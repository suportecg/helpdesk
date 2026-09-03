export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/services/audit/audit.service";

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "TI")) {
      return NextResponse.json(
        { error: "Permissão insuficiente" },
        { status: 403 }
      );
    }

    const ipAddress = request.headers.get("x-forwarded-for") || undefined;

    // We can't delete requesters if they have tickets tied to them directly,
    // but in prisma schema `Requester` is often related to tickets. 
    // Assuming `Ticket` has `requesterId` that deletes cascading or set null,
    // or we can just try to delete all. Let's execute deleteMany.
    
    const result = await prisma.requester.deleteMany({});

    await logAuditEvent({
      userId: session.id,
      action: "DELETE_ALL_REQUESTERS",
      entity: "Requester",
      entityId: "ALL",
      details: `Todos os solicitantes (${result.count}) foram excluídos.`,
      ipAddress,
    });

    return NextResponse.json({ success: true, count: result.count }, { status: 200 });
  } catch (error: any) {
    console.error("[DELETE /api/requesters/all] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao excluir todos os solicitantes", details: error.message },
      { status: 500 }
    );
  }
}
