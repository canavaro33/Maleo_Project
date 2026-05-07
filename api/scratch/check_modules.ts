import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.learningModule.count();
  console.log('Total modules:', count);
}

main().catch(console.error).finally(() => prisma.$disconnect());
