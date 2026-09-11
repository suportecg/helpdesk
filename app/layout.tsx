import type { Metadata } from "next";
import { Outfit, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/providers/app-providers";
import { getSession } from "@/lib/auth";
import { Toaster } from "sonner";
import NextTopLoader from 'nextjs-toploader';
import { cn } from "@/lib/utils";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });
const jetBrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

export const metadata: Metadata = {
  title: "Chamado",
  description:
    "Sistema corporativo modular e White Label para gestão de chamados, técnicos, BI e atendimento.",
  icons: [
    { rel: "icon", url: "/cg-logo.png" },
    { rel: "shortcut icon", url: "/cg-logo.png" },
    { rel: "apple-touch-icon", url: "/cg-logo.png" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${spaceGrotesk.variable} ${jetBrainsMono.variable} min-h-screen bg-background font-sans antialiased`}
      >
        <NextTopLoader color="hsl(var(--primary))" showSpinner={false} />
        <AppProviders initialUser={session}>{children}</AppProviders>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
