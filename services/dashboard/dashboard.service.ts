import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export type DashboardPeriod =
  | "TODAY"
  | "YESTERDAY"
  | "LAST_7_DAYS"
  | "LAST_30_DAYS"
  | "THIS_MONTH"
  | "THIS_YEAR"
  | "MONTHLY_SPECIFIC"
  | "CUSTOM";

export interface DashboardFilterParams {
  period?: DashboardPeriod;
  startDate?: string;
  endDate?: string;
  sectorId?: string;
  serviceId?: string;
  technicianId?: string;
  monthYear?: string; // "07-2026" format for monthly filtering
}

export interface ChartDataPoint {
  name: string;
  value: number;
  secondaryValue?: number;
  percentage?: number;
  color?: string;
  id?: string;
}

export interface TimeSeriesPoint {
  date: string;
  label: string;
  total: number;
  concluidos: number;
  emAtendimento: number;
}

export interface DashboardStatsResult {
  kpis: {
    totalTickets: { value: number; changePercent: number; prevValue: number };
    inProgress: { value: number };
    completed: { value: number; changePercent: number; prevValue: number };
    waiting: { value: number };
    scheduled: { value: number };
    avgTimeMinutes: { value: number; formatted: string };
    avgTimePerTech: { value: number; formatted: string };
    topTechHighlight: {
      name: string;
      completedCount: number;
      avgTimeFormatted: string;
    } | null;
    topAvgTimeTechs: Array<{
      name: string;
      avgTimeMinutes: number;
      avgTimeFormatted: string;
    }>;
  };
  rankings: {
    topTechnicians: Array<{
      id: string;
      name: string;
      email: string;
      count: number;
      avgTimeMinutes: number;
      percentage: number;
    }>;
    topServices: Array<{
      id: string;
      name: string;
      category: string;
      count: number;
      percentage: number;
    }>;
    topSectors: Array<{
      id: string;
      name: string;
      count: number;
      percentage: number;
    }>;
    servicesBySector: Record<string, Array<{ name: string; count: number }>>;
  };
  charts: {
    byTechnician: ChartDataPoint[];
    bySector: ChartDataPoint[];
    byService: ChartDataPoint[];
    byStatus: ChartDataPoint[];
    byOrigin: ChartDataPoint[];
    avgTimeByTechnician: ChartDataPoint[];
    avgTimeByService: ChartDataPoint[];
    avgTimeBySector: ChartDataPoint[];
    byDay: TimeSeriesPoint[];
    byWeek: TimeSeriesPoint[];
    byMonth: TimeSeriesPoint[];
    servicesBySector: Record<string, Array<{ name: string; count: number }>>;
  };
  periodRange: {
    start: string;
    end: string;
    label: string;
  };
}

