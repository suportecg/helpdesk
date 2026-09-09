"use client";

import React, { useState, useEffect } from "react";
import { X, FloppyDisk, ImageSquare } from "@phosphor-icons/react";

interface SignatureSettingsModalProps {
  onClose: () => void;
  onSave: (sigHtml: string) => void;
}

export default function SignatureSettingsModal({ onClose, onSave }: SignatureSettingsModalProps) {
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [empresa, setEmpresa] = useState("CG Construções");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [site, setSite] = useState("www.cgconstrucoes.com");
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("@helpdesk:signature_data");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.nome) setNome(data.nome);
        if (data.cargo) setCargo(data.cargo);
        if (data.empresa) setEmpresa(data.empresa);
        if (data.email) setEmail(data.email);
        if (data.telefone) setTelefone(data.telefone);
        if (data.site) setSite(data.site);
        if (data.logoUrl) setLogoUrl(data.logoUrl);
      } catch (e) {}
    }
  }, []);

  const getDirectImageUrl = (url: string) => {
    if (!url) return "";
    
    // Convert Google Drive view links to direct image links
    const gdriveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (gdriveMatch && gdriveMatch[1]) {
      return `https://drive.google.com/uc?export=view&id=${gdriveMatch[1]}`;
    }
    
    // Convert Github blob links to raw links
    if (url.includes("github.com") && url.includes("/blob/")) {
      return url.replace("github.com", "raw.githubusercontent.com").replace("/blob/", "/");
    }

    return url;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalLogoUrl = getDirectImageUrl(logoUrl);
    
    // Build HTML based on Movidesk screenshot style
    const html = `
<table style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin-top: 20px; border-collapse: collapse;">
  <tbody>
    <tr>
      <td style="padding-right: 20px; border-right: 1px solid #e2e8f0; vertical-align: middle;">
        ${finalLogoUrl ? `<img src="${finalLogoUrl}" alt="${empresa}" style="max-width: 140px; display: block;" referrerpolicy="no-referrer" />` : `<div style="width: 140px; height: 60px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #94a3b8; border-radius: 4px;">Sem Logo</div>`}
      </td>
      <td style="padding-left: 20px; vertical-align: middle; line-height: 1.5;">
        <div style="font-size: 16px; font-weight: bold; color: #334155;">${nome}</div>
        <div style="font-size: 13px; color: #64748b; margin-bottom: 4px;">${cargo}</div>
        <div style="font-size: 13px; font-weight: bold; color: #334155; margin-bottom: 4px;">${empresa}</div>
        <div style="font-size: 13px;">
          <a href="mailto:${email}" style="color: #4f78f5; text-decoration: none;">${email}</a>
        </div>
        <div style="font-size: 13px; color: #475569;">
          Fone: <a href="tel:${telefone.replace(/\D/g, '')}" style="color: #4f78f5; text-decoration: none;">${telefone}</a>
        </div>
        <div style="font-size: 13px; color: #475569;">
          Website: <a href="http://${site.replace(/^https?:\/\//i, '')}" target="_blank" style="color: #4f78f5; text-decoration: none;">${site}</a>
        </div>
      </td>
    </tr>
  </tbody>
</table>`;

    const data = { nome, cargo, empresa, email, telefone, site, logoUrl };
    localStorage.setItem("@helpdesk:signature_data", JSON.stringify(data));
    localStorage.setItem("@helpdesk:signature", JSON.stringify({ html }));
    
    onSave(html);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between bg-muted/30">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            Configurar Assinatura
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-muted-foreground/80 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" weight="bold" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <form id="sig-form" onSubmit={handleSave} className="space-y-5">
            
            <div className="bg-[#4f78f5]/5 border border-[#4f78f5]/20 rounded-lg p-4 flex gap-4 items-start mb-6">
              <div className="p-2 bg-[#4f78f5]/10 text-[#4f78f5] rounded-lg shrink-0">
                <ImageSquare className="w-6 h-6" />
              </div>
              <div>
                <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">URL da Logo</label>
                <input 
                  type="url"
                  placeholder="https://exemplo.com/logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full text-sm bg-card border border-border rounded-md px-3 py-2 outline-none focus:border-[#4f78f5] transition-colors"
                />
                <p className="text-[11px] text-muted-foreground mt-1.5">Insira o link direto para a imagem da logo da empresa.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Nome</label>
                <input required type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="" className="w-full text-sm bg-muted/30 border border-border/60 rounded-md px-3 py-2.5 outline-none focus:border-[#4f78f5]" />
              </div>
              <div>
                <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Cargo</label>
                <input required type="text" value={cargo} onChange={e => setCargo(e.target.value)} placeholder="" className="w-full text-sm bg-muted/30 border border-border/60 rounded-md px-3 py-2.5 outline-none focus:border-[#4f78f5]" />
              </div>
              <div>
                <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Empresa</label>
                <input required type="text" value={empresa} onChange={e => setEmpresa(e.target.value)} placeholder="" className="w-full text-sm bg-muted/30 border border-border/60 rounded-md px-3 py-2.5 outline-none focus:border-[#4f78f5]" />
              </div>
              <div>
                <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">E-mail</label>
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="" className="w-full text-sm bg-muted/30 border border-border/60 rounded-md px-3 py-2.5 outline-none focus:border-[#4f78f5]" />
              </div>
              <div>
                <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Telefone</label>
                <input required type="text" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="" className="w-full text-sm bg-muted/30 border border-border/60 rounded-md px-3 py-2.5 outline-none focus:border-[#4f78f5]" />
              </div>
              <div>
                <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Website</label>
                <input required type="text" value={site} onChange={e => setSite(e.target.value)} placeholder="" className="w-full text-sm bg-muted/30 border border-border/60 rounded-md px-3 py-2.5 outline-none focus:border-[#4f78f5]" />
              </div>
            </div>

            <div className="mt-8">
              <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Pré-visualização</label>
              <div className="border border-border/60 rounded-lg p-5 bg-card shadow-sm overflow-x-auto">
                <table style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif", marginTop: "10px", borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <td style={{ paddingRight: "20px", borderRight: "1px solid #e2e8f0", verticalAlign: "middle" }}>
                        {logoUrl ? (
                          <img src={getDirectImageUrl(logoUrl)} alt={empresa} style={{ maxWidth: "140px", display: "block" }} referrerPolicy="no-referrer" />
                        ) : (
                          <div style={{ width: "140px", height: "60px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: "#94a3b8", borderRadius: "4px" }}>Sem Logo</div>
                        )}
                      </td>
                      <td style={{ paddingLeft: "20px", verticalAlign: "middle", lineHeight: "1.5" }}>
                        <div style={{ fontSize: "16px", fontWeight: "bold", color: "#334155" }}>{nome || "Seu Nome"}</div>
                        <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "4px" }}>{cargo || "Seu Cargo"}</div>
                        <div style={{ fontSize: "13px", fontWeight: "bold", color: "#334155", marginBottom: "4px" }}>{empresa}</div>
                        <div style={{ fontSize: "13px" }}>
                          <span style={{ color: "#4f78f5" }}>{email || "email@empresa.com"}</span>
                        </div>
                        <div style={{ fontSize: "13px", color: "#475569" }}>
                          Fone: <span style={{ color: "#4f78f5" }}>{telefone || "(00) 00000-0000"}</span>
                        </div>
                        <div style={{ fontSize: "13px", color: "#475569" }}>
                          Website: <span style={{ color: "#4f78f5" }}>{site}</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </form>
        </div>

        <div className="px-6 py-4 bg-muted/30 border-t border-border/40 flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-sm font-bold text-muted-foreground hover:bg-slate-200 transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            form="sig-form"
            className="bg-[#4f78f5] text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#3b62d6] transition-colors shadow-sm"
          >
            <FloppyDisk weight="bold" className="w-4 h-4" />
            Salvar Assinatura
          </button>
        </div>
      </div>
    </div>
  );
}
