"use client";

import React, { useRef, useState, useMemo } from "react";
import { toJpeg } from "html-to-image";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Cell as PieCell,
  LabelList,
} from "recharts";

interface ManagerialDashboardProps {
  tickets: any[];
  onClose: () => void;
}

function formatTime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:00`;
}

export function ManagerialDashboard({ tickets, onClose }: ManagerialDashboardProps) {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // 1. Chamados por Setor (Bar Chart Laranja)
  const ticketsBySector = useMemo(() => {
    const map = new Map<string, number>();
    tickets.forEach((t) => {
      const name = t.sector?.name || "Sem Setor";
      map.set(name, (map.get(name) || 0) + 1);
    });
    return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [tickets]);

  // 2. Chamados por Técnico (Bar Chart Laranja)
  const ticketsByTech = useMemo(() => {
    const map = new Map<string, number>();
    tickets.forEach((t) => {
      const name = t.technician?.name?.split(" ")[0] || "Fila Geral";
      map.set(name, (map.get(name) || 0) + 1);
    });
    return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [tickets]);

  // 3. Chamados por Serviço (Bar Chart Horizontal Laranja)
  const ticketsByService = useMemo(() => {
    const map = new Map<string, number>();
    tickets.forEach((t) => {
      let name = t.service?.name || "Sem Serviço";
      if (name.length > 25) name = name.substring(0, 22) + "...";
      map.set(name, (map.get(name) || 0) + 1);
    });
    return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [tickets]);

  // 4. Média de Tempo por Técnico (Gauges)
  const avgTimeByTech = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    tickets.forEach((t) => {
      if (t.totalTimeMinutes != null && t.totalTimeMinutes >= 0 && t.technician?.name) {
        const name = t.technician.name.split(" ")[0];
        const current = map.get(name) || { total: 0, count: 0 };
        map.set(name, { total: current.total + t.totalTimeMinutes, count: current.count + 1 });
      }
    });
    return Array.from(map, ([name, data]) => ({
      name,
      avgMinutes: Math.round(data.total / data.count),
    })).sort((a, b) => b.avgMinutes - a.avgMinutes);
  }, [tickets]);

  const handleExport = async () => {
    if (!dashboardRef.current) return;
    setIsExporting(true);
    try {
      const origWidth = 1123;
      const origHeight = dashboardRef.current.scrollHeight || 794;

      // Use html-to-image com largura e altura explícitas e sem margens para evitar deslocamento/corte em containeres com scroll
      const imgData = await toJpeg(dashboardRef.current, {
        quality: 0.95,
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        width: origWidth,
        height: origHeight,
        style: {
          margin: "0",
          padding: "32px",
          transform: "none",
          width: `${origWidth}px`,
          height: `${origHeight}px`,
          position: "static",
          overflow: "visible",
          maxWidth: "none",
        },
      });
      
      const pdf = new jsPDF("landscape", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Ajuste proporcional para caber exatamente em A4 Paisagem sem cortes nem distorção
      const ratioWidth = pdfWidth / origWidth;
      const ratioHeight = pdfHeight / origHeight;
      const ratio = Math.min(ratioWidth, ratioHeight);
      
      const imgWidth = origWidth * ratio;
      const imgHeight = origHeight * ratio;
      const x = (pdfWidth - imgWidth) / 2;
      const y = (pdfHeight - imgHeight) / 2;

      pdf.addImage(imgData, "JPEG", x, y, imgWidth, imgHeight);
      pdf.save(`relatorio-gerencial-${Date.now()}.pdf`);
    } catch (e) {
      console.error(e);
      alert("Erro ao gerar PDF");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex flex-col">
      {/* Navbar do Modal */}
      <div className="flex items-center justify-between p-4 border-b bg-background shadow-sm">
        <div>
          <h2 className="text-xl font-bold">Relatório Gerencial</h2>
          <p className="text-xs text-muted-foreground">O relatório reflete os filtros aplicados na tela anterior.</p>
        </div>
        <div className="flex gap-4">
          <Button onClick={handleExport} disabled={isExporting} className="bg-primary hover:bg-primary/90 text-white shadow-md">
            <Download className="mr-2 w-4 h-4" />
            {isExporting ? "Gerando PDF..." : "Baixar PDF"}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Conteúdo Central (proporções exatas de A4 Landscape 297x210 mm) */}
      <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-900 p-8 flex justify-center items-start">
        <div
          ref={dashboardRef}
          className="bg-white p-8 shadow-sm border border-slate-200 shrink-0"
          style={{ width: "1123px", minHeight: "794px", margin: 0 }}
        >
          <div className="mb-6 border-b pb-3">
            <h1 className="text-3xl font-serif text-slate-800">Dashboard Gerencial de Chamados</h1>
            <p className="text-slate-500 mt-1">Gerado em: {new Date().toLocaleString("pt-BR")}</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* 1. Chamados por Setor/Obra */}
            <div className="border border-slate-200 p-5 rounded-lg bg-white shadow-sm">
              <h3 className="text-lg font-serif text-slate-700 mb-4 border-b pb-2">Número de Chamados por Setor/Obra</h3>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ticketsBySector} margin={{ top: 20, right: 10, left: -20, bottom: 40 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#475569" }} interval={0} angle={-45} textAnchor="end" />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#475569" }} />
                    <Bar dataKey="value" fill="#f59e0b" maxBarSize={40} isAnimationActive={false}>
                      <LabelList dataKey="value" position="top" fill="#64748b" fontSize={11} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. Chamados por Técnico */}
            <div className="border border-slate-200 p-5 rounded-lg bg-white shadow-sm">
              <h3 className="text-lg font-serif text-slate-700 mb-4 border-b pb-2">Número de Chamados por Técnico</h3>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ticketsByTech} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: "#475569", fontWeight: 600 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#475569" }} />
                    <Bar dataKey="value" fill="#f59e0b" maxBarSize={60} isAnimationActive={false}>
                      <LabelList dataKey="value" position="top" fill="#64748b" fontSize={12} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3. Chamados por Serviço (Horizontal) */}
            <div className="border border-slate-200 p-5 rounded-lg bg-white shadow-sm">
              <h3 className="text-lg font-serif text-slate-700 mb-4 border-b pb-2">Número de Chamados por Serviço</h3>
              <div style={{ height: Math.max(230, ticketsByService.length * 22) }} className="w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ticketsByService} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#475569" }} />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#475569" }} width={120} />
                    <Bar dataKey="value" fill="#f59e0b" maxBarSize={20} isAnimationActive={false}>
                      <LabelList dataKey="value" position="right" fill="#64748b" fontSize={11} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 4. Média de Tempo por Técnico (Gauges) */}
            <div className="border border-slate-200 p-6 rounded-lg bg-white shadow-sm flex flex-col">
              <h3 className="text-xl font-serif text-slate-700 mb-6 border-b pb-2">Média de Tempo em min. Por Ticket</h3>
              {avgTimeByTech.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-slate-400">Sem dados de tempo para exibir</div>
              ) : (
                <div className="flex-1 flex flex-wrap items-center justify-center gap-8 pt-4">
                  {avgTimeByTech.map((tech) => {
                    const maxMins = 1440; // 24h as visual maximum for the gauge
                    const value = Math.min(tech.avgMinutes, maxMins);
                    const remainder = maxMins - value;
                    const color = value < 60 ? "#10b981" : value < 240 ? "#f59e0b" : "#ef4444"; // Green < 1h, Yellow < 4h, Red > 4h

                    return (
                      <div key={tech.name} className="flex flex-col items-center">
                        <div className="w-[180px] h-[100px] relative">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[{ value }, { value: remainder }]}
                                cx="50%"
                                cy="100%"
                                startAngle={180}
                                endAngle={0}
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={0}
                                dataKey="value"
                                stroke="none"
                                isAnimationActive={false}
                              >
                                <PieCell fill={color} />
                                <PieCell fill="#e2e8f0" />
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center">
                            <span className="font-bold text-2xl text-slate-800 tracking-tight">{formatTime(tech.avgMinutes)}</span>
                          </div>
                        </div>
                        <span className="font-bold text-slate-700 mt-4 text-lg">{tech.name}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
