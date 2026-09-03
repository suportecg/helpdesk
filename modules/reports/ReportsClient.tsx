"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { motion, type Variants } from "framer-motion";
import {
  TrendUp,
  ArrowsClockwise,
  Faders,
  Printer,
  FileXls,
  Clock,
  CheckCircle,
  WarningCircle,
  Users,
  Medal,
  Stack,
  Buildings,
  DownloadSimple,
  Funnel,
  ChartBar,
  CaretDown,
} from "@phosphor-icons/react";
import { DashboardSkeleton } from "@/modules/dashboard/DashboardSkeleton";
import { ChartWidget, ChartType } from "@/modules/dashboard/charts/ChartWidgets";
import {
  WidgetConfigModal,
  DashboardWidgetConfig,
  INITIAL_WIDGETS_CONFIG,
} from "@/modules/dashboard/WidgetConfigModal";
import {
  ExportPDFModal,
  PDFFormat,
  PDFTheme,
  ReportMode,
} from "./ExportPDFModal";
import { generateProfessionalPDF } from "./generateProfessionalPDF";
import { MonthYearSelector, getCurrentMonthYear } from "@/components/common/MonthYearSelector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const STORAGE_KEY = "cg_helpdesk_dashboard_widgets_v1";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  show: { 
    opacity: 1, 
    y: 0, 
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 100, damping: 20 } 
  }
};

export function ReportsClient() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<string>("");
  const [monthYear, setMonthYear] = useState<string>(getCurrentMonthYear());
  const [reportMode, setReportMode] = useState<ReportMode>("EXECUTIVO");
  const [stats, setStats] = useState<any>(null);
  const [widgets, setWidgets] = useState<DashboardWidgetConfig[]>(
    INITIAL_WIDGETS_CONFIG
  );
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  useEffect(() => {
    async function loadLayouts() {
      try {
        const res = await fetch("/api/report-layouts");
        if (res.ok) {
          const layouts = await res.json();
          const defaultLayout = layouts.find((l: any) => l.isDefault) || layouts[0];
          if (defaultLayout && defaultLayout.config && Array.isArray(defaultLayout.config)) {
            setWidgets(defaultLayout.config);
            return;
          }
        }
      } catch (e) {
        console.error("Erro ao carregar layouts do banco:", e);
      }
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
    }
    loadLayouts();
  }, []);

  const saveWidgets = async (updated: DashboardWidgetConfig[]) => {
    setWidgets(updated);
    if (reportMode !== "PERSONALIZADO") {
      setReportMode("PERSONALIZADO");
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      await fetch("/api/report-layouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Custom Layout (${new Date().toLocaleDateString("pt-BR")})`,
          config: updated,
          isDefault: true,
        }),
      });
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
      console.error("Erro ao carregar dados de relatórios BI:", e);
    } finally {
      setLoading(false);
    }
  }, [period, monthYear]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleGeneratePDF = ({
    format,
    theme,
    mode,
  }: {
    format: PDFFormat;
    theme: PDFTheme;
    mode: ReportMode;
  }) => {
    generateProfessionalPDF({
      stats,
      config: { theme, mode },
      widgets,
    });
  };

  const handleExportCSV = (widget: DashboardWidgetConfig) => {
    if (!stats || !stats.charts) return;
    const data = stats.charts[widget.id];
    if (!data || !Array.isArray(data)) return;

    const headers = Object.keys(data[0] || {}).join(",");
    const rows = data
      .map((row) => Object.values(row).map((v) => `"${v}"`).join(","))
      .join("\n");

    const csvContent =
      "data:text/csv;charset=utf-8," + encodeURIComponent(`${headers}\n${rows}`);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute(
      "download",
      `cg_helpdesk_${widget.id}_${new Date().toISOString().slice(0, 10)}.csv`
    );
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

  // Filtrar widgets na tela conforme o Modo de Relatório
  const visibleWidgets = widgets.filter((w) => {
    if (!w.visible) return false;
    if (reportMode === "EXECUTIVO") {
      return ["byOrigin", "byMonth", "byStatus"].includes(w.id);
    }
    if (reportMode === "OPERACIONAL") {
      return ["byStatus", "byDay", "byWeek", "byOrigin"].includes(w.id);
    }
    if (reportMode === "PRODUTIVIDADE") {
      return ["avgTimeByTechnician"].includes(w.id);
    }
    if (reportMode === "PERFORMANCE") {
      return [
        "avgTimeByTechnician",
        "avgTimeByService",
        "avgTimeBySector",
        "byDay",
      ].includes(w.id);
    }
    return true; // PERSONALIZADO exibe todos os habilitados pelo usuário
  });

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-12 pb-12"
    >
      {/* CABEÇALHO ART GALLERY (Minimalista, Espaçado) */}
      <motion.div variants={itemVariants} className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-6 border-b border-border/40">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <ChartBar weight="duotone" className="h-8 w-8 text-foreground" />
            <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-widest bg-background">
              {reportMode}
            </Badge>
          </div>
          <h1 className="text-4xl font-display font-bold tracking-tight text-foreground">
            Relatórios & BI
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl">
            Análise aprofundada de performance, SLA e volumetria do departamento de TI.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Seletor de Mês */}
          <div className="bg-background rounded-lg border border-border/60 p-1">
            <MonthYearSelector
              value={monthYear}
              onChange={(my) => {
                setMonthYear(my);
                setPeriod("");
              }}
            />
          </div>

          {/* Seletor de Períodos Rápidos */}
          <div className="flex rounded-lg border border-border/60 p-1 bg-background">
            {[
              { id: "TODAY", label: "Hoje" },
              { id: "YESTERDAY", label: "Ontem" },
              { id: "LAST_7_DAYS", label: "7 dias" },
              { id: "LAST_30_DAYS", label: "30 dias" },
              { id: "THIS_MONTH", label: "Mês" },
              { id: "THIS_YEAR", label: "Ano" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPeriod(p.id);
                  setMonthYear("");
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  period === p.id && !monthYear
                    ? "bg-foreground text-background shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={loadStats}
              title="Atualizar Indicadores"
              className="h-10 w-10 rounded-xl"
            >
              <ArrowsClockwise
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setConfigModalOpen(true)}
              title="Personalizar Widgets"
              className="h-10 w-10 rounded-xl"
            >
              <Faders className="h-4 w-4" />
            </Button>

            <Button
              variant="default"
              onClick={() => setExportModalOpen(true)}
              className="h-10 px-4 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
            >
              <Printer className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </motion.div>

      {/* SELETOR DE MODOS DE RELATÓRIO EXECUTIVO (Art Gallery Style) */}
      <motion.div variants={itemVariants} className="flex flex-wrap items-stretch gap-3">
        {[
          {
            id: "EXECUTIVO",
            label: "Executivo",
            desc: "Visão institucional",
          },
          {
            id: "OPERACIONAL",
            label: "Operacional",
            desc: "Fila e fluxo diário",
          },
          {
            id: "PRODUTIVIDADE",
            label: "Produtividade",
            desc: "Equipe e tempos",
          },
          {
            id: "PERFORMANCE",
            label: "Performance",
            desc: "SLA e eficiência",
          },
          {
            id: "PERSONALIZADO",
            label: "Personalizado",
            desc: "Visão livre",
          },
        ].map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setReportMode(m.id as ReportMode)}
            className={`flex-1 min-w-[160px] p-4 rounded-[1.5rem] text-left transition-all duration-300 border ${
              reportMode === m.id
                ? "bg-foreground text-background shadow-xl scale-[1.02] border-transparent"
                : "bg-card border-border/40 text-foreground hover:border-foreground/20 hover:bg-accent/50"
            }`}
          >
            <p className="text-sm font-display font-bold tracking-wide uppercase mb-1">{m.label}</p>
            <p className={`text-xs ${reportMode === m.id ? 'text-background/70' : 'text-muted-foreground'}`}>
              {m.desc}
            </p>
          </button>
        ))}
      </motion.div>

      {/* KPIs NÍVEL 1: GRANDES NÚMEROS */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card rounded-[2rem] p-8 flex flex-col justify-between h-[200px] group hover-lift">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Total Ingressado
            </span>
            <FileXls weight="duotone" className="h-6 w-6 text-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <div className="text-6xl font-display font-bold text-foreground mb-2">
              {kpis.totalTickets?.value || 0}
            </div>
            {typeof kpis.totalTickets?.changePercent === "number" && (
              <div className={`text-sm font-semibold flex items-center gap-1 ${kpis.totalTickets.changePercent >= 0 ? 'text-success' : 'text-danger'}`}>
                {kpis.totalTickets.changePercent >= 0 ? <TrendUp weight="bold" /> : <TrendUp weight="bold" className="rotate-180" />}
                {Math.abs(kpis.totalTickets.changePercent)}% vs anterior
              </div>
            )}
          </div>
        </div>

        <div className="glass-card rounded-[2rem] p-8 flex flex-col justify-between h-[200px] group hover-lift">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Resolvidos
            </span>
            <CheckCircle weight="duotone" className="h-6 w-6 text-success opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <div className="text-6xl font-display font-bold text-foreground mb-2">
              {kpis.completed?.value || 0}
            </div>
            {typeof kpis.completed?.changePercent === "number" && (
              <div className={`text-sm font-semibold flex items-center gap-1 ${kpis.completed.changePercent >= 0 ? 'text-success' : 'text-danger'}`}>
                {kpis.completed.changePercent >= 0 ? <TrendUp weight="bold" /> : <TrendUp weight="bold" className="rotate-180" />}
                {Math.abs(kpis.completed.changePercent)}% vs anterior
              </div>
            )}
          </div>
        </div>

        <div className="glass-card rounded-[2rem] p-8 flex flex-col justify-between h-[200px] group hover-lift">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Taxa de Resolução
            </span>
            <Medal weight="duotone" className="h-6 w-6 text-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-6xl font-display font-bold text-foreground">
                {kpis.totalTickets?.value > 0
                  ? Math.round(((kpis.completed?.value || 0) / kpis.totalTickets.value) * 100)
                  : 0}
              </span>
              <span className="text-2xl font-bold text-muted-foreground">%</span>
            </div>
            <div className="text-sm font-medium text-muted-foreground">do volume ingressado</div>
          </div>
        </div>

        <div className="glass-card rounded-[2rem] p-8 flex flex-col justify-between h-[200px] group hover-lift bg-foreground text-background">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-background/60 uppercase tracking-widest">
              Tempo Médio Total
            </span>
            <Clock weight="duotone" className="h-6 w-6 text-background opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-display font-bold mb-2 tracking-tight">
              {kpis.avgTimeMinutes?.formatted || "0 min"}
            </div>
            <div className="text-sm font-medium text-background/60">
              ({kpis.avgTimeMinutes?.value || 0} minutos líquidos)
            </div>
          </div>
        </div>
      </motion.div>

      {/* KPIs NÍVEL 2: BARRA DE STATUS MINIMALISTA */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row items-center divide-y md:divide-y-0 md:divide-x divide-border bg-card/40 border border-border/60 rounded-2xl overflow-hidden backdrop-blur-sm">
        {/* Aberto */}
        <div className="flex-1 w-full p-6 flex items-center justify-between hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3">
            <Clock weight="fill" className="h-5 w-5 text-warning" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Em Fila</span>
          </div>
          <span className="text-3xl font-display font-bold text-foreground">{kpis.inProgress?.value || 0}</span>
        </div>
        {/* Pendências */}
        <div className="flex-1 w-full p-6 flex items-center justify-between hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3">
            <WarningCircle weight="fill" className="h-5 w-5 text-blue-500" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Aguardando</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-display font-bold text-foreground">{kpis.waiting?.value || 0}</span>
            <span className="text-sm font-semibold text-muted-foreground">(+{kpis.scheduled?.value || 0})</span>
          </div>
        </div>
        {/* Tempo Médio por Técnico */}
        <div className="flex-1 w-full p-6 flex items-center justify-between hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3">
            <Users weight="fill" className="h-5 w-5 text-foreground" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">TMA Técnico</span>
          </div>
          <span className="text-2xl font-display font-bold text-foreground">{kpis.avgTimePerTech?.formatted || "0 min"}</span>
        </div>
        {/* Técnicos Ativos */}
        <div className="flex-1 w-full p-6 flex items-center justify-between hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3">
            <Users weight="fill" className="h-5 w-5 text-success" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Equipe Ativa</span>
          </div>
          <span className="text-3xl font-display font-bold text-foreground">{kpis.activeTechCount?.value || 0}</span>
        </div>
      </motion.div>

      {/* 3 CARDS DE RANKING (Minimalistas) */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-16 pt-16 border-t border-border/40">
        {/* Ranking 1: Top Técnicos */}
        <div className="flex flex-col">
          <div className="pb-4 mb-6">
            <h3 className="text-lg font-display font-bold flex items-center gap-3 text-foreground">
              <Medal weight="duotone" className="h-6 w-6 text-muted-foreground" />
              Top Técnicos
            </h3>
          </div>
          <div className="space-y-6">
            {rankings.topTechnicians?.length > 0 ? (
              rankings.topTechnicians.slice(0, 5).map((t: any, idx: number) => {
                const maxCount = rankings.topTechnicians[0].count;
                return (
                  <div key={t.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-muted text-foreground font-bold flex items-center justify-center text-xs">
                          {idx + 1}
                        </span>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">{t.name}</span>
                          <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{t.avgTimeMinutes} min médio</span>
                        </div>
                      </div>
                      <span className="font-display font-bold text-lg text-foreground">{t.count}</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-foreground rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${Math.min(100, Math.max(8, (t.count / maxCount) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground py-6">
                Nenhum chamado resolvido no período.
              </p>
            )}
          </div>
        </div>

        {/* Ranking 2: Top Serviços */}
        <div className="flex flex-col">
          <div className="pb-4 mb-6">
            <h3 className="text-lg font-display font-bold flex items-center gap-3 text-foreground">
              <Stack weight="duotone" className="h-6 w-6 text-muted-foreground" />
              Top Serviços
            </h3>
          </div>
          <div className="space-y-6">
            {rankings.topServices?.length > 0 ? (
              rankings.topServices.slice(0, 5).map((s: any) => (
                <div key={s.id} className="space-y-2">
                  <div className="flex items-end justify-between">
                    <span className="font-semibold text-foreground truncate max-w-[200px]">
                      {s.name}
                    </span>
                    <span className="font-display font-bold text-lg text-foreground">
                      {s.count}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-foreground/60 rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${Math.min(100, Math.max(8, s.percentage))}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-6">
                Nenhum serviço registrado no período.
              </p>
            )}
          </div>
        </div>

        {/* Ranking 3: Top Setores */}
        <div className="flex flex-col">
          <div className="pb-4 mb-6">
            <h3 className="text-lg font-display font-bold flex items-center gap-3 text-foreground">
              <Buildings weight="duotone" className="h-6 w-6 text-muted-foreground" />
              Setores Acionadores
            </h3>
          </div>
          <div className="space-y-6">
            {rankings.topSectors?.length > 0 ? (
              rankings.topSectors.slice(0, 5).map((sec: any) => (
                <div key={sec.id} className="space-y-2">
                  <div className="flex items-end justify-between">
                    <span className="font-semibold text-foreground truncate max-w-[200px]">
                      {sec.name}
                    </span>
                    <span className="font-display font-bold text-lg text-foreground">
                      {sec.count}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-foreground/30 rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${Math.min(100, Math.max(8, sec.percentage))}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-6">
                Nenhum setor registrado no período.
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* GRADE DE WIDGETS INTERATIVOS (Art Gallery Bento Grid) */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16 pt-16 border-t border-border/40">
        {visibleWidgets
          .sort((a, b) => a.order - b.order)
          .map((widget) => {
            const chartData = charts[widget.id] || [];
            const isTimeSeries = [
              "byDay",
              "byWeek",
              "byMonth",
            ].includes(widget.id);
            const unit = widget.id.startsWith("avgTime") ? "min" : "chamados";

            return (
              <div
                key={widget.id}
                className={`glass-card rounded-[2rem] p-6 flex flex-col ${
                  widget.colSpan === 3
                    ? "md:col-span-2 lg:col-span-3"
                    : widget.colSpan === 2
                    ? "md:col-span-2 lg:col-span-2"
                    : "col-span-1"
                }`}
              >
                <div className="flex flex-row items-center justify-between pb-4 mb-4">
                  <div>
                    <h3 className="text-lg font-display font-bold text-foreground">
                      {widget.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {widget.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs font-semibold rounded-lg bg-background hover:bg-muted/50"
                          title="Alternar visualização"
                        >
                          {widget.currentType === "BAR" && "Barra"}
                          {widget.currentType === "PIE" && "Pizza"}
                          {widget.currentType === "DONUT" && "Rosca"}
                          {widget.currentType === "LINE" && "Linha"}
                          {widget.currentType === "AREA" && "Área"}
                          {widget.currentType === "RADAR" && "Radar"}
                          <CaretDown className="ml-1.5 h-3.5 w-3.5" />
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
                      className="h-8 w-8 rounded-lg hover:bg-muted/50"
                      onClick={() => handleExportCSV(widget)}
                      title="Exportar em CSV"
                    >
                      <DownloadSimple className="h-4 w-4 text-foreground" />
                    </Button>
                  </div>
                </div>

                <div className="flex-1 w-full relative min-h-[300px]">
                  <ChartWidget
                    data={chartData}
                    type={widget.currentType}
                    height={300}
                    unit={unit}
                    isTimeSeries={isTimeSeries}
                  />
                </div>
              </div>
            );
          })}
      </motion.div>

      {/* Modal de Customização de Layout (ADMIN) */}
      <WidgetConfigModal
        open={configModalOpen}
        onOpenChange={setConfigModalOpen}
        widgets={widgets}
        onUpdateWidgets={saveWidgets}
        onResetDefault={handleResetDefault}
      />

      {/* Modal Profissional de Exportação PDF em A4 / A3 Landscape */}
      <ExportPDFModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        currentMode={reportMode}
        periodLabel={stats?.periodRange?.label}
        onGeneratePDF={handleGeneratePDF}
      />
    </motion.div>
  );
}
