export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/services/rbac/rbac.service";
import { archiveTicket } from "@/services/ticket/ticket-actions.service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const canUpdate = await hasPermission(session.id, "chamados.update");
    if (!canUpdate) {
      return NextResponse.json({ error: "Acesso negado: permissão 'chamados.update' requerida." }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { isArchived } = body;

    const ipAddress = request.headers.get("x-forwarded-for") || undefined;
    const updated = await archiveTicket(
      id,
      Boolean(isArchived),
      session.id,
      session.name,
      ipAddress
    );

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[HelpDesk API] Erro em PATCH /api/tickets/[id]/archive:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao arquivar/restaurar chamado." },
      { status: 500 }
    );
  }
}
