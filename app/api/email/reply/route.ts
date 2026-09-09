import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sendCustomEmail } from "@/services/email/email.service";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "TI")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const data = await request.json();
    const { to, subject, content, inReplyTo, menuPath, isPublic, attachments, cc, ticketId, nextStatus, solutionHtml } = data;

    if (!to || !subject || !content) {
      return NextResponse.json({ error: "Campos 'to', 'subject' e 'content' são obrigatórios" }, { status: 400 });
    }
    
    // Convert cc string to array if it exists and is a string, or use directly if it's an array
    let ccArray: string[] | undefined = undefined;
    if (cc) {
        if (typeof cc === 'string') {
            ccArray = cc.split(',').map(email => email.trim()).filter(Boolean);
        } else if (Array.isArray(cc)) {
            ccArray = cc;
        }
    }

    const result = await sendCustomEmail(to, subject, content, inReplyTo, ccArray);

    if (!result.success) {
      return NextResponse.json({ error: "Falha ao enviar e-mail", details: result.error }, { status: 500 });
    }

    // Salvar histórico no banco
    if (inReplyTo) {
      const existing = await prisma.processedEmail.findUnique({
        where: { messageId: inReplyTo }
      });
      
      if (existing) {
        const newReply = {
          date: new Date().toISOString(),
          adminName: session.name || "Admin",
          subject,
          content,
          menuPath: menuPath || null,
          isPublic: isPublic !== undefined ? isPublic : true,
          attachments: attachments || []
        };
        
        let replies: any[] = [];
        if (existing.manualReplies) {
          if (Array.isArray(existing.manualReplies)) {
            replies = [...existing.manualReplies];
          } else {
            replies = [existing.manualReplies];
          }
        }
        
        replies.push(newReply);
        let safeSolution = undefined;
        if (solutionHtml && isPublic) {
          const DOMPurify = require("isomorphic-dompurify");
          safeSolution = DOMPurify.sanitize(solutionHtml);
        }

        await prisma.$transaction(async (tx) => {
          await tx.processedEmail.update({
            where: { messageId: inReplyTo },
            data: { manualReplies: replies }
          });
          
          if (ticketId && nextStatus) {
            await tx.ticket.update({
              where: { id: ticketId },
              data: {
                status: nextStatus,
                ...(safeSolution !== undefined ? { solution: safeSolution } : {})
              }
            });
            await tx.ticketHistory.create({
              data: {
                ticketId,
                actorId: session.id || "admin",
                actorName: session.name || "Admin",
                eventType: "STATUS_CHANGED",
                description: `Alterou o status para ${nextStatus}.`,
              },
            });
          }
        });
      }
    } else if (ticketId && nextStatus) {
      // Caso não seja um inReplyTo (ex: e-mail solto mas atrelado a ticketId), ainda queremos atualizar status
      let safeSolution = undefined;
      if (solutionHtml && isPublic) {
        const DOMPurify = require("isomorphic-dompurify");
        safeSolution = DOMPurify.sanitize(solutionHtml);
      }
      await prisma.$transaction(async (tx) => {
        await tx.ticket.update({
          where: { id: ticketId },
          data: {
            status: nextStatus,
            ...(safeSolution !== undefined ? { solution: safeSolution } : {})
          }
        });
        await tx.ticketHistory.create({
          data: {
            ticketId,
            actorId: session.id || "admin",
            actorName: session.name || "Admin",
            eventType: "STATUS_CHANGED",
            description: `Alterou o status para ${nextStatus}.`,
          },
        });
      });
    }

    return NextResponse.json({ success: true, message: "E-mail enviado com sucesso" });
  } catch (error: any) {
    console.error("[Email Reply POST] Erro:", error);
    return NextResponse.json({ error: "Erro interno", details: error.message }, { status: 500 });
  }
}
