import React from "react";
import { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { UsersManagementClient } from "@/modules/users/UsersManagementClient";

export const metadata: Metadata = {
  title: "Usuários e Técnicos - CG Construções HelpDesk",
  description: "Gestão completa de técnicos, usuários, controle RBAC e permissões corporativas",
};

export default function UsuariosPage() {
  return (
    <PageContainer>
      <UsersManagementClient />
    </PageContainer>
  );
}
