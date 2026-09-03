import { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { RequestersManagementClient } from "@/modules/requesters/RequestersManagementClient";

export const metadata: Metadata = {
  title: "Solicitantes - CG Construções HelpDesk",
  description: "Cadastro de solicitantes e clientes do atendimento",
};

export default function SolicitantesPage() {
  return (
    <PageContainer>
      <RequestersManagementClient />
    </PageContainer>
  );
}
