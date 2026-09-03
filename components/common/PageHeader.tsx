import React from "react";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title: string;
  breadcrumb?: string[];
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  breadcrumb = ["Início"],
  description,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 pb-6 border-b border-border md:flex-row md:items-center md:justify-between",
        className
      )}
    >
      <div className="space-y-1.5">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs font-medium text-muted-foreground">
            {breadcrumb.map((item, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span>&gt;</span>}
                <span className={idx === breadcrumb.length - 1 ? "text-foreground font-semibold" : ""}>
                  {item}
                </span>
              </React.Fragment>
            ))}
          </nav>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground max-w-3xl">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-3 self-start md:self-center">
          {children}
        </div>
      )}
    </div>
  );
}
