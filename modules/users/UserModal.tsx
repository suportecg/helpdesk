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
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, UserPlus, Edit3 } from "lucide-react";

interface Sector {
  id: string;
  name: string;
  description?: string | null;
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userToEdit?: any | null;
}

export function UserModal({
  isOpen,
  onClose,
  onSuccess,
  userToEdit,
}: UserModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("SOLICITANTE");
  const [department, setDepartment] = useState("");
  const [sectorId, setSectorId] = useState("");
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(userToEdit);

  useEffect(() => {
    if (isOpen) {
      fetchSectors();
      if (userToEdit) {
        setName(userToEdit.name || "");
        setEmail(userToEdit.email || "");
        setRole(userToEdit.role || "SOLICITANTE");
        setDepartment(userToEdit.department || "");
        setSectorId(userToEdit.sectorId || "");
        setPassword("");
      } else {
        setName("");
        setEmail("");
        setPassword("");
        setRole("SOLICITANTE");
        setDepartment("");
        setSectorId("");
      }
      setError(null);
    }
  }, [isOpen, userToEdit]);

  const fetchSectors = async () => {
    try {
      const res = await fetch("/api/sectors");
      if (res.ok) {
        const data = await res.json();
        setSectors(data);
      }
    } catch (e) {
      console.error("Erro ao buscar setores:", e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = isEditing ? `/api/users/${userToEdit.id}` : "/api/users";
      const method = isEditing ? "PUT" : "POST";

      const payload: any = {
        name,
        email,
        role,
        department: department || undefined,
        sectorId: sectorId || undefined,
      };

      if (!isEditing && password) {
        payload.password = password;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar usuário");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Falha ao salvar usuário");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Edit3 className="h-5 w-5 text-primary" />
                Editar Usuário
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5 text-primary" />
                Novo Usuário
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize as informações corporativas e o papel do usuário no sistema."
              : "Preencha os dados abaixo para cadastrar um novo técnico ou solicitante da CG Construções."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Nome Completo</label>
            <Input
              required
              placeholder="Ex: Lucas Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">E-mail Corporativo</label>
            <Input
              required
              type="email"
              placeholder="Ex: lucas@cgconstrucoes.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {!isEditing && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Senha Inicial (Opcional)</label>
              <Input
                type="password"
                placeholder="Padrão: cg2026ti"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Se deixado em branco, a senha padrão corporativa será atribuída.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Papel (Role)</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="SOLICITANTE">Solicitante</option>
                <option value="TI">Equipe TI / Suporte</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Setor / Obra</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={sectorId}
                onChange={(e) => setSectorId(e.target.value)}
              >
                <option value="">Selecione um Setor</option>
                {sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Departamento / Cargo</label>
            <Input
              placeholder="Ex: Infraestrutura TI / Obras"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Salvar Alterações" : "Criar Usuário"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
