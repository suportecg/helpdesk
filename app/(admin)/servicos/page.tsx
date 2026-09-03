import { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { ServicesManagementClient } from "@/modules/services/ServicesManagementClient";

export const metadata: Metadata = {
  title: "Serviços - CG Construções HelpDesk",
  description: "Catálogo de serviços e SLA",
};

export default function ServicosPage() {
  return (
    <PageContainer>
      <ServicesManagementClient />
    </PageContainer>
  );
}
