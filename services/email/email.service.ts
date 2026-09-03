import sgMail from '@sendgrid/mail';
import { getCorporateSettings } from "@/services/settings/settings.service";
import { prisma } from "@/lib/prisma";

// Set the API key if available
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

/**
 * Base email layout to inject content into, styled according to the corporate settings.
 */
function getEmailLayout(settings: any, title: string, content: string): string {
  const primaryColor = settings.primaryColor || '#2563eb';
  const logo = settings.favicon || 'https://via.placeholder.com/150x50?text=Logo'; // Fallback logic
  const systemName = settings.systemName || 'HelpDesk Pro';
  
  // Basic responsive email template
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f5;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        .header {
          background-color: ${primaryColor};
          padding: 24px;
          text-align: center;
          color: #ffffff;
        }
        .header h1 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
        }
        .content {
          padding: 32px 24px;
          color: #3f3f46;
          line-height: 1.6;
        }
        .footer {
          background-color: #fafafa;
          padding: 24px;
          text-align: center;
          font-size: 12px;
          color: #a1a1aa;
          border-top: 1px solid #f4f4f5;
        }
        .button {
          display: inline-block;
          background-color: ${primaryColor};
          color: #ffffff;
          padding: 10px 20px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
          margin-top: 16px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${title}</h1>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>${systemName}</p>
          <p>Este é um e-mail automático, não responda.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Sends a raw HTML email using SendGrid.
 */
async function sendHtmlEmail(to: string, subject: string, html: string, inReplyToMessageId?: string, cc?: string[]) {
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'suporte@empresa.com.br';
  const fromName = process.env.SENDGRID_FROM_NAME || 'HelpDesk';

  const msg: any = {
    to,
    from: {
      email: fromEmail,
      name: fromName,
    },
    subject,
    html,
  };

  if (cc && cc.length > 0) {
    msg.cc = cc;
  }

  if (inReplyToMessageId) {
    // Para agrupar no GMail / Outlookk
    msg.headers = {
      'In-Reply-To': inReplyToMessageId,
      'References': inReplyToMessageId,
    };
  }

  try {
    await sgMail.send(msg);
    console.log(`[EMAIL] E-mail enviado com sucesso para ${to}`);
    return { success: true, bodyHtml: html };
  } catch (error: any) {
    console.error(`[EMAIL] Falha ao enviar e-mail para ${to}:`, error.response?.body || error.message);
    // Retornamos falso em vez de lançar exceção para não quebrar fluxos (ex: criação de chamado)
    return { success: false, error: error.message, bodyHtml: html };
  }
}

async function getTicketEmailMetadata(ticketId: string) {
  try {
    const t = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { 
        cc: true, 
        processedEmails: { 
          orderBy: { receivedAt: 'asc' }, 
          take: 1, 
          select: { messageId: true } 
        } 
      }
    });
    const ccList = t?.cc ? t.cc.split(',').map(c => c.trim()).filter(Boolean) : undefined;
    const inReplyTo = t?.processedEmails?.[0]?.messageId;
    return { ccList, inReplyTo };
  } catch (e) {
    return { ccList: undefined, inReplyTo: undefined };
  }
}

/**
 * Envia um e-mail customizado digitado manualmente pelo administrador.
 */
export async function sendCustomEmail(to: string, subject: string, content: string, inReplyToMessageId?: string, cc?: string[]) {
  const settings = await getCorporateSettings();
  
  // Limpar quebras de linha para formatar direitinho no HTML
  const formattedContent = content.replace(/\n/g, '<br />');
  
  const html = getEmailLayout(settings, subject, formattedContent);
  return sendHtmlEmail(to, subject, html, inReplyToMessageId, cc);
}

/**
 * Envia um e-mail de teste utilizando o layout corporativo.
 */
export async function sendTestEmail(to: string) {
  console.log(`[EMAIL] Preparando e-mail de teste para ${to}...`);
  const settings = await getCorporateSettings();
  
  const content = `
    <p>Olá!</p>
    <p>Este é um e-mail de teste enviado pelo sistema <strong>${settings.systemName}</strong>.</p>
    <p>A integração com o serviço de e-mail (SendGrid) está funcionando corretamente!</p>
  `;
  
  const html = getEmailLayout(settings, 'E-mail de Teste — Integração Concluída', content);
  
  return sendHtmlEmail(to, 'Teste de Integração de E-mail', html);
}

/**
 * Envia um e-mail notificando o solicitante sobre a abertura de um novo chamado.
 */
