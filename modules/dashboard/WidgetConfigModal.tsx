"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  RotateCcw,
  LayoutGrid,
  Check,
  Settings2,
} from "lucide-react";
import { ChartType } from "./charts/ChartWidgets";

export interface DashboardWidgetConfig {
  id: string;
  title: string;
  description: string;
  currentType: ChartType;
  allowedTypes: ChartType[];
  colSpan: 1 | 2 | 3; // 1 coluna, 2 colunas ou 3 colunas
  visible: boolean;
  order: number;
}

export const INITIAL_WIDGETS_CONFIG: DashboardWidgetConfig[] = [
  {
    id: "byTechnician",
    title: "Chamados por Técnico",
    description: "Volume de atendimentos atribuídos a cada analista de TI",
    currentType: "BAR",
    allowedTypes: ["BAR", "PIE", "DONUT", "RADAR"],
    colSpan: 2,
    visible: true,
    order: 0,
  },
  {
    id: "bySector",
    title: "Chamados por Setor (Obra / Dep.)",
    description: "Distribuição institucional por departamento ou canteiro",
    currentType: "PIE",
    allowedTypes: ["PIE", "DONUT", "BAR", "RADAR"],
    colSpan: 1,
    visible: true,
    order: 1,
  },
  {
    id: "byService",
    title: "Chamados por Serviço",
    description: "Categorias do catálogo mais acionadas no período",
    currentType: "BAR",
    allowedTypes: ["BAR", "PIE", "DONUT"],
    colSpan: 2,
    visible: true,
    order: 2,
  },
  {
    id: "byStatus",
    title: "Distribuição por Status",
    description: "Visão dos estados operacionais no período",
    currentType: "DONUT",
    allowedTypes: ["DONUT", "PIE", "BAR"],
    colSpan: 1,
    visible: true,
    order: 3,
  },
  {
    id: "byOrigin",
    title: "Canais de Origem",
    description: "Portal, WhatsApp e E-mail",
    currentType: "DONUT",
    allowedTypes: ["DONUT", "PIE", "BAR"],
    colSpan: 1,
    visible: true,
    order: 4,
  },
  {
    id: "avgTimeByTechnician",
    title: "Tempo Médio por Técnico (min)",
    description: "Resolutividade média calculada de cada analista",
    currentType: "BAR",
    allowedTypes: ["BAR", "LINE"],
    colSpan: 1,
    visible: true,
    order: 5,
  },
  {
    id: "avgTimeByService",
    title: "Tempo Médio por Serviço (min)",
    description: "Esforço médio de resolução por serviço",
    currentType: "BAR",
    allowedTypes: ["BAR", "LINE"],
    colSpan: 1,
    visible: true,
    order: 6,
  },
  {
    id: "avgTimeBySector",
    title: "Tempo Médio por Setor (min)",
    description: "Tempo gasto por atendimento em cada setor",
    currentType: "BAR",
    allowedTypes: ["BAR", "LINE"],
    colSpan: 2,
    visible: true,
    order: 7,
  },
  {
    id: "byDay",
    title: "Evolução Diária de Chamados",
    description: "Série temporal de volume e conclusões diárias",
    currentType: "AREA",
    allowedTypes: ["AREA", "LINE", "BAR"],
    colSpan: 3,
    visible: true,
    order: 8,
  },
  {
    id: "byWeek",
    title: "Volume Semanal de Atendimentos",
    description: "Comparativo por semana no período",
    currentType: "BAR",
    allowedTypes: ["BAR", "LINE", "AREA"],
    colSpan: 2,
    visible: true,
    order: 9,
  },
  {
    id: "byMonth",
    title: "Consolidado Mensal do Ano",
    description: "Tendência macro ao longo dos meses",
    currentType: "LINE",
    allowedTypes: ["LINE", "AREA", "BAR"],
    colSpan: 1,
    visible: true,
    order: 10,
  },
];

export interface WidgetConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widgets: DashboardWidgetConfig[];
  onUpdateWidgets: (updated: DashboardWidgetConfig[]) => void;
  onResetDefault: () => void;
}

