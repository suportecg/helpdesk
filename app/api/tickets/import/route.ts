export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import os from "os";
import path from "path";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/services/rbac/rbac.service";
import { prisma } from "@/lib/prisma";
import Papa from "papaparse";
import { processBulkImport, BulkTicketInput } from "@/services/import/bulk-import.service";

// Função para converter HH:MM:SS ou decimais do Excel para Date
function excelTimeToString(val: any): string | null {
  if (!val) return null;
  if (typeof val === "string") {
    const clean = val.trim();
    if (!clean) return null;
    if (clean.includes(":")) {
      const parts = clean.split(":");
      const hours = (parts[0] || "00").padStart(2, '0');
      const minutes = (parts[1] || "00").padStart(2, '0');
      return `${hours}:${minutes}`;
    }
  }
  if (typeof val === "number") {
    let totalSeconds = Math.round(val * 86400);
    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    const minutes = Math.floor(totalSeconds / 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
  return null;
}

function parseExcelDate(val: any): string | null {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().split("T")[0];
  }
  if (typeof val === "number") {
    // Excel base date is Dec 30 1899
    const d = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(d.getTime())) {
      return d.toISOString().split("T")[0];
    }
  }
  if (typeof val === "string") {
    const cleanVal = val.trim();
    if (!cleanVal) return null;
    // 27/07/2026 -> 2026-07-27
    const parts = cleanVal.split("/");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return cleanVal;
  }
  return null;
}

