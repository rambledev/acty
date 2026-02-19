// scripts/seed.ts
import { PrismaClient, ActivityGroup, ActivityStatus, QRType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  try {
    // ตรวจสอบการเชื่อมต่อ database ก่อน
    console.log('🔌 Testing database connection...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful');

    // ล้างข้อมูลเดิมทั้งหมด
    console.log('🧹 Cleaning existing data...');
    await prisma.activityHistory.deleteMany();
    await prisma.qRCode.deleteMany();
    await prisma.activity.deleteMany();
    await prisma.student.deleteMany();
    await prisma.facultyRequirement.deleteMany();
    console.log('✅ Data cleaned');

    // 1. สร้างข้อมูลคณะ
    console.log('📚 Creating faculty requirements...');
    const facultyData = [
      { faculty: 'คณะวิศวกรรมศาสตร์', centralMin: 90, facultyMin: 90, freeMin: 50 },
      { faculty: 'คณะวิทยาศาสตร์', centralMin: 90, facultyMin: 90, freeMin: 50 },
      { faculty: 'คณะบริหารธุรกิจ', centralMin: 90, facultyMin: 90, freeMin: 50 },
      { faculty: 'คณะศิลปศาสตร์', centralMin: 90, facultyMin: 90, freeMin: 50 },
      { faculty: 'คณะนิติศาสตร์', centralMin: 90, facultyMin: 90, freeMin: 50 },
    ];

    for (const faculty of facultyData) {
      const result = await prisma.facultyRequirement.create({ 
        data: faculty 
      });
      console.log(`   - Created: ${result.faculty}`);
    }

    // 2. สร้างข้อมูลนักศึกษา
    console.log('👨‍🎓 Creating students...');
    const studentData = [
      { stdCode: 'B6300001', title: 'นาย', name: 'สมชาย ใจดี', faculty: 'คณะวิศวกรรมศาสตร์', program: 'วิศวกรรมคอมพิวเตอร์', centralHours: 30, facultyHours: 25, freeHours: 15 },
      { stdCode: 'B6300002', title: 'นางสาว', name: 'สุนิสา เก่งมาก', faculty: 'คณะวิทยาศาสตร์', program: 'วิทยาการคอมพิวเตอร์', centralHours: 45, facultyHours: 40, freeHours: 20 },
      { stdCode: 'B6300003', title: 'นาย', name: 'อนุชา สมาร์ท', faculty: 'คณะบริหารธุรกิจ', program: 'การจัดการ', centralHours: 60, facultyHours: 55, freeHours: 30 },
      { stdCode: 'B6300004', title: 'นางสาว', name: 'พรพิมล ฉลาดมาก', faculty: 'คณะวิศวกรรมศาสตร์', program: 'วิศวกรรมไฟฟ้า', centralHours: 85, facultyHours: 80, freeHours: 45 },
      { stdCode: 'B6300005', title: 'นาย', name: 'ธนวัฒน์ ทำงานดี', faculty: 'คณะศิลปศาสตร์', program: 'ภาษาอังกฤษ', centralHours: 20, facultyHours: 15, freeHours: 5 },
    ];

    for (const student of studentData) {
      const result = await prisma.student.create({ 
        data: student 
      });
      console.log(`   - Created: ${result.name} (${result.stdCode})`);
    }

    // 3. สร้างข้อมูลกิจกรรม (ใช้ string แทน enum ชั่วคราว)
    console.log('🎯 Creating activities...');
    const activityData = [
      {
        name: 'ปฐมนิเทศนักศึกษาใหม่',
        description: 'กิจกรรมปฐมนิเทศสำหรับนักศึกษาใหม่ประจำปี',
        startDate: new Date('2024-05-01T09:00:00Z'),
        endDate: new Date('2024-05-01T16:00:00Z'),
        group: ActivityGroup.CENTRAL,
        hours: 8,
        location: 'หอประชุมใหญ่',
        organizer: 'กองพัฒนานักศึกษา',
        status: ActivityStatus.ACTIVE,
      },
      {
        name: 'อบรมการเขียนโปรแกรม Python',
        description: 'การอบรมพื้นฐานการเขียนโปรแกรมด้วยภาษา Python',
        startDate: new Date('2024-05-10T13:00:00Z'),
        endDate: new Date('2024-05-10T16:00:00Z'),
        group: ActivityGroup.FACULTY,
        hours: 3,
        location: 'ห้อง Lab อาคารวิศวกรรม',
        organizer: 'คณะวิศวกรรมศาสตร์',
        status: ActivityStatus.ACTIVE,
      },
      {
        name: 'งานกีฬาสีภายในมหาวิทยาลัย',
        description: 'การแข่งขันกีฬาระหว่างคณะ',
        startDate: new Date('2024-05-15T08:00:00Z'),
        endDate: new Date('2024-05-17T18:00:00Z'),
        group: ActivityGroup.CENTRAL,
        hours: 6,
        location: 'สนามกีฬากลาง',
        organizer: 'สโมสรนักศึกษา',
        status: ActivityStatus.ACTIVE,
      },
    ];

    const createdActivities = [];
    for (const activity of activityData) {
      const result = await prisma.activity.create({ 
        data: activity 
      });
      createdActivities.push(result);
      console.log(`   - Created: ${result.name}`);
    }

    // 4. สร้าง QR Codes
    console.log('📱 Creating QR codes...');
    
    // กิจกรรมที่ 1: SINGLE_USE QR
    for (let i = 0; i < 2; i++) {
      await prisma.qRCode.create({
        data: {
          code: `QR_SINGLE_001_${i}`,
          activityId: createdActivities[0].id,
          type: QRType.SINGLE_USE,
          maxUses: 1,
          currentUses: 0,
          expiredAt: new Date('2024-05-02T23:59:59Z'),
        },
      });
    }

    // กิจกรรมที่ 2: MULTI_USE QR
    await prisma.qRCode.create({
      data: {
        code: 'QR_MULTI_001',
        activityId: createdActivities[1].id,
        type: QRType.MULTI_USE,
        maxUses: 999,
        currentUses: 0,
        expiredAt: new Date('2024-05-11T23:59:59Z'),
      },
    });

    console.log('✅ QR codes created');

    console.log('🎉 Seed completed successfully!');
    console.log('📊 Final summary:');
    console.log(`   - ${facultyData.length} faculties`);
    console.log(`   - ${studentData.length} students`);
    console.log(`   - ${activityData.length} activities`);

  } catch (error) {
    console.error('❌ Seed failed:');
    console.error(error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('💥 Fatal error:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔌 Database connection closed');
  });