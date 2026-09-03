"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader as DHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollText, UserCheck } from "lucide-react";
import type { RequesterHistorySummary } from "./RequesterHistoryCard";

interface RequesterHistoryModalProps {
  requesterId: string | null;
  requesterName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialHistory?: RequesterHistorySummary | null;
}

export function RequesterHistoryModal({
  requesterId,
  requesterName,
  open,
  onOpenChange,
  initialHistory
}: RequesterHistoryModalProps) {
  const [history, setHistory] = useState<RequesterHistorySummary | null>(initialHistory || null);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL");

  useEffect(() => {
    if (!open) {
      return;
    }

    if (initialHistory && initialHistory.requesterId === requesterId) {
      setHistory(initialHistory);
      return;
    }

    if (!requesterId) return;

    let isMounted = true;
    setHistory(null); // Limpa o estado anterior na hora para mostrar o loading
    setLoading(true);

    async function fetchHistory() {
      try {
        const res = await fetch(
          `/api/requesters/suggest?requesterId=${encodeURIComponent(requesterId!)}`
        );
        if (res.ok && isMounted) {
          const data = await res.json();
          setHistory(data.history || null);
        }
      } catch (err) {
        console.error("Erro ao buscar histórico do solicitante:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchHistory();

    return () => {
      isMounted = false;
    };
  }, [requesterId, open, initialHistory]);

  const availableMonths = React.useMemo(() => {
    if (!history?.recentTickets) return [];
    const months = new Set<string>();
    history.recentTickets.forEach(t => {
      const d = new Date(t.ticketDate);
      months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });
    return Array.from(months).sort().reverse();
  }, [history]);

  const filteredTickets = React.useMemo(() => {
    if (!history?.recentTickets) return [];
    if (selectedMonth === "ALL") return history.recentTickets;
    
    return history.recentTickets.filter(t => {
      const d = new Date(t.ticketDate);
      const monthYear = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return monthYear === selectedMonth;
    });
  }, [history, selectedMonth]);

  function formatMonthYear(my: string) {
    const [y, m] = my.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1, 1);
    const monthName = date.toLocaleString('pt-BR', { month: 'long' });
    return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} de ${y}`;
  }

  if (!history && loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[400px]">
          <div className="py-10 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
            <span className="text-sm">Carregando histórico...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!history) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
        <DHeader className="flex flex-row items-start justify-between pr-8">
          <div className="space-y-1.5">
            <DialogTitle className="flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-primary" />
              Histórico Completo
            </DialogTitle>
            <DialogDescription>
              Histórico de <strong>{history.requesterName || requesterName}</strong>. Total de chamados: {history.totalTickets}.
              {selectedMonth !== "ALL" && ` Mostrando ${filteredTickets.length} neste mês.`}
            </DialogDescription>
          </div>
          
          {availableMonths.length > 0 && (
            <select
              className="h-8 px-3 text-xs rounded-md border border-border bg-background focus:ring-1 focus:ring-primary/30 outline-none text-foreground transition-all cursor-pointer"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="ALL">Todos os meses</option>
              {availableMonths.map(my => (
                <option key={my} value={my}>{formatMonthYear(my)}</option>
              ))}
            </select>
          )}
        </DHeader>
        
        <div className="space-y-3 mt-4">
          {filteredTickets.map((t) => (
            <div
              key={t.id}
              className="flex flex-col gap-2 text-sm p-4 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors border border-border/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-primary text-sm">
                    #{t.ticketNumber}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {new Date(t.ticketDate).toLocaleDateString("pt-BR")} às {new Date(t.ticketDate).toLocaleTimeString("pt-BR", {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] px-2 py-0.5 uppercase tracking-tighter"
                >
                  {t.status === "ABERTO"
                    ? "Em Atendimento"
                    : t.status === "RESOLVIDO"
                    ? "Resolvido"
                    : t.status === "AGUARDANDO_USUARIO"
                    ? "Aguardando"
                    : "Agendado"}
                </Badge>
              </div>
              
              <div className="font-medium text-foreground">
                {t.problem}
              </div>
              
              <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                <UserCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                Atendido por: {t.technicianName || "Nenhum atribuído"}
              </div>
            </div>
          ))}
          {filteredTickets.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Nenhum chamado encontrado para este mês.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
