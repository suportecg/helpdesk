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
    <nav className="flex-1 space-y-2 p-4">
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
              "group relative flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-2xl transition-all duration-300",
              isActive
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                : "bg-transparent text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
            title={effectivelyCollapsed ? item.title : undefined}
          >
            <Icon
              weight={isActive ? "fill" : "duotone"}
              className={cn(
                "h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110",
                isActive ? "text-primary-foreground" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
              )}
            />
            {!effectivelyCollapsed && (
              <span className="truncate font-medium">{item.title}</span>
            )}
            {effectivelyCollapsed && (
              <div className="absolute left-full ml-2 hidden rounded-md bg-popover px-2.5 py-1.5 text-xs font-semibold text-popover-foreground shadow-md group-hover:block z-50 whitespace-nowrap">
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
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
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
          "hidden lg:flex flex-col border-r border-sidebar-border/50 bg-sidebar-background/95 backdrop-blur-2xl transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] fixed left-0 top-0 h-screen z-40",
          effectivelyCollapsed ? "w-[88px]" : "w-[280px]",
          isHovered && isCollapsed ? "shadow-2xl border-r-primary/20" : ""
        )}
      >
        {/* White Label Logo Header */}
        <div
          className={cn(
            "flex h-24 items-center border-b border-sidebar-border/30 transition-all",
            effectivelyCollapsed ? "justify-center px-0" : "justify-between px-6"
          )}
        >
          <Link href="/dashboard" className="flex items-center gap-4 overflow-hidden group">
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
            {!effectivelyCollapsed && (
              <div className="flex flex-col truncate">
                <span className="text-[15px] font-display font-bold tracking-tight text-sidebar-foreground truncate">
                  {config.systemName}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-primary mt-0.5">
                  White Label Ready
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Navegação Principal */}
        {renderNavItems()}

        {/* Toggle Button no Rodapé do Sidebar */}
        <div className="p-4 border-t border-sidebar-border/30">
          <Button
            variant="ghost"
            onClick={toggleSidebar}
            className={cn(
              "w-full flex items-center gap-3 justify-center text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground rounded-xl h-12 transition-all duration-300",
              !effectivelyCollapsed && "justify-start px-4"
            )}
            title={effectivelyCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            {effectivelyCollapsed ? (
              <CaretRight weight="bold" className="h-5 w-5" />
            ) : (
              <>
                <CaretLeft weight="bold" className="h-5 w-5" />
                <span className="text-sm font-bold tracking-wide">Recolher</span>
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
              <span className="text-[9px] font-bold uppercase tracking-widest text-primary mt-0.5">
                White Label Ready
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
