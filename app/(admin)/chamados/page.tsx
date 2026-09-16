import React, { Suspense } from "react";
import { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import TicketsManagementClient from "@/modules/tickets/TicketsManagementClient";

export const metadata: Metadata = {
  title: "Gestão de Chamados - Chamado",
  description: "Sistema profissional de HelpDesk para substituir completamente a planilha de TI com numeração automática, histórico e SLAs",
};

export default function ChamadosPage() {
  return (
    <PageContainer>
      <Suspense fallback={<div className="p-8 text-center text-muted-foreground animate-pulse">Carregando interface...</div>}>
        <TicketsManagementClient />
      </Suspense>
    </PageContainer>
  );
}
