import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { PortalNavbar } from "@/components/layout/PortalNavbar";
import { Footer } from "@/components/layout/Footer";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Se o usuário for ADMIN ou TI, ele pode ver o portal se quiser, mas o padrão é o admin.
  // O redirecionamento forte será feito na página de login e middleware (se houver).

  return (
    <div className="flex min-h-screen w-full flex-col bg-background overflow-x-hidden">
      <PortalNavbar />
      <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto p-4 md:p-8">
        <div className="flex-1">
          {children}
        </div>
        <Footer />
      </div>
    </div>
  );
}
