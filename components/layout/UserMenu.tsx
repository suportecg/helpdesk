"use client";

import React from "react";
import { SignOut, User, Shield, Buildings } from "@phosphor-icons/react";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS, ROLE_COLORS } from "@/utils/rbac";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu() {
  const { user, logout } = useAuth();

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "AD";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-3 rounded-full p-1 transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer"
          aria-label="Menu do usuário"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground shadow-xs">
            {userInitials}
          </div>
          <div className="hidden flex-col items-start text-left md:flex">
            <span className="text-sm font-semibold leading-none text-foreground">
              {user?.name || "Administrador"}
            </span>
            <span className="text-xs text-muted-foreground mt-0.5">
              {user?.email || "Usuário não autenticado"}
            </span>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-2">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold leading-none text-foreground">
              {user?.name || "Administrador"}
            </p>
            <p className="text-xs leading-none text-muted-foreground truncate">
              {user?.email || "Usuário não autenticado"}
            </p>
            <div className="flex items-center gap-1.5 pt-1.5">
              <Badge
                className={`px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                  ROLE_COLORS[user?.role || "ADMIN"]
                }`}
              >
                <Shield className="h-2.5 w-2.5 mr-1" />
                {ROLE_LABELS[user?.role || "ADMIN"]}
              </Badge>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>Meu Perfil</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
          <Buildings className="h-4 w-4 text-muted-foreground" />
          <span>{user?.department || "Gestão / TI"}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={logout}
          className="flex items-center gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
        >
          <SignOut className="h-4 w-4" />
          <span className="font-medium">Sair do sistema</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
