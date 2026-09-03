"use client";

import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionCard } from "@/components/common/SectionCard";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* 4 Cards de Métricas em Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-20 mb-2" />
              <Skeleton className="h-3 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Grid para Área de Gráficos Skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard
          title="Fluxo de Chamados (Estrutura Preparada)"
          description="Evolução diária de atendimentos no período"
          className="lg:col-span-2"
        >
          <div className="flex h-72 flex-col justify-end space-y-3 pt-6">
            <div className="flex items-end justify-between gap-2 h-48">
              {Array.from({ length: 12 }).map((_, idx) => (
                <Skeleton
                  key={idx}
                  className="w-full rounded-t-sm"
                  style={{ height: `${30 + (idx % 5) * 15}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between pt-2">
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-3 w-8" />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Distribuição por Setor"
          description="Volume por departamento"
        >
          <div className="flex h-72 flex-col items-center justify-center space-y-4">
            <Skeleton className="h-40 w-40 rounded-full" />
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-10" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-10" />
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Tabela Recente em Skeleton */}
      <SectionCard
        title="Chamados Recentes (Estrutura de Tabela Skeleton)"
        description="Listagem inicial preparada para futura integração"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b pb-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-2 border-b last:border-0"
            >
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16 rounded-md" />
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
