import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { CorporateSettingsClient } from "@/modules/settings/CorporateSettingsClient";

export const metadata = {
  title: "Configurações Corporativas — CG Construções HelpDesk Pro",
  description:
    "Gerenciamento corporativo do sistema, parâmetros White Label, políticas RBAC, SLAs e exportação gerencial PDF.",
};

export default function ConfiguracoesPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Configurações Corporativas"
        breadcrumb={["Início", "Configurações"]}
        description="Parâmetros centrais do sistema, identidade visual CG Construções, políticas RBAC, SLAs e exportação PDF."
      />
      <div className="mt-6">
        <CorporateSettingsClient />
      </div>
    </PageContainer>
  );
}
