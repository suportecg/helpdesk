import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function UsuariosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Apenas a role ADMIN pode acessar a Gestão de Usuários
  if (session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
