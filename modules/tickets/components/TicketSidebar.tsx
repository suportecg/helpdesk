"use client";

import React, { useState } from "react";
import { Combobox } from "@/components/common/Combobox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function TicketSidebar({
  ticket,
  sectors,
  services,
  technicians,
  onUpdateField,
}: {
  ticket: any;
  sectors: any[];
  services: any[];
  technicians: any[];
  onUpdateField: (field: string, value: any) => void;
}) {
  const [ccInput, setCcInput] = useState(ticket?.cc || "");
  const [tagInput, setTagInput] = useState("");
  const tags: string[] = ticket?.aiMetadata?.tags || [];

  const handleSaveCc = () => {
    if (ccInput !== ticket.cc) {
      onUpdateField("cc", ccInput);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTags = [...tags, tagInput.trim()];
      const newMetadata = { ...(ticket.aiMetadata || {}), tags: newTags };
      onUpdateField("aiMetadata", newMetadata);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter((t: string) => t !== tagToRemove);
    const newMetadata = { ...(ticket.aiMetadata || {}), tags: newTags };
    onUpdateField("aiMetadata", newMetadata);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Solicitante */}
      <div className="space-y-1">
        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Solicitante</label>
        {/* Placeholder for Combobox. In a real app we'd fetch the requesters here or pass from parent */}
        <div className="p-3 bg-background rounded-lg border shadow-sm">
          <p className="font-semibold text-sm">{ticket.requester?.name}</p>
          <p className="text-xs text-muted-foreground truncate" title={ticket.requester?.email}>{ticket.requester?.email}</p>
          {ticket.requester?.phone && <p className="text-xs text-muted-foreground mt-1">{ticket.requester?.phone}</p>}
        </div>
      </div>

      {/* Serviço / Categoria */}
      <div className="space-y-1">
        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Serviço / Categoria</label>
        <Combobox
          options={services.map((sv) => ({ id: sv.id, name: sv.name, badge: sv.category || "TI" }))}
          value={ticket.serviceId || ""}
          onChange={(val) => onUpdateField("serviceId", val)}
          placeholder="Selecione o Serviço..."
          searchPlaceholder="Buscar serviço..."
        />
      </div>

      {/* Prioridade */}
      <div className="space-y-1">
        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Prioridade</label>
        <select
          className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background shadow-sm"
          value={ticket.priority || "MEDIA"}
          onChange={(e) => onUpdateField("priority", e.target.value)}
        >
          <option value="BAIXA">Baixa</option>
          <option value="MEDIA">Média</option>
          <option value="ALTA">Alta</option>
          <option value="CRITICA">Crítica</option>
        </select>
      </div>

      {/* Previsão de solução (dueDate) */}
      <div className="space-y-1">
        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Previsão de Solução</label>
        <input
          type="datetime-local"
          value={ticket.dueDate ? new Date(ticket.dueDate).toISOString().substring(0, 16) : ''}
          onChange={(e) => onUpdateField("dueDate", e.target.value ? new Date(e.target.value).toISOString() : null)}
          className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background shadow-sm"
        />
      </div>

      {/* Responsável */}
      <div className="space-y-1">
        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Responsável</label>
        <Combobox
          options={technicians.map((t) => ({ id: t.id, name: t.name, subtitle: t.email }))}
          value={ticket.technicianId || ""}
          onChange={(val) => onUpdateField("technicianId", val)}
          placeholder="(Fila Geral)"
          searchPlaceholder="Pesquisar..."
        />
      </div>

      {/* Setor */}
      <div className="space-y-1">
        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Setor de Atendimento</label>
        <Combobox
          options={sectors.map((s) => ({ id: s.id, name: s.name }))}
          value={ticket.sectorId || ""}
          onChange={(val) => onUpdateField("sectorId", val)}
          placeholder="Selecione o Setor..."
          searchPlaceholder="Buscar setor..."
        />
      </div>

      {/* Etiquetas (Tags) */}
      <div className="space-y-2 pt-2 border-t">
        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Etiquetas</label>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag: string, idx: number) => (
            <Badge key={idx} variant="secondary" className="px-2 py-0.5 text-xs flex items-center gap-1 group">
              {tag}
              <span 
                className="cursor-pointer opacity-50 hover:opacity-100 hover:text-destructive"
                onClick={() => handleRemoveTag(tag)}
              >
                &times;
              </span>
            </Badge>
          ))}
        </div>
        <Input 
          placeholder="Adicionar etiqueta... (Enter)" 
          className="h-8 text-xs" 
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleAddTag}
        />
        <p className="text-[10px] text-muted-foreground">Salvas em aiMetadata (dívida técnica para futura tabela relacional)</p>
      </div>

      {/* Em cópia (Cc) */}
      <div className="space-y-1 pt-2 border-t">
        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Em Cópia (Cc)</label>
        <Input 
          placeholder="exemplo@email.com, outro@email.com" 
          className="text-sm" 
          value={ccInput}
          onChange={(e) => setCcInput(e.target.value)}
          onBlur={handleSaveCc}
        />
      </div>

    </div>
  );
}
