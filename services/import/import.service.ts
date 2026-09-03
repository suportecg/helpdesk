import { prisma } from "@/lib/prisma";
import { StatusType, OrigemType, PrioridadeType } from "@prisma/client";

// ============================
// CSV PARSER — ZERO DEPENDENCIES
// ============================

export interface CsvRow {
  solicitante: string;
  setor: string;
  tecnico: string;
  data: string;
  horaInicio: string;
  problema: string;
  descricao: string;
  servico: string;
  status: string;
  horaEncerramento: string;
  mediaTempo: string;
}

export interface ImportPreviewResult {
  totalRows: number;
  validRows: number;
  skippedRows: number;
  sampleRows: CsvRow[];
  newRequesters: string[];
  existingRequesters: string[];
  newSectors: string[];
  existingSectors: string[];
  newServices: string[];
  existingServices: string[];
  newTechnicians: string[];
  existingTechnicians: string[];
  detectedMonthYear: string;
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  newRequesters: number;
  existingRequesters: number;
  newSectors: number;
  existingSectors: number;
  newServices: number;
  existingServices: number;
  newTechnicians: number;
  existingTechnicians: number;
  durationMs: number;
  errors: string[];
}

/**
 * Parse CSV text into rows, handling quoted fields with commas
 */
function parseCsvText(text: string): string[][] {
  const lines: string[][] = [];
  const rows = text.split(/\r?\n/);

  for (const row of rows) {
    if (!row.trim()) continue;

    const fields: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"') {
        if (inQuotes && row[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        fields.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    fields.push(current.trim());
    lines.push(fields);
  }

  return lines;
}

/**
 * Map CSV header to column indices
 */
function mapColumns(header: string[]): Record<string, number> {
  const normalized = header.map((h) => h.toLowerCase().trim());
  const mapping: Record<string, number> = {};

  for (let i = 0; i < normalized.length; i++) {
    const h = normalized[i];
    if (h.includes("solicitante")) mapping.solicitante = i;
    else if (h.includes("setor") || h.includes("obra")) mapping.setor = i;
    else if (h.includes("técnico") || h.includes("tecnico")) mapping.tecnico = i;
    else if (h === "data") mapping.data = i;
    else if (h.includes("hora") && (h.includes("inicio") || h.includes("início")))
      mapping.horaInicio = i;
    else if (h.includes("problema")) mapping.problema = i;
    else if (h.includes("descrição") || h.includes("descricao")) mapping.descricao = i;
    else if (h.includes("serviço") || h.includes("servico")) mapping.servico = i;
    else if (h.includes("status")) mapping.status = i;
    else if (h.includes("hora") && h.includes("encerr")) mapping.horaEncerramento = i;
    else if (h.includes("média") || h.includes("media") || h.includes("tempo"))
      mapping.mediaTempo = i;
  }

  return mapping;
}

/**
 * Parse row into typed CsvRow
 */
function rowToCsvRow(fields: string[], colMap: Record<string, number>): CsvRow {
  const get = (key: string) => {
    const idx = colMap[key];
    return idx !== undefined && idx < fields.length ? fields[idx].trim() : "";
  };

  return {
    solicitante: get("solicitante"),
    setor: get("setor"),
    tecnico: get("tecnico"),
    data: get("data"),
    horaInicio: get("horaInicio"),
    problema: get("problema"),
    descricao: get("descricao"),
    servico: get("servico"),
    status: get("status"),
    horaEncerramento: get("horaEncerramento"),
    mediaTempo: get("mediaTempo"),
  };
}

/**
 * Validate if a row should be imported (not empty/header)
 */
function isValidRow(row: CsvRow): boolean {
  // Must have at least a date
  if (!row.data) return false;
  // Must have at least one meaningful field (requester, service, problem, or description)
  if (!row.solicitante && !row.servico && !row.problema && !row.descricao) return false;
  return true;
}

/**
 * Parse Brazilian date "dd/mm/yyyy" to Date
 */
function parseBrDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split("/");
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  return new Date(year, month, day);
}

/**
 * Parse time "h:mm:ss" or "hh:mm:ss" or "h:mm" to hours/minutes
 */
function parseTime(timeStr: string, dateObj: Date): Date | null {
  if (!timeStr) return null;
  const cleaned = timeStr.replace(/\s/g, "");
  const parts = cleaned.split(":");
  if (parts.length < 2) return null;

  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parts.length >= 3 ? parseInt(parts[2], 10) : 0;

  if (isNaN(hours) || isNaN(minutes)) return null;

  const result = new Date(dateObj);
  result.setHours(hours, minutes, seconds, 0);
  return result;
}

/**
 * Parse "h:mm:ss" duration to minutes
 */
function parseDurationToMinutes(duration: string): number | null {
  if (!duration) return null;
  const cleaned = duration.replace(/\s/g, "");
  const parts = cleaned.split(":");
  if (parts.length < 2) return null;

  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return null;

  return hours * 60 + minutes;
}

/**
 * Map CSV status to StatusType enum
 */
function mapStatus(csvStatus: string): StatusType {
  const normalized = csvStatus
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (normalized.includes("concluido") || normalized.includes("concluído"))
    return "RESOLVIDO";
  if (normalized.includes("atendimento")) return "ABERTO";
  if (normalized.includes("agendado")) return "AGUARDANDO_PECA";
  if (normalized.includes("aguardando")) return "AGUARDANDO_USUARIO";

  // Empty status maps to AGUARDANDO_USUARIO (user decision)
  if (!normalized) return "AGUARDANDO_USUARIO";

  return "AGUARDANDO_USUARIO";
}

/**
 * Get ticketMonthYear from a Date (MM-YYYY)
 */
function getMonthYearFromDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}-${year}`;
}

// ============================
// ENTITY RESOLUTION (UPSERT)
// ============================

const requesterCache = new Map<string, string>();
const sectorCache = new Map<string, string>();
const serviceCache = new Map<string, string>();
const technicianCache = new Map<string, string>();

async function resolveRequester(
  name: string,
  counters: { new: number; existing: number }
): Promise<string> {
  const key = name.toLowerCase().trim();
  if (requesterCache.has(key)) {
    counters.existing++;
    return requesterCache.get(key)!;
  }

  let existing = await prisma.requester.findFirst({
    where: {
      name: { equals: name.trim(), mode: "insensitive" },
    },
  });

  if (existing) {
    if (existing.deletedAt) {
      existing = await prisma.requester.update({
        where: { id: existing.id },
        data: { deletedAt: null, isActive: true },
      });
    }
    requesterCache.set(key, existing.id);
    counters.existing++;
    return existing.id;
  }

  const generatedEmail = `${key
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")}@cgconstrucoes.local`;

  const existingByEmail = await prisma.requester.findUnique({
    where: { email: generatedEmail },
  });

  if (existingByEmail) {
    requesterCache.set(key, existingByEmail.id);
    counters.existing++;
    return existingByEmail.id;
  }

  const created = await prisma.requester.create({
    data: {
      name: name.trim(),
      email: generatedEmail,
      company: "CG Construções",
      isActive: true,
    },
  });

  requesterCache.set(key, created.id);
  counters.new++;
  return created.id;
}

