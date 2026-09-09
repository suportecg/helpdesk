"use client";

import React, { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function TicketAIPanel() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-fuchsia-500/5 shadow-sm overflow-hidden transition-all">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-purple-500/10 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-500" />
          <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-300">Análise gerada por inteligência artificial (IA)</h3>
          <span className="text-xs text-muted-foreground ml-2 hidden sm:inline-block">Veja insights sobre o ticket e o solicitante</span>
        </div>
        <div>
          {expanded ? <ChevronUp className="h-4 w-4 text-purple-500/70" /> : <ChevronDown className="h-4 w-4 text-purple-500/70" />}
        </div>
      </div>
      
      {expanded && (
        <div className="p-4 pt-0 border-t border-purple-500/10 bg-background/50">
          <div className="py-4 px-2">
            <p className="text-sm text-muted-foreground mb-4">
              A inteligência artificial ainda não analisou este ticket. Em breve, você verá resumos automáticos e sugestões de resolução aqui.
            </p>
            <div className="relative">
              <Input 
                placeholder="Faça uma pergunta sobre este ticket..." 
                className="pr-10 border-purple-200 focus-visible:ring-purple-400 bg-background"
                disabled
              />
              <Button size="icon" variant="ghost" className="absolute right-1 top-1 h-7 w-7 text-purple-500" disabled>
                <Send className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
