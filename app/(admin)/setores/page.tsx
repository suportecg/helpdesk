import { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectorsManagementClient } from "@/modules/sectors/SectorsManagementClient";

export const metadata: Metadata = {
  title: "Setores - CG Construções HelpDesk",
  description: "Cadastro de setores e departamentos",
};

export default function SetoresPage() {
  return (
    <PageContainer>
      <SectorsManagementClient />
    </PageContainer>
  );
}
