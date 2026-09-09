import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/services/rbac/rbac.service";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/services/audit/audit.service";
import { sendTicketResolvedEmail } from "@/services/email/email.service";

export async function POST(
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

    const { id: currentTicketId } = await params;
    const { targetTicketNumber, action } = await request.json();

    if (!targetTicketNumber || !action) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const currentTicket = await prisma.ticket.findUnique({
      where: { id: currentTicketId },
      include: { children: true, requester: true }
    });

    if (!currentTicket) {
      return NextResponse.json({ error: "Chamado atual não encontrado." }, { status: 404 });
    }

    const targetTicket = await prisma.ticket.findFirst({
      where: { ticketNumber: targetTicketNumber },
      include: { children: true }
    });

    if (!targetTicket) {
      return NextResponse.json({ error: "Chamado destino não encontrado." }, { status: 404 });
    }

    if (currentTicket.id === targetTicket.id) {
      return NextResponse.json({ error: "Não é possível vincular o chamado a ele mesmo." }, { status: 400 });
    }

    const ipAddress = request.headers.get("x-forwarded-for") || undefined;

    if (action === "LINK") {
      // LINK: Current Ticket = PARENT, Target Ticket = CHILD
      if (currentTicket.parentId) {
        return NextResponse.json({ error: "O chamado atual já é filho de outro chamado e não pode ter sub-tarefas (Limite de 1 nível)." }, { status: 400 });
      }
      if (targetTicket.children.length > 0) {
        return NextResponse.json({ error: "O chamado que você tentou vincular possui filhos e não pode se tornar filho de outro chamado." }, { status: 400 });
      }
      if (targetTicket.parentId === currentTicket.id) {
        return NextResponse.json({ error: "Este vínculo já existe." }, { status: 400 });
      }
      if (targetTicket.parentId) {
        return NextResponse.json({ error: "O chamado que você tentou vincular já é filho de outro chamado." }, { status: 400 });
      }

      // Update target ticket to be child of current ticket
      await prisma.ticket.update({
        where: { id: targetTicket.id },
        data: { parentId: currentTicket.id }
      });

      // Add timeline to both
      await prisma.ticketHistory.create({
        data: {
          ticketId: targetTicket.id,
          actorId: session.id,
          actorName: session.name,
          eventType: "LINK_ADDED",
          description: `Vinculado como filho do chamado #${currentTicket.ticketNumber}.`
        }
      });
      await prisma.ticketHistory.create({
        data: {
          ticketId: currentTicket.id,
          actorId: session.id,
          actorName: session.name,
          eventType: "LINK_ADDED",
          description: `Chamado #${targetTicket.ticketNumber} vinculado como sub-tarefa/filho.`
        }
      });

      await createAuditLog({
        userId: session.id,
        action: "LINK_TICKET",
        entity: "Ticket",
        entityId: currentTicket.id,
        details: `Vinculou ticket #${targetTicket.ticketNumber} como filho.`,
        ipAddress,
      });

      return NextResponse.json({ success: true });

    } else if (action === "MERGE_CANCEL") {
      // MERGE_CANCEL: Current Ticket = CHILD (will be cancelled), Target Ticket = PARENT
      if (targetTicket.parentId) {
        return NextResponse.json({ error: "O chamado destino já é filho de outro chamado e não pode ser pai de chamados mesclados." }, { status: 400 });
      }
      if (currentTicket.children.length > 0) {
        return NextResponse.json({ error: "O chamado atual possui filhos e não pode ser mesclado (transformado em filho)." }, { status: 400 });
      }
      if (currentTicket.parentId === targetTicket.id) {
         // Already linked, but not cancelled maybe?
         // We can proceed to cancel it anyway.
      } else if (currentTicket.parentId) {
        return NextResponse.json({ error: "O chamado atual já é filho de outro chamado." }, { status: 400 });
      }
      
      // Update current ticket
      const updatedTicket = await prisma.ticket.update({
        where: { id: currentTicket.id },
        data: { 
          parentId: targetTicket.id,
          status: "CANCELADO"
        },
        include: { requester: true, sector: true, service: true, technician: true }
      });

      // History
      await prisma.ticketHistory.create({
        data: {
          ticketId: currentTicket.id,
          actorId: session.id,
          actorName: session.name,
          eventType: "STATUS_CHANGED",
          description: `Status alterado para Cancelado. Motivo: Mesclado com chamado #${targetTicket.ticketNumber}.`
        }
      });
      await prisma.ticketHistory.create({
        data: {
          ticketId: targetTicket.id,
          actorId: session.id,
          actorName: session.name,
          eventType: "LINK_ADDED",
          description: `Chamado #${currentTicket.ticketNumber} foi duplicado/mesclado para este chamado e cancelado.`
        }
      });

      // Internal comment on Parent
      await prisma.ticketComment.create({
        data: {
          ticketId: targetTicket.id,
          authorId: session.id,
          content: `O chamado duplicado #${currentTicket.ticketNumber} (${currentTicket.problem}) foi mesclado a este chamado.`,
          isInternal: true
        }
      });

      // Email Notification to the Requester of the cancelled ticket
      try {
        const solutionText = `Sua solicitação foi identificada como duplicada ou relacionada a um incidente maior, e foi consolidada no chamado principal #${targetTicket.ticketNumber} (${targetTicket.problem}). Acompanharemos e resolveremos tudo pelo chamado principal.`;
        
        await sendTicketResolvedEmail(
          updatedTicket as any, 
          currentTicket.requester.email, 
          currentTicket.requester.name, 
          solutionText
        );
      } catch (err) {
        console.error("[MERGE] Erro ao enviar e-mail de mesclagem:", err);
      }

      await createAuditLog({
        userId: session.id,
        action: "MERGE_TICKET",
        entity: "Ticket",
        entityId: currentTicket.id,
        details: `Mesclou e cancelou ticket no ticket principal #${targetTicket.ticketNumber}.`,
        ipAddress,
      });

      return NextResponse.json({ success: true });

    } else if (action === "UNLINK") {
      // Find which one is the child
      let childToUnlink = null;
      let parentToUnlink = null;

      if (currentTicket.parentId === targetTicket.id) {
        childToUnlink = currentTicket;
        parentToUnlink = targetTicket;
      } else if (targetTicket.parentId === currentTicket.id) {
        childToUnlink = targetTicket;
        parentToUnlink = currentTicket;
      } else {
        return NextResponse.json({ error: "Estes chamados não estão vinculados." }, { status: 400 });
      }

      await prisma.ticket.update({
        where: { id: childToUnlink.id },
        data: { parentId: null }
      });

      // History
      await prisma.ticketHistory.create({
        data: {
          ticketId: childToUnlink.id,
          actorId: session.id,
          actorName: session.name,
          eventType: "LINK_REMOVED",
          description: `Vínculo removido com o chamado principal #${parentToUnlink.ticketNumber}.`
        }
      });
      await prisma.ticketHistory.create({
        data: {
          ticketId: parentToUnlink.id,
          actorId: session.id,
          actorName: session.name,
          eventType: "LINK_REMOVED",
          description: `Vínculo removido com o sub-tarefa/filho #${childToUnlink.ticketNumber}.`
        }
      });

      await createAuditLog({
        userId: session.id,
        action: "UNLINK_TICKET",
        entity: "Ticket",
        entityId: currentTicket.id,
        details: `Desvinculou ticket #${targetTicket.ticketNumber}.`,
        ipAddress,
      });

      return NextResponse.json({ success: true });

    } else {
      return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
    }

  } catch (error: any) {
    console.error("[HelpDesk API] Erro em POST /api/tickets/[id]/link:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
