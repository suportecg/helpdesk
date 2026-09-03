import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/services/rbac/rbac.service";
import { sendTestEmail } from "@/services/email/email.service";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Apenas ADMIN ou TI podem testar configurações de e-mail (ou quem tiver permissão específica de settings)
    const canManageSettings = await hasPermission(session.id, "settings.manage");
    if (!canManageSettings && session.role !== "ADMIN" && session.role !== "TI") {
      return NextResponse.json(
        { error: "Acesso negado: permissão insuficiente." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { to } = body;

    if (!to || !to.includes("@")) {
      return NextResponse.json(
        { error: "E-mail de destino inválido." },
        { status: 400 }
      );
    }

    // Validação extra simples se a chave está configurada (para erro amigável caso não esteja)
    if (!process.env.SENDGRID_API_KEY) {
      console.warn("[EMAIL] Tentativa de teste de e-mail sem SENDGRID_API_KEY configurada.");
      return NextResponse.json(
        { error: "A chave de API do SendGrid (SENDGRID_API_KEY) não está configurada no servidor." },
        { status: 500 }
      );
    }

    const result = await sendTestEmail(to);

    if (result.success) {
      return NextResponse.json({ success: true, message: "E-mail enviado com sucesso" }, { status: 200 });
    } else {
      return NextResponse.json(
        { error: "Falha ao enviar e-mail pelo SendGrid", details: result.error },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[POST /api/settings/email/test] Erro inesperado:", error);
    return NextResponse.json(
      { error: "Erro inesperado ao testar e-mail", details: error.message },
      { status: 500 }
    );
  }
}
