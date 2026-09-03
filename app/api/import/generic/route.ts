export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Papa from "papaparse";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "TI")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    if (!type || !["requesters", "users", "services", "emails"].includes(type)) {
      return NextResponse.json({ error: "Tipo de importação inválido." }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    }

    const fileText = await file.text();
    const parsed = Papa.parse(fileText, { header: true, skipEmptyLines: true });
    const rows = parsed.data as any[];

    if (rows.length === 0) {
      return NextResponse.json({ error: "O arquivo CSV está vazio ou é inválido." }, { status: 400 });
    }

    let importedRows = 0;
    let skippedRows = 0;

    if (type === "requesters") {
      for (const row of rows) {
        if (!row["Nome"] || !row["Email"]) {
          skippedRows++;
          continue;
        }
        await prisma.requester.upsert({
          where: { email: row["Email"] },
          update: {
            name: row["Nome"],
            phone: row["Telefone"] || null,
            company: row["Empresa"] || null,
            department: row["Departamento"] || null,
          },
          create: {
            name: row["Nome"],
            email: row["Email"],
            phone: row["Telefone"] || null,
            company: row["Empresa"] || null,
            department: row["Departamento"] || null,
          }
        });
        importedRows++;
      }
    } else if (type === "users") {
      const defaultPassword = await bcrypt.hash("Mudar@123", 10);
      for (const row of rows) {
        if (!row["Nome"] || !row["Email"]) {
          skippedRows++;
          continue;
        }
        
        let sectorId = null;
        if (row["Setor"]) {
          const sector = await prisma.sector.findFirst({ where: { name: row["Setor"] } });
          if (sector) sectorId = sector.id;
          else {
            const newSector = await prisma.sector.create({ data: { name: row["Setor"] } });
            sectorId = newSector.id;
          }
        }

        const roleStr = String(row["Role"] || "TI").toUpperCase();
        const role = ["ADMIN", "TI", "SOLICITANTE"].includes(roleStr) ? roleStr as any : "TI";

        await prisma.user.upsert({
          where: { email: row["Email"] },
          update: {
            name: row["Nome"],
            role: role,
            department: row["Departamento"] || null,
            sectorId,
          },
          create: {
            name: row["Nome"],
            email: row["Email"],
            password: defaultPassword,
            role: role,
            department: row["Departamento"] || null,
            sectorId,
          }
        });
        importedRows++;
      }
    } else if (type === "services") {
      for (const row of rows) {
        if (!row["Nome"]) {
          skippedRows++;
          continue;
        }
        await prisma.service.upsert({
          where: { name: row["Nome"] },
          update: {
            category: row["Categoria"] || null,
            slaHours: row["SLA_Horas"] ? parseInt(row["SLA_Horas"]) : null,
            isActive: row["Ativo"] === "Sim" || row["Ativo"] === "true",
          },
          create: {
            name: row["Nome"],
            category: row["Categoria"] || null,
            slaHours: row["SLA_Horas"] ? parseInt(row["SLA_Horas"]) : null,
            isActive: row["Ativo"] === "Sim" || row["Ativo"] === "true",
          }
        });
        importedRows++;
      }
    } else if (type === "emails") {
      for (const row of rows) {
        if (!row["ID"]) {
          skippedRows++;
          continue;
        }
        
        // Parse date "DD/MM/YYYY HH:mm:ss"
        let receivedAtDate = null;
        if (row["Recebido Em"]) {
           const parts = row["Recebido Em"].split(" ");
           if (parts.length === 2) {
             const d = parts[0].split("/");
             if (d.length === 3) {
               receivedAtDate = new Date(`${d[2]}-${d[1]}-${d[0]}T${parts[1]}`);
             }
           }
        }
        
        const status = row["Status"] || "PROCESSED";

        await prisma.processedEmail.upsert({
          where: { messageId: row["ID"] },
          update: {
             subject: row["Assunto"] || null,
             from: row["Remetente"] || null,
             receivedAt: receivedAtDate,
             status: status
          },
          create: {
             messageId: row["ID"],
             subject: row["Assunto"] || null,
             from: row["Remetente"] || null,
             receivedAt: receivedAtDate,
             status: status,
             ticketId: row["Ticket Relacionado"] || null,
          }
        });
        importedRows++;
      }
    }

    return NextResponse.json({
      success: true,
      totalRows: rows.length,
      importedRows,
      skippedRows,
    });
  } catch (error: any) {
    console.error("[POST /api/import/generic] Erro:", error);
    return NextResponse.json({ error: error.message || "Erro ao processar importação" }, { status: 500 });
  }
}