export function WidgetConfigModal({
  open,
  onOpenChange,
  widgets,
  onUpdateWidgets,
  onResetDefault,
}: WidgetConfigModalProps) {
  const sortedWidgets = [...widgets].sort((a, b) => a.order - b.order);

  function handleToggleVisibility(id: string) {
    const next = widgets.map((w) =>
      w.id === id ? { ...w, visible: !w.visible } : w
    );
    onUpdateWidgets(next);
  }

  function handleMove(index: number, direction: "up" | "down") {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === sortedWidgets.length - 1) return;

    const targetIdx = direction === "up" ? index - 1 : index + 1;
    const currentItem = sortedWidgets[index];
    const targetItem = sortedWidgets[targetIdx];

    const next = widgets.map((w) => {
      if (w.id === currentItem.id) return { ...w, order: targetItem.order };
      if (w.id === targetItem.id) return { ...w, order: currentItem.order };
      return w;
    });

    onUpdateWidgets(next);
  }

  function handleChangeColSpan(id: string, size: 1 | 2 | 3) {
    const next = widgets.map((w) =>
      w.id === id ? { ...w, colSpan: size } : w
    );
    onUpdateWidgets(next);
  }

  function handleChangeType(id: string, type: ChartType) {
    const next = widgets.map((w) =>
      w.id === id ? { ...w, currentType: type } : w
    );
    onUpdateWidgets(next);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            Personalizar Layout do Dashboard (Gestor TI)
          </DialogTitle>
          <DialogDescription>
            Ative, oculte, reordene e defina o tamanho e tipo de cada gráfico consolidado. As suas preferências são aplicadas em tempo real.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1 space-y-2 py-2">
          {sortedWidgets.map((item, index) => (
            <div
              key={item.id}
              className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg border transition-all ${
                item.visible
                  ? "bg-card border-border shadow-sm"
                  : "bg-muted/40 border-border/50 opacity-60"
              }`}
            >
              {/* Info do Gráfico e Controle de Ordem */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={index === 0}
                    onClick={() => handleMove(index, "up")}
                    title="Mover para cima"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={index === sortedWidgets.length - 1}
                    onClick={() => handleMove(index, "down")}
                    title="Mover para baixo"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">
                      {item.title}
                    </span>
                    {!item.visible && (
                      <Badge variant="secondary" className="text-[10px]">
                        Oculto
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Ações e Propriedades do Widget */}
              <div className="flex items-center flex-wrap gap-2 self-end sm:self-center">
                {/* Seletor de Tipo */}
                <select
                  value={item.currentType}
                  onChange={(e) =>
                    handleChangeType(item.id, e.target.value as ChartType)
                  }
                  className="h-8 px-2 text-xs rounded border border-input bg-background font-medium"
                  title="Tipo padrão do gráfico"
                >
                  {item.allowedTypes.map((t) => (
                    <option key={t} value={t}>
                      {t === "BAR" && "Barra"}
                      {t === "PIE" && "Pizza"}
                      {t === "DONUT" && "Rosca"}
                      {t === "LINE" && "Linha"}
                      {t === "AREA" && "Área"}
                      {t === "RADAR" && "Radar"}
                    </option>
                  ))}
                </select>

                {/* Seletor de Tamanho (Colunas) */}
                <div className="flex items-center border border-border rounded overflow-hidden bg-background">
                  {[1, 2, 3].map((size) => {
                    const label = size === 1 ? "Pequeno" : size === 2 ? "Médio" : "Largo";
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => handleChangeColSpan(item.id, size as 1 | 2 | 3)}
                        className={`h-8 px-3 text-xs font-semibold transition-colors ${
                          item.colSpan === size
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted"
                        }`}
                        title={`${size} ${size === 1 ? "coluna" : "colunas"}`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Botão Ocultar / Exibir */}
                <Button
                  variant={item.visible ? "outline" : "default"}
                  size="sm"
                  className="h-8 px-2.5 text-xs"
                  onClick={() => handleToggleVisibility(item.id)}
                >
                  {item.visible ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5 mr-1" />
                      Ocultar
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      Exibir
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="flex items-center justify-between gap-2 pt-2 border-t">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onResetDefault}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Restaurar Padrão do Sistema
          </Button>
          <Button onClick={() => onOpenChange(false)} size="sm">
            Concluir Customização
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
