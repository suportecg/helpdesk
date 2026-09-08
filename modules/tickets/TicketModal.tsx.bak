"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  History,
  MessageSquare,
  FileText,
  Send,
  CheckCircle2,
  AlertTriangle,
  Search,
} from "lucide-react";
import { RequesterHistoryCard } from "./RequesterHistoryCard";
import { Combobox } from "@/components/common/Combobox";

export interface TicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId?: string | null;
  sectors: Array<{ id: string; name: string }>;
  services: Array<{ id: string; name: string; category?: string | null }>;
  technicians: Array<{ id: string; name: string; email: string }>;
  onSaved: () => void;
  initialStatus?: string;
}

export function TicketModal({
  open,
  onOpenChange,
  ticketId,
  sectors,
  services,
  technicians,
  onSaved,
  initialStatus,
}: TicketModalProps) {
  const isEditing = Boolean(ticketId);

  const [activeTab, setActiveTab] = useState<"INFO" | "TIMELINE" | "COMMENTS" | "ATTACHMENTS">("INFO");
  const [attachments, setAttachments] = useState<any[]>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [requesterName, setRequesterName] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [requesterId, setRequesterId] = useState<string | null>(null);
  const [sectorId, setSectorId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const [problem, setProblem] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("ABERTO");
  const [origin, setOrigin] = useState("MANUAL");
  const [priority, setPriority] = useState("MEDIA");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [observations, setObservations] = useState("");
  const [solutionText, setSolutionText] = useState("");
  const [totalTimeMinutes, setTotalTimeMinutes] = useState<number | null>(null);

  // Autocomplete Solicitante
  const [suggestions, setSuggestions] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingRequesters, setIsLoadingRequesters] = useState(false);
  const [hasLoadedRequesters, setHasLoadedRequesters] = useState(false);

  // Timeline & Comentários
  const [historyEvents, setHistoryEvents] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [addingComment, setAddingComment] = useState(false);
  const [isInternalComment, setIsInternalComment] = useState(false);
  
  const [ccAddresses, setCcAddresses] = useState<string | null>(null);
  const [replyAll, setReplyAll] = useState(true);

  // Load ticket data if editing
  useEffect(() => {
    if (!open) {
      // Reset defaults when closing
      setActiveTab("INFO");
      setRequesterName("");
      setRequesterEmail("");
      setRequesterId(null);
      setSectorId("");
      setServiceId("");
      setTechnicianId("");
      setProblem("");
      setDescription("");
      setStatus("ABERTO");
      setOrigin("MANUAL");
      setPriority("MEDIA");
      setStartTime(new Date().toISOString().slice(0, 16));
      setEndTime("");
      setObservations("");
      setSolutionText("");
      setTotalTimeMinutes(null);
      setSuggestions([]);
      setShowSuggestions(false);
      setHasLoadedRequesters(false);
      setHistoryEvents([]);
      setComments([]);
      setCcAddresses(null);
      return;
    }

    const toLocalDatetimeString = (dateVal: string | Date | null) => {
      if (!dateVal) return "";
      const d = new Date(dateVal);
      const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
      return local.toISOString().slice(0, 16);
    };

    if (ticketId) {
      fetchTicketDetails(ticketId, toLocalDatetimeString);
    } else {
      setStartTime(toLocalDatetimeString(new Date()));
    }
  }, [open, ticketId]);

  async function fetchTicketDetails(id: string, toLocalDatetimeString: (d: any) => string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/tickets/${id}`);
      if (res.ok) {
        const data = await res.json();
        setRequesterName(data.requester?.name || "");
        setRequesterEmail(data.requester?.email || "");
        setRequesterId(data.requester?.id || null);
        setSectorId(data.sectorId || "");
        setServiceId(data.serviceId || "");
        setTechnicianId(data.technicianId || "");
        setProblem(data.problem || "");
        setDescription(data.description || "");
        setStatus(initialStatus || data.status || "ABERTO");
        setOrigin(data.origin || "MANUAL");
        setPriority(data.priority || "MEDIA");
        setStartTime(toLocalDatetimeString(data.startTime));
        setEndTime(toLocalDatetimeString(data.endTime));
        setObservations(data.observations || "");
        setTotalTimeMinutes(data.totalTimeMinutes || null);
        setCcAddresses(data.cc || null);
        setHistoryEvents(data.history || []);
        setComments(data.comments || []);
        
        const attRes = await fetch(`/api/tickets/${id}/attachments`);
        if (attRes.ok) {
           setAttachments(await attRes.json());
        }
      }
    } catch (err) {
      console.error("Erro ao carregar chamado:", err);
    } finally {
      setLoading(false);
    }
  }

  // Handle requester autocomplete
  async function handleLoadAllRequesters() {
    if (hasLoadedRequesters) return;
    setIsLoadingRequesters(true);
    try {
      const res = await fetch(`/api/requesters/suggest?q=`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
        setHasLoadedRequesters(true);
      }
    } catch (err) {
      console.error("Erro ao buscar solicitantes:", err);
    } finally {
      setIsLoadingRequesters(false);
    }
  }

  async function handleRequesterChange(val: string) {
    setRequesterName(val);
    if (requesterId && val !== requesterName) {
      setRequesterId(null); // Desvincula se alterou
    }

    if (!hasLoadedRequesters && val.trim().length >= 2) {
      try {
        const res = await fetch(`/api/requesters/suggest?q=${encodeURIComponent(val)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error("Erro ao buscar solicitantes:", err);
      }
    }
  }

  function handleSelectSuggestion(s: { id: string; name: string; email: string }) {
    setRequesterId(s.id);
    setRequesterName(s.name);
    setRequesterEmail(s.email);
    setShowSuggestions(false);
  }

  // Format dynamic calculated time
  function getFormattedDuration(): string {
    let sTime = startTime ? new Date(startTime).getTime() : Date.now();
    let eTime = endTime ? new Date(endTime).getTime() : Date.now();
    if (status === "RESOLVIDO" && !endTime) {
      eTime = Date.now();
    }
    const mins = Math.max(0, Math.round((eTime - sTime) / 60000));
    if (mins === 0) return "< 1 min";
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (m === 0) return `${h} h`;
    return `${h} h ${m} min`;
  }

  // Save ticket
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!requesterName || !sectorId || !serviceId || !problem) {
      alert("Por favor, preencha Solicitante, Setor, Serviço e Problema.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        requesterName,
        requesterEmail,
        requesterId,
        sectorId,
        serviceId,
        technicianId: technicianId || null,
        problem,
        description,
        status,
        origin,
        priority,
        startTime: startTime ? new Date(startTime).toISOString() : null,
        endTime: endTime ? new Date(endTime).toISOString() : null,
        observations,
        solutionText: status === "RESOLVIDO" ? solutionText : undefined,
      };

      const url = isEditing ? `/api/tickets/${ticketId}` : "/api/tickets";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erro ao salvar chamado");
      }

      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      alert(err.message || "Erro ao salvar chamado");
    } finally {
      setSaving(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || !e.target.files.length || !ticketId) return;
    const file = e.target.files[0];
    const allowed = ["image/png", "image/jpeg", "image/jpg", "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
    if (!allowed.includes(file.type) && !file.name.match(/\.(png|jpg|jpeg|pdf|docx|xlsx)$/i)) {
       alert("Formato não permitido. Envie PNG, JPG, PDF, DOCX ou XLSX.");
       return;
    }
    
    setUploadingAttachment(true);
    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch(`/api/tickets/${ticketId}/attachments`, {
        method: "POST",
        body: fd,
      });
      if (res.ok) {
        const att = await res.json();
        setAttachments([att, ...attachments]);
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao fazer upload");
      }
    } catch (err) {
       console.error("Upload erro:", err);
    } finally {
       setUploadingAttachment(false);
       e.target.value = ""; // clear input
    }
  }

  // Add internal comment
  async function handleAddComment() {
    if (!newComment.trim() || !ticketId) return;
    setAddingComment(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: newComment,
          isInternal: isInternalComment,
          replyAll: !isInternalComment && replyAll ? true : false,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setComments((prev) => [created, ...prev]);
        setNewComment("");
      }
    } catch (err) {
      console.error("Erro ao adicionar comentário:", err);
    } finally {
      setAddingComment(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[780px] max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {isEditing ? "Editar Chamado" : "Novo Chamado"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize as informações operacionais, acompanhe a timeline e comentários internos."
              : "Substituição completa da planilha de TI com numeração automática e histórico."}
          </DialogDescription>
        </DialogHeader>

        {/* Abas */}
        <div className="flex items-center gap-1 border-b border-border/60 pb-2 mt-2">
          <Button
            type="button"
            variant={activeTab === "INFO" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("INFO")}
            className="text-xs"
          >
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            Informações
          </Button>
          {isEditing && (
            <>
              <Button
                type="button"
                variant={activeTab === "TIMELINE" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("TIMELINE")}
                className="text-xs"
              >
                <History className="w-3.5 h-3.5 mr-1.5" />
                Histórico (Timeline)
                {historyEvents.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 px-1 py-0 text-[10px]">
                    {historyEvents.length}
                  </Badge>
                )}
              </Button>
              <Button
                type="button"
                variant={activeTab === "COMMENTS" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("COMMENTS")}
                className="text-xs"
              >
                <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                Comentários Internos
                {comments.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 px-1 py-0 text-[10px]">
                    {comments.length}
                  </Badge>
                )}
              </Button>
              <Button
                type="button"
                variant={activeTab === "ATTACHMENTS" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("ATTACHMENTS")}
                className="text-xs"
              >
                <FileText className="w-3.5 h-3.5 mr-1.5" />
                Anexos
                {attachments.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 px-1 py-0 text-[10px]">
                    {attachments.length}
                  </Badge>
                )}
              </Button>
            </>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Carregando detalhes do chamado...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {/* ABA: INFORMAÇÕES */}
            {activeTab === "INFO" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Lado Esquerdo - Campos Principais (2 colunas) */}
                <div className="md:col-span-2 space-y-3">
                  {/* Solicitante (Combobox inteligente / Cadastro automático) */}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                      Solicitante * (Digite para auto-completar ou criar)
                    </label>
                    <Combobox
                      options={suggestions.map((s) => ({
                        id: s.id || s.name,
                        name: s.name,
                        subtitle: s.email,
                      }))}
                      value={requesterId || requesterName}
                      onChange={(val, item) => {
                        if (item) {
                          handleSelectSuggestion({
                            id: item.id,
                            name: item.name,
                            email: item.subtitle || "",
                          });
                        } else {
                          setRequesterName("");
                          setRequesterId(null);
                        }
                      }}
                      onSearchChange={(query) => {
                        setRequesterName(query);
                        handleRequesterChange(query);
                      }}
                      placeholder={requesterName || "Selecione ou crie o solicitante..."}
                      searchPlaceholder="Digite nome ou e-mail..."
                      allowCreate={true}
                      onCreate={(typedName) => {
                        setRequesterName(typedName);
                        setRequesterId(null);
                      }}
                      createLabelPrefix="+ Criar"
                      isLoading={isLoadingRequesters}
                      onOpen={handleLoadAllRequesters}
                    />
                  </div>

                  {/* Setor e Serviço */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                        Setor *
                      </label>
                      <Combobox
                        options={sectors.map((s) => ({
                          id: s.id,
                          name: s.name,
                        }))}
                        value={sectorId}
                        onChange={(val) => setSectorId(val || "")}
                        placeholder="Selecione o Setor..."
                        searchPlaceholder="Pesquisar setor..."
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                        Serviço (Catálogo) *
                      </label>
                      <Combobox
                        options={services.map((sv) => ({
                          id: sv.id,
                          name: sv.name,
                          badge: sv.category || "TI",
                        }))}
                        value={serviceId}
                        onChange={(val) => setServiceId(val || "")}
                        placeholder="Selecione o Serviço..."
                        searchPlaceholder="Pesquisar serviço..."
                      />
                    </div>
                  </div>

                  {/* Problema (Texto Livre Obrigatório) */}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                      Problema * (Texto Livre — Nunca Será Cadastro)
                    </label>
                    <Input
                      placeholder="Ex: Impressora apresentando lentidão ao imprimir boletos Fortes"
                      value={problem}
                      onChange={(e) => setProblem(e.target.value)}
                      className="text-sm"
                      required
                    />
                  </div>

                  {/* Descrição (Opcional) */}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                      Descrição Detalhada (Opcional)
                    </label>
                    <textarea
                      placeholder="Informe observações técnicas iniciais ou relato do usuário..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Status, Origem e Prioridade */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                        Status
                      </label>
                      <select
                        className="w-full h-9 px-2 text-xs rounded-md border border-input bg-background"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                      >
                        <option value="ABERTO">Aberto</option>
                        <option value="EM_ATENDIMENTO">Em Atendimento</option>
                        <option value="AGUARDANDO_TERCEIROS">Aguardando Terceiros</option>
                        <option value="AGUARDANDO_USUARIO">Aguardando Usuário</option>
                        <option value="RESOLVIDO">Resolvido (Concluir)</option>
                        <option value="CANCELADO">Cancelado</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                        Origem
                      </label>
                      <select
                        className="w-full h-9 px-2 text-xs rounded-md border border-input bg-background"
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                      >
                        <option value="MANUAL">Manual</option>
                        <option value="WHATSAPP">WhatsApp</option>
                        <option value="EMAIL">E-mail</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                        Prioridade
                      </label>
                      <select
                        className="w-full h-9 px-2 text-xs rounded-md border border-input bg-background"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                      >
                        <option value="BAIXA">Baixa</option>
                        <option value="MEDIA">Média</option>
                        <option value="ALTA">Alta</option>
                        <option value="CRITICA">Crítica</option>
                      </select>
                    </div>
                  </div>

                  {/* Técnico Responsável */}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                      Técnico Responsável (ADMIN ou TI)
                    </label>
                    <Combobox
                      options={technicians.map((t) => ({
                        id: t.id,
                        name: t.name,
                        subtitle: t.email,
                      }))}
                      value={technicianId}
                      onChange={(val) => setTechnicianId(val || "")}
                      placeholder="(Sem técnico — Fila Geral)"
                      searchPlaceholder="Pesquisar técnico (ADMIN/TI)..."
                    />
                  </div>

                  {/* Horários e Cálculo Automático de Tempo */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-lg border border-border/50">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">
                        Início
                      </label>
                      <div className="flex items-center w-full bg-background border border-input rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-primary transition-all">
                        <input
                          type="datetime-local"
                          value={startTime ? startTime.substring(0, 16) : ''}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="bg-transparent outline-none text-sm w-full"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">
                        Fim
                      </label>
                      <div className="flex items-center w-full bg-background border border-input rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-primary transition-all">
                        <input
                          type="datetime-local"
                          value={endTime ? endTime.substring(0, 16) : ''}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="bg-transparent outline-none text-sm w-full"
                        />
                      </div>
                    </div>
                    <div className="md:col-span-2 flex flex-col items-center justify-center bg-primary/10 rounded-md p-3 border border-primary/20 shadow-sm mt-2">
                      <span className="text-xs font-medium text-primary mb-0.5">
                        Tempo total (auto)
                      </span>
                      <span className="text-2xl font-bold font-mono text-primary">
                        {getFormattedDuration()}
                      </span>
                    </div>
                  </div>
                  
                  {status === "RESOLVIDO" && (
                    <div className="pt-2 border-t border-border/50 animate-in fade-in slide-in-from-top-2 duration-300">
                      <Label htmlFor="solutionText" className="text-emerald-600 flex items-center gap-1.5 mb-1.5">
                        Solução / Resolução do Chamado
                      </Label>
                      <Textarea
                        id="solutionText"
                        placeholder="Descreva o que foi feito para solucionar este chamado (Isso será enviado ao cliente por e-mail)..."
                        value={solutionText}
                        onChange={(e) => setSolutionText(e.target.value)}
                        rows={3}
                        className="border-emerald-200 focus-visible:ring-emerald-500 bg-emerald-50/30"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">Ao salvar o chamado como Concluído, um e-mail será enviado ao solicitante contendo esta solução.</p>
                    </div>
                  )}
                </div>

                {/* Lado Direito - Card de Histórico do Solicitante */}
                <div className="space-y-3">
                  <RequesterHistoryCard
                    requesterId={requesterId}
                    requesterName={requesterName}
                  />

                  {/* Observações Operacionais */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                      Observações
                    </label>
                    <textarea
                      placeholder="Anotações extras da equipe de TI..."
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                      rows={3}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ABA: HISTÓRICO (TIMELINE) */}
            {activeTab === "TIMELINE" && (
              <div className="space-y-3 py-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Trilha de Eventos e Alterações Operacionais
                </h4>
                {historyEvents.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Nenhum evento registrado nesta timeline.
                  </p>
                ) : (
                  <div className="space-y-3 border-l-2 border-primary/30 pl-4 my-2">
                    {historyEvents.map((ev) => (
                      <div key={ev.id} className="relative flex flex-col gap-0.5 text-xs">
                        <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background" />
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">
                            {ev.description}
                          </span>
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {new Date(ev.createdAt).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            ({new Date(ev.createdAt).toLocaleDateString("pt-BR")})
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Autor: <span className="font-medium">{ev.actorName || "Sistema"}</span>
                        </p>
                        {ev.oldValue && ev.newValue && (
                          <div className="text-[10px] bg-muted/40 p-1.5 rounded mt-1 font-mono">
                            De: <span className="line-through text-red-500">{ev.oldValue}</span> → Para:{" "}
                            <span className="text-emerald-500 font-bold">{ev.newValue}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ABA: COMENTÁRIOS INTERNOS */}
            {activeTab === "COMMENTS" && (
              <div className="space-y-4 py-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Escreva um comentário ou resposta..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddComment}
                    disabled={addingComment || !newComment.trim()}
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    Enviar
                  </Button>
                </div>
                
                <div className="flex items-center gap-4 px-1 pb-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="internalNote"
                      checked={isInternalComment}
                      onChange={(e) => setIsInternalComment(e.target.checked)}
                      className="rounded border-border text-primary cursor-pointer w-3.5 h-3.5"
                    />
                    <Label htmlFor="internalNote" className="text-xs font-semibold cursor-pointer text-muted-foreground">Nota Interna (Oculta)</Label>
                  </div>
                  
                  {!isInternalComment && ccAddresses && (
                    <div className="flex items-center gap-2 ml-2 border-l border-border/50 pl-4">
                      <input 
                        type="checkbox" 
                        id="replyAll" 
                        checked={replyAll}
                        onChange={(e) => setReplyAll(e.target.checked)}
                        className="rounded border-border text-primary cursor-pointer w-3.5 h-3.5"
                      />
                      <Label htmlFor="replyAll" className="text-xs cursor-pointer truncate max-w-[200px]" title={ccAddresses}>
                        Responder a todos em cópia ({ccAddresses.split(',').length})
                      </Label>
                    </div>
                  )}
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {comments.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Nenhum comentário interno cadastrado neste chamado.
                    </p>
                  ) : (
                    comments.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 rounded-lg border border-border/60 bg-muted/10 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-foreground">
                              {c.author?.name || "Técnico TI"}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1.5 py-0 uppercase tracking-tight"
                            >
                              {c.author?.role || "TI"}
                            </Badge>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {new Date(c.createdAt).toLocaleString("pt-BR")}
                          </span>
                        </div>
                        <p className="text-xs text-foreground mt-1 whitespace-pre-line">
                          {c.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ABA: ANEXOS */}
            {activeTab === "ATTACHMENTS" && (
              <div className="space-y-4 py-2">
                 <div className="flex flex-col gap-2 p-4 border border-dashed border-primary/40 rounded-lg bg-primary/5 items-center justify-center text-center hover:bg-primary/10 transition-colors">
                    <p className="text-xs text-muted-foreground font-medium">Anexe arquivos úteis ao chamado (PNG, JPG, PDF, DOCX, XLSX)</p>
                    <label className={`cursor-pointer inline-flex h-8 items-center justify-center rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground shadow transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] ${uploadingAttachment ? "opacity-50 pointer-events-none" : ""}`}>
                        {uploadingAttachment ? "Enviando..." : "Selecionar Arquivo"}
                        <input type="file" className="hidden" accept=".png,.jpg,.jpeg,.pdf,.docx,.xlsx" onChange={handleFileUpload} disabled={uploadingAttachment} />
                    </label>
                 </div>
                 <div className="space-y-2 mt-4 max-h-[300px] overflow-y-auto">
                    {attachments.length === 0 ? (
                       <p className="text-xs text-muted-foreground text-center py-4 bg-muted/20 rounded-md border border-border/50">Nenhum anexo encontrado.</p>
                    ) : (
                       attachments.map((att) => (
                          <div key={att.id} className="flex items-center justify-between p-3 border border-border/60 rounded-md bg-background shadow-sm hover:shadow-md transition-shadow group">
                              <div className="flex items-center gap-3 overflow-hidden">
                                 <div className="bg-primary/10 p-2 rounded-md group-hover:bg-primary/20 transition-colors">
                                    <FileText className="w-4 h-4 flex-shrink-0 text-primary" />
                                 </div>
                                 <span className="text-xs font-semibold truncate group-hover:text-primary transition-colors">{att.fileName}</span>
                              </div>
                              <a href={att.fileUrl} target="_blank" rel="noreferrer" className="text-[10px] uppercase font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-md hover:bg-primary hover:text-primary-foreground transition-colors whitespace-nowrap ml-2">
                                 Baixar
                              </a>
                          </div>
                       ))
                    )}
                 </div>
              </div>
            )}

            {activeTab === "INFO" && (
              <DialogFooter className="gap-2 pt-2 border-t border-border/40">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Salvando..." : isEditing ? "Salvar Alterações" : "Cadastrar Chamado"}
                </Button>
              </DialogFooter>
            )}
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
