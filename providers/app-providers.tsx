"use client";

import React from "react";
import { ThemeProvider } from "@/providers/theme-provider";
import { WhiteLabelProvider } from "@/providers/white-label-provider";
import { SidebarProvider } from "@/providers/sidebar-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { UserSession } from "@/types/rbac.types";

interface AppProvidersProps {
  children: React.ReactNode;
  initialUser?: UserSession | null;
}

export function AppProviders({ children, initialUser = null }: AppProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
      <WhiteLabelProvider>
        <AuthProvider initialUser={initialUser}>
          <SidebarProvider>{children}</SidebarProvider>
        </AuthProvider>
      </WhiteLabelProvider>
    </ThemeProvider>
  );
}
