import type { Metadata } from "next";
import { Outfit, Space_Grotesk, JetBrains_Mono, Geist } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/providers/app-providers";
import { getSession } from "@/lib/auth";
import { Toaster } from "sonner";
import NextTopLoader from 'nextjs-toploader';
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });
const jetBrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

export const metadata: Metadata = {
  title: "CG Construções HelpDesk Pro — Sistema Profissional de Atendimento TI",
  description:
    "Sistema corporativo modular e White Label para gestão de chamados, técnicos, BI e atendimento da CG Construções (HelpDesk Pro).",
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
    <html lang="pt-BR" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
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
