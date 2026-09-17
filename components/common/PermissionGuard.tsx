"use client";

import React, { ReactNode } from "react";
import { useAuth } from "@/providers/auth-provider";
import { LockKey } from "@phosphor-icons/react";

interface PermissionGuardProps {
  requiredPermission?: string;
  requiredRole?: string[];
  fallback?: ReactNode;
  children: ReactNode;
  showUnauthorizedMessage?: boolean;
}

export function PermissionGuard({
  requiredPermission,
  requiredRole,
  fallback = null,
  children,
  showUnauthorizedMessage = false,
}: PermissionGuardProps) {
  const { user, hasPermission } = useAuth();

  let hasAccess = false;

  if (user?.role === "ADMIN") {
    hasAccess = true;
  } else if (requiredRole && user) {
    hasAccess = requiredRole.includes(user.role);
  } else if (requiredPermission && user) {
    hasAccess = hasPermission(requiredPermission);
  } else if (!requiredPermission && !requiredRole) {
    // Se não exigiu nada, libera.
    hasAccess = true;
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  if (showUnauthorizedMessage) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/20 border rounded-2xl">
        <LockKey className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-lg font-bold text-foreground">Acesso Restrito</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          Você não tem acesso a isso. Caso queira saber mais informações, fale com a TI.
        </p>
      </div>
    );
  }

  return <>{fallback}</>;
}
