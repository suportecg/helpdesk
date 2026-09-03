"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, Column } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, type Variants } from "framer-motion";
import {
  UserPlus,
  MagnifyingGlass,
  DotsThree,
  PencilSimple,
  UserCircleCheck,
  UserMinus,
  Trash,
  ArrowsClockwise,
  Eye,
} from "@phosphor-icons/react";
import { RequesterModal, RequesterRow } from "./RequesterModal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { RequesterHistoryModal } from "../tickets/RequesterHistoryModal";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  show: { 
    opacity: 1, 
    y: 0, 
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 100, damping: 20 } 
  }
};

export function RequestersManagementClient() {
  const [requesters, setRequesters] = useState<RequesterRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros, pesquisa e paginação
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Controle de Modais
  const [isRequesterModalOpen, setIsRequesterModalOpen] = useState(false);
  const [requesterToEdit, setRequesterToEdit] = useState<RequesterRow | null>(null);

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyRequesterId, setHistoryRequesterId] = useState<string | null>(null);
  const [historyRequesterName, setHistoryRequesterName] = useState<string | null>(null);

  const [confirmDeleteRequester, setConfirmDeleteRequester] = useState<RequesterRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchRequesters = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
        sortBy: "name",
        sortOrder: "asc",
      });
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/requesters?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRequesters(data.requesters || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalRecords(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Erro ao buscar solicitantes:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchRequesters();
  }, [fetchRequesters]);

  // Ações rápidas
  const handleToggleStatus = async (u: RequesterRow) => {
    try {
      const res = await fetch(`/api/requesters/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !u.isActive }),
      });
      if (!res.ok) throw new Error("Erro ao alterar status");
      fetchRequesters();
    } catch (err: any) {
      alert(err.message || "Erro ao alterar status");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteRequester) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/requesters/${confirmDeleteRequester.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erro ao excluir solicitante");
      setConfirmDeleteRequester(null);
      fetchRequesters();
    } catch (err: any) {
      alert(err.message || "Erro ao excluir solicitante");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<RequesterRow>[] = [
    {
      key: "name",
      label: "Solicitante",
      render: (u) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-900 dark:text-slate-100">{u.name}</span>
          <span className="text-xs text-slate-500">{u.email}</span>
        </div>
      ),
    },
    {
      key: "company",
      label: "Empresa / Setor",
      render: (u) => (
        <span className="text-sm">
          {u.company || u.department ? (
            <span>
              {u.company}
              {u.company && u.department ? " / " : ""}
              {u.department}
            </span>
          ) : (
            <span className="text-slate-400 italic">Não vinculado</span>
          )}
        </span>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      render: (u) => (
        <Badge
          variant="outline"
          className={
            u.isActive
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-red-50 text-red-700 border-red-200"
          }
        >
          {u.isActive ? "Ativo" : "Inativo"}
        </Badge>
      ),
    },
    {
      key: "id",
      label: "",
      render: (u) => (
        <div className="flex justify-end items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary hover:bg-primary/10"
            onClick={() => {
              setHistoryRequesterId(u.id);
              setHistoryRequesterName(u.name);
              setHistoryModalOpen(true);
            }}
            title="Ver Histórico de Chamados"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <DotsThree className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setRequesterToEdit(u);
                  setIsRequesterModalOpen(true);
                }}
              >
                <PencilSimple className="mr-2 h-4 w-4" /> Editar Cadastro
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleToggleStatus(u)}>
                {u.isActive ? (
                  <>
                    <UserMinus className="mr-2 h-4 w-4 text-amber-600" />
                    <span className="text-amber-600">Desativar Acesso</span>
                  </>
                ) : (
                  <>
                    <UserCircleCheck className="mr-2 h-4 w-4 text-emerald-600" />
                    <span className="text-emerald-600">Reativar Acesso</span>
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setConfirmDeleteRequester(u)}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <Trash className="mr-2 h-4 w-4" /> Excluir Solicitante
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <PageHeader
          title="Solicitantes"
          breadcrumb={["Início", "Solicitantes"]}
          description="Gestão de contatos autorizados a solicitar suporte técnico."
        >
          <Button
            onClick={() => {
              setRequesterToEdit(null);
              setIsRequesterModalOpen(true);
            }}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Novo Solicitante
          </Button>
        </PageHeader>
      </motion.div>

      <div className="mt-6">
        <motion.div variants={itemVariants} className="glass-card rounded-[2rem] p-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-foreground">Lista de Solicitantes</h2>
            <p className="text-sm text-muted-foreground">Usuários externos autorizados a abrir chamados.</p>
          </div>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, e-mail ou setor..."
                className="pl-9 h-10 bg-background/50 border-border/80 focus-visible:ring-1 focus-visible:ring-primary/30 transition-all rounded-lg"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-primary/20"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">Todos os Status</option>
                <option value="ACTIVE">Ativos</option>
                <option value="INACTIVE">Inativos</option>
              </select>
              <Button variant="outline" size="icon" onClick={() => fetchRequesters()}>
                <ArrowsClockwise className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={requesters}
            isLoading={loading}
            emptyTitle="Nenhum solicitante encontrado"
            emptyDescription="Tente ajustar os filtros ou adicione um novo solicitante."
          />

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4 mt-4">
              <span className="text-sm text-slate-500">
                Mostrando página {page} de {totalPages} ({totalRecords} registros)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <RequesterModal
        isOpen={isRequesterModalOpen}
        onClose={() => setIsRequesterModalOpen(false)}
        onSuccess={fetchRequesters}
        requesterToEdit={requesterToEdit}
      />

      <ConfirmDialog
        open={!!confirmDeleteRequester}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteRequester(null);
        }}
        title="Excluir Solicitante"
        description={`Tem certeza que deseja excluir o solicitante ${confirmDeleteRequester?.name}? Esta ação o impedirá de abrir novos chamados no sistema.`}
        confirmLabel="Sim, Excluir"
        cancelLabel="Cancelar"
        onConfirm={handleDeleteConfirm}
        isConfirming={isDeleting}
        variant="destructive"
      />

      <RequesterHistoryModal
        open={historyModalOpen}
        onOpenChange={setHistoryModalOpen}
        requesterId={historyRequesterId}
        requesterName={historyRequesterName}
      />
    </motion.div>
  );
}

