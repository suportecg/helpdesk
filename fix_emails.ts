import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany();
  for (const u of users) {
    const lower = u.email.trim().toLowerCase();
    if (u.email !== lower) {
      await prisma.user.update({ where: { id: u.id }, data: { email: lower } });
      console.log(`Fixed: ${u.email} -> ${lower}`);
    }
  }
}
main();
