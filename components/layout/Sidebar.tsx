"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { CaretLeft, CaretRight, X } from "@phosphor-icons/react";
import { useSidebar } from "@/hooks/useSidebar";
import { useWhiteLabel } from "@/hooks/useWhiteLabel";
import { NAVIGATION_ITEMS } from "@/config/navigation.config";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar, isMobileOpen, setMobileOpen } = useSidebar();
  const { config } = useWhiteLabel();
  const [isHovered, setIsHovered] = React.useState(false);

  const effectivelyCollapsed = isCollapsed && !isHovered;

  const renderNavItems = () => (
    <nav className="flex-1 space-y-1.5 p-4 mt-2">
      <div className="mb-4 px-4 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/40 hidden lg:block">
        {!effectivelyCollapsed && "Menu Principal"}
      </div>
      {NAVIGATION_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "group relative flex items-center gap-3.5 px-4 py-3 text-[13px] font-semibold rounded-xl transition-all duration-300",
              isActive
                ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20"
                : "bg-transparent text-sidebar-foreground/70 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
            )}
            title={effectivelyCollapsed ? item.title : undefined}
          >
            <div className={cn(
              "flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
              isActive ? "text-primary-foreground" : "text-sidebar-foreground/50 group-hover:text-primary"
            )}>
              <Icon weight={isActive ? "fill" : "duotone"} className="h-[22px] w-[22px] shrink-0" />
            </div>
            {!effectivelyCollapsed && (
              <span className="truncate tracking-wide">{item.title}</span>
            )}
            {effectivelyCollapsed && (
              <div className="absolute left-full ml-4 hidden rounded-md bg-sidebar-accent px-3 py-1.5 text-[12px] font-bold text-sidebar-foreground shadow-xl group-hover:block z-50 whitespace-nowrap border border-sidebar-border/50">
                {item.title}
              </div>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Off-canvas background overlay para mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar para desktop */}
      <div 
        className={cn(
          "hidden lg:block shrink-0 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          isCollapsed ? "w-[88px]" : "w-[280px]"
        )}
      />
      
      <aside
        onMouseEnter={() => isCollapsed && setIsHovered(true)}
        onMouseLeave={() => isCollapsed && setIsHovered(false)}
        className={cn(
          "hidden lg:flex flex-col border-r border-sidebar-border/30 bg-sidebar-background transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] fixed left-0 top-0 h-screen z-40",
          effectivelyCollapsed ? "w-[88px]" : "w-[280px]",
          isHovered && isCollapsed ? "shadow-2xl shadow-black/50 border-r-primary/30" : ""
        )}
      >
        {/* Decorative subtle gradient background overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />

        {/* White Label Logo Header */}
        <div
          className={cn(
            "relative flex h-24 items-center border-b border-sidebar-border/30 transition-all mt-2",
            effectivelyCollapsed ? "justify-center px-0" : "justify-between px-6"
          )}
        >
          <Link href="/dashboard" className="flex items-center gap-4 overflow-hidden group w-full">
            <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl bg-white p-2 shadow-lg shadow-black/20 transition-all duration-500 group-hover:scale-105 group-hover:shadow-primary/30 relative z-10">
              <Image
                src={config.logo}
                alt={config.systemName}
                width={36}
                height={36}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            {!effectivelyCollapsed && (
              <div className="flex flex-col truncate relative z-10">
                <span className="text-[16px] font-bold tracking-tight text-white truncate">
                  {config.systemName}
                </span>
                <span className="text-[10px] text-primary-foreground/60 uppercase tracking-widest font-semibold mt-0.5">
                  Painel de Controle
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Navegação Principal */}
        <div className="relative z-10 flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-sidebar-accent [&::-webkit-scrollbar-track]:bg-transparent">
          {renderNavItems()}
        </div>

        {/* Toggle Button no Rodapé do Sidebar */}
        <div className="p-4 border-t border-sidebar-border/30 relative z-10 bg-sidebar-background">
          <Button
            variant="ghost"
            onClick={toggleSidebar}
            className={cn(
              "w-full flex items-center gap-3 justify-center text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground rounded-xl h-11 transition-all duration-300 group",
              !effectivelyCollapsed && "justify-start px-4"
            )}
            title={effectivelyCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            {effectivelyCollapsed ? (
              <CaretRight weight="bold" className="h-4 w-4 group-hover:scale-110 transition-transform" />
            ) : (
              <>
                <CaretLeft weight="bold" className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-[13px] font-semibold tracking-wide">Recolher Menu</span>
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* Sidebar mobile */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-sidebar-border bg-sidebar-background transition-transform duration-300 ease-in-out lg:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-24 items-center justify-between border-b border-sidebar-border/30 px-6">
          <Link
            href="/dashboard"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-4 overflow-hidden group"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white p-2 border border-white/20 shadow-md transition-transform duration-300 group-hover:scale-105 group-hover:shadow-lg">
              <Image
                src={config.logo}
                alt={config.systemName}
                width={36}
                height={36}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <div className="flex flex-col truncate">
              <span className="text-[15px] font-display font-bold tracking-tight text-sidebar-foreground truncate">
                {config.systemName}
              </span>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
            className="h-8 w-8 text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {renderNavItems()}
      </aside>
    </>
  );
}
