"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { useWhiteLabel } from "@/hooks/useWhiteLabel";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function LoginForm() {
  const isDev = process.env.NODE_ENV === "development";
  const [email, setEmail] = useState(isDev ? (process.env.NEXT_PUBLIC_DEV_EMAIL || "") : "");
  const [password, setPassword] = useState(isDev ? (process.env.NEXT_PUBLIC_DEV_PASSWORD || "") : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { config } = useWhiteLabel();
  const { refresh } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Credenciais inválidas.");
        setLoading(false);
        return;
      }

      await refresh();
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Erro de comunicação.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full selection:bg-primary/30">
      
      {/* Lado Esquerdo - Formulário (Branco) */}
      <div className="flex w-full flex-col justify-center items-center bg-white p-8 lg:w-1/3 border-r border-slate-200 relative z-10 shadow-2xl">
        <div className="w-full max-w-[360px] animate-in fade-in zoom-in-95 duration-500">
          
          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-4 mb-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5 border border-primary/10 shadow-sm p-1">
              <Image
                src={config.logo}
                alt={config.systemName}
                width={48}
                height={48}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {config.systemName}
              </h1>
              <p className="text-sm text-slate-500 mt-1 font-medium">
                Acesso ao Painel de Controle
              </p>
            </div>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm text-slate-700 font-semibold">
                E-mail corporativo
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@empresa.com.br"
                required
                className="h-11 text-sm bg-white border-slate-200 focus-visible:ring-2 focus-visible:ring-primary/20 shadow-sm rounded-lg text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm text-slate-700 font-semibold">
                  Senha
                </label>
                <a href="#" className="text-xs font-medium text-primary hover:underline">
                  Esqueci minha senha
                </a>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-11 text-sm bg-white border-slate-200 focus-visible:ring-2 focus-visible:ring-primary/20 shadow-sm rounded-lg text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition-all active:scale-[0.98] mt-4"
            >
              {loading ? (
                "Entrando..."
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          {/* Rodapé */}
          <div className="mt-8 flex flex-col items-center justify-center space-y-4 border-t border-slate-100 pt-6">
            <Badge variant="outline" className="text-[11px] font-medium text-slate-500 border-slate-200 rounded-full px-3 py-1 bg-slate-50">
              <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
              Ambiente Seguro
            </Badge>
            {isDev && (
              <p className="text-[11px] text-slate-400 text-center">
                Autenticação de Desenvolvimento
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Lado Direito - Imagem/Banner (Escondido no Mobile) */}
      <div className="hidden lg:flex w-2/3 flex-col justify-center bg-slate-900 relative overflow-hidden">
        {/* Imagem do Usuário (sem gradientes para respeitar a arte original) */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/login-bg.png')" }}
        />
      </div>
    </div>
  );
}
