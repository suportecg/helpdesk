import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Papa from "papaparse";
import { hasPermission } from "@/services/rbac/rbac.service";

export const dynamic = "force-dynamic";

function formatMinutesToHHMMSS(minutes: number | null): string {
  if (minutes === null || minutes === undefined) return "";
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  return `${h}:${String(m).padStart(2, '0')}:00`;
}

function formatTime(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDate(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleDateString('pt-BR');
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.role !== "ADMIN" && session.role !== "TI") {
      return NextResponse.json({ error: "Apenas ADMIN ou TI podem exportar dados" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // tickets, requesters, users, services, emails
    const month = searchParams.get("month"); // e.g. "08-2026"

    let dataToParse: any[] = [];
    let fileName = `export_${type}_${new Date().toISOString().slice(0, 10)}.csv`;

    if (type === "tickets") {
      const where: any = { deletedAt: null };
      if (month && month !== "all") {
        where.ticketMonthYear = month;
      }
      
      const tickets = await prisma.ticket.findMany({
        where,
        include: {
          requester: true,
          sector: true,
          technician: true,
          service: true,
        },
        orderBy: { ticketDate: 'asc' }
      });

      dataToParse = tickets.map(t => ({
        "Solicitante": t.requester?.name || "Desconhecido",
        "Setor/Obra": t.sector?.name || "Geral",
        "Técnico": t.technician?.name || "",
        "Data": formatDate(t.ticketDate),
        "Hora Inicio": formatTime(t.startTime),
        "Problema": t.problem,
        "Descrição": t.description || "",
        "Serviço": t.service?.name || "Geral",
        "Status": t.status,
        "Hora Encerramento": formatTime(t.endTime),
        "Média de Tempo": formatMinutesToHHMMSS(t.totalTimeMinutes)
      }));
    } else if (type === "requesters") {
      const requesters = await prisma.requester.findMany({
        where: { deletedAt: null },
        orderBy: { name: 'asc' }
      });
      dataToParse = requesters.map(r => ({
        "Nome": r.name,
        "Email": r.email,
        "Telefone": r.phone || "",
        "Empresa": r.company || "",
        "Departamento": r.department || ""
      }));
    } else if (type === "users") {
      const users = await prisma.user.findMany({
        where: { deletedAt: null },
        include: { roleRef: true, sector: true },
        orderBy: { name: 'asc' }
      });
      dataToParse = users.map(u => ({
        "Nome": u.name,
        "Email": u.email,
        "Role": u.roleRef?.name || u.role,
        "Setor": u.sector?.name || "",
        "Departamento": u.department || ""
      }));
    } else if (type === "services") {
      const services = await prisma.service.findMany({
        where: { deletedAt: null },
        orderBy: { name: 'asc' }
      });
      dataToParse = services.map(s => ({
        "Nome": s.name,
        "Categoria": s.category || "",
        "SLA_Horas": s.slaHours || "",
        "Ativo": s.isActive ? "Sim" : "Não"
      }));
    } else if (type === "emails") {
      const emails = await prisma.processedEmail.findMany({
        orderBy: { receivedAt: 'desc' }
      });
      dataToParse = emails.map(e => ({
        "ID": e.messageId,
        "Assunto": e.subject || "",
        "Remetente": e.from || "",
        "Recebido Em": e.receivedAt ? formatDate(e.receivedAt) + " " + formatTime(e.receivedAt) : "",
        "Status": e.status,
        "Ticket Relacionado": e.ticketId || ""
      }));
    } else {
      return NextResponse.json({ error: "Tipo de exportação inválido." }, { status: 400 });
    }

    const csvContent = Papa.unparse(dataToParse, {
      delimiter: ",",
      quotes: true,
      header: true
    });

    const bom = "\uFEFF";
    
    return new NextResponse(bom + csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      }
    });

  } catch (err: any) {
    console.error("Erro no export:", err);
    return NextResponse.json({ error: "Erro ao gerar exportação" }, { status: 500 });
  }
}
