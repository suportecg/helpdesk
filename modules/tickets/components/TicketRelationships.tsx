"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Link as LinkIcon, Plus, ArrowUpRight, GitMerge, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { TicketModal } from "../TicketModal";
import { Combobox } from "@/components/common/Combobox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function TicketRelationships({ 
  ticket,
  sectors,
  services,
  technicians,
  onRelationshipsUpdated
}: { 
  ticket?: any,
  sectors?: any[],
  services?: any[],
  technicians?: any[],
  onRelationshipsUpdated?: () => void
}) {
  const [expanded, setExpanded] = useState(true);
  
  // Create Child Modal state
  const [isCreateChildModalOpen, setIsCreateChildModalOpen] = useState(false);

  // Merge/Link Modal state
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [targetTicketStr, setTargetTicketStr] = useState("");
  const [mergeAction, setMergeAction] = useState<"LINK" | "MERGE_CANCEL">("LINK");
  const [isLinking, setIsLinking] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  React.useEffect(() => {
    if (!isMergeModalOpen) {
      setSearchQuery("");
      setSearchResults([]);
      return;
    }
    
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const queryParam = searchQuery ? `&query=${encodeURIComponent(searchQuery)}` : "";
        const res = await fetch(`/api/tickets?limit=50${queryParam}`);
        if (res.ok) {
          const body = await res.json();
          // Filter out the current ticket to avoid self-linking
          setSearchResults((body.data || []).filter((t: any) => t.id !== ticket?.id));
        }
      } catch (err) {}
      finally { setIsSearching(false); }
    }, 500);
    
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, isMergeModalOpen, ticket?.id]);

  if (!ticket) return null;

  const hasParent = !!ticket.parent;
  const hasChildren = ticket.children && ticket.children.length > 0;
  const totalRelationships = (hasParent ? 1 : 0) + (ticket.children?.length || 0);

  const handleLinkExisting = async () => {
    if (!targetTicketStr) return;
    setIsLinking(true);
    
    // Parse input (allow "#123" or just "123")
    const targetNumber = parseInt(targetTicketStr.replace(/\D/g, ""), 10);
    if (!targetNumber) {
      toast.error("Número de ticket inválido.");
      setIsLinking(false);
      return;
    }

    try {
      const res = await fetch(`/api/tickets/${ticket.id}/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          targetTicketNumber: targetNumber, 
          action: mergeAction 
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao vincular chamado.");
      }

      toast.success(mergeAction === "LINK" ? "Chamado vinculado com sucesso!" : "Chamado mesclado com sucesso!");
      setIsMergeModalOpen(false);
      if (onRelationshipsUpdated) onRelationshipsUpdated();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlink = async (targetNumber: number) => {
    if (!confirm(`Deseja realmente desvincular o chamado #${targetNumber}?`)) return;
    
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          targetTicketNumber: targetNumber, 
          action: "UNLINK" 
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao desvincular chamado.");
      }

      toast.success("Chamado desvinculado com sucesso!");
      if (onRelationshipsUpdated) onRelationshipsUpdated();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors rounded-xl"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <LinkIcon className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Relacionamentos</h3>
          <span className="text-xs text-muted-foreground ml-2">
            {totalRelationships === 0 ? "Nenhum ticket relacionado" : `${totalRelationships} ticket(s) relacionado(s)`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!hasParent && (
            <>
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={(e) => { e.stopPropagation(); setIsMergeModalOpen(true); }}>
                <GitMerge className="h-3 w-3 mr-1" />
                Vincular / Mesclar
              </Button>
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={(e) => { e.stopPropagation(); setIsCreateChildModalOpen(true); }}>
                <Plus className="h-3 w-3 mr-1" />
                Criar Filho
              </Button>
            </>
          )}
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>
      
      {expanded && (
        <div className="p-0 border-t flex flex-col">
          {totalRelationships === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Nenhum ticket vinculado. Use o botão acima para criar um chamado filho.
            </p>
          ) : (
            <div className="flex flex-col">
              {hasParent && (
                <div className="p-4 border-b last:border-0 bg-muted/20">
                  <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Chamado Pai</div>
                  <div className="flex items-center gap-2">
                    <Link href={`/chamados/${ticket.parent.id}`} className="flex-1 flex items-center justify-between hover:bg-muted/50 p-2 rounded-md transition-colors border bg-background group">
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">#{ticket.parent.ticketNumber} - {ticket.parent.problem}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] uppercase">{ticket.parent.status}</Badge>
                        </span>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => { e.stopPropagation(); handleUnlink(ticket.parent.ticketNumber); }}
                      title="Desvincular Chamado Pai"
                    >
                      <Unlink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              {hasChildren && (
                <div className="p-4 border-b last:border-0">
                  <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Chamados Filhos</div>
                  <div className="space-y-2">
                    {ticket.children.map((child: any) => {
                      const isMerged = child.status === "CANCELADO";
                      return (
                        <div key={child.id} className="flex items-center gap-2">
                          <Link href={`/chamados/${child.id}`} className="flex-1 flex items-center justify-between hover:bg-muted/50 p-2 rounded-md transition-colors border bg-background group">
                            <div className="flex flex-col">
                              <span className="font-semibold text-sm">
                                #{child.ticketNumber} - {child.problem}
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                                {isMerged ? (
                                  <Badge variant="secondary" className="text-[10px] uppercase bg-slate-200 dark:bg-slate-800 text-slate-500">Mesclado / Cancelado</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] uppercase">{child.status}</Badge>
                                )}
                              </span>
                            </div>
                            <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => { e.stopPropagation(); handleUnlink(child.ticketNumber); }}
                            title="Desvincular Chamado Filho"
                          >
                            <Unlink className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {isCreateChildModalOpen && (
        <TicketModal 
          open={isCreateChildModalOpen} 
          onOpenChange={setIsCreateChildModalOpen} 
          parentId={ticket.id}
          sectors={sectors || []}
          services={services || []}
          technicians={technicians || []}
          onSaved={() => {
            if (onRelationshipsUpdated) onRelationshipsUpdated();
          }}
        />
      )}

      {isMergeModalOpen && (
        <Dialog open={isMergeModalOpen} onOpenChange={setIsMergeModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Vincular ou Mesclar Chamado</DialogTitle>
              <DialogDescription>
                Selecione um chamado existente pelo seu número para criar o vínculo.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-semibold">
                  Nº do Chamado
                </label>
                <div className="col-span-3">
                  <Combobox
                    options={searchResults.map(t => ({
                       id: String(t.ticketNumber),
                       name: `#${t.ticketNumber} - ${t.problem}`,
                       subtitle: t.requester?.name,
                       badge: t.status
                    }))}
                    value={targetTicketStr}
                    onChange={(val) => setTargetTicketStr(val || "")}
                    onSearchChange={(q) => setSearchQuery(q)}
                    isLoading={isSearching}
                    placeholder="Selecione ou busque..."
                    searchPlaceholder="Buscar por número, problema..."
                    emptyText="Nenhum chamado encontrado."
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-3 mt-2 border rounded-md p-3 bg-muted/20">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="mergeAction" 
                    value="LINK"
                    checked={mergeAction === "LINK"}
                    onChange={() => setMergeAction("LINK")}
                    className="mt-1"
                  />
                  <div>
                    <span className="font-semibold text-sm">Apenas Vincular (Sub-tarefa)</span>
                    <p className="text-xs text-muted-foreground">O chamado atual será marcado como "Chamado Pai" daquele que você digitou acima. Ambos continuam ativos.</p>
                  </div>
                </label>
                
                <label className="flex items-start gap-2 cursor-pointer border-t pt-3">
                  <input 
                    type="radio" 
                    name="mergeAction" 
                    value="MERGE_CANCEL"
                    checked={mergeAction === "MERGE_CANCEL"}
                    onChange={() => setMergeAction("MERGE_CANCEL")}
                    className="mt-1"
                  />
                  <div>
                    <span className="font-semibold text-sm">Mesclar e Cancelar (Duplicado)</span>
                    <p className="text-xs text-muted-foreground">O chamado <b>atual (este que você está visualizando)</b> será vinculado como filho daquele que você digitou e será <b>automaticamente Cancelado</b> com um comentário e notificação ao solicitante.</p>
                  </div>
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsMergeModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleLinkExisting} disabled={!targetTicketStr || isLinking}>
                {isLinking ? "Processando..." : "Confirmar Vínculo"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
