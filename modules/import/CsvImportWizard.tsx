"use client";

import React, { useState, useCallback, useRef } from "react";
import {
  Upload,
  FileText,
  Eye,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Download,
  UserPlus,
  Building2,
  Wrench,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CsvImportWizardProps {
  open: boolean;
  onClose: () => void;
  onImported?: () => void;
}

type WizardStep = 1 | 2 | 3 | 4 | 5;

interface PreviewData {
  totalRows: number;
  validRows: number;
  skippedRows: number;
  sampleRows: any[];
  newRequesters: string[];
  existingRequesters: string[];
  newSectors: string[];
  existingSectors: string[];
  newServices: string[];
  existingServices: string[];
  newTechnicians: string[];
  existingTechnicians: string[];
  detectedMonthYear: string;
}

interface ImportResult {
  success: boolean;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  newRequesters: number;
  existingRequesters: number;
  newSectors: number;
  existingSectors: number;
  newServices: number;
  existingServices: number;
  newTechnicians: number;
  existingTechnicians: number;
  durationMs: number;
  errors: string[];
}

export function CsvImportWizard({ open, onClose, onImported }: CsvImportWizardProps) {
  const [step, setStep] = useState<WizardStep>(1);
  const [importType, setImportType] = useState<"tickets" | "requesters" | "users" | "services" | "emails">("tickets");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStep(1);
    setImportType("tickets");
    setFile(null);
    setPreview(null);
    setResult(null);
    setLoading(false);
    setProgress(0);
    setProgressLabel("");
    setError(null);
  }, []);

  const handleClose = () => {
    if (result && result.success) {
      onImported?.();
    }
    reset();
    onClose();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (!f.name.endsWith(".csv")) {
        setError("Selecione um arquivo .csv");
        return;
      }
      setFile(f);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && f.name.endsWith(".csv")) {
      setFile(f);
      setError(null);
    } else {
      setError("Selecione um arquivo .csv");
    }
  };

  const handlePreview = async () => {
    if (!file) return;
    if (importType !== "tickets") {
      handleImport();
      return;
    }
    setLoading(true);
    setError(null);
    setProgressLabel("Lendo arquivo...");
    setProgress(20);

    try {
      const formData = new FormData();
      formData.append("file", file);

      setProgressLabel("Analisando dados...");
      setProgress(50);

      const res = await fetch("/api/import/preview", {
        method: "POST",
        body: formData,
      });

      setProgress(80);

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erro ao analisar CSV");
      }

      const data = await res.json();
      setPreview(data);
      setProgress(100);
      setProgressLabel("Análise concluída!");
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setStep(4);

    // Simulate progress stages
    setProgressLabel(importType === "tickets" ? "Validando dados..." : "Processando importação...");
    setProgress(10);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 8;
      });
    }, 500);

    try {
      const formData = new FormData();
      formData.append("file", file);

      setProgressLabel("Importando dados...");

      const url = importType === "tickets" ? "/api/import/csv" : `/api/import/generic?type=${importType}`;

      const res = await fetch(url, {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);
      setProgressLabel("Importação concluída!");

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erro na importação");
      }

      const data = await res.json();
      setResult(data);
      setStep(5);
    } catch (err: any) {
      clearInterval(progressInterval);
      setError(err.message);
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const stepLabels = [
    "Selecionar Arquivo",
    "Pré-visualização",
    "Resumo",
    "Importando",
    "Resultado",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border shadow-2xl">
        <CardHeader className="border-b border-border/60 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-foreground">
                  Importar Histórico CSV
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Etapa {step} de 5 — {stepLabels[step - 1]}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress Stepper */}
          <div className="flex items-center gap-1 mt-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex-1 flex items-center gap-1">
                <div
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    s <= step ? "bg-primary" : "bg-muted"
                  }`}
                />
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Step 1: File Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-semibold mb-2 block text-foreground">Tipo de Importação</label>
                <select
                  value={importType}
                  onChange={(e) => setImportType(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="tickets">Chamados</option>
                  <option value="requesters">Funcionários (Solicitantes)</option>
                  <option value="users">Usuários (Técnicos)</option>
                  <option value="services">Serviços</option>
                  <option value="emails">E-mails Recebidos</option>
                </select>
              </div>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                  file
                    ? "border-primary/50 bg-primary/5"
                    : "border-border hover:border-primary/30 hover:bg-muted/30"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {file ? (
                  <div className="space-y-3">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                      <FileText className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                    >
                      Trocar arquivo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-muted/50 flex items-center justify-center">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        Arraste um arquivo CSV ou clique para selecionar
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Formato: Controle de Chamados (CG Construções)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {loading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{progressLabel}</span>
                    <span className="font-mono font-bold text-foreground">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handlePreview}
                  disabled={!file || loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : importType === "tickets" ? (
                    <Eye className="h-4 w-4 mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {importType === "tickets" ? "Analisar Arquivo" : "Importar Agora"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 2 && preview && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-muted/30 border border-border/60 text-center">
                  <p className="text-2xl font-bold text-foreground">{preview.validRows}</p>
                  <p className="text-[11px] text-muted-foreground">Linhas válidas</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border border-border/60 text-center">
                  <p className="text-2xl font-bold text-amber-500">{preview.skippedRows}</p>
                  <p className="text-[11px] text-muted-foreground">Linhas ignoradas</p>
                  <p className="text-[9px] text-muted-foreground/70">(vazias / sem dados)</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border border-border/60 text-center">
                  <p className="text-2xl font-bold text-primary">{preview.detectedMonthYear}</p>
                  <p className="text-[11px] text-muted-foreground">Período detectado</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border border-border/60 text-center">
                  <p className="text-2xl font-bold text-emerald-500">{preview.totalRows}</p>
                  <p className="text-[11px] text-muted-foreground">Total de linhas</p>
                </div>
              </div>

              {/* Data sample table */}
              <div>
                <h3 className="text-sm font-bold text-foreground mb-2">Pré-visualização (primeiros 10)</h3>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="px-2 py-1.5 text-left font-semibold text-muted-foreground">Solicitante</th>
                        <th className="px-2 py-1.5 text-left font-semibold text-muted-foreground">Setor</th>
                        <th className="px-2 py-1.5 text-left font-semibold text-muted-foreground">Técnico</th>
                        <th className="px-2 py-1.5 text-left font-semibold text-muted-foreground">Data</th>
                        <th className="px-2 py-1.5 text-left font-semibold text-muted-foreground">Problema</th>
                        <th className="px-2 py-1.5 text-left font-semibold text-muted-foreground">Serviço</th>
                        <th className="px-2 py-1.5 text-left font-semibold text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.sampleRows.map((row, idx) => (
                        <tr key={idx} className="border-t border-border/40 hover:bg-muted/20">
                          <td className="px-2 py-1.5 text-foreground max-w-[120px] truncate">{row.solicitante}</td>
                          <td className="px-2 py-1.5 text-foreground">{row.setor}</td>
                          <td className="px-2 py-1.5 text-foreground">{row.tecnico}</td>
                          <td className="px-2 py-1.5 text-muted-foreground font-mono">{row.data}</td>
                          <td className="px-2 py-1.5 text-foreground max-w-[150px] truncate">{row.problema}</td>
                          <td className="px-2 py-1.5 text-foreground max-w-[120px] truncate">{row.servico}</td>
                          <td className="px-2 py-1.5">
                            <Badge variant="outline" className="text-[10px]">{row.status || "—"}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <Button onClick={() => setStep(3)}>
                  Continuar
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Summary */}
          {step === 3 && preview && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-foreground">Resumo da Importação</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Requesters */}
                <div className="p-4 rounded-lg border border-border/60 bg-muted/10">
                  <div className="flex items-center gap-2 mb-3">
                    <UserPlus className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-bold text-foreground">Solicitantes</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Existentes (usar):</span>
                      <span className="font-bold text-foreground">{preview.existingRequesters.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Novos (criar):</span>
                      <span className="font-bold text-emerald-500">{preview.newRequesters.length}</span>
                    </div>
                    {preview.newRequesters.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {preview.newRequesters.slice(0, 5).map((n) => (
                          <Badge key={n} variant="secondary" className="text-[10px]">{n}</Badge>
                        ))}
                        {preview.newRequesters.length > 5 && (
                          <Badge variant="outline" className="text-[10px]">+{preview.newRequesters.length - 5}</Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sectors */}
                <div className="p-4 rounded-lg border border-border/60 bg-muted/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-bold text-foreground">Setores</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Existentes:</span>
                      <span className="font-bold text-foreground">{preview.existingSectors.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Novos:</span>
                      <span className="font-bold text-emerald-500">{preview.newSectors.length}</span>
                    </div>
                    {preview.newSectors.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {preview.newSectors.map((n) => (
                          <Badge key={n} variant="secondary" className="text-[10px]">{n}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Services */}
                <div className="p-4 rounded-lg border border-border/60 bg-muted/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Wrench className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-bold text-foreground">Serviços</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Existentes:</span>
                      <span className="font-bold text-foreground">{preview.existingServices.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Novos:</span>
                      <span className="font-bold text-emerald-500">{preview.newServices.length}</span>
                    </div>
                    {preview.newServices.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {preview.newServices.slice(0, 5).map((n) => (
                          <Badge key={n} variant="secondary" className="text-[10px]">{n}</Badge>
                        ))}
                        {preview.newServices.length > 5 && (
                          <Badge variant="outline" className="text-[10px]">+{preview.newServices.length - 5}</Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Technicians */}
                <div className="p-4 rounded-lg border border-border/60 bg-muted/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-bold text-foreground">Técnicos</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Encontrados:</span>
                      <span className="font-bold text-foreground">{preview.existingTechnicians.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Novos (criar desativado):</span>
                      <span className="font-bold text-amber-500">{preview.newTechnicians.length}</span>
                    </div>
                    {preview.newTechnicians.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {preview.newTechnicians.map((n) => (
                          <Badge key={n} variant="secondary" className="text-[10px]">{n}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/5">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-foreground">
                    <p className="font-semibold">Atenção</p>
                    <p className="text-muted-foreground mt-1">
                      Serão importados <strong className="text-foreground">{preview.validRows}</strong> chamados.
                      Esta ação não pode ser desfeita facilmente. Verifique os dados acima antes de prosseguir.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <Button onClick={handleImport}>
                  <Download className="h-4 w-4 mr-2" />
                  Importar {preview.validRows} Chamados
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Importing */}
          {step === 4 && (
            <div className="space-y-6 py-8">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin" />
                <h3 className="text-lg font-bold text-foreground">{progressLabel}</h3>
                <p className="text-sm text-muted-foreground">
                  Não feche esta janela. O processo pode levar alguns segundos.
                </p>
              </div>

              <div className="max-w-md mx-auto space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{progressLabel}</span>
                  <span className="font-mono font-bold text-foreground">{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Result */}
          {step === 5 && result && (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Importação Concluída</h3>
                <p className="text-sm text-muted-foreground">
                  Todos os dados foram processados com sucesso.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
                  <p className="text-3xl font-bold text-primary">{result.importedRows}</p>
                  <p className="text-xs text-muted-foreground mt-1">Chamados importados</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border border-border/60 text-center">
                  <p className="text-3xl font-bold text-amber-500">{result.skippedRows}</p>
                  <p className="text-xs text-muted-foreground mt-1">Linhas ignoradas</p>
                  <p className="text-[10px] text-muted-foreground/70">(vazias / sem dados)</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border border-border/60 text-center">
                  <p className="text-3xl font-bold text-foreground font-mono">
                    {(result.durationMs / 1000).toFixed(1)}s
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Tempo total</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border border-border/60 text-center">
                  <p className="text-3xl font-bold text-emerald-500">{result.newRequesters}</p>
                  <p className="text-xs text-muted-foreground mt-1">Solicitantes criados</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border border-border/60 text-center">
                  <p className="text-3xl font-bold text-blue-500">{result.newServices}</p>
                  <p className="text-xs text-muted-foreground mt-1">Serviços criados</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border border-border/60 text-center">
                  <p className="text-3xl font-bold text-purple-500">{result.existingTechnicians}</p>
                  <p className="text-xs text-muted-foreground mt-1">Técnicos encontrados</p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                  <p className="text-xs font-bold text-destructive mb-1">
                    Erros encontrados ({result.errors.length})
                  </p>
                  <ul className="text-xs text-destructive/80 space-y-0.5 max-h-24 overflow-y-auto">
                    {result.errors.map((e, i) => (
                      <li key={i}>• {e}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={handleClose}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Concluir
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
