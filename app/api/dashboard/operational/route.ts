export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/services/rbac/rbac.service";
import {
  getOperationalDashboardData,
  DashboardPeriod,
} from "@/services/dashboard/dashboard.service";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const canRead = await hasPermission(session.id, "dashboard.read");
    if (!canRead && session.role !== "ADMIN" && session.role !== "TI") {
      return NextResponse.json(
        { error: "Acesso negado: permissão 'dashboard.read' requerida." },
        { status: 403 }
      );
    }

    const { searchParams } = request.nextUrl;
    const periodParam = searchParams.get("period") as DashboardPeriod | null;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const sectorId = searchParams.get("sectorId") || undefined;
    const serviceId = searchParams.get("serviceId") || undefined;
    const technicianId = searchParams.get("technicianId") || undefined;
    
    let monthYear = searchParams.get("monthYear") || undefined;
    if (!monthYear) {
      const month = searchParams.get("month");
      const year = searchParams.get("year");
      if (month && year) {
        monthYear = `${month.padStart(2, "0")}-${year}`;
      }
    }

    const data = await getOperationalDashboardData({
      period: monthYear ? "MONTHLY_SPECIFIC" : (periodParam || "TODAY"),
      startDate,
      endDate,
      monthYear,
      sectorId: sectorId !== "ALL" ? sectorId : undefined,
      serviceId: serviceId !== "ALL" ? serviceId : undefined,
      technicianId: technicianId !== "ALL" ? technicianId : undefined,
    });

    return NextResponse.json({ ...data, userName: session.name }, { status: 200 });
  } catch (error: any) {
    console.error("[GET /api/dashboard/operational] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao carregar dashboard operacional", details: error.message },
      { status: 500 }
    );
  }
}
