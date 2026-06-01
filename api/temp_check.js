const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    const usersCount = await prisma.user.count();
    const teachersCount = await prisma.teacher.count();
    const studentsCount = await prisma.student.count();
    
    console.log('Users count:', usersCount);
    console.log('Teachers count:', teachersCount);
    console.log('Students count:', studentsCount);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await prisma.disconnect();
  }
}

checkData();
