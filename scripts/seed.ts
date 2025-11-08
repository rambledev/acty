// scripts/seed.ts
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Starting seed...');

  // สร้าง User และ Employee ตัวอย่าง
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  const user = await prisma.user.create({
    data: {
      username: 'employee01',
      password: hashedPassword,
      role: 'EMPLOYEE',
    },
  });

  const employee = await prisma.employee.create({
    data: {
      userId: user.id,
      titlePrefix: 'MR',
      firstName: 'สมชาย',
      lastName: 'เกิดมี',
      employeeCode: 'EMP001',
      affiliation: 'คณะเทคโนโลยีสารสนเทศ',
      email: 'employee01@university.ac.th',
      phone: '0812345678',
    },
  });

  // สร้าง System Settings
  await prisma.systemSettings.create({
    data: {
      requiredHours: 90,
      requiredCentral: 30,
      requiredFaculty: 30,
      requiredOptional: 30,
      academicYear: '2567',
      semester: '1',
    },
  });

  console.log('✅ Seed completed!');
  console.log('Employee created:', employee);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });