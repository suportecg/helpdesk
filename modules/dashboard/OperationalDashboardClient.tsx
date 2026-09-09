"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { 
  Headset, PushPin, ChartBar, Fire, Users, ListChecks, MonitorPlay,
  Plus, UserPlus, Desktop, HardDrives, Clock, CheckCircle, WarningCircle, Gear, UserFocus, At
} from "@phosphor-icons/react";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30, filter: "blur(5px)" },
  show: { 
    opacity: 1, 
    y: 0, 
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 100, damping: 20 } 
  }
};

const formatMins = (mins: number) => {
  if (mins === 0) return '0 min';
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
};

const CustomTooltip = ({ active, payload, label, currentMetric }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    const getHighlight = (metric: string) => {
      return currentMetric === metric ? "bg-primary/10 border-primary/20 -mx-2 px-2 py-1 rounded-lg" : "py-1";
    };

    return (
      <div className="bg-background/95 backdrop-blur-md border border-border p-4 rounded-2xl shadow-xl min-w-[200px]">
        <p className="font-mono text-sm text-muted-foreground mb-3 font-semibold">{label}</p>
        
        <div className="space-y-1">
          <div className={`flex justify-between items-center gap-4 transition-colors ${getHighlight('totalMinutes')}`}>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tempo de atendimento</span>
            <span className="font-mono font-bold text-primary">{formatMins(data.totalMinutes)}</span>
          </div>
          
          <div className={`flex justify-between items-center gap-4 transition-colors ${getHighlight('tickets')}`}>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Chamados</span>
            <span className="font-mono font-bold">{data.tickets}</span>
          </div>
          
          <div className={`flex justify-between items-center gap-4 transition-colors ${getHighlight('averageMinutes')}`}>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tempo médio</span>
            <span className="font-mono font-bold">{formatMins(data.averageMinutes)}</span>
          </div>
          
          <div className={`flex justify-between items-center gap-4 transition-colors ${getHighlight('resolved')}`}>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resolvidos</span>
            <span className="font-mono font-bold text-emerald-500">{data.resolved}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// Default widget visibility
const defaultWidgets = {
  heroCards: true,
  slaTower: true,
  slaRisk: true,
  chart: true,
  teamStats: true,
  timeline: true
};

export function OperationalDashboardClient() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [chartMetric, setChartMetric] = useState<"totalMinutes" | "tickets" | "resolved" | "averageMinutes">("totalMinutes");
  const [teamPeriod, setTeamPeriod] = useState<"TODAY" | "THIS_MONTH" | "LAST_30_DAYS">("THIS_MONTH");
  
  const [widgets, setWidgets] = useState(defaultWidgets);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem("helpdesk_dashboard_widgets");
    if (saved) {
      try {
        setWidgets(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const toggleWidget = (key: keyof typeof defaultWidgets) => {
    const newWidgets = { ...widgets, [key]: !widgets[key] };
    setWidgets(newWidgets);
    localStorage.setItem("helpdesk_dashboard_widgets", JSON.stringify(newWidgets));
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/operational?period=TODAY&teamPeriod=${teamPeriod}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Erro ao carregar dashboard:", e);
    } finally {
      setLoading(false);
    }
  }, [teamPeriod]);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(), 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  if (!isClient) return null;
  if (!data && loading) return <DashboardSkeleton />;
  if (!data) return <div className="p-8 text-center text-muted-foreground">Erro ao carregar dashboard.</div>;

  const { kpis, charts, lists, userName } = data;
  const firstName = userName ? userName.split(' ')[0] : 'Suporte TI';

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col h-full w-full max-w-7xl mx-auto py-12 px-4 md:px-8 bg-background min-h-[100dvh]"
    >
      
      {/* HEADER TENSION */}
      <motion.div variants={itemVariants} className="mb-12 flex items-end justify-between">
        <div>
          <div className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium bg-primary/10 text-primary w-max mb-3">
            Dashboard Operacional
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-foreground">
            Olá, {firstName}.
          </h1>
          <p className="text-base text-muted-foreground mt-2 max-w-[65ch] leading-relaxed">
            Seu centro de comando inteligente. Acompanhe métricas críticas, SLA em tempo real e a distribuição atual da sua equipe.
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 rounded-full px-4 border-border/50 shadow-sm hover-lift">
              <Gear weight="bold" className="w-4 h-4" />
              Configurar Dashboard
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-4 rounded-2xl shadow-xl border-border/50 bg-background/95 backdrop-blur-md">
            <h4 className="font-semibold text-sm mb-4">Personalizar Visualização</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="w-hero" className="text-sm cursor-pointer">Visão Geral (Cards)</Label>
                <Switch id="w-hero" checked={widgets.heroCards} onCheckedChange={() => toggleWidget('heroCards')} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="w-sla" className="text-sm cursor-pointer">Torre de SLA Global</Label>
                <Switch id="w-sla" checked={widgets.slaTower} onCheckedChange={() => toggleWidget('slaTower')} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="w-risk" className="text-sm cursor-pointer">SLA em Risco</Label>
                <Switch id="w-risk" checked={widgets.slaRisk} onCheckedChange={() => toggleWidget('slaRisk')} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="w-chart" className="text-sm cursor-pointer">Carga por Hora</Label>
                <Switch id="w-chart" checked={widgets.chart} onCheckedChange={() => toggleWidget('chart')} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="w-team" className="text-sm cursor-pointer">Desempenho da Equipe</Label>
                <Switch id="w-team" checked={widgets.teamStats} onCheckedChange={() => toggleWidget('teamStats')} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="w-time" className="text-sm cursor-pointer">Timeline Log</Label>
                <Switch id="w-time" checked={widgets.timeline} onCheckedChange={() => toggleWidget('timeline')} />
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>

      {/* THE ASYMMETRICAL BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* HERO KPI CARDS - SPANNING LEFT */}
        {widgets.heroCards && (
          <motion.div variants={itemVariants} className={`grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4 ${widgets.slaTower ? 'md:col-span-8 xl:col-span-9' : 'md:col-span-12'}`}>
            <Link href="/chamados?status=ABERTO" className="block group w-full hover-lift">
              <div className="glass-card rounded-[2rem] p-4 md:p-5 h-full relative overflow-hidden flex flex-col justify-between min-h-[140px] md:min-h-[160px]">
                <div className="flex items-center gap-2 relative z-10">
                  <div className="p-2 bg-primary/10 rounded-xl shrink-0">
                    <WarningCircle weight="bold" className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-[10px] xl:text-xs font-semibold text-foreground/70 uppercase tracking-normal whitespace-nowrap truncate">Abertos</span>
                </div>
                <div className="relative z-10 mt-4">
                  <div className="text-4xl md:text-5xl font-display font-bold text-foreground tracking-tighter">
                    {kpis.inProgress}
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/chamados?status=EM_ANDAMENTO" className="block group w-full hover-lift">
              <div className="glass-card rounded-[2rem] p-4 md:p-5 h-full relative overflow-hidden flex flex-col justify-between min-h-[140px] md:min-h-[160px]">
                <div className="flex items-center gap-2 relative z-10">
                  <div className="p-2 bg-indigo-500/10 rounded-xl shrink-0">
                    <At weight="bold" className="w-5 h-5 text-indigo-500" />
                  </div>
                  <span className="text-[10px] xl:text-xs font-semibold text-foreground/70 uppercase tracking-normal whitespace-nowrap truncate" title="Em Atendimento">Em Atend.</span>
                </div>
                <div className="relative z-10 mt-4">
                  <div className="text-4xl md:text-5xl font-display font-bold text-foreground tracking-tighter">
                    {kpis.inService || 0}
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/chamados?status=AGUARDANDO_USUARIO" className="block group w-full hover-lift">
              <div className="glass-card rounded-[2rem] p-4 md:p-5 h-full relative overflow-hidden flex flex-col justify-between min-h-[140px] md:min-h-[160px]">
                <div className="flex items-center gap-2 relative z-10">
                  <div className="p-2 bg-blue-500/10 rounded-xl shrink-0">
                    <UserFocus weight="bold" className="w-5 h-5 text-blue-500" />
                  </div>
                  <span className="text-[10px] xl:text-xs font-semibold text-foreground/70 uppercase tracking-normal whitespace-nowrap truncate" title="Aguardando">Aguardando</span>
                </div>
                <div className="relative z-10 mt-4">
                  <div className="text-4xl md:text-5xl font-display font-bold text-foreground tracking-tighter">
                    {kpis.waiting}
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/chamados?technicianId=null" className="block group w-full hover-lift">
              <div className="glass-card rounded-[2rem] p-4 md:p-5 h-full relative overflow-hidden flex flex-col justify-between min-h-[140px] md:min-h-[160px]">
                <div className="flex items-center gap-2 relative z-10">
                  <div className="p-2 bg-warning/10 rounded-xl shrink-0">
                    <Headset weight="bold" className="w-5 h-5 text-warning" />
                  </div>
                  <span className="text-[10px] xl:text-xs font-semibold text-foreground/70 uppercase tracking-normal whitespace-nowrap truncate" title="Fila Geral">Fila Geral</span>
                </div>
                <div className="relative z-10 mt-4">
                  <div className="text-4xl md:text-5xl font-display font-bold text-foreground tracking-tighter">
                    {kpis.unassigned}
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/chamados?slaRisk=true" className="block group w-full hover-lift">
              <div className="glass-card rounded-[2rem] p-4 md:p-5 h-full relative overflow-hidden flex flex-col justify-between min-h-[140px] md:min-h-[160px]">
                <div className="flex items-center gap-2 relative z-10">
                  <div className="p-2 bg-danger/10 rounded-xl shrink-0">
                    <Fire weight="bold" className="w-5 h-5 text-danger" />
                  </div>
                  <span className="text-[10px] xl:text-xs font-semibold text-foreground/70 uppercase tracking-normal whitespace-nowrap truncate" title="Risco SLA">Risco SLA</span>
                </div>
                <div className="relative z-10 mt-4">
                  <div className="text-4xl md:text-5xl font-display font-bold text-danger tracking-tighter">
                    {kpis.slaRiskCount || 0}
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* SLA TOWER - SPANNING RIGHT */}
        {widgets.slaTower && (
          <motion.div variants={itemVariants} className={`h-full ${widgets.heroCards ? 'md:col-span-4 xl:col-span-3' : 'md:col-span-12'}`}>
             <div className="glass-card rounded-[2rem] p-8 h-full flex flex-col">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Clock weight="bold" className="w-4 h-4 text-primary" />
                    Saúde Operacional
                  </h3>
               </div>
               <div className="flex-1 flex flex-col justify-center items-center text-center">
                  <div className="relative">
                    <motion.div 
                      animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className={cn("absolute inset-0 rounded-full blur-2xl -z-10", kpis.slaPercent >= 90 ? 'bg-success/20' : kpis.slaPercent >= 70 ? 'bg-warning/20' : 'bg-danger/20')}
                    />
                    <div className={cn("text-7xl font-display font-bold tracking-tighter", kpis.slaPercent >= 90 ? 'text-success' : kpis.slaPercent >= 70 ? 'text-warning' : 'text-danger')}>
                      {kpis.slaPercent}<span className="text-3xl">%</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-foreground mt-4">Nível Global de SLA</p>
                  <div className="w-full h-2 bg-secondary rounded-full mt-6 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${kpis.slaPercent}%` }}
                      transition={{ duration: 1.5, type: "spring", bounce: 0 }}
                      className={cn("h-full", kpis.slaPercent >= 90 ? 'bg-success' : kpis.slaPercent >= 70 ? 'bg-warning' : 'bg-danger')}
                    />
                  </div>
               </div>
             </div>
          </motion.div>
        )}

        {/* SLA RISK TICKETS */}
        {widgets.slaRisk && (
          <motion.div variants={itemVariants} className="md:col-span-4 glass-card rounded-[2rem] p-8">
            <h3 className="text-lg font-bold flex items-center gap-2 text-foreground mb-6">
              <Fire weight="duotone" className="w-6 h-6 text-danger" />
              SLA Crítico
            </h3>
            <div className="space-y-4">
              {lists.slaRiskTickets?.length === 0 ? (
                <div className="text-center text-muted-foreground py-6 text-sm">Nenhum chamado em risco no momento.</div>
              ) : (
                lists.slaRiskTickets?.map((t: any) => (
                  <Link href={`/chamados/${t.id}`} key={t.id} className="flex flex-col gap-1 p-3 rounded-xl hover:bg-secondary/50 transition-colors group">
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-1">#{t.number} {t.title}</span>
                      <Badge variant={t.breached ? "destructive" : "warning"} className="ml-2 shrink-0">
                        {t.breached ? "Estourado" : "Em Risco"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                      <span>{t.technicianName || 'Sem Atribuição'}</span>
                      <span className={t.breached ? 'text-danger font-medium' : 'text-warning font-medium'}>
                        {t.breached ? 'Venceu ' : 'Vence em '}
                        {Math.abs(Math.round(t.msLeft / 60000))} min
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* CHART SECTION */}
        {widgets.chart && (
          <motion.div variants={itemVariants} className={`${widgets.slaRisk ? 'md:col-span-8' : 'md:col-span-12'} glass-card rounded-[2rem] p-8 flex flex-col`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                <ChartBar weight="duotone" className="w-6 h-6 text-primary" />
                Carga de Atendimento por Hora
              </h3>
              
              <select 
                value={chartMetric} 
                onChange={(e) => setChartMetric(e.target.value as any)}
                className="bg-secondary/50 border border-border text-sm rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="totalMinutes">Tempo de atendimento</option>
                <option value="tickets">Chamados abertos</option>
                <option value="resolved">Chamados resolvidos</option>
                <option value="averageMinutes">Tempo médio por chamado</option>
              </select>
            </div>
            <div className="h-[280px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart key={chartMetric} data={charts.byHour} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B', fontFamily: 'var(--font-outfit)' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B', fontFamily: 'var(--font-outfit)' }} tickFormatter={(val) => chartMetric === 'totalMinutes' || chartMetric === 'averageMinutes' ? formatMins(val) : val} />
                  <Tooltip 
                    cursor={{ fill: 'var(--secondary)', opacity: 0.5 }} 
                    content={<CustomTooltip currentMetric={chartMetric} />}
                  />
                  <Bar dataKey={chartMetric} radius={[8, 8, 8, 8]} maxBarSize={32} minPointSize={2}>
                    {charts.byHour.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry[chartMetric] > (chartMetric === 'totalMinutes' ? 120 : chartMetric === 'tickets' ? 5 : 0) ? 'var(--warning)' : 'var(--primary-brand)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* TEAM STATUS */}
        {widgets.teamStats && (
          <motion.div variants={itemVariants} className="md:col-span-6 glass-card rounded-[2rem] p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                <Users weight="duotone" className="w-6 h-6 text-purple-500" />
                Desempenho da Equipe
              </h3>
              
              <select 
                value={teamPeriod} 
                onChange={(e) => setTeamPeriod(e.target.value as any)}
                className="bg-secondary/50 border border-border text-sm rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="TODAY">De Hoje</option>
                <option value="THIS_MONTH">Mensal</option>
                <option value="LAST_30_DAYS">Últimos 30 Dias</option>
              </select>
            </div>
            
            <div className="space-y-4">
              {lists.teamStatus.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between group p-3 rounded-2xl hover:bg-secondary/30 transition-colors">
                  <Link href={`/chamados?technicianId=${t.id}`} className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-sm font-bold text-foreground">
                        {t.name.substring(0,2).toUpperCase()}
                      </div>
                      <div className={cn("absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background", t.activeCount > 0 ? 'bg-warning' : 'bg-success')} />
                    </div>
                    <div>
                      <div className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">{t.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {t.resolvedInPeriod} concluídos
                        </Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border/50">
                          TMA: {formatMins(t.avgTimeMinutes)}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                  <div className="flex flex-col items-end">
                    <div className="text-2xl font-display font-bold text-foreground">
                      {t.activeCount}
                    </div>
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Abertos</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* RECENT EVENTS & ALERTS */}
        {widgets.timeline && (
          <motion.div variants={itemVariants} className={`${widgets.teamStats ? 'md:col-span-6' : 'md:col-span-12'} flex flex-col gap-6`}>
            <div className="glass-card rounded-[2rem] p-8 flex-1">
               <h3 className="text-lg font-bold flex items-center gap-2 text-foreground mb-6">
                  <ListChecks weight="duotone" className="w-6 h-6 text-primary" />
                  Timeline Log
                </h3>
                <div className="space-y-6">
                  {lists.recentEvents.slice(0, 6).map((ev: any, i: number) => (
                    <div key={ev.id} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-foreground shrink-0 border border-border">
                          {ev.actor.substring(0,2).toUpperCase()}
                        </div>
                        {i !== Math.min(lists.recentEvents.length, 6) - 1 && (
                          <div className="w-0.5 h-6 bg-border mt-2" />
                        )}
                      </div>
                      <div className="pt-2 flex-1">
                        <p className="text-base text-foreground leading-snug">
                          <span className="font-bold">{ev.actor}</span> <span className="text-muted-foreground">{ev.action}</span> <span className="text-primary font-bold cursor-pointer hover:underline">{ev.ticket}</span>
                        </p>
                        <p className="text-sm text-muted-foreground mt-1 font-mono">{ev.time} · {ev.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
            </div>
          </motion.div>
        )}

      </div>
    </motion.div>
  );
}
