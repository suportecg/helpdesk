"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Clock, AlertCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequesterHistoryModal } from "./RequesterHistoryModal";

export interface RequesterHistorySummary {
  requesterId: string;
  requesterName: string;
  totalTickets: number;
  lastTicketDate: string | null;
  lastTechnicianName: string | null;
  recentTickets: Array<{
    id: string;
    ticketNumber: number;
    problem: string;
    status: string;
    ticketDate: string;
    technicianName: string | null;
  }>;
}

interface RequesterHistoryCardProps {
  requesterId?: string | null;
  requesterName?: string;
}

export function RequesterHistoryCard({
  requesterId,
  requesterName,
}: RequesterHistoryCardProps) {
  const [history, setHistory] = useState<RequesterHistorySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!requesterId) {
      setHistory(null);
      return;
    }

    async function fetchHistory() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/requesters/suggest?requesterId=${encodeURIComponent(requesterId!)}`
        );
        if (res.ok) {
          const data = await res.json();
          setHistory(data.history || null);
        }
      } catch (err) {
        console.error("Erro ao buscar histórico do solicitante:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [requesterId]);

  if (!requesterId && !requesterName) {
    return null;
  }

  if (loading) {
    return (
      <Card className="border border-border/60 bg-muted/20">
        <CardContent className="p-4 text-xs text-muted-foreground flex items-center gap-2">
          <Clock className="w-4 h-4 animate-spin text-primary" />
          <span>Carregando histórico do solicitante...</span>
        </CardContent>
      </Card>
    );
  }

  if (!history && requesterName) {
    return (
      <Card className="border border-blue-500/20 bg-blue-500/5">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-semibold text-foreground">Novo Solicitante identificado</p>
            <p className="text-muted-foreground mt-0.5">
              &quot;{requesterName}&quot; será cadastrado(a) automaticamente no sistema ao salvar o chamado.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!history) return null;

  return (
    <>
      <Card className="border border-border/80 bg-card/60 shadow-sm">
        <CardHeader className="p-3 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-primary" />
            Histórico de Atendimentos — {history.requesterName}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-mono">
              Total: {history.totalTickets} {history.totalTickets === 1 ? "chamado" : "chamados"}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="w-6 h-6 rounded-full hover:bg-primary/10 text-primary transition-colors"
              onClick={() => setModalOpen(true)}
              title="Visualizar Histórico Completo"
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      <RequesterHistoryModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        requesterId={history.requesterId}
        requesterName={history.requesterName}
        initialHistory={history}
      />
    </>
  );
}
