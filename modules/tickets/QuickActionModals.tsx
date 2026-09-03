"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserCheck, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { Combobox } from "@/components/common/Combobox";

export interface TechnicianOption {
  id: string;
  name: string;
  email: string;
}

interface AssignTechnicianModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketNumber?: number;
  currentTechnicianId?: string | null;
  technicians: TechnicianOption[];
  onSave: (technicianId: string | null) => Promise<void>;
}

export function AssignTechnicianModal({
  open,
  onOpenChange,
  ticketNumber,
  currentTechnicianId,
  technicians,
  onSave,
}: AssignTechnicianModalProps) {
  const [selectedId, setSelectedId] = useState<string>(
    currentTechnicianId || ""
  );
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onSave(selectedId ? selectedId : null);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary" />
            Atribuir Técnico — Chamado #{ticketNumber}
          </DialogTitle>
          <DialogDescription>
            Selecione o técnico de TI responsável pelo atendimento ou remova a atribuição.
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
            Técnico Responsável (ADMIN ou TI)
          </label>
          <Combobox
            options={technicians.map((tech) => ({
              id: tech.id,
              name: tech.name,
              subtitle: tech.email,
            }))}
            value={selectedId}
            onChange={(val) => setSelectedId(val || "")}
            placeholder="(Sem técnico atribuído / Fila Geral)"
            searchPlaceholder="Pesquisar técnico..."
          />
        </div>

        <DialogFooter className="gap-2 mt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? "Salvando..." : "Confirmar Atribuição"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ChangeStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketNumber?: number;
  currentStatus: string;
  onSave: (status: string) => Promise<void>;
}

export function ChangeStatusModal({
  open,
  onOpenChange,
  ticketNumber,
  currentStatus,
  onSave,
}: ChangeStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>(
    currentStatus || "ABERTO"
  );
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onSave(selectedStatus);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statusList = [
    { code: "ABERTO", label: "Aberto", icon: Clock, color: "text-amber-500" },
    { code: "RESOLVIDO", label: "Resolvido", icon: CheckCircle2, color: "text-emerald-500" },
    { code: "AGUARDANDO_USUARIO", label: "Aguardando", icon: AlertTriangle, color: "text-blue-500" },
    { code: "AGUARDANDO_PECA", label: "Agendado", icon: Clock, color: "text-purple-500" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            Alterar Status — Chamado #{ticketNumber}
          </DialogTitle>
          <DialogDescription>
            Defina a nova situação operacional do chamado. Concluir encerrará o tempo de atendimento.
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
            Status do Atendimento
          </label>
          <div className="grid grid-cols-2 gap-2">
            {statusList.map((item) => {
              const Icon = item.icon;
              const isSelected = selectedStatus === item.code;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setSelectedStatus(item.code)}
                  className={`flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-sm font-medium"
                      : "border-border/60 bg-muted/20 hover:bg-muted/40"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${item.color}`} />
                  <span className="text-xs">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <DialogFooter className="gap-2 mt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? "Salvando..." : "Atualizar Status"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
