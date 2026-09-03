import fs from "fs";
import Papa from "papaparse";

const fileText = fs.readFileSync("/home/hudsonsantos/Downloads/Controle de Chamados 2026 - Jul(2).csv", "utf-8");

const parseResult = Papa.parse(fileText, {
  header: false,
  skipEmptyLines: true,
});

let rawData = parseResult.data as any[][];

if (rawData.length > 0 && rawData[0].length === 1 && String(rawData[0][0]).includes(";")) {
  const fallbackParse = Papa.parse(fileText, { header: false, skipEmptyLines: true, delimiter: ";" });
  rawData = fallbackParse.data as any[][];
}

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

const parsedRows = [];
for (let i = 0; i < Math.min(5, rows.length); i++) {
  const row = rows[i];
  const solicitanteNome = String(getCol(row, ["solicitante", "cliente", "nome"]) || "Usuário Não Informado").trim();
  const setorNome = String(getCol(row, ["setor", "obra", "departamento"]) || "Geral").trim();
  const rawTecnico = getCol(row, ["técnico", "tecnico", "responsável", "responsavel"]);
  const tecnicoNome = rawTecnico ? String(rawTecnico).trim() : null;
  const problema = String(getCol(row, ["problema", "título", "assunto"]) || "Problema não informado").trim();

  parsedRows.push({ solicitanteNome, setorNome, tecnicoNome, problema });
}

console.log("Headers detected:", headers);
console.log("Parsed top 5:", parsedRows);
