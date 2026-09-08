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
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
      
      {/* 1. CABEÇALHO */}
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-[#4f78f5]/10 text-[#4f78f5] rounded-2xl">
          <EnvelopeSimple weight="duotone" className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Gestão de E-mails</h1>
          <p className="text-sm text-slate-500 mt-1">
            Controle do histórico IMAP e templates dinâmicos de resposta.
          </p>
        </div>
      </div>

      {/* 2. ABAS */}
      <div className="flex items-center gap-6 border-b border-slate-200 pb-px mb-6">
        <button
          onClick={() => setActiveTab("history")}
          className={`pb-3 text-sm font-semibold transition-colors relative ${
            activeTab === "history" 
              ? "text-[#4f78f5]" 
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Histórico IMAP
          {activeTab === "history" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#4f78f5] rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("templates")}
          className={`pb-3 text-sm font-semibold transition-colors relative ${
            activeTab === "templates" 
              ? "text-[#4f78f5]" 
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Templates de Resposta
          {activeTab === "templates" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#4f78f5] rounded-t-full" />
          )}
        </button>
      </div>

      {activeTab === "history" && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          
          {/* 4. BARRA DE CONTROLE */}
          {emails.length > 0 && (
            <div className="bg-slate-50/50 p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <span className="text-sm text-slate-500 font-medium">
                {emails.length} {emails.length === 1 ? 'registro listado' : 'registros listados'}.
              </span>
              
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mr-2">
                  <Broom className="w-4 h-4" /> Limpar Histórico:
                </span>
                <button 
                  onClick={() => handleCleanup(30)}
                  className="px-3 py-1.5 text-xs font-bold uppercase tracking-wide bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  +30 dias
                </button>
                <button 
                  onClick={() => handleCleanup(14)}
                  className="px-3 py-1.5 text-xs font-bold uppercase tracking-wide bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  +14 dias
                </button>
                <button 
                  onClick={() => handleCleanup(7)}
                  className="px-3 py-1.5 text-xs font-bold uppercase tracking-wide bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  +7 dias
                </button>
                <button 
                  onClick={() => handleCleanup(null)}
                  className="px-3 py-1.5 text-xs font-bold uppercase tracking-wide bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 rounded-lg transition-colors ml-1"
                >
                  Tudo
                </button>
              </div>
            </div>
          )}
          
          {/* 5. LISTA DE E-MAILS */}
          {emails.length === 0 ? (
            <div className="p-16 text-center text-slate-400">
              <EnvelopeSimple className="w-16 h-16 mx-auto mb-4 opacity-30 text-slate-300" weight="thin" />
              <p className="text-lg font-medium text-slate-500">Caixa de entrada vazia</p>
              <p className="text-sm mt-1">Nenhum e-mail processado recentemente.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {emails.map((email) => {
                const isExpanded = expandedEmailId === email.id;
                
                return (
                  <div key={email.id} className="group hover:bg-slate-50/80 transition-colors">
                    {/* Linha Principal (Header do Card) */}
                    <div 
                      className="p-5 flex items-start gap-4 cursor-pointer"
                      onClick={() => toggleExpand(email.id)}
                    >
                      <div className="mt-1 shrink-0">
                        {email.status === "PROCESSED" ? (
                          <CheckCircle weight="fill" className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <WarningCircle weight="fill" className="w-5 h-5 text-amber-500" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4 mb-2">
                          {/* 6. ASSUNTO */}
                          <p className="text-[15px] font-semibold text-slate-800 truncate" title={email.subject || "Sem assunto"}>
                            {email.subject || "(Sem assunto)"}
                          </p>
                          
                          {/* 8. DATA E HORA */}
                          <div className="flex items-center gap-3 shrink-0">
                            <time className="text-[12px] text-slate-500 font-mono tracking-tight">
                              {new Date(email.processedAt).toLocaleString('pt-BR')}
                            </time>
                            {isExpanded ? (
                              <CaretUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                            ) : (
                              <CaretDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                            )}
                          </div>
                        </div>
                        
                        {/* 7. REMETENTE & 9. ID */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-[13px] text-slate-500 mb-3">
                          <span className="truncate" title={email.from || ""}>
                            De: <span className="font-medium text-slate-600">{email.from}</span>
                          </span>
                          <span className="hidden sm:inline text-slate-300">•</span>
                          <span className="truncate font-mono text-[11px] text-slate-400" title={email.messageId}>
                            ID: {email.messageId}
                          </span>
                        </div>
                        
                        {/* 10. BADGES */}
                        <div className="flex flex-wrap items-center gap-2">
                          {email.ticketId && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#4f78f5]/10 text-[#4f78f5] text-[10px] font-bold uppercase tracking-wider">
                              Ticket #{email.ticket?.ticketNumber || email.ticketId} Gerado
                            </div>
                          )}
                          
                          {email.status === 'ERROR' && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-600 text-[10px] font-bold uppercase tracking-wider">
                              Falha no processamento
                            </div>
                          )}
                          
                          {/* 11. RESPOSTAS MANUAIS */}
                          {email.manualReplies && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                              <PaperPlaneRight weight="fill" /> {Array.isArray(email.manualReplies) ? email.manualReplies.length : 1} Respostas Manuais
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* 13. EXCLUSÃO */}
                      <button 
                        onClick={(e) => handleDeleteIndividual(e, email.id)}
                        className="p-2.5 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors ml-4 shrink-0 opacity-50 group-hover:opacity-100"
                        title="Excluir e-mail"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* 12. ÁREA DE EXPANSÃO (SANFONA) */}
                    {isExpanded && (
                      <div className="bg-slate-50 border-t border-slate-100 p-6 animate-in slide-in-from-top-2 fade-in duration-200">
                        {replySuccess && (
                          <div className="mb-5 p-4 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-between border border-emerald-100 text-sm shadow-sm">
                            <div className="flex items-center gap-2 font-medium">
                              <CheckCircle className="w-5 h-5 shrink-0" weight="fill" />
                              <p>{replySuccess}</p>
                            </div>
                            <button onClick={() => setReplySuccess(null)} className="font-bold opacity-70 hover:opacity-100 transition-opacity">✕</button>
                          </div>
                        )}
                        
                        {replyError && (
                          <div className="mb-5 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 border border-red-100 text-sm shadow-sm font-medium">
                            <WarningCircle className="w-5 h-5 shrink-0" weight="fill" />
                            <p>{replyError}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                          {/* Corpo Recebido */}
                          <div className="space-y-3">
                            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                              <EnvelopeSimple className="w-4 h-4" />
                              Mensagem Original Recebida
                            </h3>
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 h-[350px] overflow-y-auto text-sm relative custom-scrollbar">
                              {email.bodyReceived ? (
                                <div 
                                  className="prose prose-sm max-w-none break-words text-slate-700"
                                  dangerouslySetInnerHTML={{ __html: email.bodyReceived }} 
                                />
                              ) : (
                                <div className="h-full flex items-center justify-center text-slate-400 italic text-sm">
                                  Conteúdo não salvo
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Corpo Enviado */}
                          <div className="space-y-3">
                            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Code className="w-4 h-4" />
                                Resposta Automática do Sistema
                              </div>
                              {email.from && replyingTo !== email.id && (
                                <button
                                  onClick={() => handleStartReply(email)}
                                  className="text-[#4f78f5] hover:bg-[#4f78f5] hover:text-white transition-colors flex items-center gap-1.5 bg-[#4f78f5]/10 px-3 py-1.5 rounded-lg text-xs font-bold"
                                >
                                  <PaperPlaneRight weight="bold" /> Responder
                                </button>
                              )}
                            </h3>
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-1 h-[350px] overflow-hidden text-sm relative">
                              {email.bodySent ? (
                                <iframe
                                  srcDoc={email.bodySent}
                                  title="Corpo Enviado"
                                  className="w-full h-full border-none bg-white rounded-lg"
                                />
                              ) : (
                                <div className="h-full flex items-center justify-center text-slate-400 italic text-sm">
                                  Nenhuma resposta automática foi enviada.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Histórico de Respostas Manuais */}
                        {email.manualReplies && (
                          <div className="mt-8 mb-6 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                              <PaperPlaneRight className="w-4 h-4 text-[#4f78f5]" weight="fill" />
                              Histórico de Interações Manuais
                            </h3>
                            <div className="space-y-4">
                              {(Array.isArray(email.manualReplies) ? email.manualReplies : [email.manualReplies]).map((reply: any, idx: number) => (
                                <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-5 text-sm relative">
                                  <div className="flex justify-between items-center mb-3 text-xs">
                                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 uppercase">
                                        {reply.adminName?.substring(0, 1) || "?"}
                                      </div>
                                      {reply.adminName || "Suporte"}
                                    </span>
                                    <span className="font-mono text-slate-400 bg-white px-2 py-1 rounded border border-slate-100">
                                      {new Date(reply.date).toLocaleString('pt-BR')}
                                    </span>
                                  </div>
                                  <div className="font-semibold text-slate-800 mb-2">{reply.subject}</div>
                                  <div className="bg-white rounded-lg p-4 border border-slate-100 whitespace-pre-wrap font-sans text-slate-600 text-[14px] leading-relaxed shadow-sm">
                                    {reply.content}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Formulário de Resposta Manual */}
                        {replyingTo === email.id && (
                          <div className="mt-6 bg-white border border-[#4f78f5]/30 rounded-xl shadow-md relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                              <h3 className="text-sm font-bold flex items-center gap-2 text-[#4f78f5]">
                                <PenNib weight="fill" className="w-4 h-4" /> Nova Resposta
                              </h3>
                              <button
                                onClick={() => setReplyingTo(null)}
                                className="p-1.5 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
                              >
                                <X className="w-4 h-4" weight="bold" />
                              </button>
                            </div>
                            
                            <form onSubmit={(e) => handleSubmitReply(email, e)} className="p-6 space-y-5">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Para:</label>
                                  <input 
                                    type="text" 
                                    readOnly 
                                    value={email.from || ""} 
                                    className="w-full text-sm bg-slate-50 border border-slate-200 text-slate-600 rounded-lg px-4 py-2.5 outline-none font-medium"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Assunto:</label>
                                  <input 
                                    type="text" 
                                    required
                                    value={replySubject}
                                    onChange={(e) => setReplySubject(e.target.value)}
                                    className="w-full text-sm bg-white border border-slate-300 rounded-lg px-4 py-2.5 outline-none focus:border-[#4f78f5] focus:ring-1 focus:ring-[#4f78f5] transition-shadow font-medium text-slate-800"
                                  />
                                </div>
                              </div>
                              
                              <div className="space-y-1.5">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Mensagem:</label>
                                <textarea 
                                  required
                                  rows={6}
                                  value={replyContent}
                                  onChange={(e) => setReplyContent(e.target.value)}
                                  placeholder="Escreva sua resposta aqui..."
                                  className="w-full text-sm bg-white border border-slate-300 rounded-lg px-4 py-3 outline-none focus:border-[#4f78f5] focus:ring-1 focus:ring-[#4f78f5] transition-shadow custom-scrollbar text-slate-700 leading-relaxed"
                                />
                              </div>
                              
                              <div className="flex justify-end pt-2">
                                <button
                                  type="submit"
                                  disabled={isSending}
                                  className="bg-[#4f78f5] text-white px-6 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-[#3b62d6] transition-colors disabled:opacity-50 shadow-sm"
                                >
                                  {isSending ? "Enviando..." : <><PaperPlaneRight weight="bold" /> Enviar Resposta</>}
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
