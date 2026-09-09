"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export default function LoadingTicket() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-background animate-in fade-in duration-300">
      <header className="flex h-14 shrink-0 items-center justify-between border-b px-6 bg-card">
        <div className="flex items-center gap-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="space-y-4 pt-6">
              <Skeleton className="h-[200px] w-full rounded-xl" />
              <Skeleton className="h-[150px] w-full rounded-xl" />
            </div>
          </div>
        </div>
        <aside className="w-80 border-l bg-muted/10 p-6 space-y-6 overflow-y-auto shrink-0 hidden md:block">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </aside>
      </div>
    </div>
  );
}
