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
import { UploadCloud, CheckCircle2, AlertTriangle, FileSpreadsheet } from "lucide-react";

export interface ImportExcelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}

export function ImportExcelModal({
  open,
  onOpenChange,
  onImported,
}: ImportExcelModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    importedCount?: number;
    errors?: string[];
    message?: string;
  } | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  }

  async function handleImport() {
    if (!file) return;
    setUploading(true);
    setResult(null);

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/tickets/import", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (res.ok) {
        setResult({
          success: true,
          importedCount: data.importedCount,
          errors: data.errors,
          message: data.message,
        });
        if (data.importedCount > 0) {
          onImported();
        }
      } else {
        setResult({ success: false, errors: [data.error || "Erro desconhecido na importação"] });
      }
    } catch (err: any) {
      setResult({ success: false, errors: [err.message || "Erro de conexão ao importar"] });
    } finally {
      setUploading(false);
    }
  }

  function closeModal() {
    setFile(null);
    setResult(null);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={closeModal}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
            Importar Chamados (CSV)
          </DialogTitle>
          <DialogDescription>
            Envie sua planilha de controle atual para importar os chamados em massa para o sistema.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4 py-4">
            <div className="border-2 border-dashed border-border/60 rounded-lg p-6 flex flex-col items-center justify-center text-center bg-muted/10 hover:bg-muted/30 transition-colors">
              <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-foreground mb-1">
                Arraste ou clique para selecionar
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Apenas arquivos .csv são suportados
              </p>
              <label className="cursor-pointer inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
                Selecionar Arquivo
                <input
                  type="file"
                  className="hidden"
                  accept=".csv, text/csv"
                  onChange={handleFileChange}
                />
              </label>
              {file && (
                <div className="mt-4 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded text-xs text-emerald-600 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Arquivo selecionado: {file.name}
                </div>
              )}
            </div>

            <div className="bg-muted/40 p-3 rounded text-xs text-muted-foreground">
              <strong className="text-foreground">Colunas Reconhecidas:</strong> Solicitante, Setor/Obra, Técnico, Data, Hora Início, Problema, Descrição, Serviço, Status, Encerramento.
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {result.success ? (
              <div className="flex flex-col items-center justify-center text-center p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                <h3 className="font-semibold text-emerald-700">Importação Concluída</h3>
                <p className="text-sm text-emerald-600 mt-1">
                  <strong>{result.importedCount}</strong> chamados importados com sucesso!
                </p>
                {result.message && (
                  <div className="mt-3 p-3 bg-emerald-500/20 rounded text-xs text-emerald-800 text-left">
                    <strong className="block mb-1">Relatório de Reuso:</strong>
                    {result.message}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertTriangle className="w-10 h-10 text-red-500 mb-2" />
                <h3 className="font-semibold text-red-700">Falha na Importação</h3>
                <p className="text-sm text-red-600 mt-1">Ocorreu um erro e a importação falhou.</p>
              </div>
            )}

            {result.errors && result.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-semibold text-red-500 mb-2">Erros / Avisos encontrados:</h4>
                <div className="max-h-32 overflow-y-auto bg-red-500/5 border border-red-500/20 p-2 rounded text-xs font-mono text-red-600 space-y-1">
                  {result.errors.map((err, idx) => (
                    <div key={idx}>- {err}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={closeModal} disabled={uploading}>
            {result ? "Fechar" : "Cancelar"}
          </Button>
          {!result && (
            <Button onClick={handleImport} disabled={!file || uploading}>
              {uploading ? "Importando..." : "Iniciar Importação"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