export async function sendTicketCreatedEmail(ticketData: any, requesterEmail: string, requesterName: string) {
  if (!requesterEmail) {
    console.log(`[EMAIL] Solicitante ${requesterName} não possui e-mail cadastrado. Abortando notificação.`);
    return { success: false, reason: 'NO_EMAIL' };
  }

  console.log(`[EMAIL] Preparando notificação de abertura de chamado para ${requesterEmail}...`);
  const settings = await getCorporateSettings();
  const dateStr = ticketData.ticketDate ? new Date(ticketData.ticketDate).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
  
  // Buscar template no banco
  let template = await prisma.emailTemplate.findUnique({
    where: { code: 'TICKET_CREATED' }
  });
  
  // Variáveis disponíveis
  const vars: Record<string, string> = {
    '{{requesterName}}': requesterName || 'Cliente',
    '{{ticketNumber}}': String(ticketData.ticketNumber || ''),
    '{{problem}}': ticketData.problem || '',
    '{{status}}': ticketData.status || '',
    '{{priority}}': ticketData.priority || '',
    '{{date}}': dateStr,
    '{{systemName}}': settings.systemName,
  };
  
  let subject = `Chamado #${ticketData.ticketNumber} aberto — ${settings.systemName}`;
  let content = '';

  if (template) {
    subject = template.subject;
    content = template.bodyHtml;
    // Apply variables to subject and content
    for (const [key, value] of Object.entries(vars)) {
      subject = subject.replace(new RegExp(key, 'g'), value);
      content = content.replace(new RegExp(key, 'g'), value);
    }
    
    // Fallback if the user removes all content
    if (!content.trim()) {
      content = `<p>Seu chamado foi registrado.</p>`;
    }
  } else {
    // Template hardcoded fallback (caso ainda não exista no banco)
    content = `
      <p>Olá, <strong>${requesterName}</strong>!</p>
      <p>Seu chamado foi registrado com sucesso em nosso sistema.</p>
      
      <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
        <p style="margin: 0 0 8px 0;"><strong>Chamado:</strong> #${ticketData.ticketNumber}</p>
        <p style="margin: 0 0 8px 0;"><strong>Problema:</strong> ${ticketData.problem}</p>
        <p style="margin: 0 0 8px 0;"><strong>Status:</strong> ${ticketData.status}</p>
        <p style="margin: 0 0 8px 0;"><strong>Prioridade:</strong> ${ticketData.priority}</p>
        <p style="margin: 0;"><strong>Data de abertura:</strong> ${dateStr}</p>
      </div>
      
      <p>Nossa equipe técnica já recebeu sua solicitação e dará continuidade ao atendimento o mais breve possível.</p>
      <p>Você receberá novas atualizações sobre este chamado por e-mail.</p>
      
      <p>Atenciosamente,<br>Equipe <strong>${settings.systemName}</strong></p>
    `;
  }
  
  const html = getEmailLayout(
    template?.primaryColor ? { ...settings, primaryColor: template.primaryColor } : settings, 
    template?.name || `Chamado #${ticketData.ticketNumber} Aberto`, 
    content
  );
  
  const { ccList, inReplyTo } = await getTicketEmailMetadata(ticketData.id);
  
  return sendHtmlEmail(requesterEmail, subject, html, inReplyTo, ccList);
}

/**
 * Envia um e-mail notificando o solicitante sobre a resolução de um chamado.
 */
export async function sendTicketResolvedEmail(ticketData: any, requesterEmail: string, requesterName: string, solutionText: string) {
  if (!requesterEmail) return { success: false, reason: 'NO_EMAIL' };

  console.log(`[EMAIL] Preparando notificação de resolução para ${requesterEmail}...`);
  const settings = await getCorporateSettings();
  const dateStr = new Date().toLocaleDateString('pt-BR');
  
  let template = await prisma.emailTemplate.findUnique({
    where: { code: 'TICKET_RESOLVED' }
  });
  
  const vars: Record<string, string> = {
    '{{requesterName}}': requesterName || 'Cliente',
    '{{ticketNumber}}': String(ticketData.ticketNumber || ''),
    '{{problem}}': ticketData.problem || '',
    '{{status}}': 'RESOLVIDO',
    '{{priority}}': ticketData.priority || '',
    '{{date}}': dateStr,
    '{{systemName}}': settings.systemName,
    '{{solution}}': solutionText || 'Seu problema foi resolvido.',
  };
  
  let subject = `Chamado #${ticketData.ticketNumber} resolvido — ${settings.systemName}`;
  let content = '';

  if (template) {
    subject = template.subject;
    content = template.bodyHtml;
    for (const [key, value] of Object.entries(vars)) {
      subject = subject.replace(new RegExp(key, 'g'), value);
      content = content.replace(new RegExp(key, 'g'), value);
    }
    if (!content.trim()) content = `<p>O chamado foi concluído.</p>`;
  } else {
    content = `
      <p>Olá, <strong>${requesterName}</strong>!</p>
      <p>Temos uma ótima notícia: o seu chamado foi <strong>resolvido</strong>!</p>
      <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
        <p style="margin: 0 0 8px 0;"><strong>Chamado:</strong> #${ticketData.ticketNumber}</p>
        <p style="margin: 0 0 8px 0;"><strong>Solução:</strong> ${vars['{{solution}}']}</p>
      </div>
      <p>Se precisar de mais alguma coisa, não hesite em abrir um novo chamado.</p>
    `;
  }
  
  const html = getEmailLayout(
    template?.primaryColor ? { ...settings, primaryColor: template.primaryColor } : settings, 
    template?.name || `Chamado #${ticketData.ticketNumber} Resolvido`, 
    content
  );
  
  const { ccList, inReplyTo } = await getTicketEmailMetadata(ticketData.id);

  return sendHtmlEmail(requesterEmail, subject, html, inReplyTo, ccList);
}
