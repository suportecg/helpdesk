"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Calendar,
  Filter,
  Download,
  Settings2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Award,
  Layers,
  Building2,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { DashboardSkeleton } from "./DashboardSkeleton";
import {
  ChartWidget,
  ChartType,
} from "./charts/ChartWidgets";
import {
  WidgetConfigModal,
  DashboardWidgetConfig,
  INITIAL_WIDGETS_CONFIG,
} from "./WidgetConfigModal";
import { MonthYearSelector, getCurrentMonthYear } from "@/components/common/MonthYearSelector";
import { SectorServiceWidget } from "@/components/dashboard/SectorServiceWidget";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const STORAGE_KEY = "cg_helpdesk_dashboard_widgets_v1";

export function DashboardClient() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<string>("");
  const [monthYear, setMonthYear] = useState<string>(getCurrentMonthYear());
  const [stats, setStats] = useState<any>(null);
  const [widgets, setWidgets] = useState<DashboardWidgetConfig[]>(INITIAL_WIDGETS_CONFIG);
  const [configModalOpen, setConfigModalOpen] = useState(false);

  // Carregar configurações de widgets do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setWidgets(parsed);
        }
      }
    } catch (e) {
      console.error("Erro ao carregar widgets do localStorage", e);
    }
  }, []);

  const saveWidgets = (updated: DashboardWidgetConfig[]) => {
    setWidgets(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetDefault = () => {
    saveWidgets(INITIAL_WIDGETS_CONFIG);
  };

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (monthYear) {
        params.set("monthYear", monthYear);
      } else {
        params.set("period", period);
      }
      const res = await fetch(`/api/dashboard/stats?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error("Erro ao carregar dados do dashboard:", e);
    } finally {
      setLoading(false);
    }
  }, [period, monthYear]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Função para exportação/impressão institucional PDF
  const handlePrintPDF = () => {
    window.print();
  };

  // Exportar CSV de um gráfico individual
  const handleExportCSV = (widget: DashboardWidgetConfig) => {
    if (!stats || !stats.charts) return;
    const data = stats.charts[widget.id];
    if (!data || !Array.isArray(data)) return;

    const headers = Object.keys(data[0] || {}).join(",");
    const rows = data
      .map((row) => Object.values(row).map((v) => `"${v}"`).join(","))
      .join("\n");

    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(`${headers}\n${rows}`);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `cg_helpdesk_${widget.id}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !stats) {
    return <DashboardSkeleton />;
  }

  const kpis = stats?.kpis || {};
  const rankings = stats?.rankings || {};
  const charts = stats?.charts || {};

  return (
    <div className="space-y-6 pb-12">
      {/* CABEÇALHO DE IMPRESSÃO INSTITUCIONAL (Só aparece ao imprimir/PDF) */}
      <div className="hidden print:flex items-center justify-between border-b-2 border-primary pb-4 mb-6">
        <div className="flex items-center gap-4">
          <img src="/cg-logo.png" alt="CG Construções" className="h-14 w-auto" />
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Relatório Executivo de BI & Indicadores de TI
            </h1>
            <p className="text-xs text-muted-foreground">
              CG Construções HelpDesk Pro — Departamento de Tecnologia da Informação
            </p>
          </div>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">Período: {stats?.periodRange?.label}</p>
          <p>Impresso em: {new Date().toLocaleString("pt-BR")}</p>
        </div>
      </div>

      {/* BARRA SUPERIOR OPERACIONAL DE BI */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border rounded-xl p-4 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">
              Painel Corporativo de Indicadores
            </h2>
            <p className="text-xs text-muted-foreground">
              Consolidados e métricas analíticas em tempo real do HelpDesk
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Seletor de Mês */}
          <MonthYearSelector
            value={monthYear}
            onChange={(my) => {
              setMonthYear(my);
              setPeriod("");
            }}
          />

          {/* Seletor de Períodos Rápidos */}
          <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/30">
            {[
              { id: "TODAY", label: "Hoje" },
              { id: "YESTERDAY", label: "Ontem" },
              { id: "LAST_7_DAYS", label: "7 dias" },
              { id: "LAST_30_DAYS", label: "30 dias" },
              { id: "THIS_MONTH", label: "Este Mês" },
              { id: "THIS_YEAR", label: "Ano" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPeriod(p.id);
                  setMonthYear("");
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  period === p.id && !monthYear
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadStats}
            title="Atualizar Indicadores"
            className="h-8"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfigModalOpen(true)}
            className="h-8 font-medium"
          >
            <Settings2 className="h-3.5 w-3.5 mr-1.5" />
            Personalizar Dashboard
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handlePrintPDF}
            className="h-8 font-medium"
          >
            <Printer className="h-3.5 w-3.5 mr-1.5" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* LINHA DE 8 CARDS DE KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total de Chamados */}
        <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total de Chamados
              </span>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <FileSpreadsheet className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-foreground">
                {kpis.totalTickets?.value || 0}
              </span>
              {typeof kpis.totalTickets?.changePercent === "number" && (
                <Badge
                  variant="outline"
                  className={`text-[11px] font-mono px-1.5 py-0.5 ${
                    kpis.totalTickets.changePercent >= 0
                      ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/5"
                      : "text-rose-500 border-rose-500/30 bg-rose-500/5"
                  }`}
                >
                  {kpis.totalTickets.changePercent >= 0 ? "+" : ""}
                  {kpis.totalTickets.changePercent}% vs ant.
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Volume total ingressado no período
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Aberto */}
        <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Aberto
              </span>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-amber-500">
                {kpis.inProgress?.value || 0}
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                Ativos em fila
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Chamados com analistas em tratativa
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Resolvidos */}
        <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Resolvidos
              </span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-emerald-500">
                {kpis.completed?.value || 0}
              </span>
              {typeof kpis.completed?.changePercent === "number" && (
                <Badge
                  variant="outline"
                  className={`text-[11px] font-mono px-1.5 py-0.5 ${
                    kpis.completed.changePercent >= 0
                      ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/5"
                      : "text-rose-500 border-rose-500/30 bg-rose-500/5"
                  }`}
                >
                  {kpis.completed.changePercent >= 0 ? "+" : ""}
                  {kpis.completed.changePercent}% vs ant.
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Atendimentos finalizados com sucesso
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Aguardando & Agendados */}
        <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Pendências (Aguardando)
              </span>
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                <AlertCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-foreground">
                {kpis.waiting?.value || 0}
              </span>
              <Badge variant="secondary" className="text-[11px]">
                +{kpis.scheduled?.value || 0} Agendados
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Aguardando peças, fornecedor ou retorno
            </p>
          </CardContent>
        </Card>

        {/* KPI 5: Tempo Médio de Atendimento */}
        <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Tempo Médio Total
              </span>
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold text-indigo-500 font-mono">
                {kpis.avgTimeMinutes?.formatted || "0 min"}
              </span>
              <span className="text-xs text-muted-foreground">
                ({kpis.avgTimeMinutes?.value || 0} min)
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Média entre abertura e encerramento
            </p>
          </CardContent>
        </Card>

        {/* KPI 6: Tempo Médio por Técnico (Top 3) */}
        <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Tempo Médio / Técnico
              </span>
              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-500">
                <Users className="h-4 w-4" />
              </div>
            </div>
            {kpis.topAvgTimeTechs && kpis.topAvgTimeTechs.length > 0 ? (
              <div className="space-y-1.5">
                {kpis.topAvgTimeTechs.map((t: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-foreground font-medium truncate max-w-[100px]">{t.name}</span>
                    <span className="font-bold font-mono text-teal-500">{t.avgTimeFormatted}</span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-xl font-bold text-teal-500 font-mono">
                {kpis.avgTimePerTech?.formatted || "0 min"}
              </span>
            )}
            <p className="text-[11px] text-muted-foreground mt-1">
              Os 3 melhores tempos médios
            </p>
          </CardContent>
        </Card>

        {/* KPI 7: Técnico Destaque do Período */}
        <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                🏆 Técnico Destaque
              </span>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <Award className="h-4 w-4" />
              </div>
            </div>
            {kpis.topTechHighlight ? (
              <div>
                <span className="text-lg font-bold text-foreground">
                  {kpis.topTechHighlight.name}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    {kpis.topTechHighlight.completedCount} concluídos
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {kpis.topTechHighlight.avgTimeFormatted} médio
                  </Badge>
                </div>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Nenhum técnico no período</span>
            )}
            <p className="text-[11px] text-muted-foreground mt-1">
              Maior volume de resoluções
            </p>
          </CardContent>
        </Card>

        {/* KPI 8: Taxa de Resolução Rápida */}
        <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Taxa de Resolução
              </span>
              <div className="p-2 rounded-lg bg-pink-500/10 text-pink-500">
                <Award className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-foreground font-mono">
                {kpis.totalTickets?.value > 0
                  ? Math.round(((kpis.completed?.value || 0) / kpis.totalTickets.value) * 100)
                  : 0}
                %
              </span>
              <span className="text-xs text-muted-foreground">do volume</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Chamados finalizados no período
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 4 CARDS DE RANKING (TOP TÉCNICOS, SERVIÇOS, SETORES, SERVIÇOS POR SETOR) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Ranking 1: Top Técnicos */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Top Técnicos em Resolução
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {rankings.topTechnicians?.length > 0 ? (
              rankings.topTechnicians.map((t: any, idx: number) => (
                <div key={t.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-foreground">{t.name}</p>
                      <p className="text-[11px] text-muted-foreground">{t.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold font-mono text-foreground">{t.count} resolvidos</p>
                    <p className="text-[11px] text-muted-foreground">{t.avgTimeMinutes} min médio</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-6">
                Nenhum chamado resolvido por técnicos no período.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Ranking 2: Top Serviços */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Top Serviços mais Acionados
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {rankings.topServices?.length > 0 ? (
              rankings.topServices.map((s: any, idx: number) => (
                <div key={s.id} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground truncate max-w-[180px]">
                      {s.name}
                    </span>
                    <span className="font-bold font-mono text-foreground">
                      {s.count} ({s.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.max(8, s.percentage))}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-6">
                Nenhum serviço registrado no período.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Ranking 3: Top Setores */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Setores institucionais com Maior Volume
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {rankings.topSectors?.length > 0 ? (
              rankings.topSectors.map((sec: any, idx: number) => (
                <div key={sec.id} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground truncate max-w-[180px]">
                      {sec.name}
                    </span>
                    <span className="font-bold font-mono text-foreground">
                      {sec.count} ({sec.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.max(8, sec.percentage))}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-6">
                Nenhum setor registrado no período.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Ranking 4: Serviços por Setor */}
        <SectorServiceWidget data={rankings.servicesBySector} />
      </div>

      {/* GRID DE WIDGETS INTERATIVOS DE GRÁFICOS (11 Gráficos com Customização) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {widgets
          .filter((w) => w.visible)
          .sort((a, b) => a.order - b.order)
          .map((widget) => {
            const chartData = charts[widget.id] || [];
            const isTimeSeries = ["byDay", "byWeek", "byMonth"].includes(widget.id);
            const unit = widget.id.startsWith("avgTime") ? "min" : "chamados";

            return (
              <Card
                key={widget.id}
                className={`border-border bg-card shadow-sm hover:shadow-md transition-all flex flex-col ${
                  widget.colSpan === 3
                    ? "md:col-span-2 lg:col-span-3"
                    : widget.colSpan === 2
                    ? "md:col-span-2 lg:col-span-2"
                    : "col-span-1"
                }`}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/60">
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground">
                      {widget.title}
                    </CardTitle>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {widget.description}
                    </p>
                  </div>

                  {/* Barra de Ferramentas por Widget (Oculta na Impressão PDF) */}
                  <div className="flex items-center gap-1.5 print:hidden">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-[11px] font-semibold rounded border-border bg-muted/30 hover:bg-muted/50"
                          title="Alternar tipo de visualização do gráfico"
                        >
                          {widget.currentType === "BAR" && "Barra"}
                          {widget.currentType === "PIE" && "Pizza"}
                          {widget.currentType === "DONUT" && "Rosca"}
                          {widget.currentType === "LINE" && "Linha"}
                          {widget.currentType === "AREA" && "Área"}
                          {widget.currentType === "RADAR" && "Radar"}
                          <ChevronDown className="ml-1 h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {widget.allowedTypes.map((type) => (
                          <DropdownMenuItem
                            key={type}
                            onClick={() => {
                              const next = widgets.map((w) =>
                                w.id === widget.id
                                  ? { ...w, currentType: type as ChartType }
                                  : w
                              );
                              saveWidgets(next);
                            }}
                          >
                            {type === "BAR" && "Barra"}
                            {type === "PIE" && "Pizza"}
                            {type === "DONUT" && "Rosca"}
                            {type === "LINE" && "Linha"}
                            {type === "AREA" && "Área"}
                            {type === "RADAR" && "Radar"}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleExportCSV(widget)}
                      title="Exportar dados do gráfico em CSV"
                    >
                      <Download className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-4 flex-1">
                  <ChartWidget
                    data={chartData}
                    type={widget.currentType}
                    height={270}
                    unit={unit}
                    isTimeSeries={isTimeSeries}
                  />
                </CardContent>
              </Card>
            );
          })}
      </div>

      {/* Modal de Customização de Layout do Dashboard */}
      <WidgetConfigModal
        open={configModalOpen}
        onOpenChange={setConfigModalOpen}
        widgets={widgets}
        onUpdateWidgets={saveWidgets}
        onResetDefault={handleResetDefault}
      />
    </div>
  );
}
