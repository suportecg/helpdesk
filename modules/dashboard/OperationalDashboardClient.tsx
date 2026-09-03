"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { 
  Headset, PushPin, ChartBar, Fire, Users, ListChecks, MonitorPlay,
  Plus, UserPlus, Desktop, HardDrives, Clock, CheckCircle, WarningCircle 
} from "@phosphor-icons/react";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

export function OperationalDashboardClient() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [chartMetric, setChartMetric] = useState<"totalMinutes" | "tickets" | "resolved" | "averageMinutes">("totalMinutes");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/operational?period=TODAY`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Erro ao carregar dashboard:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(), 30000);
    return () => clearInterval(interval);
  }, [loadData]);

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
      </motion.div>

      {/* THE ASYMMETRICAL BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* HERO KPI CARDS - SPANNING LEFT */}
        <motion.div variants={itemVariants} className="md:col-span-8 grid grid-cols-2 gap-6">
          <Link href="/chamados?status=ABERTO" className="block group w-full hover-lift">
            <div className="glass-card rounded-[2rem] p-8 h-full relative overflow-hidden flex flex-col justify-between min-h-[220px]">
              <div className="absolute -right-4 -top-4 p-4 opacity-5 group-hover:scale-110 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
                <WarningCircle weight="duotone" className="w-32 h-32 text-primary" />
              </div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="p-3 bg-primary/10 rounded-2xl">
                  <WarningCircle weight="bold" className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm font-semibold text-foreground/70 uppercase tracking-wider">Abertos</span>
              </div>
              <div className="relative z-10 mt-6">
                <div className="text-6xl font-display font-bold text-foreground tracking-tighter">
                  {kpis.inProgress}
                </div>
              </div>
            </div>
          </Link>

          <Link href="/chamados?technicianId=null" className="block group w-full hover-lift">
            <div className="glass-card rounded-[2rem] p-8 h-full relative overflow-hidden flex flex-col justify-between min-h-[220px]">
              <div className="absolute -right-4 -top-4 p-4 opacity-5 group-hover:scale-110 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
                <Headset weight="duotone" className="w-32 h-32 text-warning" />
              </div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="p-3 bg-warning/10 rounded-2xl">
                  <Headset weight="bold" className="w-6 h-6 text-warning" />
                </div>
                <span className="text-sm font-semibold text-foreground/70 uppercase tracking-wider">Fila Geral</span>
              </div>
              <div className="relative z-10 mt-6">
                <div className="text-6xl font-display font-bold text-foreground tracking-tighter">
                  {kpis.unassigned}
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* SLA TOWER - SPANNING RIGHT */}
        <motion.div variants={itemVariants} className="md:col-span-4 h-full">
           <div className="glass-card rounded-[2rem] p-8 h-full flex flex-col">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Clock weight="bold" className="w-4 h-4 text-primary" />
                  Saúde Operacional
                </h3>
             </div>
             <div className="flex-1 flex flex-col justify-center items-center text-center">
                <div className="relative">
                  {/* Subtle pulsing background for SLA */}
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

        {/* CHART SECTION */}
        <motion.div variants={itemVariants} className="md:col-span-8 glass-card rounded-[2rem] p-8 flex flex-col">
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

        {/* QUICK ACTIONS ISLAND */}
        <motion.div variants={itemVariants} className="md:col-span-4 glass-card rounded-[2rem] p-8 flex flex-col justify-between">
           <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-6">
              <MonitorPlay weight="bold" className="w-4 h-4 text-emerald-500" />
              Ações Rápidas
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/chamados" className="block w-full">
                <Button variant="outline" className="w-full h-auto py-6 flex flex-col items-center justify-center gap-4 bg-secondary/30 hover:bg-white dark:hover:bg-slate-800 border-border/50 rounded-2xl hover-lift">
                  <div className="p-3 bg-emerald-500/10 rounded-full">
                    <Plus weight="bold" className="h-6 w-6 text-emerald-500" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Novo Chamado</span>
                </Button>
              </Link>
              <Link href="/chamados?technicianId=null" className="block w-full">
                <Button variant="outline" className="w-full h-auto py-6 flex flex-col items-center justify-center gap-4 bg-secondary/30 hover:bg-white dark:hover:bg-slate-800 border-border/50 rounded-2xl hover-lift">
                  <div className="p-3 bg-purple-500/10 rounded-full">
                    <UserPlus weight="bold" className="h-6 w-6 text-purple-500" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Assumir Fila</span>
                </Button>
              </Link>
              <Button variant="outline" className="w-full h-auto py-6 flex flex-col items-center justify-center gap-4 bg-secondary/30 hover:bg-white dark:hover:bg-slate-800 border-border/50 rounded-2xl hover-lift">
                <div className="p-3 bg-blue-500/10 rounded-full">
                  <Desktop weight="bold" className="h-6 w-6 text-blue-500" />
                </div>
                <span className="text-sm font-semibold text-foreground">Acesso Remoto</span>
              </Button>
              <Button variant="outline" className="w-full h-auto py-6 flex flex-col items-center justify-center gap-4 bg-secondary/30 hover:bg-white dark:hover:bg-slate-800 border-border/50 rounded-2xl hover-lift">
                <div className="p-3 bg-amber-500/10 rounded-full">
                  <HardDrives weight="bold" className="h-6 w-6 text-amber-500" />
                </div>
                <span className="text-sm font-semibold text-foreground">Servidores</span>
              </Button>
            </div>
        </motion.div>

        {/* TEAM STATUS */}
        <motion.div variants={itemVariants} className="md:col-span-5 glass-card rounded-[2rem] p-8">
           <h3 className="text-lg font-bold flex items-center gap-2 text-foreground mb-6">
              <Users weight="duotone" className="w-6 h-6 text-purple-500" />
              Equipe em Operação
            </h3>
            <div className="space-y-5">
              {lists.teamStatus.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-sm font-bold text-foreground">
                        {t.name.substring(0,2).toUpperCase()}
                      </div>
                      <div className={cn("absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background", t.activeCount > 0 ? 'bg-success' : 'bg-warning')} />
                    </div>
                    <div>
                      <div className="text-base font-semibold text-foreground">{t.name}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">
                        {t.activeCount > 0 ? 'Em atendimento' : 'Livre / Pausado'}
                      </div>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-mono font-bold text-foreground">
                    {t.activeCount}
                  </div>
                </div>
              ))}
            </div>
        </motion.div>

        {/* RECENT EVENTS & ALERTS */}
        <motion.div variants={itemVariants} className="md:col-span-7 flex flex-col gap-6">
          <div className="glass-card rounded-[2rem] p-8 flex-1">
             <h3 className="text-lg font-bold flex items-center gap-2 text-foreground mb-6">
                <ListChecks weight="duotone" className="w-6 h-6 text-primary" />
                Timeline Log
              </h3>
              <div className="space-y-6">
                {lists.recentEvents.slice(0, 4).map((ev: any, i: number) => (
                  <div key={ev.id} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-foreground shrink-0 border border-border">
                        {ev.actor.substring(0,2).toUpperCase()}
                      </div>
                      {i !== Math.min(lists.recentEvents.length, 4) - 1 && (
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

      </div>
    </motion.div>
  );
}
