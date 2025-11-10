// prisma/seed.ts
import { PrismaClient, ActivityGroup, QRType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 เริ่มต้น Seeding ข้อมูล...');

  // ลบข้อมูลเก่าทั้งหมด (เรียงลำดับเพื่อหลีกเลี่ยง Foreign Key Constraint)
  await prisma.$transaction([
    prisma.activityHistory.deleteMany(),
    prisma.qRCode.deleteMany(),
    prisma.activity.deleteMany(),
    prisma.facultyRequirement.deleteMany(),
    prisma.student.deleteMany(),
  ]);

  // 🎓 Seed นักศึกษา
  const studentData = [
    {
      stdCode: '66010001',
      title: 'นาย',
      name: 'สมชาย ใจดี',
      faculty: 'คณะวิทยาศาสตร์',
      program: 'วิทยาการคอมพิวเตอร์',
      centralHours: 8,
      facultyHours: 14,
      freeHours: 4,
    },
    {
      stdCode: '66010002', 
      title: 'นางสาว',
      name: 'สมหญิง รักเรียน',
      faculty: 'คณะวิทยาศาสตร์',
      program: 'เทคโนโลยีสารสนเทศ',
      centralHours: 5,
      facultyHours: 10,
      freeHours: 6,
    },
    {
      stdCode: '66020001',
      title: 'นาย',
      name: 'ธนวัฒน์ เก่งดี',
      faculty: 'คณะวิศวกรรมศาสตร์',
      program: 'วิศวกรรมคอมพิวเตอร์',
      centralHours: 12,
      facultyHours: 8,
      freeHours: 3,
    },
  ];

  const students = await prisma.$transaction(
    studentData.map((data) => prisma.student.create({ data }))
  );
  console.table(students.map((s) => ({ รหัส: s.stdCode, ชื่อ: s.name, คณะ: s.faculty })));

  // 📋 Seed ข้อกำหนดของคณะ
  const facultyRequirements = [
    { faculty: 'คณะวิทยาศาสตร์', centralMin: 90, facultyMin: 90, freeMin: 50 },
    { faculty: 'คณะวิศวกรรมศาสตร์', centralMin: 90, facultyMin: 90, freeMin: 50 },
    { faculty: 'คณะบริหารธุรกิจ', centralMin: 90, facultyMin: 90, freeMin: 50 },
    { faculty: 'คณะศิลปศาสตร์', centralMin: 90, facultyMin: 90, freeMin: 50 },
    { faculty: 'คณะศึกษาศาสตร์', centralMin: 90, facultyMin: 90, freeMin: 50 },
  ];

  await prisma.facultyRequirement.createMany({
    data: facultyRequirements
  });
  console.log('✅ เพิ่มข้อกำหนดของคณะแล้ว');

  // 🏛️ Seed กิจกรรมแต่ละกลุ่ม (ใช้ Enum)
  const activityGroups = {
    [ActivityGroup.CENTRAL]: [
      { 
        name: 'โครงการอบรมจริยธรรม', 
        description: 'อบรมจริยธรรมสำหรับนักศึกษาใหม่', 
        hours: 3, 
        startDate: '2024-11-15',
        endDate: '2024-11-15',
        location: 'หอประชุมใหญ่',
        organizer: 'กองพัฒนานักศึกษา'
      },
      { 
        name: 'โครงการปฐมนิเทศนักศึกษาใหม่', 
        description: 'ปฐมนิเทศนักศึกษาใหม่ ปีการศึกษา 2567', 
        hours: 5, 
        startDate: '2024-08-01',
        endDate: '2024-08-02',
        location: 'ศูนย์ประชุมมหาวิทยาลัย',
        organizer: 'กอง académic'
      },
      { 
        name: 'กิจกรรมวันสถาปนามหาวิทยาลัย', 
        description: 'เฉลิมฉลองวันสถาปนามหาวิทยาลัย', 
        hours: 4, 
        startDate: '2024-09-20',
        endDate: '2024-09-20',
        location: 'ลานหน้าตึก admin',
        organizer: 'คณะกรรมการนักศึกษา'
      },
    ],
    [ActivityGroup.FACULTY]: [
      { 
        name: 'กิจกรรมวันคล้ายวันสถาปนาคณะวิทยาศาสตร์', 
        description: 'ฉลองวันคล้ายวันสถาปนาคณะวิทยาศาสตร์', 
        hours: 2, 
        startDate: '2024-11-10',
        endDate: '2024-11-10',
        location: 'ลานคณะวิทยาศาสตร์',
        organizer: 'คณบดีคณะวิทยาศาสตร์'
      },
      { 
        name: 'โครงการพัฒนาทักษะการเขียนโปรแกรม', 
        description: 'อบรมการเขียนโปรแกรมเบื้องต้น', 
        hours: 6, 
        startDate: '2024-10-15',
        endDate: '2024-10-16',
        location: 'ห้องคอมพิวเตอร์ 1',
        organizer: 'ภาควิชาวิทยาการคอมพิวเตอร์'
      },
      { 
        name: 'กิจกรรมทัศนศึกษาดูงาน', 
        description: 'ดูงานบริษัทเทคโนโลยี', 
        hours: 8, 
        startDate: '2024-10-25',
        endDate: '2024-10-25',
        location: 'บริษัท ABC Technology',
        organizer: 'อาจารย์ที่ปรึกษา'
      },
    ],
    [ActivityGroup.FREE]: [
      { 
        name: 'กิจกรรมจิตอาสา', 
        description: 'จิตอาสาทำความสะอาดชุมชน', 
        hours: 4, 
        startDate: '2024-11-08',
        endDate: '2024-11-08',
        location: 'ชุมชนใกล้มหาวิทยาลัย',
        organizer: 'ชมรมจิตอาสา'
      },
      { 
        name: 'กิจกรรมกีฬาสีภายใน', 
        description: 'แข่งขันกีฬาสีระหว่างชั้นปี', 
        hours: 6, 
        startDate: '2024-10-05',
        endDate: '2024-10-06',
        location: 'สนามกีฬามหาวิทยาลัย',
        organizer: 'สโมสรนักศึกษา'
      },
      { 
        name: 'โครงการค่ายอาสา', 
        description: 'ค่ายอาสาพัฒนาชนบท', 
        hours: 10, 
        startDate: '2024-09-15', 
        endDate: '2024-09-17',
        location: 'จังหวัดนครราชสีมา',
        organizer: 'ชมรมอาสาพัฒนา'
      },
    ],
  };

  const allActivities: any[] = [];

  for (const [group, activities] of Object.entries(activityGroups)) {
    const created = await prisma.$transaction(
      activities.map((a) =>
        prisma.activity.create({
          data: {
            name: a.name,
            description: a.description,
            group: group as ActivityGroup,
            hours: a.hours,
            startDate: new Date(a.startDate),
            endDate: new Date(a.endDate),
            location: a.location,
            organizer: a.organizer,
          },
        })
      )
    );
    allActivities.push(...created);
    console.log(`✅ กลุ่ม ${group}: เพิ่ม ${created.length} กิจกรรม`);
  }

  // 🔗 สร้าง QR Codes สำหรับกิจกรรมต่างๆ
  console.log('\n🔗 สร้าง QR Codes...');
  
  const qrCodesData = [
    // SINGLE USE QR Codes
    { 
      activity: allActivities[0], // อบรมจริยธรรม
      type: QRType.SINGLE_USE,
      maxUses: 1,
      expiredAt: '2024-11-16T23:59:59'
    },
    { 
      activity: allActivities[3], // วันคล้ายคณะวิทยาศาสตร์
      type: QRType.SINGLE_USE, 
      maxUses: 1,
      expiredAt: '2024-11-11T23:59:59'
    },
    
    // MULTI USE QR Codes
    { 
      activity: allActivities[1], // ปฐมนิเทศ
      type: QRType.MULTI_USE,
      maxUses: 1000,
      expiredAt: '2024-08-03T23:59:59'
    },
    { 
      activity: allActivities[6], // กีฬาสี
      type: QRType.MULTI_USE,
      maxUses: 1000, 
      expiredAt: '2024-10-07T23:59:59'
    },
    
    // LIMITED USE QR Codes
    { 
      activity: allActivities[4], // ทัศนศึกษา
      type: QRType.LIMITED_USE,
      maxUses: 30,
      expiredAt: '2024-10-26T23:59:59'
    },
    { 
      activity: allActivities[7], // ค่ายอาสา
      type: QRType.LIMITED_USE,
      maxUses: 50,
      expiredAt: '2024-09-18T23:59:59'
    },
  ];

  const qrCodes = await prisma.$transaction(
    qrCodesData.map((data, index) =>
      prisma.qRCode.create({
        data: {
          code: `QR-${Date.now()}-${index + 1}`,
          activityId: data.activity.id,
          type: data.type,
          maxUses: data.maxUses,
          expiredAt: new Date(data.expiredAt),
          createdAt: new Date(),
        },
      })
    )
  );

  console.log(`✅ สร้าง QR Codes แล้ว ${qrCodes.length} รายการ`);

  // 📝 สร้างประวัติการสแกนให้นักศึกษาคนแรก
  const student = students[0];
  console.log(`\n📝 สร้างประวัติการสแกนสำหรับ ${student.name}...`);

  const scanHistoryData = [
    { 
      qrCode: qrCodes[0], // อบรมจริยธรรม (SINGLE_USE)
      scannedAt: '2024-11-15T10:00:00',
      hoursEarned: 3
    },
    { 
      qrCode: qrCodes[1], // วันคล้ายคณะ (SINGLE_USE)
      scannedAt: '2024-11-10T14:00:00', 
      hoursEarned: 2
    },
    { 
      qrCode: qrCodes[4], // ทัศนศึกษา (LIMITED_USE)
      scannedAt: '2024-10-25T09:00:00',
      hoursEarned: 8
    },
    { 
      qrCode: qrCodes[5], // ค่ายอาสา (LIMITED_USE)
      scannedAt: '2024-09-16T08:00:00',
      hoursEarned: 10
    },
  ];

  // อัพเดต QR Codes ที่ถูกใช้
  // ในส่วนของการสร้างประวัติการสแกน
for (const [i, item] of scanHistoryData.entries()) {
  // อัพเดต QR Code ตามประเภท
  const updateData: any = {
    currentUses: { increment: 1 }
  };

  if (item.qrCode.type === QRType.SINGLE_USE) {
    updateData.isUsed = true;
    updateData.usedBy = student.id;
    updateData.usedAt = new Date(item.scannedAt);
  }

  await prisma.qRCode.update({
    where: { id: item.qrCode.id },
    data: updateData
  });

  await prisma.activityHistory.create({
    data: {
      activityId: item.qrCode.activityId,
      qrCodeId: item.qrCode.id,
      studentId: student.id,
      scannedAt: new Date(item.scannedAt),
      hoursEarned: item.hoursEarned,
    },
  });
}

  console.log('✅ เพิ่มข้อมูลประวัติการเข้าร่วมแล้ว');

  // 🧮 สรุปชั่วโมง
  const studentWithHours = await prisma.student.findUnique({
    where: { id: student.id }
  });

  const facultyReq = await prisma.facultyRequirement.findFirst({
    where: { faculty: studentWithHours?.faculty }
  });

  console.log('\n📊 สรุปชั่วโมงของ', student.name);
  console.log(`   กิจกรรมกลาง: ${studentWithHours?.centralHours} / ${facultyReq?.centralMin} ชม.`);
  console.log(`   กิจกรรมคณะ: ${studentWithHours?.facultyHours} / ${facultyReq?.facultyMin} ชม.`);
  console.log(`   กิจกรรมเสรี: ${studentWithHours?.freeHours} / ${facultyReq?.freeMin} ชม.`);
  
  const totalCurrent = (studentWithHours?.centralHours || 0) + (studentWithHours?.facultyHours || 0) + (studentWithHours?.freeHours || 0);
  const totalRequired = (facultyReq?.centralMin || 0) + (facultyReq?.facultyMin || 0) + (facultyReq?.freeMin || 0);
  
  console.log(`   รวม: ${totalCurrent} / ${totalRequired} ชม.`);
  console.log(`   ความคืบหน้า: ${((totalCurrent / totalRequired) * 100).toFixed(1)}%`);

  console.log('\n✨ Seeding เสร็จสิ้น!');
}

main()
  .catch((e) => {
    console.error('❌ เกิดข้อผิดพลาดระหว่าง Seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });