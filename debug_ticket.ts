import { prisma } from './lib/prisma';
import { calculateBusinessMinutes } from './lib/business-hours';

async function main() {
  const t = await prisma.ticket.findFirst({
    where: { ticketNumber: 48 },
    include: { pauses: true }
  });
  
  if (!t) return console.log("Not found");
  
  const sTime = t.startTime ? new Date(t.startTime) : new Date(t.ticketDate);
  const eTime = t.endTime ? new Date(t.endTime) : new Date();
  const mins = calculateBusinessMinutes(sTime, eTime);
  
  let pauseMins = 0;
  for (const p of t.pauses) {
      if (p.duration) {
          pauseMins += p.duration;
      } else {
          pauseMins += calculateBusinessMinutes(new Date(p.startTime), new Date());
      }
  }
  
  console.log(`Ticket 48:`);
  console.log(`sTime: ${sTime}`);
  console.log(`eTime: ${eTime}`);
  console.log(`Total mins: ${mins}`);
  console.log(`Pauses: ${JSON.stringify(t.pauses)}`);
  console.log(`Total pause mins: ${pauseMins}`);
  console.log(`Result: ${mins - pauseMins}`);
}

main();
