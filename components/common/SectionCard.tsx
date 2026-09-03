import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface SectionCardProps {
  title?: string;
  description?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function SectionCard({
  title,
  description,
  headerAction,
  children,
  footer,
  className,
  contentClassName,
}: SectionCardProps) {
  const hasHeader = title || description || headerAction;

  return (
    <Card className={cn("overflow-hidden border-border bg-card shadow-xs", className)}>
      {hasHeader && (
        <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border/60 pb-4">
          <div className="space-y-1">
            {title && <CardTitle className="text-base font-semibold">{title}</CardTitle>}
            {description && (
              <CardDescription className="text-xs text-muted-foreground">
                {description}
              </CardDescription>
            )}
          </div>
          {headerAction && <div className="flex items-center gap-2">{headerAction}</div>}
        </CardHeader>
      )}
      <CardContent className={cn("p-6", !hasHeader && "pt-6", contentClassName)}>
        {children}
      </CardContent>
      {footer && (
        <CardFooter className="border-t border-border/60 bg-muted/30 py-3 px-6">
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}
