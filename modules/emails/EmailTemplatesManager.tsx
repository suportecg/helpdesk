"use client";

import React, { useEffect, useState } from "react";
import { Plus, PencilSimple, Trash, WarningCircle, CheckCircle, Code, PaperPlaneTilt, Eye, X } from "@phosphor-icons/react";
import { toast } from "sonner";

interface EmailTemplate {
  id: string;
  code: string;
  name: string;
  subject: string;
  bodyHtml: string;
  showPriority: boolean;
  showStatus: boolean;
  primaryColor: string | null;
}

export default function EmailTemplatesManager() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal/Form state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<EmailTemplate>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/email-templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (err) {
      console.error("Failed to fetch templates:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreate = () => {
    setFormData({
      code: "NOVO_TEMPLATE",
      name: "Novo Template",
      subject: "",
      bodyHtml: "<p>Digite seu e-mail aqui...</p>",
      showPriority: true,
      showStatus: true,
      primaryColor: "#2563eb",
    });
    setError(null);
    setSuccess(null);
    setIsEditing(true);
  };

  const openEdit = (template: EmailTemplate) => {
    setFormData(template);
    setError(null);
    setSuccess(null);
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const isUpdate = !!formData.id;
    const url = isUpdate ? `/api/email-templates/${formData.id}` : `/api/email-templates`;
    const method = isUpdate ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Ocorreu um erro ao salvar o template.");
        return;
      }

      setSuccess("Template salvo com sucesso!");
      setIsEditing(false);
      fetchTemplates();
    } catch (err: any) {
      setError(err.message || "Erro de conexão ao salvar.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o template "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/email-templates/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Template excluído com sucesso!");
        fetchTemplates();
      } else {
        const data = await res.json();
        toast.error("Erro ao excluir: " + (data.error || "Desconhecido"));
      }
    } catch (err) {
      toast.error("Erro ao excluir template.");
    }
  };

  const getPreviewHtml = () => {
    let html = formData.bodyHtml || "";
    html = html.replace(/{{requesterName}}/g, "João Silva");
    html = html.replace(/{{ticketNumber}}/g, "104");
    html = html.replace(/{{problem}}/g, "Problema com a impressora");
    html = html.replace(/{{status}}/g, "ABERTO");
    html = html.replace(/{{priority}}/g, "MEDIA");
    html = html.replace(/{{date}}/g, new Date().toLocaleDateString("pt-BR"));
    html = html.replace(/{{systemName}}/g, "CG Construções HelpDesk");
    return html;
  };

  if (isEditing) {
    return (
      <div className="bg-card border border-border/50 rounded-[2rem] shadow-sm p-6 lg:p-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold">{formData.id ? "Editar Template" : "Novo Template"}</h2>
            <p className="text-sm text-muted-foreground mt-1">Configure o design e conteúdo das notificações automáticas.</p>
          </div>
          <button 
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-xl transition-colors"
          >
            Cancelar
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-danger/10 text-danger rounded-xl flex items-center gap-3 border border-danger/20 text-sm">
            <WarningCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome de exibição</label>
                <input
                  type="text"
                  required
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="Ex: Abertura de Chamado"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Code className="w-4 h-4" /> Código (Único)
                </label>
                <input
                  type="text"
                  required
                  disabled={!!formData.id} // Não pode mudar o código depois de criado
                  value={formData.code || ""}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                  className="w-full bg-muted/50 border border-input rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-70 font-mono text-xs uppercase"
                  placeholder="TICKET_CREATED"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Assunto do E-mail</label>
              <input
                type="text"
                required
                value={formData.subject || ""}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="Chamado #{{ticketNumber}} Aberto"
              />
              <p className="text-xs text-muted-foreground mt-1">Variáveis no assunto: {'{{ticketNumber}}, {{systemName}}'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Cor Principal</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.primaryColor || "#2563eb"}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="w-10 h-10 rounded overflow-hidden cursor-pointer bg-transparent border-0 p-0"
                  />
                  <span className="text-sm font-mono text-muted-foreground">{formData.primaryColor || "#2563eb"}</span>
                </div>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <h4 className="text-sm font-bold text-primary mb-2 flex items-center gap-2">
                <Code className="w-4 h-4" />
                Variáveis Disponíveis no HTML
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1 font-mono">
                <li><span className="text-foreground">{'{{requesterName}}'}</span> : Nome do solicitante</li>
                <li><span className="text-foreground">{'{{ticketNumber}}'}</span> : Número do chamado</li>
                <li><span className="text-foreground">{'{{problem}}'}</span> : Assunto do chamado</li>
                <li><span className="text-foreground">{'{{status}}'}</span> : Status atual</li>
                <li><span className="text-foreground">{'{{priority}}'}</span> : Prioridade do chamado</li>
                <li><span className="text-foreground">{'{{date}}'}</span> : Data (DD/MM/YYYY)</li>
                <li><span className="text-foreground">{'{{systemName}}'}</span> : Nome do sistema</li>
              </ul>
            </div>
          </div>

          <div className="space-y-2 flex flex-col">
            <label className="text-sm font-medium flex justify-between">
              Corpo HTML (Dentro do Layout Base)
            </label>
            <textarea
              required
              value={formData.bodyHtml || ""}
              onChange={(e) => setFormData({ ...formData, bodyHtml: e.target.value })}
              className="w-full flex-1 min-h-[300px] bg-foreground/5 font-mono text-sm border border-input rounded-xl p-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all custom-scrollbar"
              placeholder="<p>Olá, {{requesterName}}!</p>"
            />
          </div>

          <div className="col-span-1 lg:col-span-2 pt-6 border-t border-border/50 flex justify-end gap-3">
            <button 
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="bg-muted text-foreground border border-border px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-muted/80 transition-colors shadow-sm"
            >
              <Eye weight="bold" />
              Visualizar
            </button>
            <button 
              type="submit"
              className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm"
            >
              <PaperPlaneTilt weight="fill" />
              Salvar Template
            </button>
          </div>
        </form>

        {/* Modal de Preview */}
        {isPreviewOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-card border border-border w-full max-w-3xl rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <h3 className="font-bold flex items-center gap-2"><Eye /> Pré-visualização do Template</h3>
                <button onClick={() => setIsPreviewOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-[#f1f5f9]">
                {/* Mock do layout base do email */}
                <div 
                  className="max-w-[600px] mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden font-sans"
                  style={{ fontFamily: "Arial, sans-serif" }}
                >
                  <div className="h-2 w-full" style={{ backgroundColor: formData.primaryColor || "#2563eb" }}></div>
                  <div className="p-8 text-gray-800" dangerouslySetInnerHTML={{ __html: getPreviewHtml() }} />
                  <div className="bg-gray-50 border-t border-gray-100 p-6 text-center text-xs text-gray-500">
                    Este é um e-mail automático enviado por CG Construções HelpDesk.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {success && (
        <div className="p-4 bg-success/10 text-success rounded-xl flex items-center justify-between border border-success/20 text-sm">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 shrink-0" weight="fill" />
            <p>{success}</p>
          </div>
          <button onClick={() => setSuccess(null)} className="text-success hover:opacity-70 font-bold">✕</button>
        </div>
      )}

      <div className="flex justify-between items-end">
        <p className="text-sm text-muted-foreground max-w-2xl">
          Os templates abaixo são usados pelo sistema ao disparar notificações. Você pode personalizar os textos, HTML e cores que serão inseridos no layout base de e-mails da sua empresa.
        </p>
        <button
          onClick={openCreate}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm text-sm"
        >
          <Plus weight="bold" />
          Novo Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-2 p-12 text-center text-muted-foreground animate-pulse">
            Carregando templates...
          </div>
        ) : templates.length === 0 ? (
          <div className="col-span-2 p-12 text-center text-muted-foreground bg-card border border-border/50 rounded-2xl">
            <p>Nenhum template cadastrado.</p>
          </div>
        ) : (
          templates.map((template) => (
            <div key={template.id} className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm flex flex-col gap-4 hover:border-primary/30 transition-colors group">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="font-bold text-lg leading-tight">{template.name}</h3>
                  <p className="text-xs font-mono text-muted-foreground mt-1 px-2 py-0.5 bg-muted rounded inline-block">
                    {template.code}
                  </p>
                </div>
                {template.primaryColor && (
                  <div 
                    className="w-6 h-6 rounded-full shadow-sm border border-black/10 shrink-0" 
                    style={{ backgroundColor: template.primaryColor }}
                    title={`Cor: ${template.primaryColor}`}
                  />
                )}
              </div>
              
              <div className="bg-muted/30 p-3 rounded-xl border border-border/50 text-sm">
                <p className="font-medium text-muted-foreground mb-1 text-xs uppercase tracking-wider">Assunto:</p>
                <p className="truncate" title={template.subject}>{template.subject}</p>
              </div>

              <div className="mt-auto flex justify-end gap-2 pt-2 border-t border-border/30 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => openEdit(template)}
                  className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold"
                >
                  <PencilSimple weight="bold" /> Editar
                </button>
                <button 
                  onClick={() => handleDelete(template.id, template.name)}
                  className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold"
                >
                  <Trash weight="bold" /> Excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
