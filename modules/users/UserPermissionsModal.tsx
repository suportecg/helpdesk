"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  ShieldAlert,
  Loader2,
  CheckCircle2,
  Lock,
  Layers,
  Users,
  BarChart3,
  Settings,
  FileText,
  Share2,
} from "lucide-react";

interface PermissionItem {
  id: string;
  code: string;
  label: string;
  category: string;
  description: string | null;
}

interface CategoryGroup {
  category: string;
  permissions: PermissionItem[];
}

interface UserPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  userName: string;
  userRole: string;
  onSuccess?: () => void;
}

export function UserPermissionsModal({
  isOpen,
  onClose,
  userId,
  userName,
  userRole,
  onSuccess,
}: UserPermissionsModalProps) {
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [selectedMap, setSelectedMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    if (isOpen && userId) {
      loadData();
    }
  }, [isOpen, userId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [groupsRes, userPermsRes] = await Promise.all([
        fetch("/api/permissions"),
        fetch(`/api/users/${userId}/permissions`),
      ]);

      if (!groupsRes.ok || !userPermsRes.ok) {
        throw new Error("Falha ao carregar permissões e grupos");
      }

      const groupsData: CategoryGroup[] = await groupsRes.json();
      const userPermsData = await userPermsRes.json();

      setCategories(groupsData);

      // Preencher o mapa selectedMap com base em permissionCodes do usuário
      const initialMap: Record<string, boolean> = {};
      const activeCodes = new Set<string>(userPermsData.permissionCodes || []);

      groupsData.forEach((cat) => {
        cat.permissions.forEach((perm) => {
          initialMap[perm.id] = activeCodes.has(perm.code);
        });
      });

      setSelectedMap(initialMap);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar permissões");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (permId: string) => {
    setSelectedMap((prev) => ({
      ...prev,
      [permId]: !prev[permId],
    }));
  };

  const handleSelectAllCategory = (catPermissions: PermissionItem[], state: boolean) => {
    const update: Record<string, boolean> = {};
    catPermissions.forEach((p) => {
      update[p.id] = state;
    });
    setSelectedMap((prev) => ({
      ...prev,
      ...update,
    }));
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    setError(null);

    try {
      const permissionsPayload = Object.entries(selectedMap).map(([permissionId, granted]) => ({
        permissionId,
        granted,
      }));

      const res = await fetch(`/api/users/${userId}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: permissionsPayload }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao atualizar permissões");
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Falha ao salvar permissões");
    } finally {
      setSaving(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Chamados":
        return <Layers className="h-4 w-4 text-blue-500" />;
      case "Usuários":
        return <Users className="h-4 w-4 text-purple-500" />;
      case "Dashboard":
        return <BarChart3 className="h-4 w-4 text-emerald-500" />;
      case "Configurações":
        return <Settings className="h-4 w-4 text-amber-500" />;
      case "Relatórios":
        return <FileText className="h-4 w-4 text-rose-500" />;
      case "Integrações":
        return <Share2 className="h-4 w-4 text-indigo-500" />;
      default:
        return <ShieldAlert className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-[700px] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <ShieldAlert className="h-5 w-5 text-primary" />
              Matriz de Permissões Individuais
            </DialogTitle>
            <Badge variant="outline" className="text-xs">
              Role: {userRole}
            </Badge>
          </div>
          <DialogDescription className="text-gray-700 dark:text-gray-300">
            Configure as permissões específicas e exceções para o usuário <strong>{userName}</strong>. As permissões selecionadas têm precedência sobre a regra do papel padrão.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-1 space-y-5 py-2">
          {loading ? (
            <div className="flex h-48 items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" />
              Carregando matriz de permissões...
            </div>
          ) : (
            categories.map((group) => {
              const allChecked = group.permissions.every((p) => selectedMap[p.id]);

              return (
                <div
                  key={group.category}
                  className="rounded-xl border border-border/80 bg-card/60 p-4 shadow-sm transition-all hover:border-primary/30"
                >
                  <div className="flex items-center justify-between border-b border-border/50 pb-2 mb-3">
                    <div className="flex items-center gap-2 font-semibold text-foreground">
                      {getCategoryIcon(group.category)}
                      <span>{group.category}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => handleSelectAllCategory(group.permissions, true)}
                      >
                        Marcar Tudo
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => handleSelectAllCategory(group.permissions, false)}
                      >
                        Desmarcar
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {group.permissions.map((perm) => {
                      const isChecked = Boolean(selectedMap[perm.id]);
                      return (
                        <label
                          key={perm.id}
                          className={`flex items-start gap-2.5 rounded-lg border p-2.5 cursor-pointer transition-colors ${
                            isChecked
                              ? "border-primary/40 bg-primary/5 dark:bg-primary/10"
                              : "border-border/60 bg-background/50 hover:bg-muted/40"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-primary"
                            checked={isChecked}
                            onChange={() => handleToggle(perm.id)}
                          />
                          <div className="flex-1 text-sm">
                            <div className="font-medium text-foreground flex items-center justify-between">
                              <span>{perm.label}</span>
                              <span className="font-mono text-[10px] text-muted-foreground">
                                {perm.code}
                              </span>
                            </div>
                            {perm.description && (
                              <p className="mt-0.5 text-xs text-muted-foreground leading-tight">
                                {perm.description}
                              </p>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <DialogFooter className="border-t border-border/50 pt-3 mt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Fechar
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving || loading}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Permissões
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
