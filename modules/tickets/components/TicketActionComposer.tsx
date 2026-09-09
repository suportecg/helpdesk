"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import SignatureSettingsModal from "../../emails/SignatureSettingsModal";

export function TicketActionComposer({ 
  ticket, 
  onActionAdded, 
  onStatusChange 
}: { 
  ticket: any, 
  onActionAdded: () => void,
  onStatusChange: (status: string) => void
}) {
  const [activeTab, setActiveTab] = useState<"PUBLIC" | "INTERNAL">("PUBLIC");
  const [submitting, setSubmitting] = useState(false);
  const [nextStatus, setNextStatus] = useState<string>("KEEP"); // "KEEP" means don't change
  const [signatureHtml, setSignatureHtml] = useState("");
  const [showSignatureSettings, setShowSignatureSettings] = useState(false);

  useEffect(() => {
    try {
      const savedSig = localStorage.getItem("@helpdesk:signature");
      if (savedSig) {
        const sig = JSON.parse(savedSig);
        setSignatureHtml(sig.html || "");
      }
    } catch (e) {}
  }, []);

  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    editorProps: {
      attributes: {
        class: "min-h-[120px] max-h-[300px] overflow-y-auto p-4 focus:outline-none text-sm prose dark:prose-invert max-w-none",
      },
    },
  });

  const handleSubmit = async () => {
    if (!editor || editor.isEmpty) return;
    
    setSubmitting(true);
    const contentHtml = editor.getHTML();
    const contentText = editor.getText();

    try {
      if (activeTab === "PUBLIC") {
        const finalHtml = signatureHtml ? contentHtml + "<br/><br/>" + signatureHtml : contentHtml;

        // Ação Pública
        if (ticket.origin === "EMAIL" || ticket.requester?.email) {
          // Tentar enviar e-mail se tiver origem de e-mail ou se o solicitante tiver e-mail
          const inReplyTo = ticket.processedEmails?.[ticket.processedEmails.length - 1]?.messageId;
          const payload = {
            to: ticket.requester?.email,
            cc: ticket.cc,
            subject: `Re: ${ticket.problem}`,
            content: finalHtml,
            inReplyTo,
            isPublic: true,
            ticketId: ticket.id,
            nextStatus: nextStatus !== "KEEP" && nextStatus !== ticket.status ? nextStatus : undefined,
            solutionHtml: (activeTab === "PUBLIC" && nextStatus === "RESOLVIDO" && editor.getText().trim().length > 0) ? finalHtml : undefined
          };

          const res = await fetch(`/api/email/reply`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!res.ok) throw new Error("Erro ao enviar e-mail da Ação Pública");
        } else {
          // Se for ação pública mas não houver como enviar e-mail, salva apenas como comentário público
          const res = await fetch(`/api/tickets/${ticket.id}/comments`, {
            method: "POST",
            body: JSON.stringify({ 
              text: contentText, 
              isInternal: false,
              nextStatus: nextStatus !== "KEEP" && nextStatus !== ticket.status ? nextStatus : undefined,
              solutionHtml: (activeTab === "PUBLIC" && nextStatus === "RESOLVIDO" && editor.getText().trim().length > 0) ? finalHtml : undefined,
              signatureHtml: signatureHtml || undefined
            }),
          });
          if (!res.ok) throw new Error("Erro ao salvar ação pública como comentário");
        }
      } else {
        // Ação Interna
        const res = await fetch(`/api/tickets/${ticket.id}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            text: contentText, 
            isInternal: true,
            nextStatus: nextStatus !== "KEEP" && nextStatus !== ticket.status ? nextStatus : undefined
          }),
        });
        if (!res.ok) throw new Error("Erro ao salvar ação interna");
      }


      toast.success("Ação adicionada com sucesso!");
      editor.commands.setContent("");
      onActionAdded();
    } catch (err: any) {
      toast.error(err.message || "Erro ao adicionar ação");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
      {/* TABS */}
      <div className="flex border-b border-border/50 bg-muted/20">
        <button
          className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === "PUBLIC" ? "border-primary text-primary bg-background" : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          }`}
          onClick={() => setActiveTab("PUBLIC")}
        >
          Ação Pública
        </button>
        <button
          className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === "INTERNAL" ? "border-warning text-warning bg-warning/5" : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          }`}
          onClick={() => setActiveTab("INTERNAL")}
        >
          Ação Interna
        </button>
      </div>

      <div className={activeTab === "INTERNAL" ? "bg-warning/5" : "bg-background"}>
        {/* TOOLBAR */}
        <div className="flex items-center gap-1 border-b border-border/50 p-2 bg-muted/10">
          <Button 
            variant="ghost" 
            size="icon" 
            className={`h-8 w-8 ${editor?.isActive("bold") ? "bg-muted text-foreground" : "text-muted-foreground"}`}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className={`h-8 w-8 ${editor?.isActive("italic") ? "bg-muted text-foreground" : "text-muted-foreground"}`}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-4 bg-border mx-1" />
        </div>

        {/* EDITOR */}
        <div className="cursor-text" onClick={() => editor?.commands.focus()}>
          <EditorContent editor={editor} />
        </div>

        {/* SIGNATURE PREVIEW */}
        {(activeTab === "PUBLIC" && signatureHtml) && (
          <div className="px-4 pb-4">
            <div className="text-[13px] text-muted-foreground pt-4 mt-2 border-t border-border/50" dangerouslySetInnerHTML={{ __html: signatureHtml }} />
          </div>
        )}

        {/* FOOTER ACTIONS */}
        <div className="flex items-center justify-between p-3 border-t border-border/50 bg-muted/10">
          <div className="flex items-center gap-4">
            <p className="text-xs text-muted-foreground">
              {activeTab === "PUBLIC" ? "Esta mensagem será enviada ao solicitante." : "Esta nota ficará oculta para o solicitante."}
            </p>
            {activeTab === "PUBLIC" && (
              <button
                type="button"
                onClick={() => setShowSignatureSettings(true)}
                className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary flex items-center gap-1.5 transition-colors bg-background px-2.5 py-1.5 border border-border/60 rounded shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256"><path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l12.69-12.69L204.69,96Z"></path></svg>
                Assinatura
              </button>
            )}
          </div>
          
          <div className="flex items-center">
            <select 
              className="h-9 px-3 py-1 bg-background border border-border rounded-l-md text-sm outline-none focus:ring-1 focus:ring-primary shadow-sm"
              value={nextStatus}
              onChange={(e) => setNextStatus(e.target.value)}
            >
              <option value="KEEP">Manter status atual</option>
              <option value="ABERTO">Aberto</option>
              <option value="EM_ATENDIMENTO">Em Atendimento</option>
              <option value="AGUARDANDO_USUARIO">Aguardando Usuário</option>
              <option value="RESOLVIDO">Resolvido</option>
            </select>
            <Button 
              onClick={handleSubmit} 
              disabled={submitting}
              className={`rounded-l-none shadow-sm ${activeTab === "INTERNAL" ? "bg-warning hover:bg-warning/90 text-warning-foreground" : ""}`}
            >
              {submitting ? "Enviando..." : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Adicionar ação
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {showSignatureSettings && (
        <SignatureSettingsModal
          onClose={() => setShowSignatureSettings(false)}
          onSave={(html) => setSignatureHtml(html)}
        />
      )}
    </div>
  );
}
