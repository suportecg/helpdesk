import React from "react";
import { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import TicketsManagementClient from "@/modules/tickets/TicketsManagementClient";

export const metadata: Metadata = {
  title: "Gestão de Chamados - CG Construções HelpDesk",
  description: "Sistema profissional de HelpDesk para substituir completamente a planilha de TI com numeração automática, histórico e SLAs",
};

export default function ChamadosPage() {
  return (
    <PageContainer>
      <TicketsManagementClient />
    </PageContainer>
  );
}
