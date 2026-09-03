"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DataTable, Column } from "@/components/common/DataTable";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { motion, type Variants } from "framer-motion";
import {
  Plus,
  MagnifyingGlass,
  DotsThree,
  PencilSimple,
  UserCircleCheck,
  CheckCircle,
  Archive,
  Trash,
  Copy,
  Clock,
  WarningCircle,
  FileText,
  Faders,
  ArrowsDownUp,
  X,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import { TicketModal } from "./TicketModal";
import { AssignTechnicianModal, ChangeStatusModal } from "./QuickActionModals";
import { useAuth } from "@/providers/auth-provider";
import { toast } from "sonner";
import { MonthYearSelector, getCurrentMonthYear } from "@/components/common/MonthYearSelector";
import { ManagerialDashboard } from "@/components/reports/ManagerialDashboard";
import { CsvImportWizard } from "../import/CsvImportWizard";

export interface TicketRow {
  id: string;
  ticketNumber: number;
  ticketMonthYear?: string;
  problem: string;
  description: string | null;
  status: string;
  origin: string;
  priority: string;
  ticketDate: string;
  dueDate: string | null;
  startTime: string | null;
  endTime: string | null;
  totalTimeMinutes: number | null;
  isArchived: boolean;
  requester: { id: string; name: string; email: string; department?: string | null };
  sector: { id: string; name: string };
  technician?: { id: string; name: string; email: string; avatar?: string | null } | null;
  service: { id: string; name: string; category?: string | null };
  hasUnreadReply?: boolean;
  _count?: { comments: number; history: number };
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

export interface TicketsManagementClientProps {
  initialTickets?: TicketRow[];
  initialTotal?: number;
  initialPage?: number;
  initialLimit?: number;
  isArchived?: boolean;
}

export default function TicketsManagementClient({
  initialTickets,
  initialTotal,
  initialPage,
  initialLimit,
  isArchived: defaultIsArchived = false,
}: TicketsManagementClientProps) {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query") || "";
  
  const [tickets, setTickets] = useState<TicketRow[]>(initialTickets || []);
  const [loading, setLoading] = useState(true);

  const [sectors, setSectors] = useState<Array<{ id: string; name: string }>>([]);
  const [services, setServices] = useState<Array<{ id: string; name: string; category?: string | null }>>([]);
  const [technicians, setTechnicians] = useState<Array<{ id: string; name: string; email: string }>>([]);

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sectorFilter, setSectorFilter] = useState<string>("ALL");
  const [serviceFilter, setServiceFilter] = useState<string>("ALL");
  const [technicianFilter, setTechnicianFilter] = useState<string>("ALL");
  const [originFilter, setOriginFilter] = useState<string>("ALL");
  const [isArchived, setIsArchived] = useState(defaultIsArchived);
  const [monthYear, setMonthYear] = useState<string>(getCurrentMonthYear());
  const [sortBy, setSortBy] = useState<"ticketDate" | "totalTimeMinutes" | "requester" | "service">("ticketDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [page, setPage] = useState(initialPage || 1);
  const [limit, setLimit] = useState(initialLimit || 10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(initialTotal || 0);
  const [openCount, setOpenCount] = useState(0);
  const [resolvedCount, setResolvedCount] = useState(0);
  const [waitingCount, setWaitingCount] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketModalInitialStatus, setTicketModalInitialStatus] = useState<string | undefined>(undefined);

  const [assignTechModalOpen, setAssignTechModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState<TicketRow | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<TicketRow | null>(null);
  const [confirmArchive, setConfirmArchive] = useState<TicketRow | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const [managerialDashboardOpen, setManagerialDashboardOpen] = useState(false);
  const [managerialDashboardTickets, setManagerialDashboardTickets] = useState<TicketRow[]>([]);

  const loadAuxiliaryData = useCallback(async () => {
    try {
      const [secRes, srvRes, techRes] = await Promise.all([
        fetch("/api/sectors"),
        fetch("/api/services"),
        fetch("/api/users?role=ADMIN_OR_TI&limit=100"),
      ]);

      if (secRes.ok) {
        const data = await secRes.json();
        setSectors(data || []);
      }
      if (srvRes.ok) {
        const data = await srvRes.json();
        setServices(data || []);
      }
      if (techRes.ok) {
        const data = await techRes.json();
        const tiUsers = (Array.isArray(data) ? data : data.users || data.data || []).map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
        }));
        setTechnicians(tiUsers);
      }
    } catch (err) {
      console.error("Erro ao carregar dados auxiliares de chamados:", err);
    }
  }, []);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      if (debouncedQuery.trim()) params.set("query", debouncedQuery.trim());
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (sectorFilter !== "ALL") params.set("sectorId", sectorFilter);
      if (serviceFilter !== "ALL") params.set("serviceId", serviceFilter);
      if (technicianFilter !== "ALL") params.set("technicianId", technicianFilter);
      if (originFilter !== "ALL") params.set("origin", originFilter);
      params.set("isArchived", String(isArchived));
      if (monthYear) params.set("monthYear", monthYear);

      const res = await fetch(`/api/tickets?${params.toString()}`);
      if (res.ok) {
        const body = await res.json();
        setTickets(body.data || []);
        setTotalPages(body.meta?.totalPages || 1);
        setTotalItems(body.meta?.total || 0);
        setOpenCount(body.meta?.openCount || 0);
        setResolvedCount(body.meta?.resolvedCount || 0);
        setWaitingCount(body.meta?.waitingCount || 0);
      }
    } catch (err) {
      console.error("Erro ao buscar chamados:", err);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    limit,
    sortBy,
    sortOrder,
    debouncedQuery,
    statusFilter,
    sectorFilter,
    serviceFilter,
    technicianFilter,
    originFilter,
    isArchived,
    monthYear,
  ]);

  useEffect(() => {
    loadAuxiliaryData();
  }, [loadAuxiliaryData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  function formatTimeBadge(minutes: number | null): string {
    if (minutes === null || minutes === undefined || minutes < 0) return "Em and.";
    if (minutes === 0) return "< 1 min";
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (m === 0) return `${h} h`;
    return `${h} h ${m} min`;
  }

  function renderStatusBadge(status: string) {
    switch (status) {
      case "ABERTO":
        return (
          <Badge className="bg-transparent text-amber-500 border-amber-500/20 hover:bg-amber-500/10 text-[11px] px-2 py-0.5 font-medium shadow-none">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse" /> Aberto
          </Badge>
        );
      case "EM_ATENDIMENTO":
        return (
          <Badge className="bg-transparent text-indigo-500 border-indigo-500/20 hover:bg-indigo-500/10 text-[11px] px-2 py-0.5 font-medium shadow-none">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5 animate-pulse" /> Em Atendimento
          </Badge>
        );
      case "RESOLVIDO":
        return (
          <Badge className="bg-transparent text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10 text-[11px] px-2 py-0.5 font-medium shadow-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" /> Resolvido
          </Badge>
        );
      case "AGUARDANDO_USUARIO":
        return (
          <Badge className="bg-transparent text-blue-500 border-blue-500/20 hover:bg-blue-500/10 text-[11px] px-2 py-0.5 font-medium shadow-none">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5" /> Aguardando Cliente
          </Badge>
        );
      case "AGUARDANDO_PECA":
        return (
          <Badge className="bg-transparent text-purple-500 border-purple-500/20 hover:bg-purple-500/10 text-[11px] px-2 py-0.5 font-medium shadow-none">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-1.5" /> Aguardando Peça
          </Badge>
        );
      case "CANCELADO":
        return (
          <Badge className="bg-transparent text-zinc-500 border-zinc-500/20 hover:bg-zinc-500/10 text-[11px] px-2 py-0.5 font-medium shadow-none">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 mr-1.5" /> Cancelado
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-[11px] shadow-none">{status}</Badge>;
    }
  }

  async function handleSaveTechnician(technicianId: string | null) {
    if (!activeTicket) return;
    try {
      const res = await fetch(`/api/tickets/${activeTicket.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technicianId }),
      });
      if (!res.ok) throw new Error("Erro ao atribuir técnico");
      toast.success("Técnico atribuído com sucesso!");
      fetchTickets();
    } catch (err: any) {
      toast.error(err.message || "Erro ao atribuir técnico");
    }
  }

  async function handleSaveStatus(newStatus: string) {
    if (!activeTicket) return;

    try {
      const res = await fetch(`/api/tickets/${activeTicket.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Erro ao alterar status");
      toast.success("Status atualizado com sucesso!");
      fetchTickets();
    } catch (err: any) {
      toast.error(err.message || "Erro ao alterar status");
    }
  }

  async function handleArchiveConfirm() {
    if (!confirmArchive) return;
    try {
      const res = await fetch(`/api/tickets/${confirmArchive.id}/archive`, {
        method: "PUT",
      });
      if (!res.ok) throw new Error("Erro ao arquivar chamado");
      toast.success(confirmArchive.isArchived ? "Chamado restaurado!" : "Chamado arquivado!");
      setConfirmArchive(null);
      fetchTickets();
    } catch (err: any) {
      toast.error(err.message || "Erro ao arquivar chamado");
    }
  }

  async function handleDeleteConfirm() {
    if (!confirmDelete) return;
    try {
      const res = await fetch(`/api/tickets/${confirmDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erro ao excluir chamado");
      toast.success("Chamado excluído com sucesso!");
      setConfirmDelete(null);
      fetchTickets();
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir chamado");
    }
  }

  async function openManagerialDashboard() {
    setExportingPdf(true);
    try {
      const params = new URLSearchParams({
        query: debouncedQuery, status: statusFilter, sectorId: sectorFilter, serviceId: serviceFilter, technicianId: technicianFilter, origin: originFilter, isArchived: String(isArchived), monthYear: monthYear || "", format: "json"
      });
      const res = await fetch(`/api/tickets/export?${params.toString()}`);
      if (!res.ok) throw new Error("Erro ao buscar dados");
      const data: TicketRow[] = await res.json();
      
      setManagerialDashboardTickets(data);
      setManagerialDashboardOpen(true);
    } catch (error) {
      console.error("Erro ao buscar dados para o relatório:", error);
      toast.error("Erro ao buscar dados para o relatório.");
    } finally {
      setExportingPdf(false);
    }
  }

  const columns: Column<TicketRow>[] = [
    {
      label: "TICKET",
      key: "ticketNumber",
      className: "w-20 text-center font-mono",
      render: (item) => (
        <div className="flex flex-col items-center justify-center relative w-fit mx-auto">
          {item.hasUnreadReply && (
            <span className="absolute -top-1 -right-2.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-danger" title="Nova resposta do cliente"></span>
            </span>
          )}
          <span className="font-mono text-sm text-foreground/80 font-semibold tracking-wide">
            #{item.ticketNumber}
          </span>
        </div>
      ),
    },
    {
      label: "Solicitante & Setor",
      key: "requester",
      className: "w-48",
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground text-xs truncate">
            {item.requester?.name}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Badge variant="outline" className="text-[10px] px-1 py-0 font-mono">
              {item.sector?.name}
            </Badge>
            {item.requester?.department && (
              <span className="text-[10px] text-muted-foreground truncate">
                {item.requester.department}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      label: "Serviço & Problema",
      key: "problem",
      className: "w-auto px-4",
      render: (item) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-primary truncate">
              [{item.service?.name}]
            </span>
          </div>
          <span className="text-xs font-medium text-foreground truncate mt-0.5">
            {item.problem}
          </span>
          {item.description && (
            <span className="text-[10px] text-muted-foreground truncate">
              {item.description}
            </span>
          )}
        </div>
      ),
    },
    {
      label: "Técnico Responsável",
      key: "technician",
      className: "w-40",
      render: (item) => (
        <div className="flex items-center gap-2">
          {item.technician ? (
            <>
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                {item.technician.name.substring(0, 2).toUpperCase()}
              </div>
              <span className="text-xs font-medium truncate">{item.technician.name}</span>
            </>
          ) : (
            <Badge variant="outline" className="text-[10px] text-muted-foreground border-dashed">
              Fila Geral
            </Badge>
          )}
        </div>
      ),
    },
    {
      label: "Tempo Total",
      key: "totalTimeMinutes",
      className: "w-24 text-center font-mono",
      render: (item) => {
        let slaColor = "text-muted-foreground";
        let slaText = "";
        if (item.dueDate && item.status !== "RESOLVIDO" && item.status !== "CANCELADO") {
           const due = new Date(item.dueDate).getTime();
           const now = Date.now();
           if (now > due) {
              slaColor = "text-red-500 font-bold";
              slaText = " (Atrasado)";
           } else if (due - now < 3600000) {
              slaColor = "text-amber-500 font-bold";
              slaText = " (Critico)";
           } else {
              slaColor = "text-emerald-500 font-medium";
              slaText = " (No Prazo)";
           }
        }
        return (
          <div className="flex flex-col items-center justify-center">
            <span className="inline-flex items-center gap-1 text-[11px] font-mono px-1.5 py-0.5 text-muted-foreground">
              <Clock className="w-3 h-3 opacity-50" />
              {formatTimeBadge(item.totalTimeMinutes)}
            </span>
            {item.dueDate && item.status !== "RESOLVIDO" && item.status !== "CANCELADO" && (
              <span className={`text-[9px] ${slaColor}`}>
                {new Date(item.dueDate).toLocaleDateString("pt-BR")} às {new Date(item.dueDate).toLocaleTimeString("pt-BR", {hour: '2-digit', minute:'2-digit'})} {slaText}
              </span>
            )}
          </div>
        );
      },
    },
    {
      label: "Status",
      key: "status",
      className: "w-32 text-center",
      render: (item) => renderStatusBadge(item.status),
    },
    {
      label: "Origem",
      key: "origin",
      className: "w-20 text-center",
      render: (item) => (
        <Badge variant="outline" className="text-[10px] font-mono">
          {item.origin}
        </Badge>
      ),
    },
    {
      label: "Ações",
      key: "id",
      className: "w-40 text-right pr-4",
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          {!item.technician && user?.id && (
            <Button
              variant="outline"
              size="sm"
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  const res = await fetch(`/api/tickets/${item.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ technicianId: user.id, status: "EM_ATENDIMENTO" }),
                  });
                  if (!res.ok) throw new Error("Erro");
                  toast.success("Chamado atribuído a você! Atualize as informações se necessário.");
                  fetchTickets();
                  setSelectedTicketId(item.id);
                  setTimeout(() => {
                    setModalOpen(true);
                  }, 300);
                } catch {
                  toast.error("Falha ao assumir chamado.");
                }
              }}
              className="h-8 px-2 text-xs border-primary text-primary hover:bg-primary/10 gap-1.5 rounded-full"
              title="Assumir Chamado"
            >
              <UserCircleCheck weight="bold" className="w-3.5 h-3.5" />
              Assumir
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTicketId(item.id);
              setModalOpen(true);
            }}
            title="Visualizar/Editar"
          >
            <MagnifyingGlass className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-warning hover:text-warning hover:bg-warning/10 rounded-full transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setActiveTicket(item);
              setStatusModalOpen(true);
            }}
            title="Alterar Status"
          >
            <PencilSimple className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-danger hover:text-danger hover:bg-danger/10 rounded-full transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDelete(item);
            }}
            title="Excluir"
          >
            <X className="h-4 w-4" />
          </Button>
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
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-foreground flex items-center gap-2">
            Chamados
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestão inteligente de tickets e SLA.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setImportModalOpen(true)} className="text-xs">
            <ArrowsDownUp className="w-3.5 h-3.5 mr-1.5" />
            Importar Excel
          </Button>
          <Button variant="outline" size="sm" onClick={openManagerialDashboard} disabled={exportingPdf} className="text-xs text-emerald-600">
            {exportingPdf ? <ArrowsClockwise className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <FileText className="w-3.5 h-3.5 mr-1.5" />}
            Relatório
          </Button>
          <Button
            variant={isArchived ? "secondary" : "outline"}
            size="sm"
            onClick={() => {
              setIsArchived(!isArchived);
              setPage(1);
            }}
            className="text-xs"
          >
            <Archive className="w-3.5 h-3.5 mr-1.5" />
            {isArchived ? "Exibindo Arquivados" : "Ver Arquivados"}
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setSelectedTicketId(null);
              setModalOpen(true);
            }}
            className="text-xs shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Novo Chamado
          </Button>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => { setStatusFilter("ALL"); setPage(1); }}
          className={`glass-card rounded-[2rem] p-6 h-full relative overflow-hidden group hover-lift cursor-pointer transition-all ${statusFilter === "ALL" ? "ring-2 ring-primary shadow-lg" : ""}`}
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
            <FileText weight="duotone" className="w-24 h-24 text-foreground" />
          </div>
          <div className="flex items-center gap-3 mb-2 relative z-10">
            <div className="p-3 bg-secondary rounded-2xl">
              <FileText weight="bold" className="w-5 h-5 text-foreground" />
            </div>
            <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Total Listado</span>
          </div>
          <div className="text-4xl font-display font-bold text-foreground mt-4 relative z-10">
            {loading ? <Skeleton className="h-10 w-16" /> : totalItems}
          </div>
        </div>

        <div 
          onClick={() => { setStatusFilter("ABERTO"); setPage(1); }}
          className={`glass-card rounded-[2rem] p-6 h-full relative overflow-hidden group hover-lift cursor-pointer transition-all ${statusFilter === "ABERTO" ? "ring-2 ring-warning shadow-lg" : ""}`}
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
            <Clock weight="duotone" className="w-24 h-24 text-warning" />
          </div>
          <div className="flex items-center gap-3 mb-2 relative z-10">
            <div className="p-3 bg-warning/10 rounded-2xl">
              <Clock weight="bold" className="w-5 h-5 text-warning" />
            </div>
            <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Em Aberto</span>
          </div>
          <div className="text-4xl font-display font-bold text-foreground mt-4 relative z-10">
            {loading ? <Skeleton className="h-10 w-16" /> : openCount}
          </div>
        </div>

        <div 
          onClick={() => { setStatusFilter("RESOLVIDO"); setPage(1); }}
          className={`glass-card rounded-[2rem] p-6 h-full relative overflow-hidden group hover-lift cursor-pointer transition-all ${statusFilter === "RESOLVIDO" ? "ring-2 ring-success shadow-lg" : ""}`}
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
            <CheckCircle weight="duotone" className="w-24 h-24 text-success" />
          </div>
          <div className="flex items-center gap-3 mb-2 relative z-10">
            <div className="p-3 bg-success/10 rounded-2xl">
              <CheckCircle weight="bold" className="w-5 h-5 text-success" />
            </div>
            <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Resolvidos</span>
          </div>
          <div className="text-4xl font-display font-bold text-foreground mt-4 relative z-10">
            {loading ? <Skeleton className="h-10 w-16" /> : resolvedCount}
          </div>
        </div>

        <div 
          onClick={() => { setStatusFilter("AGUARDANDO_USUARIO"); setPage(1); }}
          className={`glass-card rounded-[2rem] p-6 h-full relative overflow-hidden group hover-lift cursor-pointer transition-all ${statusFilter === "AGUARDANDO_USUARIO" ? "ring-2 ring-blue-500 shadow-lg" : ""}`}
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
            <WarningCircle weight="duotone" className="w-24 h-24 text-blue-500" />
          </div>
          <div className="flex items-center gap-3 mb-2 relative z-10">
            <div className="p-3 bg-blue-500/10 rounded-2xl">
              <WarningCircle weight="bold" className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Aguardando</span>
          </div>
          <div className="text-4xl font-display font-bold text-foreground mt-4 relative z-10">
            {loading ? <Skeleton className="h-10 w-16" /> : waitingCount}
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="relative z-50 glass-card rounded-[2rem] p-6 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-[350px]">
            <MagnifyingGlass className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Pesquisar número, solicitante, problema..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-10 bg-background/50 border-border/80 focus-visible:ring-1 focus-visible:ring-primary/30 transition-all rounded-lg"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Período:</span>
            <div className="min-w-[140px]">
              <MonthYearSelector
                value={monthYear || "ALL"}
                onChange={(my) => {
                  setMonthYear(my === "ALL" ? "" : my);
                  setPage(1);
                }}
                includeAllYear={true}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-border/50 pt-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Faders className="w-4 h-4" />
            Filtros:
          </div>
          
          <select
            className="h-8 px-3 text-xs rounded-md border border-border bg-background focus:ring-1 focus:ring-primary/30 outline-none text-foreground transition-all cursor-pointer"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="ALL">Todos Status</option>
            <option value="ABERTO">Em Aberto</option>
            <option value="RESOLVIDO">Resolvido</option>
            <option value="AGUARDANDO_USUARIO">Aguardando</option>
            <option value="AGUARDANDO_PECA">Agendado</option>
          </select>

          <select
            className="h-8 px-3 text-xs rounded-md border border-border bg-background focus:ring-1 focus:ring-primary/30 outline-none text-foreground transition-all cursor-pointer"
            value={sectorFilter}
            onChange={(e) => { setSectorFilter(e.target.value); setPage(1); }}
          >
            <option value="ALL">Todos Setores</option>
            {sectors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <select
            className="h-8 px-3 text-xs rounded-md border border-border bg-background focus:ring-1 focus:ring-primary/30 outline-none text-foreground transition-all cursor-pointer"
            value={technicianFilter}
            onChange={(e) => { setTechnicianFilter(e.target.value); setPage(1); }}
          >
            <option value="ALL">Todos Técnicos</option>
            {technicians.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>

          <select
            className="h-8 px-3 text-xs rounded-md border border-border bg-background focus:ring-1 focus:ring-primary/30 outline-none text-foreground transition-all cursor-pointer ml-auto"
            value={`${sortBy}:${sortOrder}`}
            onChange={(e) => {
              const [b, o] = e.target.value.split(":") as [any, any];
              setSortBy(b); setSortOrder(o);
            }}
          >
            <option value="ticketDate:desc">Mais recentes</option>
            <option value="ticketDate:asc">Mais antigos</option>
            <option value="totalTimeMinutes:desc">Maior duração</option>
            <option value="totalTimeMinutes:asc">Menor duração</option>
            <option value="requester:asc">Solicitante (A-Z)</option>
          </select>
        </div>
      </motion.div>

      {/* Tabela de Chamados */}
      <motion.div variants={itemVariants} className="glass-card rounded-[2rem] p-2 overflow-hidden shadow-sm">
        <DataTable
          className="table-fixed"
          columns={columns}
          data={tickets}
          isLoading={loading}
          emptyTitle="Nenhum chamado encontrado"
          emptyDescription="Cadastre um novo chamado para substituir a planilha de TI ou limpe os filtros selecionados."
          onRowClick={async (item) => {
            setSelectedTicketId(item.id);
            setModalOpen(true);
            if (item.hasUnreadReply) {
              // Limpa otimisticamente
              setTickets(tickets.map(t => t.id === item.id ? { ...t, hasUnreadReply: false } : t));
              // API call para atualizar no banco
              try {
                await fetch(`/api/tickets/${item.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ hasUnreadReply: false })
                });
              } catch (e) {
                console.error("Erro ao limpar notificação de resposta:", e);
              }
            }
          }}
        />
        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 text-xs">
            <span className="text-muted-foreground">
              Página <strong className="text-foreground">{page}</strong> de{" "}
              <strong className="text-foreground">{totalPages}</strong> (Total:{" "}
              {totalItems} itens)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-xs h-7"
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="text-xs h-7"
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Modais do Módulo */}
      <TicketModal
        open={modalOpen}
        onOpenChange={(v) => {
          setModalOpen(v);
          if (!v) setTicketModalInitialStatus(undefined);
        }}
        ticketId={selectedTicketId}
        sectors={sectors}
        services={services}
        technicians={technicians}
        onSaved={fetchTickets}
        initialStatus={ticketModalInitialStatus}
      />

      <AssignTechnicianModal
        open={assignTechModalOpen}
        onOpenChange={setAssignTechModalOpen}
        ticketNumber={activeTicket?.ticketNumber}
        currentTechnicianId={activeTicket?.technician?.id}
        technicians={technicians}
        onSave={handleSaveTechnician}
      />

      <ChangeStatusModal
        open={statusModalOpen}
        onOpenChange={setStatusModalOpen}
        ticketNumber={activeTicket?.ticketNumber}
        currentStatus={activeTicket?.status || "ABERTO"}
        onSave={handleSaveStatus}
      />

      <ConfirmDialog
        open={Boolean(confirmArchive)}
        onOpenChange={(open) => !open && setConfirmArchive(null)}
        title={confirmArchive?.isArchived ? "Restaurar Chamado?" : "Arquivar Chamado?"}
        description={`Deseja realmente ${
          confirmArchive?.isArchived ? "restaurar" : "arquivar"
        } o chamado #${confirmArchive?.ticketNumber} (${confirmArchive?.problem})?`}
        confirmLabel={confirmArchive?.isArchived ? "Sim, Restaurar" : "Sim, Arquivar"}
        cancelLabel="Cancelar"
        onConfirm={handleArchiveConfirm}
      />

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title="Excluir Chamado (Soft Delete)?"
        description={`Deseja inativar logicamente o chamado #${confirmDelete?.ticketNumber}? O histórico de auditoria será mantido.`}
        confirmLabel="Sim, Excluir"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />

      <CsvImportWizard
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImported={() => {
          setImportModalOpen(false);
          fetchTickets();
        }}
      />
      {managerialDashboardOpen && (
        <ManagerialDashboard 
          tickets={managerialDashboardTickets} 
          onClose={() => setManagerialDashboardOpen(false)} 
        />
      )}
    </motion.div>
  );
}
