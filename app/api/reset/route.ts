export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/services/rbac/rbac.service";
import { prisma } from "@/lib/prisma";

/**
 * DELETE /api/reset
 * Resets operational data while preserving structural/config data
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Only ADMIN can reset
    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Apenas administradores podem resetar o banco." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { confirmText } = body;

    if (confirmText !== "RESETAR") {
      return NextResponse.json(
        { error: "Texto de confirmação incorreto. Digite RESETAR para continuar." },
        { status: 400 }
      );
    }

    // Execute deletion in proper order to respect FK constraints
    await prisma.$transaction(async (tx) => {
      // 1. Ticket-related entities first
      await tx.ticketAttachment.deleteMany({});
      await tx.ticketComment.deleteMany({});
      await tx.ticketHistory.deleteMany({});
      // 2. Tickets themselves
      await tx.ticket.deleteMany({});
      // 3. Requesters (only used by tickets)
      await tx.requester.deleteMany({});
      // 4. Audit logs
      await tx.auditLog.deleteMany({});
      // 5. Import logs
      await tx.importLog.deleteMany({});
      // 6. Notifications
      await tx.notification.deleteMany({});
    });

    return NextResponse.json({
      success: true,
      message: "Banco de dados resetado com sucesso. Dados operacionais removidos.",
      preserved: [
        "Empresa", "Configurações", "Usuários", "Papéis",
        "Permissões", "Serviços", "Setores", "Catálogos",
        "White Label", "Logo", "Tema",
      ],
      deleted: [
        "Tickets", "Comentários", "Timeline", "Anexos",
        "Solicitantes", "Auditoria", "Importações", "Notificações",
      ],
    });
  } catch (error: any) {
    console.error("[DELETE /api/reset] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao resetar banco de dados", details: error.message },
      { status: 500 }
    );
  }
}
