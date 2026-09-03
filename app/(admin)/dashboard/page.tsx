import React from "react";
import { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { OperationalDashboardClient } from "@/modules/dashboard/OperationalDashboardClient";
import { Button } from "@/components/ui/button";
import { Plus, BarChart3 } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dashboard Operacional — CG Construções HelpDesk",
  description: "Central operacional de chamados, fila em atendimento e atividades de TI em tempo real",
};

export default function DashboardPage() {
  return (
    <PageContainer>
      <div className="flex flex-col h-full w-full">
        <OperationalDashboardClient />
      </div>
    </PageContainer>
  );
}
