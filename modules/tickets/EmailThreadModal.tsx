"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Clock,
  History,
  MessageSquare,
  FileText,
  Send,
  User,
  Paperclip,
  CheckCircle2,
  Mail
} from "lucide-react";
import { calculateBusinessMinutes } from "@/lib/business-hours";
import { RequesterHistoryCard } from "./RequesterHistoryCard";
import { Combobox } from "@/components/common/Combobox";
import { useAuth } from "@/providers/auth-provider";
import { toast } from "sonner";

export interface EmailThreadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId?: string | null;
  sectors: Array<{ id: string; name: string }>;
  services: Array<{ id: string; name: string; category?: string | null }>;
  technicians: Array<{ id: string; name: string; email: string }>;
  onSaved: () => void;
  initialStatus?: string;
}

type TimelineEvent = {
  id: string;
  type: "inbound_email" | "outbound_email" | "comment";
  date: Date;
  author: string;
  subject?: string;
  body: string;
  isInternal?: boolean;
  cc?: string;
};

export function EmailThreadModal({
  open,
  onOpenChange,
  ticketId,
  sectors,
  services,
  technicians,
  onSaved,
  initialStatus,
}: EmailThreadModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"THREAD" | "INFO">("THREAD");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  
  // Ticket Data
  const [ticketNumber, setTicketNumber] = useState<number | null>(null);
  const [requesterName, setRequesterName] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [requesterId, setRequesterId] = useState<string | null>(null);
  const [sectorId, setSectorId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const [problem, setProblem] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("ABERTO");
  const [origin, setOrigin] = useState("EMAIL");
  const [priority, setPriority] = useState("MEDIA");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [observations, setObservations] = useState("");
  const [solutionText, setSolutionText] = useState("");
  const [ccAddresses, setCcAddresses] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingRequesters, setIsLoadingRequesters] = useState(false);
  const [hasLoadedRequesters, setHasLoadedRequesters] = useState(false);

  // Thread Data
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [replyContent, setReplyContent] = useState("");
  const [replyAll, setReplyAll] = useState(true);
  const [isInternalNote, setIsInternalNote] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setActiveTab("THREAD");
      setTimelineEvents([]);
      setReplyContent("");
      setRequesterName("");
      setRequesterEmail("");
      setRequesterId(null);
      setSectorId("");
      setServiceId("");
      setTechnicianId("");
      setProblem("");
      setDescription("");
      setStatus("ABERTO");
      setPriority("MEDIA");
      setStartTime("");
      setEndTime("");
      setObservations("");
      setSolutionText("");
      setCcAddresses(null);
      setTicketNumber(null);
      return;
    }

    if (ticketId) {
      fetchTicketDetails(ticketId);
    }
  }, [open, ticketId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (activeTab === "THREAD") {
      scrollToBottom();
    }
  }, [timelineEvents, activeTab]);

  async function fetchTicketDetails(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/tickets/${id}`);
      if (res.ok) {
        const data = await res.json();
        
        const toLocalDatetimeString = (dateVal: string | Date | null) => {
          if (!dateVal) return "";
          const d = new Date(dateVal);
          const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
          return local.toISOString().slice(0, 16);
        };

        setTicketNumber(data.ticketNumber);
        setRequesterName(data.requester?.name || "");
        setRequesterEmail(data.requester?.email || "");
        setRequesterId(data.requester?.id || null);
        setSectorId(data.sectorId || "");
        setServiceId(data.serviceId || "");
        setTechnicianId(data.technicianId || "");
        setProblem(data.problem || "");
        setDescription(data.description || "");
        setStatus(initialStatus || data.status || "ABERTO");
        setOrigin(data.origin || "EMAIL");
        setPriority(data.priority || "MEDIA");
        setStartTime(toLocalDatetimeString(data.startTime));
        setEndTime(toLocalDatetimeString(data.endTime));
        setObservations(data.observations || "");
        setCcAddresses(data.cc || null);
        
        // Build Timeline
        const events: TimelineEvent[] = [];
        
        if (data.processedEmails) {
          data.processedEmails.forEach((pe: any) => {
            events.push({
              id: pe.id,
              type: "inbound_email",
              date: new Date(pe.receivedAt || pe.processedAt),
              author: pe.from || "Desconhecido",
              subject: pe.subject,
              body: pe.bodyReceived || "(Corpo vazio)",
              cc: pe.cc
            });
            
            if (pe.manualReplies && Array.isArray(pe.manualReplies)) {
              pe.manualReplies.forEach((reply: any, idx: number) => {
                events.push({
                  id: `${pe.id}-reply-${idx}`,
                  type: "outbound_email",
                  date: new Date(reply.date),
                  author: reply.adminName || "Equipe",
                  subject: reply.subject,
                  body: reply.content || "(Sem conteúdo)"
                });
              });
            }
          });
        }
        
        if (data.comments) {
          data.comments.forEach((c: any) => {
            events.push({
              id: `comment-${c.id}`,
              type: "comment",
              date: new Date(c.createdAt),
              author: c.author?.name || "Sistema",
              body: c.content,
              isInternal: c.isInternal
            });
          });
        }
        
        events.sort((a, b) => a.date.getTime() - b.date.getTime());
        setTimelineEvents(events);
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
      setRequesterId(null);
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

  function getFormattedDuration(): string {
    let sTime = startTime ? new Date(startTime) : new Date();
    let eTime = endTime ? new Date(endTime) : new Date();
    if (status === "RESOLVIDO" && !endTime) {
      eTime = new Date();
    }
    const mins = calculateBusinessMinutes(sTime, eTime);
    if (mins === 0) return "< 1 min";
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (m === 0) return `${h} h`;
    return `${h} h ${m} min`;
  }

  async function handleSaveInfo(e: React.FormEvent) {
    e.preventDefault();
    if (!requesterName || !sectorId || !serviceId || !problem) {
      toast.error("Por favor, preencha Solicitante, Setor, Serviço e Problema.");
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

      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Erro ao salvar chamado");
      }
      toast.success("Informações salvas com sucesso!");
      onSaved();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar chamado");
    } finally {
      setSaving(false);
    }
  }

  async function handleSendReply() {
    if (!replyContent.trim() || !ticketId) return;
    
    if (isInternalNote) {
      setSendingReply(true);
      try {
        const res = await fetch(`/api/tickets/${ticketId}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            text: replyContent,
            isInternal: true,
            replyAll: false,
          }),
        });
        if (res.ok) {
          setReplyContent("");
          fetchTicketDetails(ticketId); // refresh timeline
        }
      } catch (err) {
        toast.error("Erro ao adicionar nota interna");
      } finally {
        setSendingReply(false);
      }
      return;
    }

    // Outbound email reply
    const lastInbound = [...timelineEvents].reverse().find(e => e.type === "inbound_email");
    if (!lastInbound) {
      toast.error("Não há e-mail recebido para responder.");
      return;
    }

    setSendingReply(true);
    try {
      // Pega messageId
      const ticketRes = await fetch(`/api/tickets/${ticketId}`);
      const tData = await ticketRes.json();
      const inReplyTo = tData.processedEmails?.[tData.processedEmails.length - 1]?.messageId;

      const payload = {
        to: requesterEmail || tData.requester?.email,
        cc: replyAll ? ccAddresses : undefined,
        subject: `Re: ${problem}`,
        content: replyContent,
        inReplyTo,
        isPublic: true
      };

      const res = await fetch(`/api/email/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Erro ao enviar resposta");
      }
      
      toast.success("Resposta enviada com sucesso!");
      setReplyContent("");
      fetchTicketDetails(ticketId); // Refresh thread
    } catch (err: any) {
      toast.error(err.message || "Erro ao responder");
    } finally {
      setSendingReply(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[850px] h-[90vh] flex flex-col p-0 overflow-hidden bg-background">
        <DialogHeader className="px-6 py-4 border-b border-border/50 shrink-0 bg-muted/20">
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Chamado #{ticketNumber} — Thread de E-mail
          </DialogTitle>
          <DialogDescription className="truncate pr-4" title={problem}>
            {problem}
          </DialogDescription>
        </DialogHeader>

        {/* Abas */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-border/50 shrink-0">
          <Button
            type="button"
            variant={activeTab === "THREAD" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("THREAD")}
            className={`text-xs rounded-b-none ${activeTab === "THREAD" ? "border-b-2 border-primary" : ""}`}
          >
            <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
            Thread de E-mail
          </Button>
          <Button
            type="button"
            variant={activeTab === "INFO" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("INFO")}
            className={`text-xs rounded-b-none ${activeTab === "INFO" ? "border-b-2 border-primary" : ""}`}
          >
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            Informações Operacionais
          </Button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
            Carregando thread...
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {activeTab === "THREAD" && (
              <div className="flex flex-col h-full">
                <div className="flex-1 space-y-6 pb-6">
                  {timelineEvents.map((ev) => (
                    <div 
                      key={ev.id} 
                      className={`flex flex-col gap-2 rounded-xl p-4 border shadow-sm ${
                        ev.isInternal ? "bg-warning/10 border-warning/30" : 
                        ev.type === "inbound_email" ? "bg-card border-border/60" : "bg-primary/5 border-primary/20"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            ev.isInternal ? "bg-warning/20 text-warning-foreground" :
                            ev.type === "inbound_email" ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"
                          }`}>
                            {ev.author.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-foreground">
                              {ev.author}
                              {ev.type === "outbound_email" && " (Equipe)"}
                            </span>
                            {ev.type === "inbound_email" && ev.cc && (
                              <span className="text-[10px] text-muted-foreground truncate max-w-[300px]" title={`CC: ${ev.cc}`}>
                                CC: {ev.cc}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[11px] text-muted-foreground">
                            {ev.date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                          </span>
                          {ev.isInternal && (
                            <Badge variant="outline" className="mt-1 border-warning/50 text-warning text-[9px] px-1 py-0 h-4">
                              Nota Interna
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-2 text-sm text-foreground/90 leading-relaxed overflow-x-auto w-full">
                        {ev.type === "inbound_email" || ev.type === "outbound_email" ? (
                          <div 
                            className="email-body-content max-w-full"
                            dangerouslySetInnerHTML={{ __html: ev.body }}
                          />
                        ) : (
                          <p className="whitespace-pre-wrap">{ev.body}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                
                {/* Reply Box */}
                <div className="sticky bottom-0 mt-4 bg-background pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="internalNote"
                          checked={isInternalNote}
                          onChange={(e) => setIsInternalNote(e.target.checked)}
                          className="rounded border-border text-warning cursor-pointer w-3.5 h-3.5"
                        />
                        <Label htmlFor="internalNote" className="text-xs font-semibold cursor-pointer text-warning">Nota Interna (Não envia e-mail)</Label>
                      </div>
                      
                      {!isInternalNote && ccAddresses && (
                        <div className="flex items-center gap-2 border-l border-border/50 pl-4">
                          <input 
                            type="checkbox" 
                            id="replyAll" 
                            checked={replyAll}
                            onChange={(e) => setReplyAll(e.target.checked)}
                            className="rounded border-border text-primary cursor-pointer w-3.5 h-3.5"
                          />
                          <Label htmlFor="replyAll" className="text-xs cursor-pointer truncate max-w-[200px]" title={ccAddresses}>
                            Responder a todos
                          </Label>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="relative">
                    <Textarea 
                      placeholder={isInternalNote ? "Digite sua nota interna..." : "Digite sua resposta para o solicitante..."}
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className={`min-h-[100px] pb-12 resize-y text-sm ${isInternalNote ? 'bg-warning/5 border-warning/30 focus-visible:ring-warning/50' : ''}`}
                    />
                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                      <Button 
                        size="sm" 
                        onClick={handleSendReply}
                        disabled={sendingReply || !replyContent.trim()}
                        className={isInternalNote ? "bg-warning hover:bg-warning/90 text-warning-foreground" : ""}
                      >
                        {sendingReply ? "Enviando..." : (
                          <>
                            <Send className="w-3.5 h-3.5 mr-1.5" />
                            {isInternalNote ? "Salvar Nota" : "Enviar Resposta"}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  {!isInternalNote && (
                    <p className="text-[10px] text-muted-foreground mt-1">A assinatura padrão da equipe será anexada automaticamente ao final do e-mail.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "INFO" && (
              <form onSubmit={handleSaveInfo} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-3">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                        Solicitante
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
                        placeholder={requesterName || "Selecione o solicitante..."}
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

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Setor *</label>
                        <Combobox
                          options={sectors.map((s) => ({ id: s.id, name: s.name }))}
                          value={sectorId}
                          onChange={(val) => setSectorId(val || "")}
                          placeholder="Selecione..."
                          searchPlaceholder="Pesquisar..."
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Serviço *</label>
                        <Combobox
                          options={services.map((sv) => ({ id: sv.id, name: sv.name, badge: sv.category || "TI" }))}
                          value={serviceId}
                          onChange={(val) => setServiceId(val || "")}
                          placeholder="Selecione..."
                          searchPlaceholder="Pesquisar..."
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Assunto / Problema *</label>
                      <Input
                        value={problem}
                        onChange={(e) => setProblem(e.target.value)}
                        className="text-sm"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Status</label>
                        <select
                          className="w-full h-9 px-2 text-xs rounded-md border border-input bg-background"
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                        >
                          <option value="ABERTO">Aberto</option>
                          <option value="EM_ATENDIMENTO">Em Atendimento</option>
                          <option value="AGUARDANDO_TERCEIROS">Aguardando Terceiros</option>
                          <option value="AGUARDANDO_USUARIO">Aguardando Usuário</option>
                          <option value="RESOLVIDO">Resolvido</option>
                          <option value="CANCELADO">Cancelado</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Origem</label>
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
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Prioridade</label>
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

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Técnico Responsável</label>
                      <Combobox
                        options={technicians.map((t) => ({ id: t.id, name: t.name, subtitle: t.email }))}
                        value={technicianId}
                        onChange={(val) => setTechnicianId(val || "")}
                        placeholder="(Sem técnico — Fila Geral)"
                        searchPlaceholder="Pesquisar..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-lg border border-border/50">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1">Início</label>
                        <input
                          type="datetime-local"
                          value={startTime ? startTime.substring(0, 16) : ''}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="bg-background border border-input rounded-md px-3 py-2 text-sm w-full"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1">Fim</label>
                        <input
                          type="datetime-local"
                          value={endTime ? endTime.substring(0, 16) : ''}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="bg-background border border-input rounded-md px-3 py-2 text-sm w-full"
                        />
                      </div>
                      <div className="md:col-span-2 flex flex-col items-center justify-center bg-primary/10 rounded-md p-3 border border-primary/20 shadow-sm mt-2">
                        <span className="text-xs font-medium text-primary mb-0.5">Tempo total (auto)</span>
                        <span className="text-2xl font-bold font-mono text-primary">{getFormattedDuration()}</span>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button type="submit" disabled={saving}>
                        {saving ? "Salvando..." : "Salvar Alterações"}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <RequesterHistoryCard requesterId={requesterId} requesterName={requesterName} />
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Observações</label>
                      <textarea
                        placeholder="Anotações extras da equipe de TI..."
                        value={observations}
                        onChange={(e) => setObservations(e.target.value)}
                        rows={5}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
