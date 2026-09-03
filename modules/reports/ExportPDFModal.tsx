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
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Sun,
  Moon,
  Check,
  Building2,
  Layout,
  Download,
} from "lucide-react";

export type PDFFormat = "LANDSCAPE" | "A4_LANDSCAPE" | "A3_LANDSCAPE";
export type PDFTheme = "LIGHT" | "DARK";
export type ReportMode =
  | "EXECUTIVO"
  | "OPERACIONAL"
  | "PRODUTIVIDADE"
  | "PERFORMANCE"
  | "PERSONALIZADO";

export interface ExportPDFModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentMode: ReportMode;
  periodLabel?: string;
  onGeneratePDF: (config: {
    format: PDFFormat;
    theme: PDFTheme;
    mode: ReportMode;
  }) => void;
}

export function ExportPDFModal({
  open,
  onOpenChange,
  currentMode,
  periodLabel = "Últimos 30 dias",
  onGeneratePDF,
}: ExportPDFModalProps) {
  const [theme, setTheme] = useState<PDFTheme>("LIGHT");
  const [mode, setMode] = useState<ReportMode>(currentMode);

  const handleConfirm = () => {
    onGeneratePDF({ format: "LANDSCAPE", theme, mode });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Exportar Relatório Executivo Institucional — CG Construções
          </DialogTitle>
          <DialogDescription>
            Gere um documento PDF profissional com desenho vetorial, logomarca oficial e consolidados inteligentes, com download instantâneo e sem impressão no navegador.
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 space-y-5">
          {/* 1. LAYOUT EXECUTIVO LANDSCAPE INFORMATIVO */}
          <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3">
            <Layout className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-foreground">
                  Formato Landscape Executivo
                </span>
                <Badge variant="default" className="text-[10px] px-1.5 py-0.5">
                  Automático
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                O layout é orientado em paisagem (Landscape), desenhado para condensar tabelas e KPIs gerenciais em 2 a 3 páginas harmoniosas.
              </p>
            </div>
          </div>

          {/* 2. SELEÇÃO DE TEMA (CLARO / ESCURO) */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
              1. Tema do Documento PDF
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTheme("LIGHT")}
                className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                  theme === "LIGHT"
                    ? "border-primary bg-primary/10 ring-2 ring-primary"
                    : "border-border hover:bg-muted/40"
                }`}
              >
                <div className="p-2 rounded-md bg-amber-500/10 text-amber-500">
                  <Sun className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">Tema Claro</p>
                  <p className="text-[11px] text-muted-foreground">
                    Fundo branco, ideal para apresentações e papel
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTheme("DARK")}
                className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                  theme === "DARK"
                    ? "border-primary bg-primary/10 ring-2 ring-primary"
                    : "border-border hover:bg-muted/40"
                }`}
              >
                <div className="p-2 rounded-md bg-blue-500/10 text-blue-500">
                  <Moon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">Tema Escuro</p>
                  <p className="text-[11px] text-muted-foreground">
                    Tons corporativos ardósia executivo
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* 3. MODO DO RELATÓRIO */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
              2. Modo do Relatório Consolidado
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as ReportMode)}
              className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="EXECUTIVO">
                Executivo — Visão C-Level (KPIs, Setores, Origem e Evolução Mensal)
              </option>
              <option value="OPERACIONAL">
                Operacional — Fila e Fluxo (Status, Volume Diário/Semanal e Serviços)
              </option>
              <option value="PRODUTIVIDADE">
                Produtividade — Equipe TI (Chamados e Tempo Médio por Técnico)
              </option>
              <option value="PERFORMANCE">
                Performance — SLA e Resolutividade (Tempos Médios e Taxa de Fechamento)
              </option>
              <option value="PERSONALIZADO">
                Personalizado — Indicadores Ativos Customizados
              </option>
            </select>
          </div>

          {/* RESUMO DO CABEÇALHO E RODAPÉ GERADO */}
          <div className="bg-muted/30 border border-border rounded-lg p-3 text-xs space-y-1">
            <div className="flex items-center justify-between font-semibold text-foreground">
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-primary" />
                CG Construções — HelpDesk Pro
              </span>
              <span>Depto. de TI</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground text-[11px]">
              <span>Período: {periodLabel}</span>
              <span>Orientação: Landscape ({theme === "LIGHT" ? "Claro" : "Escuro"})</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} className="font-semibold">
            <Download className="h-4 w-4 mr-1.5" />
            Gerar e Baixar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
