"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Wrench } from "lucide-react";

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  serviceToEdit?: any | null;
}

export function ServiceModal({
  isOpen,
  onClose,
  onSuccess,
  serviceToEdit,
}: ServiceModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [slaHours, setSlaHours] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(serviceToEdit);

  useEffect(() => {
    if (isOpen) {
      if (serviceToEdit) {
        setName(serviceToEdit.name || "");
        setCategory(serviceToEdit.category || "");
        setDescription(serviceToEdit.description || "");
        setSlaHours(serviceToEdit.slaHours ? String(serviceToEdit.slaHours) : "");
      } else {
        setName("");
        setCategory("");
        setDescription("");
        setSlaHours("");
      }
      setError(null);
    }
  }, [isOpen, serviceToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("O nome do serviço é obrigatório.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = isEditing
        ? `/api/services/${serviceToEdit.id}`
        : "/api/services";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name, 
          category, 
          description, 
          slaHours: slaHours ? parseInt(slaHours) : null 
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erro ao salvar serviço");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro interno.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            {isEditing ? "Editar Serviço" : "Novo Serviço"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Nome do Serviço</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Formatação de Computador, Troca de Mouse..."
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Categoria</label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ex: Hardware, Software, Rede..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Descrição (Opcional)</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes sobre este serviço"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">SLA (Horas)</label>
            <Input
              type="number"
              min="1"
              value={slaHours}
              onChange={(e) => setSlaHours(e.target.value)}
              placeholder="Ex: 24 para 24 horas"
            />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