async function resolveSector(
  name: string,
  counters: { new: number; existing: number }
): Promise<string> {
  const key = name.toLowerCase().trim();
  if (sectorCache.has(key)) {
    counters.existing++;
    return sectorCache.get(key)!;
  }

  let existing = await prisma.sector.findFirst({
    where: {
      name: { equals: name.trim(), mode: "insensitive" },
    },
  });

  if (existing) {
    if (existing.deletedAt) {
      existing = await prisma.sector.update({
        where: { id: existing.id },
        data: { deletedAt: null, isActive: true },
      });
    }
    sectorCache.set(key, existing.id);
    counters.existing++;
    return existing.id;
  }

  const created = await prisma.sector.create({
    data: { name: name.trim(), isActive: true },
  });

  sectorCache.set(key, created.id);
  counters.new++;
  return created.id;
}

async function resolveService(
  name: string,
  counters: { new: number; existing: number }
): Promise<string> {
  const key = name.toLowerCase().trim();
  if (serviceCache.has(key)) {
    counters.existing++;
    return serviceCache.get(key)!;
  }

  let existing = await prisma.service.findFirst({
    where: {
      name: { equals: name.trim(), mode: "insensitive" },
    },
  });

  if (existing) {
    if (existing.deletedAt) {
      existing = await prisma.service.update({
        where: { id: existing.id },
        data: { deletedAt: null, isActive: true },
      });
    }
    serviceCache.set(key, existing.id);
    counters.existing++;
    return existing.id;
  }

  const created = await prisma.service.create({
    data: { name: name.trim(), category: "TI", isActive: true },
  });

  serviceCache.set(key, created.id);
  counters.new++;
  return created.id;
}