function mapStatus(status: string): any {
  const s = status.toLowerCase().trim();
  if (s.includes("concluí") || s.includes("resolvido") || s.includes("fechado")) return "RESOLVIDO";
  if (s.includes("andamento") || s.includes("iniciado")) return "EM_ANDAMENTO";
  if (s.includes("aguardando") || s.includes("esperando") || s.includes("pendente")) return "AGUARDANDO_USUARIO";
  if (s.includes("cancelado")) return "CANCELADO";
  return "ABERTO"; // Default
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    // PARA DEBUG LOCAL:
    const mockSession = session || { id: "bf211e39-52ba-4216-aed9-3c7f99fa58c4", name: "Hudson Eduardo", role: "ADMIN" };
    
    if (!mockSession?.id) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const canCreate = await hasPermission(mockSession.id, "chamados.create");
    if (!canCreate) {
      return NextResponse.json({ error: "Acesso negado: permissão 'chamados.create' requerida." }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    }

    const fileText = await file.text();
    try {
      const tmpDir = os.tmpdir();
      fs.writeFileSync(path.join(tmpDir, 'last-upload.csv'), fileText);
    } catch (e) {
      console.warn("Não foi possível salvar log de upload no tmpdir:", e);
    }

    const parseResult = Papa.parse(fileText, {
      header: false,
      skipEmptyLines: true,
    });
    
    let rawData = parseResult.data as any[][];
    
    // Fallback para caso não consiga separar (ex: se o papaparse falhou no delimitador)
    if (rawData.length > 0 && rawData[0].length === 1 && String(rawData[0][0]).includes(";")) {
      const fallbackParse = Papa.parse(fileText, { header: false, skipEmptyLines: true, delimiter: ";" });
      rawData = fallbackParse.data as any[][];
    }
    
    // Identificar a linha do cabeçalho
    let headerRowIndex = 0;
    if (rawData && rawData.length > 0) {
      for (let i = 0; i < Math.min(5, rawData.length); i++) {
        if (rawData[i] && Array.isArray(rawData[i]) && rawData[i].some((cell: any) => typeof cell === "string" && cell.toLowerCase().includes("solicitante"))) {
          headerRowIndex = i;
          break;
        }
      }
    }

    const headers = (rawData[headerRowIndex] || []) as any[];
    const rows = rawData.slice(headerRowIndex + 1);

    const getCol = (row: any[], headerMatches: string[]) => {
      if (!headers) return null;
      const idx = headers.findIndex((h: any) => h && headerMatches.some(m => String(h).toLowerCase().includes(m)));
      return idx >= 0 ? row[idx] : null;
    };

    const parsedRows: BulkTicketInput[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0 || !row.some((cell: any) => Boolean(String(cell || "").trim()))) continue; // Linha vazia

      const rawSolicitante = getCol(row, ["solicitante", "cliente", "nome"]);
      const solicitanteNome = rawSolicitante && String(rawSolicitante).trim() ? String(rawSolicitante).trim() : "Usuário Não Informado";

      const rawSetor = getCol(row, ["setor", "obra", "departamento"]);
      const setorNome = rawSetor && String(rawSetor).trim() ? String(rawSetor).trim() : "Geral";

      const rawTecnico = getCol(row, ["técnico", "tecnico", "responsável", "responsavel"]);
      const tecnicoNome = rawTecnico && String(rawTecnico).trim() ? String(rawTecnico).trim() : null;
      
      const rawDate = getCol(row, ["data", "abertura"]);
      const dateStr = parseExcelDate(rawDate);
      const dataChamado = dateStr ? new Date(dateStr) : new Date();
      
      const horaInicio = excelTimeToString(getCol(row, ["hora início", "hora inicio", "início", "abertura"]));
      const rawProblema = getCol(row, ["problema", "título", "assunto"]);
      const problema = rawProblema && String(rawProblema).trim() ? String(rawProblema).trim() : "Problema não informado";

      const rawDescricao = getCol(row, ["descrição", "detalhes"]);
      const descricao = rawDescricao && String(rawDescricao).trim() ? String(rawDescricao).trim() : undefined;

      const rawServico = getCol(row, ["serviço", "servico", "categoria"]);
      const servicoNome = rawServico && String(rawServico).trim() ? String(rawServico).trim() : "Geral";

      const rawStatus = getCol(row, ["status", "situação"]);
      const statusRaw = rawStatus && String(rawStatus).trim() ? String(rawStatus).trim() : "Aberto";

      const encerramento = excelTimeToString(getCol(row, ["encerramento", "hora fim", "fim", "fechamento"]));

      parsedRows.push({
        solicitante: solicitanteNome,
        setor: setorNome,
        tecnico: tecnicoNome,
        dataChamado: !isNaN(dataChamado.getTime()) ? dataChamado : new Date(),
        horaInicio,
        encerramento,
        problema,
        descricao,
        servico: servicoNome,
        status: mapStatus(statusRaw)
      });
    }

    console.log("[DEBUG IMPORT] Headers detectados:", headers);
    console.log("[DEBUG IMPORT] Exemplo do primeiro parse:", parsedRows[0]);
    
    try {
      const tmpDir = os.tmpdir();
      fs.writeFileSync(path.join(tmpDir, 'parsedRows.json'), JSON.stringify(parsedRows, null, 2));
    } catch (e) {
      console.warn("Não foi possível salvar parsedRows.json no tmpdir:", e);
    }

    if (parsedRows.length === 0) {
      return NextResponse.json({ error: "Nenhum chamado válido encontrado na planilha." }, { status: 400 });
    }

    // Processamento Bulk de Alta Performance
    const result = await processBulkImport(parsedRows, mockSession.id, mockSession.name);

    return NextResponse.json({
      success: true,
      importedCount: result.importedCount,
      stats: result.stats,
      message: `Foram criados ${result.stats.newSectors} novos setores e reaproveitados ${result.stats.reusedSectors}. Foram criados ${result.stats.newServices} novos serviços e reaproveitados ${result.stats.reusedServices}. Foram criados ${result.stats.newRequesters} novos solicitantes e reaproveitados ${result.stats.reusedRequesters}.`
    });

  } catch (error: any) {
    console.error("[HelpDesk API] Erro ao importar planilha:", error);
    return NextResponse.json(
      { error: error?.message || "Erro interno ao processar a importação." },
      { status: 500 }
    );
  }
}
