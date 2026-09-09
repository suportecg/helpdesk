"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { User, Lock, FileCode, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { TextStyle } from "@tiptap/extension-text-style";
import { Link } from "@tiptap/extension-link";
import { Extension } from "@tiptap/core";
import { generateDefaultSignature } from "@/lib/default-signature";

const GlobalStyle = Extension.create({
  name: 'globalStyle',
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle', 'paragraph', 'heading', 'table', 'tableRow', 'tableHeader', 'tableCell', 'image', 'link'],
        attributes: {
          style: {
            default: null,
            parseHTML: element => element.getAttribute('style'),
            renderHTML: attributes => {
              if (!attributes.style) return {}
              return { style: attributes.style }
            },
          },
          align: {
            default: null,
            parseHTML: element => element.getAttribute('align'),
            renderHTML: attributes => {
              if (!attributes.align) return {}
              return { align: attributes.align }
            },
          },
          cellpadding: {
            default: null,
            parseHTML: element => element.getAttribute('cellpadding'),
            renderHTML: attributes => {
              if (!attributes.cellpadding) return {}
              return { cellpadding: attributes.cellpadding }
            },
          },
          cellspacing: {
            default: null,
            parseHTML: element => element.getAttribute('cellspacing'),
            renderHTML: attributes => {
              if (!attributes.cellspacing) return {}
              return { cellspacing: attributes.cellspacing }
            },
          },
          border: {
            default: null,
            parseHTML: element => element.getAttribute('border'),
            renderHTML: attributes => {
              if (!attributes.border) return {}
              return { border: attributes.border }
            },
          },
          colspan: {
            default: null,
            parseHTML: element => element.getAttribute('colspan'),
            renderHTML: attributes => {
              if (!attributes.colspan) return {}
              return { colspan: attributes.colspan }
            },
          },
          width: {
            default: null,
            parseHTML: element => element.getAttribute('width'),
            renderHTML: attributes => {
              if (!attributes.width) return {}
              return { width: attributes.width }
            },
          },
          height: {
            default: null,
            parseHTML: element => element.getAttribute('height'),
            renderHTML: attributes => {
              if (!attributes.height) return {}
              return { height: attributes.height }
            },
          }
        },
      },
    ]
  },
})

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [importHtmlOpen, setImportHtmlOpen] = useState(false);
  const [htmlToImport, setHtmlToImport] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TextStyle,
      Link.configure({
        openOnClick: false,
      }),
      GlobalStyle,
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          referrerpolicy: "no-referrer",
        },
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "min-h-[200px] border rounded-md p-4 bg-background focus:outline-none prose dark:prose-invert max-w-none",
      },
    },
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (editor && user) {
      if (user.signatureHtml) {
        editor.commands.setContent(user.signatureHtml);
      } else {
        editor.commands.setContent(generateDefaultSignature(user.name || "", user.email || ""));
      }
    }
  }, [editor, user]);

  async function fetchProfile() {
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Falha ao carregar perfil");
      const data = await res.json();
      setUser(data);
      setName(data.name || "");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async () => {
    if (password && password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    setSaving(true);
    try {
      const payload: any = { name };
      if (password) payload.password = password;
      if (editor) payload.signatureHtml = editor.getHTML();

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Erro ao salvar perfil");
      toast.success("Perfil atualizado com sucesso!");
      setPassword("");
      setConfirmPassword("");
      
      // Update local storage signature as fallback for any old components
      if (payload.signatureHtml) {
        localStorage.setItem("@helpdesk:signature", JSON.stringify({ html: payload.signatureHtml }));
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleImportHtml = () => {
    if (editor && htmlToImport) {
      editor.commands.setContent(htmlToImport);
      setImportHtmlOpen(false);
      setHtmlToImport("");
      toast.success("HTML importado para o editor!");
    }
  };

  const handleLoadDefaultTemplate = () => {
    if (editor) {
      editor.commands.setContent(generateDefaultSignature(name || user?.name || "Seu Nome", user?.email || "email@cgconstrucoes.com"));
      toast.success("Modelo padrão da CG Construções carregado no editor!");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando perfil...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-heading">Meu Perfil</h1>
        <p className="text-muted-foreground text-sm">Gerencie suas informações pessoais e assinatura de e-mail.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6 bg-card p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-semibold flex items-center gap-2"><User className="w-5 h-5"/> Dados Pessoais</h2>
          <div className="space-y-2">
            <Label>Nome Completo</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2 opacity-60">
            <Label>E-mail (Não editável)</Label>
            <Input value={user?.email || ""} disabled />
          </div>
        </div>

        <div className="space-y-6 bg-card p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Lock className="w-5 h-5"/> Alterar Senha</h2>
          <div className="space-y-2">
            <Label>Nova Senha</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Deixe em branco para não alterar" />
          </div>
          <div className="space-y-2">
            <Label>Confirmar Nova Senha</Label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="space-y-6 bg-card p-6 rounded-xl border shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2"><FileCode className="w-5 h-5"/> Assinatura de E-mail</h2>
            <p className="text-xs text-muted-foreground">Esta assinatura será incluída em suas ações públicas.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleLoadDefaultTemplate}>
              Restaurar Modelo Padrão CG
            </Button>
            <Button variant="outline" size="sm" onClick={() => setImportHtmlOpen(true)}>
              Importar HTML Bruto
            </Button>
          </div>
        </div>
        
        <div className="mt-2">
          <EditorContent editor={editor} />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={saving} className="px-8">
          {saving ? "Salvando..." : <><CheckCircle2 className="w-4 h-4 mr-2"/> Salvar Alterações</>}
        </Button>
      </div>

      <Dialog open={importHtmlOpen} onOpenChange={setImportHtmlOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Importar Assinatura em HTML</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Cole o código HTML da sua assinatura abaixo. Ele será renderizado no editor visual para você poder alterar o texto livremente depois.
            </p>
            <textarea
              className="w-full h-48 p-3 border rounded-md text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="<html><body>...</body></html>"
              value={htmlToImport}
              onChange={(e) => setHtmlToImport(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportHtmlOpen(false)}>Cancelar</Button>
            <Button onClick={handleImportHtml}>Importar para o Editor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
