import { prisma } from './lib/prisma';

async function main() {
  const tickets = await prisma.ticket.findMany({
    where: { ticketNumber: { in: [48, 50] } },
    include: { pauses: true, history: { orderBy: { createdAt: 'desc' } } }
  });

  for (const t of tickets) {
    console.log(`Ticket ${t.ticketNumber}: status=${t.status}, pauses=${t.pauses.length}`);
    if ((t.status === 'AGUARDANDO_USUARIO' || t.status === 'AGUARDANDO_TERCEIROS') && t.pauses.filter(p => !p.endTime).length === 0) {
      // Find when it entered the current status
      const hist = await prisma.ticketHistory.findFirst({
        where: { ticketId: t.id },
        orderBy: { createdAt: 'desc' }
      });
      
      const startTime = hist ? hist.createdAt : new Date();
      
      console.log(`Fixing ticket ${t.ticketNumber}, inserting pause from ${startTime}`);
      
      await prisma.ticketPause.create({
        data: {
          ticketId: t.id,
          reason: `Pausa retroativa: ${t.status}`,
          startTime: startTime
        }
      });
    }
  }
}

main().catch(console.error);
