"use client";

import React from "react";
import { useWhiteLabel } from "@/hooks/useWhiteLabel";

export function Footer() {
  const { config } = useWhiteLabel();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border bg-background/50 px-6 py-4 text-center text-xs text-muted-foreground">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 sm:flex-row">
        <p>
          &copy; {currentYear}{" "}
          <span className="font-semibold text-foreground">
            {config.systemName}
          </span>
          . Todos os direitos reservados.
        </p>
        <p className="flex items-center gap-1.5">
          <span>Desenvolvido para</span>
          <span className="font-medium text-primary">CG Construções</span>
          <span>• Arquitetura Modular & White Label</span>
        </p>
      </div>
    </footer>
  );
}
