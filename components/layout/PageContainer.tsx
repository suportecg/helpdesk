import React from "react";
import { cn } from "@/lib/utils";

export interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <main
      className={cn(
        "flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:px-8 md:py-8 transition-all duration-200",
        className
      )}
    >
      {children}
    </main>
  );
}
