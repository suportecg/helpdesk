import React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";

export interface Column<T> {
  key: string;
  label: string;
  className?: string;
  render?: (item: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  rowKey?: (item: T, idx: number) => string | number;
  onRowClick?: (item: T) => void;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  emptyTitle = "Nenhum registro encontrado",
  emptyDescription = "Não há dados para exibir nesta tabela no momento.",
  emptyAction,
  rowKey,
  onRowClick,
  className,
}: DataTableProps<T>) {
  return (
    <div className="w-full overflow-hidden bg-transparent">
      <Table className={className}>
        <TableHeader>
          <TableRow className="border-b bg-transparent hover:bg-transparent">
            {columns.map((col) => (
              <TableHead 
                key={col.key} 
                className={`h-12 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 ${col.className || ""}`}
              >
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <TableRow key={idx}>
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    <Skeleton className="h-4 w-full max-w-[120px]" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-64 text-center">
                <EmptyState
                  title={emptyTitle}
                  description={emptyDescription}
                  action={emptyAction}
                  className="border-0 bg-transparent"
                />
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, idx) => {
              const key = rowKey ? rowKey(item, idx) : idx;
              return (
                <TableRow
                  key={key}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                  className={onRowClick ? "cursor-pointer hover:bg-muted/20 transition-colors group border-b border-border/30 last:border-0" : "hover:bg-muted/20 transition-colors group border-b border-border/30 last:border-0"}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className={`py-4 ${col.className}`}>
                      {col.render
                        ? col.render(item, idx)
                        : (item as Record<string, unknown>)[col.key] !== undefined
                        ? String((item as Record<string, unknown>)[col.key])
                        : ""}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
