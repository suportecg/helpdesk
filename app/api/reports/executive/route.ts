export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/services/rbac/rbac.service";
import { getExecutiveReportData, ExecutiveReportFilters } from "@/services/report/report.service";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const canRead = await hasPermission(session.id, "dashboard.read");
    if (!canRead && session.role !== "ADMIN" && session.role !== "TI") {
      return NextResponse.json(
        { error: "Acesso negado: permissão requerida." },
        { status: 403 }
      );
    }

    const { searchParams } = request.nextUrl;
    const filters: ExecutiveReportFilters = {
      period: searchParams.get("period") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      monthYear: searchParams.get("monthYear") || undefined,
      technicianId: searchParams.get("technicianId") || undefined,
      sectorId: searchParams.get("sectorId") || undefined,
      serviceId: searchParams.get("serviceId") || undefined,
      status: searchParams.get("status") || undefined,
      priority: searchParams.get("priority") || undefined,
      origin: searchParams.get("origin") || undefined,
    };

    const data = await getExecutiveReportData(filters);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Erro na API de Relatório Executivo:", error);
    return NextResponse.json(
      { error: "Erro interno ao gerar relatório", details: error.message },
      { status: 500 }
    );
  }
}
