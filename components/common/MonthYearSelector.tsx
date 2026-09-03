"use client";

import React, { useState, useEffect, useRef } from "react";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

interface MonthOption {
  value: string;
  label: string;
  month: number;
  year: number;
}

interface MonthYearSelectorProps {
  value: string;
  onChange: (monthYear: string) => void;
  includeAllYear?: boolean;
  className?: string;
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function getCurrentMonthYear(): string {
  const now = new Date();
  return `${String(now.getMonth() + 1).padStart(2, "0")}-${now.getFullYear()}`;
}

function formatMonthYear(my: string): string {
  const [mm, yyyy] = my.split("-");
  const idx = parseInt(mm, 10) - 1;
  return `${MONTH_NAMES[idx]} ${yyyy}`;
}

export function MonthYearSelector({
  value,
  onChange,
  includeAllYear = false,
  className = "",
}: MonthYearSelectorProps) {
  const [months, setMonths] = useState<MonthOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadMonths() {
      try {
        const res = await fetch("/api/tickets/months");
        if (res.ok) {
          const data = await res.json();
          setMonths(data);
        }
      } catch (e) {
        console.error("Erro ao carregar meses:", e);
      } finally {
        setLoading(false);
      }
    }
    loadMonths();
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayLabel = value === "ALL"
    ? "Ano Completo"
    : value
    ? formatMonthYear(value)
    : "Filtrar por Mês";

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (value === "ALL") return;
    const [mm, yyyy] = (value || getCurrentMonthYear()).split("-");
    let month = parseInt(mm, 10) - 1;
    let year = parseInt(yyyy, 10);
    if (month < 1) { month = 12; year--; }
    onChange(`${String(month).padStart(2, "0")}-${year}`);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (value === "ALL") return;
    const [mm, yyyy] = (value || getCurrentMonthYear()).split("-");
    let month = parseInt(mm, 10) + 1;
    let year = parseInt(yyyy, 10);
    if (month > 12) { month = 1; year++; }
    onChange(`${String(month).padStart(2, "0")}-${year}`);
  };

  return (
    <div ref={ref} className={`relative inline-flex items-center ${className}`}>
      <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-card text-sm font-semibold text-foreground shadow-sm">
        <button
          type="button"
          onClick={handlePrev}
          className="p-1 rounded-md hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground"
          title="Mês anterior"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-2 py-0.5 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
        >
          <Calendar className="h-4 w-4 text-primary" />
          <span className="min-w-[120px] text-center">
            {loading ? "Carregando..." : displayLabel}
          </span>
          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="p-1 rounded-md hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground"
          title="Próximo mês"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-52 max-h-72 overflow-y-auto bg-popover border border-border rounded-lg shadow-xl z-[100] py-1 animate-in fade-in slide-in-from-top-2 duration-150">
          {includeAllYear && (
            <button
              type="button"
              onClick={() => { onChange("ALL"); setOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                value === "ALL"
                  ? "bg-primary/10 text-primary font-bold"
                  : "text-foreground hover:bg-muted/50"
              }`}
            >
              <span>Ano Completo</span>
              {value === "ALL" && (
                <span className="text-[10px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                  ATIVO
                </span>
              )}
            </button>
          )}

          {includeAllYear && months.length > 0 && (
            <div className="border-t border-border/50 my-1" />
          )}

          {months.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => { onChange(m.value); setOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                value === m.value
                  ? "bg-primary/10 text-primary font-bold"
                  : "text-foreground hover:bg-muted/50"
              }`}
            >
              <span>{m.label}</span>
              {value === m.value && (
                <span className="text-[10px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                  ATIVO
                </span>
              )}
            </button>
          ))}

          {months.length === 0 && !loading && (
            <div className="px-3 py-4 text-xs text-muted-foreground text-center">
              Nenhum registro encontrado.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
