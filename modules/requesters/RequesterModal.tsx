"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, PencilSimple } from "@phosphor-icons/react";

export interface RequesterRow {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  department?: string | null;
  isActive: boolean;
  createdAt?: string;
}

interface RequesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  requesterToEdit: RequesterRow | null;
}

export function RequesterModal({
  isOpen,
  onClose,
  onSuccess,
  requesterToEdit,
}: RequesterModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("CG Construções");
  const [department, setDepartment] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (requesterToEdit) {
      setName(requesterToEdit.name || "");
      setEmail(requesterToEdit.email || "");
      setPhone(requesterToEdit.phone || "");
      setCompany(requesterToEdit.company || "CG Construções");
      setDepartment(requesterToEdit.department || "");
      setIsActive(requesterToEdit.isActive);
    } else {
      setName("");
      setEmail("");
      setPhone("");
      setCompany("CG Construções");
      setDepartment("");
      setIsActive(true);
    }
    setError("");
  }, [requesterToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("O nome do solicitante é obrigatório.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        company: company.trim() || undefined,
        department: department.trim() || undefined,
        isActive,
      };

      let res;
      if (requesterToEdit) {
        res = await fetch(`/api/requesters/${requesterToEdit.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/requesters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao salvar solicitante");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao salvar o solicitante.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !loading && !open && onClose()}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {requesterToEdit ? (
              <>
                <PencilSimple className="h-5 w-5 text-primary" />
                Editar Solicitante
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5 text-primary" />
                Novo Solicitante
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {requesterToEdit
              ? "Atualize as informações de contato do solicitante."
              : "Cadastre um novo solicitante para abertura de chamados."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs font-medium border border-red-200">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Nome Completo *
            </label>
            <Input
              placeholder="Ex: João da Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              E-mail (opcional)
            </label>
            <Input
              type="email"
              placeholder="Ex: joao@cgconstrucoes.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Empresa
              </label>
              <Input
                placeholder="Ex: CG Construções"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Setor / Obra
              </label>
              <Input
                placeholder="Ex: Obra Centro"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Telefone (opcional)
            </label>
            <Input
              placeholder="Ex: (11) 98765-4321"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActiveRequester"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="isActiveRequester" className="text-xs text-foreground font-medium">
              Solicitante ativo no sistema
            </label>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Solicitante"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
