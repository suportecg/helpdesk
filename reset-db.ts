import { prisma } from "./lib/prisma";

async function main() {
  console.log("Deletando histórico de chamados...");
  await prisma.ticketHistory.deleteMany();
  
  console.log("Deletando todos os chamados...");
  const result = await prisma.ticket.deleteMany();
  
  console.log(`Deletados ${result.count} chamados.`);
  
  // Optional: Deletar solicitante 'Usuário Não Informado'
  await prisma.requester.deleteMany({
    where: {
      name: "Usuário Não Informado"
    }
  });

  // Optional: Deletar setor 'Geral' se estiver vazio
  try {
     await prisma.sector.deleteMany({
       where: {
         name: "Geral"
       }
     });
  } catch(e) {
     // ignora se estiver em uso
  }
}

main()
  .then(() => console.log("Limpeza concluída!"))
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