function getPeriodRange(params: DashboardFilterParams): {
  start: Date;
  end: Date;
  prevStart: Date;
  prevEnd: Date;
  label: string;
} {
  const now = new Date();
  let start = new Date();
  let end = new Date();
  let label = "Últimos 30 dias";

  if (params.period === "TODAY") {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    label = "Hoje";
  } else if (params.period === "YESTERDAY") {
    const yest = new Date(now);
    yest.setDate(now.getDate() - 1);
    start = new Date(yest.getFullYear(), yest.getMonth(), yest.getDate(), 0, 0, 0, 0);
    end = new Date(yest.getFullYear(), yest.getMonth(), yest.getDate(), 23, 59, 59, 999);
    label = "Ontem";
  } else if (params.period === "LAST_7_DAYS") {
    start = new Date(now);
    start.setDate(now.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    end = new Date(now);
    label = "Últimos 7 dias";
  } else if (params.period === "LAST_30_DAYS" || !params.period) {
    start = new Date(now);
    start.setDate(now.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    end = new Date(now);
    label = "Últimos 30 dias";
  } else if (params.period === "THIS_MONTH") {
    start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    end = new Date(now);
    label = "Este mês";
  } else if (params.period === "THIS_YEAR") {
    start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    end = new Date(now);
    label = "Ano atual";
  } else if (params.period === "MONTHLY_SPECIFIC" && params.monthYear) {
    const [mm, yyyy] = params.monthYear.split("-");
    const month = parseInt(mm, 10) - 1;
    const year = parseInt(yyyy, 10);
    start = new Date(year, month, 1, 0, 0, 0, 0);
    end = new Date(year, month + 1, 0, 23, 59, 59, 999);
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    label = `${monthNames[month]} ${year}`;
  } else if (params.period === "CUSTOM" && params.startDate && params.endDate) {
    start = new Date(params.startDate);
    end = new Date(params.endDate);
    end.setHours(23, 59, 59, 999);
    label = `${start.toLocaleDateString("pt-BR")} a ${end.toLocaleDateString("pt-BR")}`;
  }

  // Calcular período anterior proporcional para comparação de crescimento/queda
  const durationMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - durationMs);

  return { start, end, prevStart, prevEnd, label };
}

function formatMinutes(minutes: number): string {
  const mins = Math.max(0, Math.round(minutes));
  if (mins === 0) return "0 min";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export async function getDashboardStats(
  params: DashboardFilterParams = {}
): Promise<DashboardStatsResult> {
  // If monthYear is provided without a period, set MONTHLY_SPECIFIC
  if (params.monthYear && !params.period) {
    params.period = "MONTHLY_SPECIFIC";
  }

  const range = getPeriodRange(params);

  // Filtro base dos chamados no período atual
  const whereCurrent: Prisma.TicketWhereInput = {
    deletedAt: null,
    ...(params.monthYear
      ? { ticketMonthYear: params.monthYear }
      : {
          ticketDate: {
            gte: range.start,
            lte: range.end,
          },
        }),
  };

  // Filtro base dos chamados no período anterior (para KPI comparativo)
  const wherePrevious: Prisma.TicketWhereInput = {
    deletedAt: null,
    ...(params.monthYear
      ? {
          // For monthly, compare with previous month
          ticketMonthYear: (() => {
            const [mm, yyyy] = params.monthYear!.split("-");
            let prevMonth = parseInt(mm, 10) - 1;
            let prevYear = parseInt(yyyy, 10);
            if (prevMonth < 1) { prevMonth = 12; prevYear--; }
            return `${String(prevMonth).padStart(2, "0")}-${prevYear}`;
          })(),
        }
      : {
          ticketDate: {
            gte: range.prevStart,
            lte: range.prevEnd,
          },
        }),
  };

  if (params.sectorId) {
    whereCurrent.sectorId = params.sectorId;
    wherePrevious.sectorId = params.sectorId;
  }
  if (params.serviceId) {
    whereCurrent.serviceId = params.serviceId;
    wherePrevious.serviceId = params.serviceId;
  }
  if (params.technicianId) {
    whereCurrent.technicianId = params.technicianId;
    wherePrevious.technicianId = params.technicianId;
  }

  // Consultar todos os tickets do período para análises e agregações de BI
  const [currentTickets, previousTickets, activeTechs, allSectors, allServices, allUsers] =
    await Promise.all([
      prisma.ticket.findMany({
        where: whereCurrent,
        include: {
          sector: true,
          service: true,
          technician: true,
          requester: true,
        },
      }),
      prisma.ticket.findMany({
        where: wherePrevious,
        select: {
          id: true,
          status: true,
        },
      }),
      prisma.user.count({
        where: {
          role: { in: ["ADMIN", "TI"] },
          isActive: true,
        },
      }),
      prisma.sector.findMany(),
      prisma.service.findMany(),
      prisma.user.findMany({
        where: { role: { in: ["ADMIN", "TI"] } },
      }),
    ]);

  // 1. CÁLCULO DOS KPIs
  const totalTickets = currentTickets.length;
  const prevTotalTickets = previousTickets.length;
  const changePercentTotal =
    prevTotalTickets > 0
      ? Math.round(((totalTickets - prevTotalTickets) / prevTotalTickets) * 100)
      : totalTickets > 0
      ? 100
      : 0;

  const inProgress = currentTickets.filter((t) => t.status === "ABERTO").length;
  const completed = currentTickets.filter((t) => t.status === "RESOLVIDO").length;
  const prevCompleted = previousTickets.filter((t) => t.status === "RESOLVIDO").length;
  const changePercentCompleted =
    prevCompleted > 0
      ? Math.round(((completed - prevCompleted) / prevCompleted) * 100)
      : completed > 0
      ? 100
      : 0;

  const waiting = currentTickets.filter((t) => t.status === "AGUARDANDO_USUARIO").length;
  const scheduled = currentTickets.filter((t) => t.status === "AGUARDANDO_PECA").length;

  const completedWithTime = currentTickets.filter(
    (t) => t.status === "RESOLVIDO" && typeof t.totalTimeMinutes === "number" && t.totalTimeMinutes > 0
  );

  const avgTimeMinutesVal =
    completedWithTime.length > 0
      ? Math.round(
          completedWithTime.reduce((acc, t) => acc + (t.totalTimeMinutes || 0), 0) /
            completedWithTime.length
        )
      : 0;

  const avgTimePerTechVal =
    activeTechs > 0 && completedWithTime.length > 0
      ? Math.round(avgTimeMinutesVal / Math.max(1, activeTechs))
      : avgTimeMinutesVal;

  // 2. AGRUPAMENTOS PARA OS 11 GRÁFICOS
  // 2.1 Por Técnico
  const techMap: Record<string, { name: string; count: number; totalTime: number; completedCount: number }> = {};
  allUsers.forEach((u) => {
    techMap[u.id] = { name: u.name, count: 0, totalTime: 0, completedCount: 0 };
  });
  techMap["unassigned"] = { name: "Fila Geral (Sem Atribuição)", count: 0, totalTime: 0, completedCount: 0 };

  // 2.2 Por Setor
  const sectorMap: Record<string, { name: string; count: number; totalTime: number; completedCount: number }> = {};
  allSectors.forEach((sec) => {
    sectorMap[sec.id] = { name: sec.name, count: 0, totalTime: 0, completedCount: 0 };
  });

  // 2.3 Por Serviço
  const serviceMap: Record<string, { name: string; category: string; count: number; totalTime: number; completedCount: number }> = {};
  allServices.forEach((srv) => {
    serviceMap[srv.id] = { name: srv.name, category: srv.category || "TI", count: 0, totalTime: 0, completedCount: 0 };
  });

  // 2.4 Por Origem
  const originMap: Record<string, number> = {
    MANUAL: 0,
    WHATSAPP: 0,
    EMAIL: 0,
  };

  // Serviços por Setor map
  const sectorServiceMap: Record<string, Record<string, { name: string; count: number }>> = {};

  currentTickets.forEach((t) => {
    // Tech
    const techKey = t.technicianId || "unassigned";
    if (!techMap[techKey]) {
      techMap[techKey] = {
        name: t.technician?.name || "Outro",
        count: 0,
        totalTime: 0,
        completedCount: 0,
      };
    }
    techMap[techKey].count += 1;
    if (t.status === "RESOLVIDO" && typeof t.totalTimeMinutes === "number") {
      techMap[techKey].totalTime += t.totalTimeMinutes;
      techMap[techKey].completedCount += 1;
    }

    // Sector
    if (t.sectorId && sectorMap[t.sectorId]) {
      sectorMap[t.sectorId].count += 1;
      if (t.status === "RESOLVIDO" && typeof t.totalTimeMinutes === "number") {
        sectorMap[t.sectorId].totalTime += t.totalTimeMinutes;
        sectorMap[t.sectorId].completedCount += 1;
      }
    }

    // Service
    if (t.serviceId && serviceMap[t.serviceId]) {
      serviceMap[t.serviceId].count += 1;
      if (t.status === "RESOLVIDO" && typeof t.totalTimeMinutes === "number") {
        serviceMap[t.serviceId].totalTime += t.totalTimeMinutes;
        serviceMap[t.serviceId].completedCount += 1;
      }
    }

    // Origin
    const orig = t.origin || "MANUAL";
    originMap[orig] = (originMap[orig] || 0) + 1;

    // Services by Sector
    if (t.sectorId && t.serviceId) {
      const sectorName = t.sector?.name || t.sectorId;
      const serviceName = t.service?.name || t.serviceId;
      if (!sectorServiceMap[sectorName]) {
        sectorServiceMap[sectorName] = {};
      }
      if (!sectorServiceMap[sectorName][serviceName]) {
        sectorServiceMap[sectorName][serviceName] = { name: serviceName, count: 0 };
      }
      sectorServiceMap[sectorName][serviceName].count += 1;
    }
  });

  // Formatar dados dos gráficos
  const byTechnician: ChartDataPoint[] = Object.entries(techMap)
    .filter(([_, data]) => data.count > 0)
    .map(([id, data]) => ({
      id,
      name: data.name,
      value: data.count,
      percentage: totalTickets > 0 ? Math.round((data.count / totalTickets) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value);

  const bySector: ChartDataPoint[] = Object.entries(sectorMap)
    .filter(([_, data]) => data.count > 0)
    .map(([id, data]) => ({
      id,
      name: data.name,
      value: data.count,
      percentage: totalTickets > 0 ? Math.round((data.count / totalTickets) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value);

  const byService: ChartDataPoint[] = Object.entries(serviceMap)
    .filter(([_, data]) => data.count > 0)
    .map(([id, data]) => ({
      id,
      name: data.name,
      value: data.count,
      percentage: totalTickets > 0 ? Math.round((data.count / totalTickets) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value);

  const byStatus: ChartDataPoint[] = [
    { name: "Aberto", value: inProgress, color: "#f59e0b" },
    { name: "Resolvido", value: completed, color: "#10b981" },
    { name: "Aguardando", value: waiting, color: "#3b82f6" },
    { name: "Agendado", value: scheduled, color: "#8b5cf6" },
  ];

  const byOrigin: ChartDataPoint[] = [
    { name: "Portal / Manual", value: originMap.MANUAL || 0, color: "#3b82f6" },
    { name: "WhatsApp", value: originMap.WHATSAPP || 0, color: "#10b981" },
    { name: "E-mail", value: originMap.EMAIL || 0, color: "#6366f1" },
  ];

  const avgTimeByTechnician: ChartDataPoint[] = Object.entries(techMap)
    .filter(([_, data]) => data.completedCount > 0)
    .map(([id, data]) => ({
      id,
      name: data.name,
      value: Math.round(data.totalTime / data.completedCount),
    }))
    .sort((a, b) => a.value - b.value); // ASC: fastest first

  const avgTimeByService: ChartDataPoint[] = Object.entries(serviceMap)
    .filter(([_, data]) => data.completedCount > 0)
    .map(([id, data]) => ({
      id,
      name: data.name,
      value: Math.round(data.totalTime / data.completedCount),
    }))
    .sort((a, b) => b.value - a.value);

  const avgTimeBySector: ChartDataPoint[] = Object.entries(sectorMap)
    .filter(([_, data]) => data.completedCount > 0)
    .map(([id, data]) => ({
      id,
      name: data.name,
      value: Math.round(data.totalTime / data.completedCount),
    }))
    .sort((a, b) => b.value - a.value);

  // Serviços por Setor — top 5 por setor
  const servicesBySector: Record<string, Array<{ name: string; count: number }>> = {};
  for (const [sectorName, servicesMap] of Object.entries(sectorServiceMap)) {
    servicesBySector[sectorName] = Object.values(servicesMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  // 3. SÉRIES TEMPORAIS (Dia, Semana, Mês)
  const byDayMap: Record<string, { label: string; total: number; concluidos: number; emAtendimento: number }> = {};
  const byWeekMap: Record<string, { label: string; total: number; concluidos: number; emAtendimento: number }> = {};
  const byMonthMap: Record<string, { label: string; total: number; concluidos: number; emAtendimento: number }> = {};

  currentTickets.forEach((t) => {
    const d = new Date(t.ticketDate || t.createdAt);
    const dateStr = d.toISOString().slice(0, 10);
    const dayLabel = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

    if (!byDayMap[dateStr]) {
      byDayMap[dateStr] = { label: dayLabel, total: 0, concluidos: 0, emAtendimento: 0 };
    }
    byDayMap[dateStr].total += 1;
    if (t.status === "RESOLVIDO") byDayMap[dateStr].concluidos += 1;
    if (t.status === "ABERTO") byDayMap[dateStr].emAtendimento += 1;

    // Semana (Início do Domingo daquela semana)
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const weekKey = weekStart.toISOString().slice(0, 10);
    const weekLabel = `Semana ${weekStart.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`;
    if (!byWeekMap[weekKey]) {
      byWeekMap[weekKey] = { label: weekLabel, total: 0, concluidos: 0, emAtendimento: 0 };
    }
    byWeekMap[weekKey].total += 1;
    if (t.status === "RESOLVIDO") byWeekMap[weekKey].concluidos += 1;
    if (t.status === "ABERTO") byWeekMap[weekKey].emAtendimento += 1;

    // Mês
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).toUpperCase();
    if (!byMonthMap[monthKey]) {
      byMonthMap[monthKey] = { label: monthLabel, total: 0, concluidos: 0, emAtendimento: 0 };
    }
    byMonthMap[monthKey].total += 1;
    if (t.status === "RESOLVIDO") byMonthMap[monthKey].concluidos += 1;
    if (t.status === "ABERTO") byMonthMap[monthKey].emAtendimento += 1;
  });

  const byDay: TimeSeriesPoint[] = Object.entries(byDayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }));

  const byWeek: TimeSeriesPoint[] = Object.entries(byWeekMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }));

  const byMonth: TimeSeriesPoint[] = Object.entries(byMonthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }));

  // 4. RANKINGS DE BI
  const topTechnicians = allUsers
    .map((u) => {
      const d = techMap[u.id] || { count: 0, totalTime: 0, completedCount: 0 };
      const avg = d.completedCount > 0 ? Math.round(d.totalTime / d.completedCount) : 0;
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        count: d.count,
        avgTimeMinutes: avg,
        percentage: totalTickets > 0 ? Math.round((d.count / totalTickets) * 100) : 0,
      };
    })
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topServices = Object.entries(serviceMap)
    .map(([id, d]) => ({
      id,
      name: d.name,
      category: d.category,
      count: d.count,
      percentage: totalTickets > 0 ? Math.round((d.count / totalTickets) * 100) : 0,
    }))
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topSectors = Object.entries(sectorMap)
    .map(([id, d]) => ({
      id,
      name: d.name,
      count: d.count,
      percentage: totalTickets > 0 ? Math.round((d.count / totalTickets) * 100) : 0,
    }))
    .filter((sec) => sec.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Técnico Destaque — o que mais resolveu chamados no período
  const topTech = topTechnicians.length > 0 ? topTechnicians[0] : null;
  const topTechHighlight = topTech && topTech.count > 0
    ? {
        name: topTech.name,
        completedCount: topTech.count,
        avgTimeFormatted: formatMinutes(topTech.avgTimeMinutes),
      }
    : null;

  // Top 3 tempos médios por técnico (os mais rápidos)
  const topAvgTimeTechs = avgTimeByTechnician.slice(0, 3).map((t) => ({
    name: t.name,
    avgTimeMinutes: t.value,
    avgTimeFormatted: formatMinutes(t.value),
  }));

  return {
    kpis: {
      totalTickets: {
        value: totalTickets,
        changePercent: changePercentTotal,
        prevValue: prevTotalTickets,
      },
      inProgress: { value: inProgress },
      completed: {
        value: completed,
        changePercent: changePercentCompleted,
        prevValue: prevCompleted,
      },
      waiting: { value: waiting },
      scheduled: { value: scheduled },
      avgTimeMinutes: {
        value: avgTimeMinutesVal,
        formatted: formatMinutes(avgTimeMinutesVal),
      },
      avgTimePerTech: {
        value: avgTimePerTechVal,
        formatted: formatMinutes(avgTimePerTechVal),
      },
      topTechHighlight,
      topAvgTimeTechs,
    },
    rankings: {
      topTechnicians,
      topServices,
      topSectors,
      servicesBySector,
    },
    charts: {
      byTechnician,
      bySector,
      byService,
      byStatus,
      byOrigin,
      avgTimeByTechnician,
      avgTimeByService,
      avgTimeBySector,
      byDay,
      byWeek,
      byMonth,
      servicesBySector,
    },
    periodRange: {
      start: range.start.toISOString(),
      end: range.end.toISOString(),
      label: range.label,
    },
  };
}

export async function getOperationalDashboardData(params: DashboardFilterParams = {}) {
  const range = getPeriodRange(params);

  // Filtros
  const whereCurrent: Prisma.TicketWhereInput = {
    deletedAt: null,
    ticketDate: { gte: range.start, lte: range.end },
  };

  if (params.sectorId) whereCurrent.sectorId = params.sectorId;
  if (params.serviceId) whereCurrent.serviceId = params.serviceId;
  if (params.technicianId) whereCurrent.technicianId = params.technicianId;

  // Busca paralela
  const [tickets, history, activeTechs] = await Promise.all([
    prisma.ticket.findMany({
      where: whereCurrent,
      include: {
        sector: true,
        service: true,
        technician: true,
        requester: true,
        pauses: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.ticketHistory.findMany({
      where: {
        createdAt: { gte: range.start, lte: range.end },
      },
      include: {
        ticket: { select: { ticketNumber: true, problem: true } },
        actor: { select: { name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.user.findMany({
      where: { role: { in: ["ADMIN", "TI"] }, isActive: true },
      select: { id: true, name: true, email: true, avatar: true },
    }),
  ]);

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  let inProgress = 0;
  let waiting = 0;
  let unassigned = 0;
  let resolvedToday = 0;
  let criticalCount = 0;
  let totalSlaMet = 0;
  let totalWithSla = 0;
  let totalResolvedTime = 0;
  
  // Initialize hours data structure
  const hoursData = Array.from({ length: 24 }, (_, i) => ({
    name: `${String(i).padStart(2, '0')}:00`,
    tickets: 0,
    totalMinutes: 0,
    averageMinutes: 0,
    resolved: 0
  }));

  const criticalTickets: any[] = [];
  const techStats: Record<string, { id: string, name: string, activeCount: number, resolvedToday: number }> = {};

  activeTechs.forEach(tech => {
    techStats[tech.id] = { id: tech.id, name: tech.name, activeCount: 0, resolvedToday: 0 };
  });

  const calculateEffectiveTime = (t: any): number => {
    if (typeof t.totalTimeMinutes === 'number' && t.totalTimeMinutes > 0) {
      return t.totalTimeMinutes;
    }
    if (t.startTime && t.endTime) {
      const diffMs = new Date(t.endTime).getTime() - new Date(t.startTime).getTime();
      let totalPauseMs = 0;
      if (t.pauses && t.pauses.length > 0) {
        t.pauses.forEach((p: any) => {
          const start = new Date(p.startTime).getTime();
          const end = p.endTime ? new Date(p.endTime).getTime() : new Date().getTime();
          totalPauseMs += (end - start);
        });
      }
      return Math.max(0, Math.floor((diffMs - totalPauseMs) / 60000));
    }
    return 0;
  };

  tickets.forEach(t => {
    // Basic counts
    if (t.status === "ABERTO") inProgress++;
    if (t.status === "AGUARDANDO_USUARIO" || t.status === "AGUARDANDO_PECA") waiting++;
    if (!t.technicianId) unassigned++;
    
    // Critical
    if (t.status !== "RESOLVIDO" && t.status !== "CANCELADO" && (t.priority === "ALTA" || t.priority === "CRITICA")) {
      criticalCount++;
      criticalTickets.push({
        id: t.id,
        number: t.ticketNumber,
        title: t.problem,
        priority: t.priority,
        dueDate: t.dueDate,
        technicianName: t.technician?.name || null
      });
    }

    // Resolved today
    if (t.status === "RESOLVIDO") {
      const closedDate = new Date(t.updatedAt).toISOString().slice(0, 10);
      if (closedDate === todayStr) {
        resolvedToday++;
        if (t.technicianId && techStats[t.technicianId]) {
          techStats[t.technicianId].resolvedToday++;
        }
      }
      
      if (typeof t.totalTimeMinutes === 'number') {
         totalResolvedTime += t.totalTimeMinutes;
      }
    }

    // Active per tech
    if (t.status !== "RESOLVIDO" && t.status !== "CANCELADO" && t.technicianId && techStats[t.technicianId]) {
      techStats[t.technicianId].activeCount++;
    }

    // SLA calculation
    if (t.dueDate) {
      totalWithSla++;
      if (t.status === "RESOLVIDO") {
        if (new Date(t.updatedAt) <= new Date(t.dueDate)) totalSlaMet++;
      } else if (t.status !== "CANCELADO") {
        if (now <= new Date(t.dueDate)) totalSlaMet++;
      }
    }

    // Tickets by hour (Adjusted for BRT timezone - America/Sao_Paulo)
    const dateBRT = new Date(new Date(t.createdAt).toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const hour = dateBRT.getHours();
    hoursData[hour].tickets++;
    if (t.status === "RESOLVIDO") {
      hoursData[hour].resolved++;
    }
    
    const effectiveTime = calculateEffectiveTime(t);
    hoursData[hour].totalMinutes += effectiveTime;
  });

  // Calculate SLA %
  const slaPercent = totalWithSla > 0 ? Math.round((totalSlaMet / totalWithSla) * 100) : 100;
  
  // Calculate Avg Time
  const resolvedCount = tickets.filter(t => t.status === "RESOLVIDO").length;
  const avgTimeMinutes = resolvedCount > 0 ? Math.round(totalResolvedTime / resolvedCount) : 0;

  // Format charts
  const byHourChart = hoursData
    .map(data => ({
      ...data,
      averageMinutes: data.tickets > 0 ? Math.round(data.totalMinutes / data.tickets) : 0
    }))
    .filter((_, hour) => hour >= 6 && hour <= 20); // Only business hours to avoid empty space

  const teamList = Object.values(techStats).sort((a, b) => b.activeCount - a.activeCount);
  const rankingList = [...teamList].sort((a, b) => b.resolvedToday - a.resolvedToday).slice(0, 5);

  return {
    kpis: {
      total: tickets.length,
      inProgress,
      waiting,
      unassigned,
      resolvedToday,
      criticalCount,
      slaPercent,
      avgTimeMinutes,
      avgTimeFormatted: formatMinutes(avgTimeMinutes),
    },
    charts: {
      byHour: byHourChart,
    },
    lists: {
      criticalTickets: criticalTickets.slice(0, 5),
      recentEvents: history.map(h => ({
        id: h.id,
        actor: h.actorName || "Sistema",
        action: h.description,
        ticket: h.ticket ? `#${h.ticket.ticketNumber}` : "",
        time: new Date(h.createdAt).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' }),
        date: new Date(h.createdAt).toLocaleDateString("pt-BR"),
      })),
      teamStatus: teamList,
      ranking: rankingList,
    },
    lastUpdated: now.toISOString(),
  };
}
