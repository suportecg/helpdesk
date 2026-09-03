import { Role } from "@/types/rbac.types";

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrador",
  TI: "Suporte TI",
  SOLICITANTE: "Solicitante",
};

export const ROLE_COLORS: Record<Role, string> = {
  ADMIN: "bg-primary text-primary-foreground",
  TI: "bg-blue-600 text-white dark:bg-blue-500",
  SOLICITANTE: "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100",
};

export function hasRole(userRole: Role, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(userRole);
}

export function isAdmin(userRole: Role): boolean {
  return userRole === "ADMIN";
}

export function isSupport(userRole: Role): boolean {
  return userRole === "ADMIN" || userRole === "TI";
}
