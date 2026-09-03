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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, type Variants } from "framer-motion";
import { Plus, MagnifyingGlass, DotsThree, PencilSimple, Trash, Clock } from "@phosphor-icons/react";
import { ServiceModal } from "./ServiceModal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

export interface ServiceRow {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  slaHours: number | null;
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

export function ServicesManagementClient() {
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [filteredServices, setFilteredServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState<ServiceRow | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<ServiceRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/services");
      if (res.ok) {
        const data = await res.json();
        setServices(data);
        setFilteredServices(data);
      }
    } catch (err) {
      console.error("Erro ao buscar serviços:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredServices(services);
    } else {
      const term = search.toLowerCase();
      setFilteredServices(
        services.filter((s) => s.name.toLowerCase().includes(term) || s.category?.toLowerCase().includes(term))
      );
    }
  }, [search, services]);

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/services/${confirmDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erro ao excluir serviço");
      setConfirmDelete(null);
      fetchServices();
    } catch (err: any) {
      alert(err.message || "Erro ao excluir serviço");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<ServiceRow>[] = [
    {
      key: "name",
      label: "Nome do Serviço",
      render: (s) => <span className="font-medium">{s.name}</span>,
    },
    {
      key: "category",
      label: "Categoria",
      render: (s) => (
        <Badge variant="secondary" className="bg-slate-100 text-slate-700">
          {s.category || "Geral"}
        </Badge>
      ),
    },
    {
      key: "slaHours",
      label: "SLA",
      render: (s) => (
        <div className="flex items-center text-slate-600">
          <Clock className="h-3 w-3 mr-1" />
          <span className="text-sm">
            {s.slaHours ? `${s.slaHours}h` : <span className="italic">Sem SLA</span>}
          </span>
        </div>
      ),
    },
    {
      key: "id",
      label: "",
      render: (s) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <DotsThree className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setServiceToEdit(s);
                  setIsModalOpen(true);
                }}
              >
                <PencilSimple className="mr-2 h-4 w-4" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setConfirmDelete(s)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash className="mr-2 h-4 w-4" /> Excluir
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
          title="Catálogo de Serviços"
          breadcrumb={["Início", "Serviços"]}
          description="Tipos de atendimento, requisições e SLA predefinidos."
        >
          <Button
            onClick={() => {
              setServiceToEdit(null);
              setIsModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Serviço
          </Button>
        </PageHeader>
      </motion.div>

      <div className="mt-6">
        <motion.div variants={itemVariants} className="glass-card rounded-[2rem] p-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-foreground">Lista de Serviços</h2>
            <p className="text-sm text-muted-foreground">Catálogo de serviços e SLAs associados.</p>
          </div>
          <div className="flex mb-6">
            <div className="relative w-full max-w-sm">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar serviços ou categorias..."
                className="pl-9 h-10 bg-background/50 border-border/80 focus-visible:ring-1 focus-visible:ring-primary/30 transition-all rounded-lg"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredServices}
            isLoading={loading}
            emptyTitle="Nenhum serviço encontrado"
            emptyDescription="Crie o seu primeiro serviço no catálogo clicando no botão acima."
          />
        </motion.div>
      </div>

      <ServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchServices}
        serviceToEdit={serviceToEdit}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(open) => {
          if (!open) setConfirmDelete(null);
        }}
        title="Excluir Serviço"
        description={`Tem certeza que deseja excluir o serviço ${confirmDelete?.name}? Os chamados antigos continuarão vinculados a ele.`}
        confirmLabel="Sim, Excluir"
        cancelLabel="Cancelar"
        onConfirm={handleDeleteConfirm}
        isConfirming={isDeleting}
        variant="destructive"
      />
    </motion.div>
  );
}
