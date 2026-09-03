import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role === "SOLICITANTE") {
    redirect("/meus-chamados");
  }

  return (
    <div className="flex min-h-screen w-full bg-background overflow-x-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Navbar />
        <div className="flex-1 flex flex-col justify-between">
          {children}
          <Footer />
        </div>
      </div>
    </div>
  );
}
