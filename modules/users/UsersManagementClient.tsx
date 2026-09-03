"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
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
  ShieldWarning,
  Key,
  UserCircleCheck,
  UserMinus,
  Trash,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import { UserModal } from "./UserModal";
import { UserPermissionsModal } from "./UserPermissionsModal";
import { UserPasswordModal } from "./UserPasswordModal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string | null;
  isActive: boolean;
  sector?: { id: string; name: string } | null;
  createdAt: string;
}

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

export function UsersManagementClient() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros, pesquisa e paginação
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Controle de Modais
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserRow | null>(null);

  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [permUser, setPermUser] = useState<UserRow | null>(null);

  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [passUser, setPassUser] = useState<UserRow | null>(null);

  const [confirmDeleteUser, setConfirmDeleteUser] = useState<UserRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      if (roleFilter !== "ALL") params.set("role", roleFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalRecords(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Erro ao buscar usuários:", err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, roleFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = () => {
    setUserToEdit(null);
    setIsUserModalOpen(true);
  };

  const handleEditUser = (u: UserRow) => {
    setUserToEdit(u);
    setIsUserModalOpen(true);
  };

  const handleOpenPermissions = (u: UserRow) => {
    setPermUser(u);
    setIsPermModalOpen(true);
  };

  const handleOpenPassword = (u: UserRow) => {
    setPassUser(u);
    setIsPassModalOpen(true);
  };

  const handleToggleStatus = async (u: UserRow) => {
    try {
      const res = await fetch(`/api/users/${u.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !u.isActive }),
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (e) {
      console.error("Erro ao alterar status do usuário:", e);
    }
  };

  const handleDeleteUser = async () => {
    if (!confirmDeleteUser) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/users/${confirmDeleteUser.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setConfirmDeleteUser(null);
        fetchUsers();
      }
    } catch (e) {
      console.error("Erro ao excluir usuário:", e);
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Badge className="bg-primary text-primary-foreground font-semibold">ADMIN</Badge>;
      case "TI":
        return <Badge className="bg-blue-600 text-white font-semibold">TI (Suporte)</Badge>;
      default:
        return <Badge variant="secondary">SOLICITANTE</Badge>;
    }
  };

  const columns: Column<UserRow>[] = [
    {
      key: "name",
      label: "Usuário / Técnico",
      render: (u) => (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground">{u.name}</span>
          <span className="text-xs text-muted-foreground">{u.email}</span>
        </div>
      ),
    },
    {
      key: "role",
      label: "Papel (Role)",
      render: (u) => getRoleBadge(u.role),
    },
    {
      key: "department",
      label: "Setor / Cargo",
      render: (u) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">
            {u.sector?.name || u.department || "Não informado"}
          </span>
          {u.sector && u.department && (
            <span className="text-xs text-muted-foreground">{u.department}</span>
          )}
        </div>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      render: (u) =>
        u.isActive ? (
          <Badge variant="outline" className="border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40">
            Ativo
          </Badge>
        ) : (
          <Badge variant="outline" className="border-red-500 text-red-600 bg-red-50 dark:bg-red-950/40">
            Inativo
          </Badge>
        ),
    },
    {
      key: "id",
      label: "Ações",
      render: (u) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <DotsThree className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Ações Administrativas</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleEditUser(u)}>
              <PencilSimple className="mr-2 h-4 w-4" />
              Editar Dados
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleOpenPermissions(u)}>
              <ShieldWarning className="mr-2 h-4 w-4 text-amber-500" />
              Permissões Individuais
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleOpenPassword(u)}>
              <Key className="mr-2 h-4 w-4 text-blue-500" />
              Alterar Senha
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleToggleStatus(u)}>
              {u.isActive ? (
                <>
                  <UserMinus className="mr-2 h-4 w-4 text-orange-500" />
                  Desativar Acesso
                </>
              ) : (
                <>
                  <UserCircleCheck className="mr-2 h-4 w-4 text-emerald-500" />
                  Reativar Acesso
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => setConfirmDeleteUser(u)}
            >
              <Trash className="mr-2 h-4 w-4" />
              Excluir Usuário
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
          title="Gestão de Usuários"
          breadcrumb={["Início", "Usuários"]}
          description="Administração de técnicos, administradores, permissões RBAC e controle de acesso corporativo da CG Construções."
        >
          <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading} suppressHydrationWarning>
            <ArrowsClockwise className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button size="sm" onClick={handleCreateUser}>
            <UserPlus className="h-4 w-4 mr-1.5" />
            Novo Usuário
          </Button>
        </PageHeader>
      </motion.div>

      <div className="mt-6 space-y-4">
        {/* Barra de Filtros */}
        <motion.div variants={itemVariants} className="flex flex-col gap-3 glass-card rounded-[2rem] p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <MagnifyingGlass className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por nome, e-mail ou setor..."
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">Todos os Papéis</option>
              <option value="ADMIN">ADMIN (Administradores)</option>
              <option value="TI">TI (Equipe Suporte)</option>
              <option value="SOLICITANTE">Solicitantes</option>
            </select>

            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">Todos os Status</option>
              <option value="ACTIVE">Apenas Ativos</option>
              <option value="INACTIVE">Inativos</option>
            </select>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card rounded-[2rem] p-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-foreground">Lista de Usuários e Técnicos ({totalRecords})</h2>
            <p className="text-sm text-muted-foreground">Controle granular com sobreposição de permissões individuais por usuário.</p>
          </div>
          <DataTable
            columns={columns}
            data={users}
            isLoading={loading}
            emptyTitle="Nenhum usuário encontrado"
            emptyDescription="Tente ajustar os filtros ou cadastrar um novo usuário no botão superior."
          />

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-sm">
              <span className="text-muted-foreground">
                Página {page} de {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Modais */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSuccess={fetchUsers}
        userToEdit={userToEdit}
      />

      <UserPermissionsModal
        isOpen={isPermModalOpen}
        onClose={() => setIsPermModalOpen(false)}
        userId={permUser?.id || null}
        userName={permUser?.name || ""}
        userRole={permUser?.role || "SOLICITANTE"}
        onSuccess={fetchUsers}
      />

      <UserPasswordModal
        isOpen={isPassModalOpen}
        onClose={() => setIsPassModalOpen(false)}
        userId={passUser?.id || null}
        userName={passUser?.name || ""}
      />

      <ConfirmDialog
        open={Boolean(confirmDeleteUser)}
        onOpenChange={(open) => !open && setConfirmDeleteUser(null)}
        title="Excluir Usuário (Soft Delete)?"
        description={`Tem certeza que deseja inativar o usuário ${confirmDeleteUser?.name}? Esta ação gera registro de auditoria.`}
        confirmLabel="Sim, Excluir"
        cancelLabel="Cancelar"
        onConfirm={handleDeleteUser}
        variant="destructive"
      />
    </motion.div>
  );
}
