import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/services/audit/audit.service";
import { createTicketInMonthWithRetry } from "./create-ticket.service";

/**
 * Exclusão (Soft Delete) de chamado
 */
export async function deleteTicket(id: string, actorId?: string, ipAddress?: string) {
  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket || ticket.deletedAt) {
    throw new Error("Chamado não encontrado");
  }

  const deleted = await prisma.ticket.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await createAuditLog({
    userId: actorId,
    action: "DELETE_TICKET",
    entity: "Ticket",
    entityId: id,
    details: `Exclusão lógica (Soft Delete) do chamado #${ticket.ticketNumber}`,
    ipAddress,
  });

  return deleted;
}

/**
 * Alternar arquivamento do chamado
 */
export async function archiveTicket(
  id: string,
  isArchived: boolean,
  actorId?: string,
  actorName?: string,
  ipAddress?: string
) {
  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket || ticket.deletedAt) {
    throw new Error("Chamado não encontrado");
  }

  const updated = await prisma.ticket.update({
    where: { id },
    data: { isArchived },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: id,
      actorId: actorId || null,
      actorName: actorName || "Sistema",
      eventType: "ARCHIVED",
      description: isArchived ? "Chamado arquivado." : "Chamado restaurado dos arquivados.",
    },
  });

  await createAuditLog({
    userId: actorId,
    action: "ARCHIVE_TICKET",
    entity: "Ticket",
    entityId: id,
    details: `${isArchived ? "Arquivou" : "Restaurou"} o chamado #${ticket.ticketNumber}`,
    ipAddress,
  });

  return updated;
}

/**
 * Duplicar chamado existente
 */
export async function duplicateTicket(
  id: string,
  actorId?: string,
  actorName?: string,
  ipAddress?: string
) {
  const original = await prisma.ticket.findUnique({
    where: { id },
    include: {
      requester: true,
      sector: true,
      service: true,
    },
  });

  if (!original || original.deletedAt) {
    throw new Error("Chamado original não encontrado para duplicação");
  }

  const startTime = new Date();
  const ticketDateObj = new Date();
  const newTicket: any = await createTicketInMonthWithRetry(
    {
      problem: original.problem,
      description: original.description ? `(Duplicado do #${original.ticketNumber}) ${original.description}` : `Duplicado do chamado #${original.ticketNumber}`,
      requesterId: original.requesterId,
      sectorId: original.sectorId,
      technicianId: original.technicianId,
      serviceId: original.serviceId,
      status: "ABERTO",
      origin: original.origin,
      priority: original.priority,
      ticketDate: ticketDateObj,
      startTime,
      endTime: null,
      totalTimeMinutes: null,
      observations: original.observations,
      isArchived: false,
    },
    ticketDateObj
  );

  await prisma.ticketHistory.create({
    data: {
      ticketId: newTicket.id,
      actorId: actorId || null,
      actorName: actorName || "Sistema",
      eventType: "DUPLICATED",
      description: `Chamado duplicado a partir do #${original.ticketNumber}.`,
    },
  });

  if (newTicket.technician) {
    await prisma.ticketHistory.create({
      data: {
        ticketId: newTicket.id,
        actorId: actorId || null,
        actorName: actorName || "Sistema",
        eventType: "TECHNICIAN_ASSIGNED",
        description: `${newTicket.technician.name} assumiu.`,
      },
    });
  }

  await createAuditLog({
    userId: actorId,
    action: "DUPLICATE_TICKET",
    entity: "Ticket",
    entityId: newTicket.id,
    details: `Duplicou chamado #${original.ticketNumber} gerando novo chamado #${newTicket.ticketNumber}`,
    ipAddress,
  });

  return newTicket;
}

import { sendCustomEmail } from "../email/email.service";

/**
 * Adicionar comentário interno ao chamado
 */
export async function addTicketComment(
  ticketId: string,
  content: string,
  authorId: string,
  authorName?: string,
  isInternal: boolean = true,
  replyAll: boolean = false
) {
  const comment = await prisma.ticketComment.create({
    data: {
      ticketId,
      authorId,
      content: content.trim(),
      isInternal,
    },
    include: {
      author: { select: { id: true, name: true, email: true, avatar: true, role: true } },
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId,
      actorId: authorId,
      actorName: authorName || comment.author.name,
      eventType: "COMMENT_ADDED",
      description: isInternal ? `Adicionou nota interna.` : `Adicionou resposta pública.`,
    },
  });

  if (!isInternal && replyAll) {
    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: { requester: true }
      });
      if (ticket) {
        const to = ticket.requester.email;
        const ccs = ticket.cc ? ticket.cc.split(',').map(e => e.trim()).filter(Boolean) : undefined;
        
        if (to) {
          const subject = `Re: Chamado #${ticket.ticketNumber} - ${ticket.problem}`;
          const htmlContent = `
            <p>Olá,</p>
            <p>O chamado <strong>#${ticket.ticketNumber}</strong> recebeu uma nova resposta:</p>
            <blockquote style="border-left: 4px solid #ccc; padding-left: 10px; margin-left: 0; color: #555;">
              ${content.replace(/\n/g, '<br/>')}
            </blockquote>
            <p>Para responder, basta responder a este e-mail.</p>
          `;
          
          let inReplyTo: string | undefined = undefined;
          try {
            const ticketWithEmail = await prisma.ticket.findUnique({
              where: { id: ticketId },
              select: { processedEmails: { orderBy: { receivedAt: 'asc' }, take: 1, select: { messageId: true } } }
            });
            inReplyTo = ticketWithEmail?.processedEmails?.[0]?.messageId;
          } catch (e) {
            console.error("Error fetching original message ID", e);
          }

          await sendCustomEmail(to, subject, htmlContent, inReplyTo, ccs);
        }
      }
    } catch (err) {
      console.error("[EMAIL] Erro ao enviar notificação de resposta:", err);
    }
  }

  return comment;
}
