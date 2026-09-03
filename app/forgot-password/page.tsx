"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      toast.error("Por favor, digite seu e-mail.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Falha ao solicitar redefinição de senha.");
      }

      setSuccess(true);
      toast.success("E-mail de recuperação enviado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-card border border-border p-8 rounded-2xl shadow-xl relative overflow-hidden">
        {/* Decorativo */}
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <svg className="w-32 h-32 text-primary" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative z-10"
        >
          {success ? (
            <div className="text-center py-6">
              <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">E-mail Enviado!</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Se houver uma conta cadastrada com <strong>{email}</strong>, você receberá um link seguro para redefinir sua senha em instantes.
              </p>
              <Link href="/login">
                <Button className="w-full" variant="outline">
                  Voltar para o Login
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <Link href="/login" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-4">
                  <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
                </Link>
                <h1 className="text-2xl font-bold text-foreground font-display tracking-tight">Recuperar Senha</h1>
                <p className="text-sm text-muted-foreground mt-2">
                  Informe o e-mail cadastrado na sua conta para receber um link de redefinição de senha.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    E-mail Corporativo
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="voce@cgconstrucoes.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-background/50 h-11"
                  />
                </div>

                <Button type="submit" className="w-full h-11 text-sm font-bold shadow-md" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enviando...
                    </span>
                  ) : (
                    "Enviar Link de Recuperação"
                  )}
                </Button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
