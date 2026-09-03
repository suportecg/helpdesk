import { NextRequest, NextResponse } from "next/server";
import { checkAndProcessEmails } from "@/services/email/email-processor.service";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  // Proteger o endpoint para não ser chamado por qualquer um
  // Pode ser chamado pelo cron da Vercel ou via interface (passando o token certo)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || process.env.NEXT_PUBLIC_CRON_SECRET || "helpdesk-cron-secret-123";
  
  // Verifica se a requisição tem o segredo do cron
  const isCronAuthorized = authHeader === `Bearer ${cronSecret}`;
  
  // Ou verifica se foi chamada por um admin logado no painel
  const session = await getSession();
  const isAdmin = session?.role === "ADMIN" || session?.role === "TI";

  if (!isCronAuthorized && !isAdmin) {
    return NextResponse.json({ error: "Não autorizado", details: "Header ou sessão inválidos" }, { status: 401 });
  }

  try {
    const result = await checkAndProcessEmails();
    
    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error: any) {
    console.error("[CRON EMAIL] Erro fatal na rota:", error);
    return NextResponse.json(
      { error: "Erro interno no cron", details: error.message },
      { status: 500 }
    );
  }
}

// Também permitimos GET para facilitar o Vercel Cron
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || process.env.NEXT_PUBLIC_CRON_SECRET || "helpdesk-cron-secret-123";
  
  // Verifica se a requisição tem o segredo do cron
  const isCronAuthorized = authHeader === `Bearer ${cronSecret}`;
  
  // Ou verifica se foi chamada por um admin logado no painel
  const session = await getSession();
  const isAdmin = session?.role === "ADMIN" || session?.role === "TI";

  if (!isCronAuthorized && !isAdmin) {
    return NextResponse.json({ error: "Não autorizado", details: "Header ou sessão inválidos" }, { status: 401 });
  }

  try {
    const result = await checkAndProcessEmails();
    
    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro interno no cron", details: error.message },
      { status: 500 }
    );
  }
}
