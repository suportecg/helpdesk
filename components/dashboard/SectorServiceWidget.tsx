"use client";

import React, { useState } from "react";
import { Building2, Layers, ChevronRight, Wrench } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SectorServiceWidgetProps {
  data: Record<string, Array<{ name: string; count: number }>>;
}

export function SectorServiceWidget({ data }: SectorServiceWidgetProps) {
  const sectors = Object.keys(data || {});
  const [selectedSector, setSelectedSector] = useState<string>(sectors[0] || "");

  if (!data || sectors.length === 0) {
    return (
      <Card className="border-border bg-card shadow-sm h-full">
        <CardHeader className="pb-3 border-b border-border/60">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            Serviços mais Acionados por Setor
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground text-center py-6">
            Nenhum dado registrado para setores no período.
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentServices = data[selectedSector] || [];
  const maxCount = Math.max(1, ...currentServices.map((s) => s.count));

  return (
    <Card className="border-border bg-card shadow-sm h-full flex flex-col">
      <CardHeader className="pb-3 border-b border-border/60">
        <CardTitle className="text-sm font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <span>Serviços por Setor</span>
          </div>
          <Badge variant="secondary" className="text-[10px] font-mono">
            {sectors.length} setores
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 flex-1 flex flex-col gap-3">
        {/* Seletor horizontal de Setores */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 border-b border-border/40 scrollbar-none">
          {sectors.map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => setSelectedSector(sec)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                selectedSector === sec
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/70"
              }`}
            >
              <Building2 className="h-3 w-3" />
              {sec}
            </button>
          ))}
        </div>

        {/* Lista Top Serviços do Setor selecionado */}
        <div className="space-y-3 flex-1">
          {currentServices.length > 0 ? (
            currentServices.map((srv, idx) => {
              const percentage = Math.round((srv.count / maxCount) * 100);
              return (
                <div key={srv.name} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground truncate max-w-[200px] flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      {srv.name}
                    </span>
                    <span className="font-bold font-mono text-foreground">
                      {srv.count} chamado{srv.count > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(8, percentage)}%` }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-muted-foreground text-center py-6">
              Nenhum serviço registrado para {selectedSector}.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
