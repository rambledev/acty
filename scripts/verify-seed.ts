// scripts/verify-seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifySeed() {
  try {
    console.log('🔍 Verifying seed data...');

    const faculties = await prisma.facultyRequirement.findMany();
    const students = await prisma.student.findMany();
    const activities = await prisma.activity.findMany();
    const qrCodes = await prisma.qRCode.findMany();

    console.log('\n📊 VERIFICATION RESULTS:');
    console.log('========================');
    console.log(`Faculty Requirements: ${faculties.length} records`);
    faculties.forEach(f => console.log(`   - ${f.faculty}`));
    
    console.log(`\nStudents: ${students.length} records`);
    students.forEach(s => console.log(`   - ${s.stdCode}: ${s.name}`));
    
    console.log(`\nActivities: ${activities.length} records`);
    activities.forEach(a => console.log(`   - ${a.name} (${a.group})`));
    
    console.log(`\nQR Codes: ${qrCodes.length} records`);
    qrCodes.forEach(q => console.log(`   - ${q.code} (${q.type})`));

    if (faculties.length > 0 && students.length > 0 && activities.length > 0) {
      console.log('\n✅ SEED VERIFICATION: PASSED');
    } else {
      console.log('\n❌ SEED VERIFICATION: FAILED');
    }

  } catch (error) {
    console.error('❌ Verification error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifySeed();