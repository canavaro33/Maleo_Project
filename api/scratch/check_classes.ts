import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const teacherCount = await prisma.teacher.count();
  console.log('Total Teachers:', teacherCount);

  const teachers = await prisma.teacher.findMany({
    take: 5,
    include: {
      schedules: { include: { class: true } },
      homeroomClasses: true
    }
  });

  teachers.forEach(t => {
    console.log(`Teacher: ${t.name} (ID: ${t.id})`);
    console.log(`  Schedules Classes: ${t.schedules.map(s => s.class.name).join(', ') || 'None'}`);
    console.log(`  Homeroom Classes: ${t.homeroomClasses.map(c => c.name).join(', ') || 'None'}`);
  });

  const targetClass = await prisma.class.findFirst({ 
    where: { name: { contains: 'IX' } },
    include: { homeroomTeacher: true } 
  });
  if (targetClass) {
    console.log(`Found Target Class: ${targetClass.name} (ID: ${targetClass.id}, Level: ${targetClass.level})`);
  } else {
    console.log('Class with "IX" not found in DB.');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
