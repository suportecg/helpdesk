export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/services/rbac/rbac.service";
import { duplicateTicket } from "@/services/ticket/ticket-actions.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const canCreate = await hasPermission(session.id, "chamados.create");
    if (!canCreate) {
      return NextResponse.json({ error: "Acesso negado: permissão 'chamados.create' requerida." }, { status: 403 });
    }

    const { id } = await params;
    const ipAddress = request.headers.get("x-forwarded-for") || undefined;
    const duplicated = await duplicateTicket(id, session.id, session.name, ipAddress);

    return NextResponse.json(duplicated, { status: 201 });
  } catch (error: any) {
    console.error("[HelpDesk API] Erro em POST /api/tickets/[id]/duplicate:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao duplicar chamado." },
      { status: 500 }
    );
  }
}