async function resolveTechnician(
  name: string,
  counters: { new: number; existing: number }
): Promise<string> {
  const key = name.toLowerCase().trim();
  if (technicianCache.has(key)) {
    counters.existing++;
    return technicianCache.get(key)!;
  }

  let existing = await prisma.user.findFirst({
    where: {
      name: { contains: name.trim(), mode: "insensitive" },
      role: { in: ["ADMIN", "TI"] },
    },
  });

  if (existing) {
    if (existing.deletedAt) {
      existing = await prisma.user.update({
        where: { id: existing.id },
        data: { deletedAt: null, isActive: true },
      });
    }
    technicianCache.set(key, existing.id);
    counters.existing++;
    return existing.id;
  }

  // Create as inactive TI user for admin review
  const generatedEmail = `${key
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")}.import@ti.cgconstrucoes.local`;

  // Fallback: Check if user with generated email already exists to prevent unique constraint failure
  const existingByEmail = await prisma.user.findUnique({
    where: { email: generatedEmail },
  });

  if (existingByEmail) {
    technicianCache.set(key, existingByEmail.id);
    counters.existing++;
    return existingByEmail.id;
  }

  const created = await prisma.user.create({
    data: {
      name: name.trim(),
      email: generatedEmail,
      password: "$2a$12$importedUserNoLogin", // not a valid bcrypt hash
      role: "TI",
      isActive: false,
    },
  });

  technicianCache.set(key, created.id);
  counters.new++;
  return created.id;
}

// ============================
// PREVIEW & IMPORT
// ============================

export async function previewCsvImport(csvText: string): Promise<ImportPreviewResult> {
  // Clear caches for preview
  requesterCache.clear();
  sectorCache.clear();
  serviceCache.clear();
  technicianCache.clear();

  const rawRows = parseCsvText(csvText);
  if (rawRows.length < 2) {
    throw new Error("CSV deve conter pelo menos um cabeçalho e uma linha de dados.");
  }

  const colMap = mapColumns(rawRows[0]);
  const dataRows = rawRows.slice(1);

  const csvRows: CsvRow[] = dataRows.map((r) => rowToCsvRow(r, colMap));
  const validRows = csvRows.filter(isValidRow);
  const skippedRows = csvRows.length - validRows.length;

  // Collect unique entity names (with fallbacks for empty fields)
  const requesterNames = [...new Set(validRows.map((r) => r.solicitante.trim() || "Solicitante Não Informado").filter(Boolean))];
  const sectorNames = [...new Set(validRows.map((r) => r.setor.trim() || "Geral").filter(Boolean))];
  const serviceNames = [...new Set(validRows.map((r) => r.servico.trim() || "Dúvidas & Informações").filter(Boolean))];
  const technicianNames = [...new Set(validRows.map((r) => r.tecnico.trim()).filter(Boolean))];

  // Check which exist in DB
  const existingRequesters: string[] = [];
  const newRequesters: string[] = [];
  for (const name of requesterNames) {
    const exists = await prisma.requester.findFirst({
      where: { name: { equals: name, mode: "insensitive" }, deletedAt: null },
    });
    if (exists) existingRequesters.push(name);
    else newRequesters.push(name);
  }

  const existingSectors: string[] = [];
  const newSectors: string[] = [];
  for (const name of sectorNames) {
    const exists = await prisma.sector.findFirst({
      where: { name: { equals: name, mode: "insensitive" }, deletedAt: null },
    });
    if (exists) existingSectors.push(name);
    else newSectors.push(name);
  }

  const existingServices: string[] = [];
  const newServices: string[] = [];
  for (const name of serviceNames) {
    const exists = await prisma.service.findFirst({
      where: { name: { equals: name, mode: "insensitive" }, deletedAt: null },
    });
    if (exists) existingServices.push(name);
    else newServices.push(name);
  }

  const existingTechnicians: string[] = [];
  const newTechnicians: string[] = [];
  for (const name of technicianNames) {
    const exists = await prisma.user.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        role: { in: ["ADMIN", "TI"] },
        deletedAt: null,
      },
    });
    if (exists) existingTechnicians.push(name);
    else newTechnicians.push(name);
  }

  // Detect the main monthYear from the first valid row with a date
  let detectedMonthYear = "";
  for (const row of validRows) {
    const dateObj = parseBrDate(row.data);
    if (dateObj) {
      detectedMonthYear = getMonthYearFromDate(dateObj);
      break;
    }
  }

  return {
    totalRows: csvRows.length,
    validRows: validRows.length,
    skippedRows,
    sampleRows: validRows.slice(0, 10),
    newRequesters,
    existingRequesters,
    newSectors,
    existingSectors,
    newServices,
    existingServices,
    newTechnicians,
    existingTechnicians,
    detectedMonthYear,
  };
}

