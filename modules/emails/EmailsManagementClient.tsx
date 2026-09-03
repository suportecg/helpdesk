"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { EnvelopeSimple, CheckCircle, WarningCircle, CaretDown, CaretUp, Code, PenNib, PaperPlaneRight, X, Trash, Broom } from "@phosphor-icons/react";
import EmailTemplatesManager from "./EmailTemplatesManager";

interface ProcessedEmail {
  id: string;
  messageId: string;
  subject: string | null;
  from: string | null;
  processedAt: Date;
  ticketId: string | null;
  status: string;
  bodyReceived: string | null;
  bodySent: string | null;
  manualReplies?: any;
  ticket?: { ticketNumber: number } | null;
}

interface EmailsManagementClientProps {
  initialEmails: ProcessedEmail[];
}

export default function EmailsManagementClient({ initialEmails }: EmailsManagementClientProps) {
  const [emails, setEmails] = useState<ProcessedEmail[]>(initialEmails);
  const [activeTab, setActiveTab] = useState<"history" | "templates">("history");
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);
  
  // Reply State
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replySubject, setReplySubject] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [replySuccess, setReplySuccess] = useState<string | null>(null);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [checkLoading, setCheckLoading] = useState(false);

  const toggleExpand = (id: string) => {
    if (expandedEmailId === id) {
      setExpandedEmailId(null);
      setReplyingTo(null);
    } else {
      setExpandedEmailId(id);
      setReplyingTo(null);
    }
  };

  const handleStartReply = (email: ProcessedEmail) => {
    setReplyingTo(email.id);
    setReplySubject(email.subject ? `Re: ${email.subject}` : "Re:");
    setReplyContent("");
    setReplySuccess(null);
    setReplyError(null);
  };

  const handleSubmitReply = async (email: ProcessedEmail, e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setReplySuccess(null);
    setReplyError(null);

    try {
      const res = await fetch("/api/email/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email.from,
          subject: replySubject,
          content: replyContent,
          inReplyTo: email.messageId, // Threading
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setReplySuccess("E-mail respondido com sucesso!");
        setReplyingTo(null);
        
        // Simular atualização no frontend
        setEmails(prev => prev.map(em => {
          if (em.id === email.id) {
            const newReply = { date: new Date().toISOString(), adminName: "Você", subject: replySubject, content: replyContent };
            const existingReplies = em.manualReplies ? (Array.isArray(em.manualReplies) ? em.manualReplies : [em.manualReplies]) : [];
            return { ...em, manualReplies: [...existingReplies, newReply] };
          }
          return em;
        }));
      } else {
        setReplyError(data.error || "Falha ao enviar e-mail.");
      }
    } catch (err: any) {
      setReplyError(err.message || "Erro de conexão.");
    } finally {
      setIsSending(false);
    }
  };

  const checkNewEmails = async () => {
    toast.info("Iniciando verificação da caixa de entrada...");
    setCheckLoading(true);
    try {
      const res = await fetch("/api/email/check", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Verificação concluída. E-mails processados: ${data.processed}, Erros: ${data.errors}`);
        window.location.reload(); // Quickest way to refresh since it's a server component
      } else {
        toast.error("Erro na verificação: " + (data.error || "Desconhecido"));
      }
    } catch (err: any) {
      toast.error("Erro na comunicação com o servidor.");
    } finally {
      setCheckLoading(false);
    }
  };

  const handleCleanup = async (days: number | null) => {
    let confirmMsg = days 
      ? `Tem certeza que deseja apagar permanentemente todos os registros de e-mail IMAP mais antigos que ${days} dias?` 
      : "Tem certeza que deseja apagar TODO o histórico de e-mails IMAP do banco?";
      
    if (!window.confirm(confirmMsg)) return;
    
    try {
      const query = days ? `?days=${days}` : "";
      const res = await fetch(`/api/email/cleanup${query}`, { method: "DELETE" });
      const data = await res.json();
      
      if (res.ok) {
        alert(data.message);
        window.location.reload();
      } else {
        alert("Erro: " + data.error);
      }
    } catch (err) {
      alert("Erro ao limpar histórico.");
    }
  };

  const handleDeleteIndividual = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Deseja apagar este registro do histórico de e-mails?")) return;
    
    try {
      const res = await fetch(`/api/email/cleanup/${id}`, { method: "DELETE" });
      if (res.ok) {
        setEmails(prev => prev.filter(em => em.id !== id));
      } else {
        alert("Erro ao excluir registro.");
      }
    } catch (err) {
      alert("Erro de conexão.");
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-primary/10 text-primary rounded-2xl">
          <EnvelopeSimple weight="duotone" className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestão de E-mails</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Controle do histórico IMAP e templates dinâmicos de resposta.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 border-b border-border/50 pb-px mb-6">
        <button
          onClick={() => setActiveTab("history")}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "history" 
              ? "border-primary text-foreground" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Histórico IMAP
        </button>
        <button
          onClick={() => setActiveTab("templates")}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "templates" 
              ? "border-primary text-foreground" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Templates de Resposta
        </button>
      </div>

      {activeTab === "history" && (
        <div className="bg-card border border-border/50 rounded-[2rem] overflow-hidden shadow-sm">
          
          {/* Action Bar */}
          {emails.length > 0 && (
            <div className="bg-muted/10 p-4 border-b border-border/50 flex justify-end items-center gap-2">
              <span className="text-xs text-muted-foreground mr-auto font-medium">
                {emails.length} registros listados.
              </span>
              
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Broom className="w-4 h-4" /> Limpar Histórico:
                </span>
                <button 
                  onClick={() => handleCleanup(30)}
                  className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide bg-background border border-border hover:bg-muted rounded-md transition-colors"
                >
                  +30 dias
                </button>
                <button 
                  onClick={() => handleCleanup(14)}
                  className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide bg-background border border-border hover:bg-muted rounded-md transition-colors"
                >
                  +14 dias
                </button>
                <button 
                  onClick={() => handleCleanup(7)}
                  className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide bg-background border border-border hover:bg-muted rounded-md transition-colors"
                >
                  +7 dias
                </button>
                <button 
                  onClick={() => handleCleanup(null)}
                  className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 rounded-md transition-colors ml-2"
                >
                  Tudo
                </button>
              </div>
            </div>
          )}
          
          {emails.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <EnvelopeSimple className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Nenhum e-mail processado ainda.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {emails.map((email) => {
                const isExpanded = expandedEmailId === email.id;
                
                return (
                  <div key={email.id} className="p-5 hover:bg-muted/10 transition-colors">
                    <div 
                      className="flex items-start gap-4 cursor-pointer"
                      onClick={() => toggleExpand(email.id)}
                    >
                      <div className="mt-1">
                        {email.status === "PROCESSED" ? (
                          <CheckCircle weight="fill" className="w-5 h-5 text-success" />
                        ) : (
                          <WarningCircle weight="fill" className="w-5 h-5 text-danger" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-4 mb-1">
                          <p className="text-sm font-semibold truncate" title={email.subject || "Sem assunto"}>
                            {email.subject || "(Sem assunto)"}
                          </p>
                          <div className="flex items-center gap-3">
                            <time className="text-[11px] text-muted-foreground shrink-0 font-medium">
                              {new Date(email.processedAt).toLocaleString('pt-BR')}
                            </time>
                            {isExpanded ? (
                              <CaretUp className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <CaretDown className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <span className="truncate">De: {email.from}</span>
                          <span>•</span>
                          <span className="truncate max-w-[200px]">ID: {email.messageId}</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {email.ticketId && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                              Ticket #{email.ticket?.ticketNumber || email.ticketId} Gerado
                            </div>
                          )}
                          {email.status === 'ERROR' && (
                            <div className="px-2.5 py-1 rounded-md bg-danger/10 text-danger text-[10px] font-bold uppercase tracking-wider">
                              Falha no processamento
                            </div>
                          )}
                          {email.manualReplies && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-foreground/10 text-foreground text-[10px] font-bold uppercase tracking-wider">
                              <PaperPlaneRight weight="fill" /> {Array.isArray(email.manualReplies) ? email.manualReplies.length : 1} Respostas Manuais
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Lixeira Individual */}
                      <button 
                        onClick={(e) => handleDeleteIndividual(e, email.id)}
                        className="p-2 text-muted-foreground hover:bg-danger/10 hover:text-danger rounded-lg transition-colors ml-4 self-center"
                        title="Excluir do Histórico"
                      >
                        <Trash className="w-5 h-5" />
                      </button>
                    </div>
                    
                    {/* Expanded Content View */}
                    {isExpanded && (
                      <div className="mt-6 ml-9 animate-in slide-in-from-top-2 fade-in duration-200">
                        {replySuccess && (
                          <div className="mb-4 p-3 bg-success/10 text-success rounded-xl flex items-center justify-between border border-success/20 text-sm">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 shrink-0" weight="fill" />
                              <p>{replySuccess}</p>
                            </div>
                            <button onClick={() => setReplySuccess(null)} className="font-bold opacity-70 hover:opacity-100">✕</button>
                          </div>
                        )}
                        
                        {replyError && (
                          <div className="mb-4 p-3 bg-danger/10 text-danger rounded-xl flex items-center gap-2 border border-danger/20 text-sm">
                            <WarningCircle className="w-4 h-4 shrink-0" />
                            <p>{replyError}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
                          {/* Corpo Recebido */}
                          <div className="space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                              <EnvelopeSimple className="w-4 h-4" />
                              Recebido do Cliente
                            </h3>
                            <div className="bg-background rounded-xl border border-border/50 p-4 h-[300px] overflow-y-auto overflow-x-hidden text-sm relative custom-scrollbar">
                              {email.bodyReceived ? (
                                <div 
                                  className="prose prose-sm dark:prose-invert max-w-none break-words"
                                  dangerouslySetInnerHTML={{ __html: email.bodyReceived }} 
                                />
                              ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground italic text-xs">
                                  Conteúdo não salvo
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Corpo Enviado */}
                          <div className="space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Code className="w-4 h-4" />
                                Resposta Automática
                              </div>
                              {email.from && replyingTo !== email.id && (
                                <button
                                  onClick={() => handleStartReply(email)}
                                  className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1 bg-primary/10 px-2 py-1 rounded"
                                >
                                  <PaperPlaneRight weight="bold" /> Responder
                                </button>
                              )}
                            </h3>
                            <div className="bg-background rounded-xl border border-border/50 p-4 h-[300px] overflow-y-auto overflow-x-hidden text-sm relative custom-scrollbar">
                              {email.bodySent ? (
                                <iframe
                                  srcDoc={email.bodySent}
                                  title="Corpo Enviado"
                                  className="w-full h-full border-none bg-white rounded-md"
                                />
                              ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground italic text-xs">
                                  Nenhuma resposta automática foi enviada.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Histórico de Respostas Manuais */}
                        {email.manualReplies && (
                          <div className="mt-6 mb-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
                              <PaperPlaneRight className="w-4 h-4" />
                              Histórico de Respostas Manuais
                            </h3>
                            <div className="space-y-3">
                              {(Array.isArray(email.manualReplies) ? email.manualReplies : [email.manualReplies]).map((reply: any, idx: number) => (
                                <div key={idx} className="bg-muted/30 border border-border/50 rounded-xl p-4 text-sm relative">
                                  <div className="flex justify-between items-center mb-2 text-xs text-muted-foreground">
                                    <span className="font-bold text-foreground">De: {reply.adminName}</span>
                                    <span>{new Date(reply.date).toLocaleString('pt-BR')}</span>
                                  </div>
                                  <div className="font-semibold mb-2">Assunto: {reply.subject}</div>
                                  <div className="bg-background rounded-lg p-3 border border-border/30 whitespace-pre-wrap font-mono text-[13px]">
                                    {reply.content}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Formulário de Resposta Manual */}
                        {replyingTo === email.id && (
                          <div className="mt-4 p-5 bg-card border border-primary/20 rounded-xl shadow-sm relative animate-in fade-in zoom-in-95 duration-200">
                            <button
                              onClick={() => setReplyingTo(null)}
                              className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted"
                            >
                              <X className="w-5 h-5" />
                            </button>
                            
                            <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-primary">
                              <PaperPlaneRight weight="fill" /> Enviar Resposta Manual
                            </h3>
                            
                            <form onSubmit={(e) => handleSubmitReply(email, e)} className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="text-xs font-semibold text-muted-foreground">Para:</label>
                                  <input 
                                    type="text" 
                                    readOnly 
                                    value={email.from || ""} 
                                    className="w-full text-sm bg-muted/50 border border-input rounded-lg px-3 py-2 outline-none"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs font-semibold text-muted-foreground">Assunto:</label>
                                  <input 
                                    type="text" 
                                    required
                                    value={replySubject}
                                    onChange={(e) => setReplySubject(e.target.value)}
                                    className="w-full text-sm bg-background border border-input rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20"
                                  />
                                </div>
                              </div>
                              
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-muted-foreground">Sua Mensagem:</label>
                                <textarea 
                                  required
                                  rows={5}
                                  value={replyContent}
                                  onChange={(e) => setReplyContent(e.target.value)}
                                  placeholder="Digite sua resposta aqui..."
                                  className="w-full text-sm bg-background border border-input rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 custom-scrollbar"
                                />
                              </div>
                              
                              <div className="flex justify-end pt-2">
                                <button
                                  type="submit"
                                  disabled={isSending}
                                  className="bg-primary text-primary-foreground px-5 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
                                >
                                  {isSending ? "Enviando..." : <><PaperPlaneRight weight="bold" /> Enviar Mensagem</>}
                                </button>
                              </div>
                            </form>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "templates" && <EmailTemplatesManager />}
    </div>
  );
}
