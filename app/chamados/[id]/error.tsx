"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function ErrorTicket({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center bg-background">
      <div className="flex max-w-md flex-col items-center text-center p-8 rounded-xl border bg-card shadow-sm">
        <div className="rounded-full bg-destructive/10 p-4 mb-4">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-bold mb-2">Ops! Algo deu errado</h2>
        <p className="text-muted-foreground mb-6 text-sm">
          Não foi possível carregar as informações deste ticket. O ticket pode ter sido excluído ou você não tem permissão para acessá-lo.
        </p>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => reset()}>
            Tentar novamente
          </Button>
          <Button asChild>
            <Link href="/chamados">
              Voltar para Tickets
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
