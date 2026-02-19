// app/api/student/scan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    if (session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'เฉพาะนักศึกษาเท่านั้นที่สามารถสแกนได้' }, { status: 403 });
    }

    const { qrCode } = await request.json();

    if (!qrCode) {
      return NextResponse.json({ error: 'ไม่พบ QR Code' }, { status: 400 });
    }

    console.log(`Student ${session.user.id} scanning QR code: ${qrCode}`);

    // ค้นหา QR Code ในฐานข้อมูล
    const qrCodeRecord = await prisma.qRCode.findUnique({
      where: { code: qrCode },
      include: {
        activity: {
          select: {
            id: true,
            name: true,
            description: true,
            group: true,
            hours: true,
            location: true,
            organizer: true,
            status: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    if (!qrCodeRecord) {
      return NextResponse.json({ 
        error: 'QR Code ไม่ถูกต้อง หรือไม่พบในระบบ' 
      }, { status: 404 });
    }

    if (!qrCodeRecord.isActive) {
      return NextResponse.json({ 
        error: 'QR Code นี้ถูกปิดใช้งานแล้ว' 
      }, { status: 400 });
    }

    if (!qrCodeRecord.activity) {
      return NextResponse.json({ 
        error: 'ไม่พบข้อมูลกิจกรรมที่เชื่อมโยงกับ QR Code นี้' 
      }, { status: 404 });
    }

    if (qrCodeRecord.activity.status !== 'ACTIVE') {
      return NextResponse.json({ 
        error: 'กิจกรรมนี้ไม่เปิดรับสมัครแล้ว' 
      }, { status: 400 });
    }

    // ตรวจสอบวันที่กิจกรรม (ถ้ามี)
    const now = new Date();
    if (qrCodeRecord.activity.startDate && qrCodeRecord.activity.startDate > now) {
      return NextResponse.json({ 
        error: 'กิจกรรมยังไม่เริ่ม' 
      }, { status: 400 });
    }

    if (qrCodeRecord.activity.endDate && qrCodeRecord.activity.endDate < now) {
      return NextResponse.json({ 
        error: 'กิจกรรมสิ้นสุดแล้ว' 
      }, { status: 400 });
    }

    // หาข้อมูล student จาก users table
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        stdCode: true,
        name: true,
        title: true,
        faculty: true,
        program: true,
        centralHours: true,
        facultyHours: true,
        freeHours: true,
      },
    });

    if (!user || !user.stdCode) {
      return NextResponse.json({ 
        error: 'ไม่พบข้อมูลนักศึกษา กรุณาติดต่อเจ้าหน้าที่' 
      }, { status: 404 });
    }

    // หาหรือสร้าง student record ใน tb_student
    let student = await prisma.student.findUnique({
      where: { stdCode: user.stdCode },
    });

    if (!student) {
      // สร้าง student record ใหม่
      student = await prisma.student.create({
        data: {
          stdCode: user.stdCode,
          name: user.name,
          title: user.title,
          faculty: user.faculty,
          program: user.program,
          centralHours: user.centralHours,
          facultyHours: user.facultyHours,
          freeHours: user.freeHours,
        },
      });
    }

    // ตรวจสอบว่าเคยสแกนกิจกรรมนี้แล้วหรือไม่
    const existingScan = await prisma.activityHistory.findUnique({
      where: {
        qrCodeId_studentId: {
          qrCodeId: qrCodeRecord.id,
          studentId: student.id,
        },
      },
    });

    if (existingScan) {
      return NextResponse.json({ 
        error: 'คุณได้สแกนกิจกรรมนี้ไปแล้ว' 
      }, { status: 400 });
    }

    // ตรวจสอบขั้นสูง: SINGLE_USE QR Code
    if (qrCodeRecord.type === 'SINGLE_USE' && qrCodeRecord.isUsed) {
      return NextResponse.json({ 
        error: 'QR Code นี้ถูกใช้งานไปแล้ว' 
      }, { status: 400 });
    }

    // ตรวจสอบขั้นสูง: LIMITED_USE QR Code
    if (qrCodeRecord.type === 'LIMITED_USE' && qrCodeRecord.currentUses >= qrCodeRecord.maxUses) {
      return NextResponse.json({ 
        error: 'QR Code นี้ถึงขีดจำกัดการใช้งานแล้ว' 
      }, { status: 400 });
    }

    // เริ่ม transaction เพื่อบันทึกการสแกน
    const result = await prisma.$transaction(async (tx) => {
      // 1. บันทึกประวัติการสแกน
      const history = await tx.activityHistory.create({
        data: {
          activityId: qrCodeRecord.activity!.id,
          qrCodeId: qrCodeRecord.id,
          studentId: student!.id,
          hoursEarned: qrCodeRecord.activity!.hours,
          scannedAt: new Date(),
        },
      });

      // 2. อัพเดทชั่วโมงใน tb_student
      const updateData: any = {};
      switch (qrCodeRecord.activity!.group) {
        case 'CENTRAL':
          updateData.centralHours = { increment: qrCodeRecord.activity!.hours };
          break;
        case 'FACULTY':
          updateData.facultyHours = { increment: qrCodeRecord.activity!.hours };
          break;
        case 'FREE':
          updateData.freeHours = { increment: qrCodeRecord.activity!.hours };
          break;
      }

      await tx.student.update({
        where: { id: student!.id },
        data: updateData,
      });

      // 3. อัพเดทชั่วโมงใน users table ด้วย
      await tx.user.update({
        where: { id: session.user.id },
        data: updateData,
      });

      // 4. อัพเดท QR Code usage
      const qrUpdateData: any = {
        currentUses: { increment: 1 },
      };

      // ถ้าเป็น SINGLE_USE ให้ mark เป็น used
      if (qrCodeRecord.type === 'SINGLE_USE') {
        qrUpdateData.isUsed = true;
        qrUpdateData.usedAt = new Date();
        qrUpdateData.usedBy = student!.id;
      }

      await tx.qRCode.update({
        where: { id: qrCodeRecord.id },
        data: qrUpdateData,
      });

      return history;
    });

    console.log(`Scan successful: Student ${session.user.id} earned ${qrCodeRecord.activity.hours} hours from activity ${qrCodeRecord.activity.id}`);

    return NextResponse.json({
      success: true,
      message: `สแกนสำเร็จ! ได้รับ ${qrCodeRecord.activity.hours} ชั่วโมงกิจกรรม${qrCodeRecord.activity.group === 'CENTRAL' ? 'ส่วนกลาง' : qrCodeRecord.activity.group === 'FACULTY' ? 'คณะ' : 'เสรี'}`,
      activity: {
        id: qrCodeRecord.activity.id,
        name: qrCodeRecord.activity.name,
        group: qrCodeRecord.activity.group,
        hours: qrCodeRecord.activity.hours,
        organizer: qrCodeRecord.activity.organizer,
      },
      hoursEarned: qrCodeRecord.activity.hours,
      scanTime: result.scannedAt,
    });

  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสแกน กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    );
  }
}