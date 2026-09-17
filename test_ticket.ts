import { getTicketById } from './services/ticket/query-tickets.service';

async function test() {
  const prisma = (await import('./lib/prisma')).prisma;
  const t = await prisma.ticket.findFirst({ where: { ticketNumber: 69 } });
  if (!t) return console.log("Ticket not found");
  
  const ticket = await getTicketById(t.id);
  console.log("ProcessedEmails count:", ticket?.processedEmails?.length);
  ticket?.processedEmails?.forEach((pe: any) => console.log(pe.from, pe.receivedAt));
}
test().catch(console.error);
