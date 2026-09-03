import React from "react";
import { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { ReportsClient } from "@/modules/reports/ReportsClient";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Relatórios Executivos de BI & Analytics — CG Construções HelpDesk",
  description: "Central gerencial de indicadores, tempos de atendimento e exportação PDF corporativa",
};

export default function RelatoriosPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Relatórios & Business Intelligence"
        breadcrumb={["Início", "Relatórios"]}
        description="Métricas de resolução, comparativos por obras e departamentos, SLAs de TI e exportação de relatórios C-Level."
      >
        <Link href="/chamados">
          <Button size="sm" className="font-semibold">
            <Plus className="h-4 w-4 mr-1.5" />
            Abrir Novo Chamado
          </Button>
        </Link>
      </PageHeader>

      <div className="mt-6">
        <ReportsClient />
      </div>
    </PageContainer>
  );
}
