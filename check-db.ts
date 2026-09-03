import { prisma } from "./lib/prisma";
async function main() {
  const tickets = await prisma.ticket.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { requester: true, sector: true, technician: true }
  });
  console.log(JSON.stringify(tickets, null, 2));
}
main().finally(() => prisma.$disconnect());
