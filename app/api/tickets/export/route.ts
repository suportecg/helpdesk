export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/services/rbac/rbac.service";
import { getTicketsPaginated } from "@/services/ticket/query-tickets.service";
import { OrigemType, PrioridadeType, StatusType } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const canRead = await hasPermission(session.id, "chamados.read");
    if (!canRead) {
      return NextResponse.json({ error: "Acesso negado: permissão 'chamados.read' requerida." }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const query = searchParams.get("query") || undefined;
    const status = (searchParams.get("status") as StatusType | "ALL") || "ALL";
    const serviceId = searchParams.get("serviceId") || "ALL";
    const sectorId = searchParams.get("sectorId") || "ALL";
    const technicianId = searchParams.get("technicianId") || "ALL";
    const origin = (searchParams.get("origin") as OrigemType | "ALL") || "ALL";
    const priority = (searchParams.get("priority") as PrioridadeType | "ALL") || "ALL";
    const isArchived = searchParams.get("isArchived") === "true";
    const monthYear = searchParams.get("monthYear") || undefined;

    const format = searchParams.get("format") || "csv";

    // Buscar com limite grande para exportação
    const result = await getTicketsPaginated({
      page: 1,
      limit: 5000,
      query,
      status,
      serviceId,
      sectorId,
      technicianId,
      origin,
      priority,
      isArchived,
      monthYear,
      userId: session.id,
      role: session.role,
    });

    const tickets = result.data;

    if (format === "json") {
      return NextResponse.json(tickets);
    }

    let csv = "ID,Numero,Mes/Ano,Solicitante,Setor,Servico,Tecnico,Status,Prioridade,Origem,Data,Hora Inicial,Hora Final,Tempo(Min)\n";

    tickets.forEach(t => {
       const escape = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
       csv += [
           escape(t.id),
           escape(t.ticketNumber.toString()),
           escape(t.ticketMonthYear || ""),
           escape(t.requester.name),
           escape(t.sector.name),
           escape(t.service.name),
           escape(t.technician?.name || "Fila Geral"),
           escape(t.status),
           escape(t.priority),
           escape(t.origin),
           escape(new Date(t.ticketDate).toLocaleDateString('pt-BR')),
           escape(t.startTime ? new Date(t.startTime).toLocaleTimeString('pt-BR') : ""),
           escape(t.endTime ? new Date(t.endTime).toLocaleTimeString('pt-BR') : ""),
           escape(t.totalTimeMinutes?.toString() || "")
       ].join(",") + "\n";
    });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="chamados-${Date.now()}.csv"`,
      },
    });

  } catch (error: any) {
    console.error("[HelpDesk API] Erro em GET /api/tickets/export:", error);
    return NextResponse.json(
      { error: error?.message || "Erro interno ao exportar chamados." },
      { status: 500 }
    );
  }
}
