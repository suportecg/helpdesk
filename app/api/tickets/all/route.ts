export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/services/audit/audit.service";

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Permissão insuficiente" }, { status: 403 });
    }

    const ipAddress = request.headers.get("x-forwarded-for") || undefined;

    // Delete all tickets. Cascading deletes will handle related entities if configured in schema.
    await prisma.ticket.deleteMany({});

    await logAuditEvent({
      userId: session.id,
      action: "DELETE_ALL_TICKETS",
      entity: "Ticket",
      entityId: "ALL",
      details: "Todos os chamados foram excluídos da base de dados.",
      ipAddress,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("[DELETE /api/tickets/all] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao excluir todos os chamados", details: error.message },
      { status: 500 }
    );
  }
}
