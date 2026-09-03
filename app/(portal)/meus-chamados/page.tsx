import React from "react";
import { Metadata } from "next";
import { PortalHero } from "@/components/layout/PortalHero";
import TicketsManagementClient from "@/modules/tickets/TicketsManagementClient";

export const metadata: Metadata = {
  title: "Meus Chamados - CG Construções HelpDesk",
  description: "Acompanhe e gerencie seus tickets de atendimento.",
};

export default function MeusChamadosPage() {
  return (
    <div className="w-full">
      <PortalHero />
      <div className="bg-card border border-border shadow-sm rounded-xl p-6">
        <h2 className="text-xl font-bold mb-6">Meus Chamados</h2>
        <TicketsManagementClient />
      </div>
    </div>
  );
}
