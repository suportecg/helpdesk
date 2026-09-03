"use client";

import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useWhiteLabel } from "@/hooks/useWhiteLabel";

export function PortalHero() {
  const { config } = useWhiteLabel();

  return (
    <div className="w-full bg-primary/5 rounded-2xl p-8 md:p-12 mb-8 text-center border border-primary/10 relative overflow-hidden">
      {/* Decoração de fundo sutil */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          Como podemos ajudar você hoje?
        </h1>
        <p className="text-muted-foreground text-lg">
          Bem-vindo ao portal de atendimento da {config.systemName}. Busque por soluções ou abra um novo chamado.
        </p>
        
        <div className="relative max-w-xl mx-auto mt-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Descreva seu problema ou busque uma dúvida..." 
            className="w-full h-14 pl-12 pr-4 rounded-full text-base bg-background border-border shadow-sm focus-visible:ring-primary"
          />
        </div>
      </div>
    </div>
  );
}
