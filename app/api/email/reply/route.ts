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
    const { to, subject, content, inReplyTo } = data;

    if (!to || !subject || !content) {
      return NextResponse.json({ error: "Campos 'to', 'subject' e 'content' são obrigatórios" }, { status: 400 });
    }
    const result = await sendCustomEmail(to, subject, content, inReplyTo);

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
          content
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
        
        await prisma.processedEmail.update({
          where: { messageId: inReplyTo },
          data: { manualReplies: replies }
        });
      }
    }

    return NextResponse.json({ success: true, message: "E-mail enviado com sucesso" });
  } catch (error: any) {
    console.error("[Email Reply POST] Erro:", error);
    return NextResponse.json({ error: "Erro interno", details: error.message }, { status: 500 });
  }
}
