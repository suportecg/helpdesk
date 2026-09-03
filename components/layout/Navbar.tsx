"use client";

import React from "react";
import { Menu, Search, ShieldCheck } from "lucide-react";
import { useSidebar } from "@/hooks/useSidebar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

export function Navbar() {
  const { toggleMobile } = useSidebar();
  const router = useRouter();
  const [search, setSearch] = React.useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/chamados?query=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-6">
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={toggleMobile}
          className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground lg:hidden cursor-pointer"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Busca Rápida */}
        <form onSubmit={handleSearch} className="relative hidden w-full max-w-sm md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar chamados, usuários, serviços..."
            className="w-full rounded-full pl-9 pr-4 bg-muted/40 focus:bg-background border-border/80"
          />
        </form>
      </div>

      <div className="flex items-center gap-3">
        {/* Badge de Status Operacional */}
        <div className="hidden md:flex items-center gap-2 bg-success/10 text-success px-2 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest">
          <div className="w-1.5 h-1.5 rounded-[1px] bg-success animate-pulse" />
          <span>Sistema Operacional</span>
        </div>

        {/* Alternador de Temas (Claro, Escuro e Automático) */}
        <ThemeToggle />

        {/* Menu do Usuário */}
        <UserMenu />
      </div>
    </header>
  );
}
