const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const ticket = await prisma.ticket.findFirst({ where: { ticketNumber: 69 }, include: { processedEmails: true } });
  if (!ticket) return console.log("Ticket not found");
  
  console.log("ProcessedEmails count:", ticket.processedEmails.length);
  ticket.processedEmails.forEach(pe => console.log(pe.id, pe.from, pe.status));
}
run().finally(() => prisma.$disconnect());
