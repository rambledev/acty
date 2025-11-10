// test-data.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testData() {
  console.log('🎓 นักศึกษา:');
  const students = await prisma.student.findMany();
  console.table(students.map(s => ({
    id: s.id,
    รหัส: s.stdCode,
    ชื่อ: s.name,
    คณะ: s.faculty,
    กิจกรรมกลาง: s.centralHours,
    กิจกรรมคณะ: s.facultyHours,
    กิจกรรมเสรี: s.freeHours
  })));

  console.log('\n🏛️ กิจกรรม:');
  const activities = await prisma.activity.findMany();
  console.table(activities.map(a => ({
    id: a.id,
    ชื่อ: a.name,
    กลุ่ม: a.group,
    ชั่วโมง: a.hours
  })));

  console.log('\n🔗 QR Codes:');
  const qrCodes = await prisma.qRCode.findMany({
    include: { activity: true }
  });
  console.table(qrCodes.map(q => ({
    id: q.id,
    code: q.code,
    กิจกรรม: q.activity.name,
    type: q.type,
    ใช้แล้ว: q.currentUses + '/' + q.maxUses,
    หมดอายุ: q.expiredAt?.toLocaleDateString('th-TH')
  })));
}

testData().catch(console.error).finally(() => prisma.$disconnect());