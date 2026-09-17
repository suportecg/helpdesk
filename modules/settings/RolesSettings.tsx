"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash, PencilSimple, Plus, ShieldCheck } from "@phosphor-icons/react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

interface RoleRow {
  id: string;
  name: string;
  label: string;
  description: string | null;
  createdAt: string;
  permissions?: any[];
}

export function RolesSettings() {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState<RoleRow | null>(null);
  
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  
  const [confirmDelete, setConfirmDelete] = useState<RoleRow | null>(null);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/roles");
      if (res.ok) {
        setRoles(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleOpenModal = (role?: RoleRow) => {
    if (role) {
      setRoleToEdit(role);
      setName(role.name);
      setLabel(role.label);
      setDescription(role.description || "");
    } else {
      setRoleToEdit(null);
      setName("");
      setLabel("");
      setDescription("");
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = roleToEdit ? `/api/roles/${roleToEdit.id}` : "/api/roles";
    const method = roleToEdit ? "PUT" : "POST";
    
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, label, description }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchRoles();
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao salvar função");
      }
    } catch (e) {
      console.error(e);
      alert("Falha ao salvar função");
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      const res = await fetch(`/api/roles/${confirmDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        setConfirmDelete(null);
        fetchRoles();
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao excluir");
      }
    } catch (e) {
      alert("Falha ao excluir função");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-bold">Funções (Roles)</h2>
          <p className="text-sm text-muted-foreground">Crie e gerencie os papéis de acesso do sistema.</p>
        </div>
        <Button size="sm" onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-4 w-4" /> Nova Função
        </Button>
      </div>

      <div className="border rounded-2xl overflow-hidden bg-card">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
            <tr>
              <th className="px-6 py-3">Nome (Código)</th>
              <th className="px-6 py-3">Label</th>
              <th className="px-6 py-3">Descrição</th>
              <th className="px-6 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {roles.map(r => (
              <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4 font-mono font-semibold text-primary">{r.name}</td>
                <td className="px-6 py-4 font-semibold">{r.label}</td>
                <td className="px-6 py-4 text-muted-foreground">{r.description || "-"}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal(r)}>
                      <PencilSimple className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    {["ADMIN", "TI", "SOLICITANTE"].includes(r.name) ? null : (
                      <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(r)}>
                        <Trash className="h-4 w-4 text-danger" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{roleToEdit ? "Editar Função" : "Nova Função"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Nome (Código Único)</label>
              <Input required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: GESTAO" disabled={Boolean(roleToEdit && ["ADMIN", "TI", "SOLICITANTE"].includes(roleToEdit.name))} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Label de Exibição</label>
              <Input required value={label} onChange={e => setLabel(e.target.value)} placeholder="Ex: Equipe de Gestão" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Descrição (Opcional)</label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Acesso de visualização para gestores" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title="Excluir Função?"
        description="Tem certeza que deseja excluir esta função permanentemente?"
        confirmLabel="Sim, Excluir"
        cancelLabel="Cancelar"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
}
