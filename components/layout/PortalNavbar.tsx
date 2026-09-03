"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useWhiteLabel } from "@/hooks/useWhiteLabel";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";
import { Button } from "@/components/ui/button";

export function PortalNavbar() {
  const { config } = useWhiteLabel();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-8">
      <div className="flex items-center gap-6 flex-1">
        <Link href="/meus-chamados" className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 p-1.5">
            <Image
              src={config.logo}
              alt={config.systemName}
              width={32}
              height={32}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <div className="flex flex-col truncate">
            <span className="text-base font-bold tracking-tight text-foreground truncate">
              {config.systemName}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
              Portal do Solicitante
            </span>
          </div>
        </Link>

        {/* Links de navegação do Portal */}
        <nav className="hidden md:flex items-center gap-1 ml-4">
          <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
            <Link href="/meus-chamados">Meus Chamados</Link>
          </Button>
          <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
            <Link href="/novo-chamado">Novo Chamado</Link>
          </Button>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {/* Alternador de Temas */}
        <ThemeToggle />

        {/* Menu do Usuário */}
        <UserMenu />
      </div>
    </header>
  );
}
