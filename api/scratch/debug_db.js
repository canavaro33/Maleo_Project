const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debug() {
  console.log("--- DEBUGGING USER & TEACHER RELATION ---");
  
  const users = await prisma.user.findMany({
    include: {
      teacher: {
        include: {
          subjects: true,
          homeroomClasses: true
        }
      }
    }
  });

  console.log(JSON.stringify(users, null, 2));

  console.log("--- ALL TEACHERS ---");
  const teachers = await prisma.teacher.findMany({
    include: {
      subjects: true,
      homeroomClasses: true
    }
  });
  console.log(JSON.stringify(teachers, null, 2));

  console.log("--- ALL SUBJECTS ---");
  const subjects = await prisma.subject.findMany();
  console.log(JSON.stringify(subjects, null, 2));
}

debug()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
