import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const ticket = await prisma.ticket.findFirst({ where: { ticketNumber: 69 } });
  if (!ticket) return console.log("Ticket 69 not found");
  
  const emails = await prisma.processedEmail.findMany({ where: { ticketId: ticket.id } });
  console.log(`Found ${emails.length} emails for ticket 69`);
  for (const e of emails) {
    console.log(`- ${e.from} | ${e.subject} | Status: ${e.status}`);
  }
}
run().finally(() => prisma.$disconnect());