export async function executeCsvImport(
  csvText: string,
  importedBy?: string
): Promise<ImportResult> {
  const startTime = Date.now();
  const errors: string[] = [];

  // Clear caches
  requesterCache.clear();
  sectorCache.clear();
  serviceCache.clear();
  technicianCache.clear();

  const rawRows = parseCsvText(csvText);
  if (rawRows.length < 2) {
    throw new Error("CSV deve conter pelo menos um cabeçalho e uma linha de dados.");
  }

  const colMap = mapColumns(rawRows[0]);
  const dataRows = rawRows.slice(1);

  const csvRows: CsvRow[] = dataRows.map((r) => rowToCsvRow(r, colMap));
  const validRows = csvRows.filter(isValidRow);

  const requesterNames = [...new Set(validRows.map((r) => r.solicitante.trim() || "Solicitante Não Informado").filter(Boolean))];
  const sectorNames = [...new Set(validRows.map((r) => r.setor.trim() || "Geral").filter(Boolean))];
  const serviceNames = [...new Set(validRows.map((r) => r.servico.trim() || "Dúvidas & Informações").filter(Boolean))];
  const technicianNames = [...new Set(validRows.map((r) => r.tecnico.trim()).filter(Boolean))];

  // Find all unique months in the valid rows and clear existing tickets for those months
  // to avoid duplicating tickets when re-importing a monthly spreadsheet
  const monthsInCsv = new Set<string>();
  for (const row of validRows) {
    const dateObj = parseBrDate(row.data);
    if (dateObj) {
      monthsInCsv.add(getMonthYearFromDate(dateObj));
    }
  }

  // Removido: Não deletamos mais os chamados do mês.
  // A verificação de duplicidade por linha garantirá que os chamados existentes sejam preservados,
  // e apenas os novos chamados adicionados à planilha serão importados (idempotência).

  const reqCounters = { new: 0, existing: 0 };
  const secCounters = { new: 0, existing: 0 };
  const srvCounters = { new: 0, existing: 0 };
  const techCounters = { new: 0, existing: 0 };

  let importedRows = 0;

  // Process in batches of 50
  const BATCH_SIZE = 50;
  for (let batchStart = 0; batchStart < validRows.length; batchStart += BATCH_SIZE) {
    const batch = validRows.slice(batchStart, batchStart + BATCH_SIZE);

    // Resolve entities for this batch
    const resolvedBatch: Array<{
      row: CsvRow;
      requesterId: string;
      sectorId: string;
      serviceId: string;
      technicianId: string | null;
      dateObj: Date;
      startTime: Date | null;
      endTime: Date | null;
      totalTimeMinutes: number | null;
      status: StatusType;
      monthYear: string;
    }> = [];

    for (const row of batch) {
      try {
        const requesterId = await resolveRequester(row.solicitante.trim() || "Solicitante Não Informado", reqCounters);
        const sectorId = await resolveSector(row.setor.trim() || "Geral", secCounters);
        const serviceId = await resolveService(row.servico.trim() || "Dúvidas & Informações", srvCounters);

        let technicianId: string | null = null;
        if (row.tecnico) {
          technicianId = await resolveTechnician(row.tecnico, techCounters);
        }

        const dateObj = parseBrDate(row.data);
        if (!dateObj) {
          errors.push(`Linha com data inválida: "${row.data}"`);
          continue;
        }

        const startTimeVal = parseTime(row.horaInicio, dateObj);
        const endTimeVal = parseTime(row.horaEncerramento, dateObj);
        const totalTimeMinutes = parseDurationToMinutes(row.mediaTempo);
        const status = mapStatus(row.status);
        const monthYear = getMonthYearFromDate(dateObj);

        resolvedBatch.push({
          row,
          requesterId,
          sectorId,
          serviceId,
          technicianId,
          dateObj,
          startTime: startTimeVal,
          endTime: endTimeVal,
          totalTimeMinutes,
          status,
          monthYear,
        });
      } catch (err: any) {
        errors.push(`Erro ao processar: "${row.solicitante}" — ${err.message}`);
      }
    }

    // Batch insert within a transaction
    if (resolvedBatch.length > 0) {
      try {
        await prisma.$transaction(async (tx) => {
          const nextNumbers = new Map<string, number>();

          for (const item of resolvedBatch) {
            // Verifica se o chamado já existe (idempotência)
            const existingTicket = await tx.ticket.findFirst({
              where: {
                ticketMonthYear: item.monthYear,
                ticketDate: item.dateObj,
                requesterId: item.requesterId,
                sectorId: item.sectorId,
                serviceId: item.serviceId,
                problem: item.row.problema || "Importado do CSV",
                startTime: item.startTime,
              },
            });

            if (existingTicket) {
              // Ignorar se o chamado já existir (já importado ou criado manualmente idêntico)
              continue;
            }

            // Get next ticket number for the monthYear if not cached
            let nextNumber = nextNumbers.get(item.monthYear);
            
            if (nextNumber === undefined) {
              const lastTicket = await tx.ticket.findFirst({
                where: { ticketMonthYear: item.monthYear },
                orderBy: { ticketNumber: "desc" },
                select: { ticketNumber: true },
              });
              nextNumber = (lastTicket?.ticketNumber || 0) + 1;
            }

            await tx.ticket.create({
              data: {
                ticketNumber: nextNumber,
                ticketMonthYear: item.monthYear,
                problem: item.row.problema || "Importado do CSV",
                description: item.row.descricao || null,
                requesterId: item.requesterId,
                sectorId: item.sectorId,
                technicianId: item.technicianId,
                serviceId: item.serviceId,
                status: item.status,
                origin: "MANUAL" as OrigemType,
                priority: "MEDIA" as PrioridadeType,
                ticketDate: item.dateObj,
                startTime: item.startTime,
                endTime: item.endTime,
                totalTimeMinutes: item.totalTimeMinutes,
                isArchived: false,
              },
            });
            
            // Increment for next ticket in the same monthYear
            nextNumbers.set(item.monthYear, nextNumber + 1);

            importedRows++;
          }
        }, { maxWait: 10000, timeout: 30000 });
      } catch (err: any) {
        errors.push(`Erro no batch ${batchStart}: ${err.message}`);
      }
    }
  }

  const durationMs = Date.now() - startTime;

  // Log the import
  try {
    await prisma.importLog.create({
      data: {
        fileName: "csv-import",
        totalRows: csvRows.length,
        importedRows,
        skippedRows: csvRows.length - validRows.length,
        newRequesters: reqCounters.new,
        newSectors: secCounters.new,
        newServices: srvCounters.new,
        newTechnicians: techCounters.new,
        durationMs,
        importedBy,
      },
    });
  } catch {
    // Non-critical
  }

  return {
    success: errors.length === 0,
    totalRows: csvRows.length,
    importedRows,
    skippedRows: csvRows.length - validRows.length,
    newRequesters: reqCounters.new,
    existingRequesters: Math.max(0, requesterNames.length - reqCounters.new),
    newSectors: secCounters.new,
    existingSectors: Math.max(0, sectorNames.length - secCounters.new),
    newServices: srvCounters.new,
    existingServices: Math.max(0, serviceNames.length - srvCounters.new),
    newTechnicians: techCounters.new,
    existingTechnicians: Math.max(0, technicianNames.length - techCounters.new),
    durationMs,
    errors,
  };
}
