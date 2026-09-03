"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, Search, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  id: string;
  name: string;
  subtitle?: string | null;
  badge?: string | null;
  [key: string]: any;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value?: string | null;
  onChange: (value: string | null, item?: ComboboxOption) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  allowCreate?: boolean;
  onCreate?: (typedName: string) => void;
  onSearchChange?: (query: string) => void;
  createLabelPrefix?: string;
  disabled?: boolean;
  className?: string;
  isLoading?: boolean;
  onOpen?: () => void;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Selecione...",
  searchPlaceholder = "Pesquisar...",
  emptyText = "Nenhum resultado encontrado.",
  allowCreate = false,
  onCreate,
  onSearchChange,
  createLabelPrefix = "+ Criar",
  disabled = false,
  className,
  isLoading = false,
  onOpen,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedItem = options.find((opt) => opt.id === value);

  // Filtragem em tempo real
  const filteredOptions = options.filter((opt) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      opt.name.toLowerCase().includes(q) ||
      (opt.subtitle && opt.subtitle.toLowerCase().includes(q)) ||
      (opt.badge && opt.badge.toLowerCase().includes(q))
    );
  });

  // Checar se deve mostrar opção de criação
  const showCreateOption =
    allowCreate &&
    query.trim().length > 1 &&
    !options.some(
      (opt) => opt.name.toLowerCase().trim() === query.toLowerCase().trim()
    );

  const totalSelectableItems =
    filteredOptions.length + (showCreateOption ? 1 : 0);

  useEffect(() => {
    if (open) {
      if (onOpen) onOpen();
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [open]);

  // Fechar clique fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(item: ComboboxOption) {
    onChange(item.id, item);
    setOpen(false);
  }

  function handleCreate() {
    if (onCreate && query.trim()) {
      onCreate(query.trim());
      setOpen(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % Math.max(1, totalSelectableItems));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev - 1 < 0 ? Math.max(0, totalSelectableItems - 1) : prev - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (showCreateOption && activeIndex === filteredOptions.length) {
        handleCreate();
      } else if (filteredOptions[activeIndex]) {
        handleSelect(filteredOptions[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Botão de disparo */}
      <div className="relative flex items-center">
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          onClick={() => setOpen((prev) => !prev)}
          className={cn(
            "w-full justify-between text-left font-normal bg-background hover:bg-muted/40 transition-colors h-9 px-3 text-xs",
            !selectedItem && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">
            {selectedItem ? (
              <span className="flex items-center gap-1.5">
                <span className="font-medium text-foreground">
                  {selectedItem.name}
                </span>
                {selectedItem.badge && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1 py-0 font-mono text-muted-foreground"
                  >
                    {selectedItem.badge}
                  </Badge>
                )}
              </span>
            ) : (
              placeholder
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>

        {/* Botão Limpar Seleção (X) */}
        {selectedItem && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            className="absolute right-7 p-1 text-muted-foreground hover:text-foreground transition-colors"
            title="Limpar seleção"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Painel Dropdown do Combobox */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover text-popover-foreground shadow-lg outline-none animate-in fade-in-80 zoom-in-95">
          {/* Barra de Pesquisa do Combobox */}
          <div className="flex items-center border-b border-border/60 px-3 py-2">
            <Search className="mr-2 h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
                onSearchChange?.(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              className="flex w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>

          {/* Lista scrollável com opções */}
          <div
            ref={listRef}
            className="max-h-60 overflow-y-auto p-1 space-y-0.5 scrollbar-thin"
          >
            {isLoading && (
              <div className="py-6 flex items-center justify-center text-xs text-muted-foreground">
                <span className="w-4 h-4 mr-2 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                Carregando...
              </div>
            )}

            {!isLoading && filteredOptions.length === 0 && !showCreateOption && (
              <div className="py-6 text-center text-xs text-muted-foreground">
                {emptyText}
              </div>
            )}

            {!isLoading && filteredOptions.map((opt, idx) => {
              const isSelected = opt.id === value;
              const isActive = idx === activeIndex;
              return (
                <div
                  key={opt.id}
                  onClick={() => handleSelect(opt)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={cn(
                    "flex items-center justify-between rounded-sm px-2.5 py-2 text-xs cursor-pointer transition-colors select-none",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground hover:bg-muted/60"
                  )}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate">{opt.name}</span>
                      {opt.badge && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-muted text-muted-foreground border border-border/40">
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    {opt.subtitle && (
                      <span className="text-[10px] text-muted-foreground truncate mt-0.5">
                        {opt.subtitle}
                      </span>
                    )}
                  </div>
                  <Check
                    className={cn(
                      "h-3.5 w-3.5 shrink-0 text-primary",
                      isSelected ? "opacity-100" : "opacity-0"
                    )}
                  />
                </div>
              );
            })}

            {/* Opção + Criar "Nome Digitado" para solicitantes não existentes */}
            {showCreateOption && (
              <div
                onClick={handleCreate}
                onMouseEnter={() => setActiveIndex(filteredOptions.length)}
                className={cn(
                  "flex items-center gap-2 rounded-sm px-2.5 py-2.5 text-xs font-semibold cursor-pointer transition-colors border-t border-dashed border-border/60 mt-1",
                  activeIndex === filteredOptions.length
                    ? "bg-primary text-primary-foreground"
                    : "text-primary hover:bg-primary/10"
                )}
              >
                <Plus className="h-4 w-4 shrink-0" />
                <span>
                  {createLabelPrefix} &quot;{query.trim()}&quot;
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
