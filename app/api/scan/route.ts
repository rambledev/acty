// app/api/scan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    // ตรวจสอบ session
    const sessionCookie = request.cookies.get('session');
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'กรุณาเข้าสู่ระบบก่อน' },
        { status: 401 }
      );
    }

    const sessionData = await decrypt(sessionCookie.value);
    if (!sessionData) {
      return NextResponse.json(
        { error: 'Session หมดอายุ กรุณาเข้าสู่ระบบใหม่' },
        { status: 401 }
      );
    }

    // เฉพาะนักศึกษาเท่านั้นที่ scan ได้
    if (sessionData.user.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'เฉพาะนักศึกษาเท่านั้นที่สามารถ scan กิจกรรมได้' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'ไม่พบรหัส QR Code' },
        { status: 400 }
      );
    }

    // ค้นหา QR Code
    const qrCode = await prisma.qRCode.findUnique({
      where: { code },
      include: {
        activity: true,
      },
    });

    if (!qrCode) {
      return NextResponse.json(
        { error: 'QR Code ไม่ถูกต้องหรือไม่มีในระบบ' },
        { status: 404 }
      );
    }

    // ตรวจสอบว่า QR Code หมดอายุหรือไม่
    if (qrCode.expiredAt && new Date(qrCode.expiredAt) < new Date()) {
      return NextResponse.json(
        { error: 'QR Code นี้หมดอายุแล้ว' },
        { status: 400 }
      );
    }

    // ตรวจสอบจำนวนการใช้งาน
    if (qrCode.currentUses >= qrCode.maxUses) {
      return NextResponse.json(
        { error: 'QR Code นี้ถูกใช้งานเต็มจำนวนแล้ว' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ากิจกรรมยัง active อยู่หรือไม่
    if (qrCode.activity.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'กิจกรรมนี้ไม่เปิดให้บันทึกแล้ว' },
        { status: 400 }
      );
    }

    // ค้นหา student จาก user session
    const user = sessionData.user as any;
    const studentCode = user.stdCode || user.username || user.email;

    let student = await prisma.student.findUnique({
      where: { stdCode: studentCode },
    });

    // ถ้ายังไม่มี student record ให้สร้างใหม่
    if (!student) {
      student = await prisma.student.create({
        data: {
          stdCode: studentCode,
          name: user.name || user.fullName || '',
          title: user.title || null,
          faculty: user.faculty || null,
          program: user.program || null,
        },
      });
    }

    // ตรวจสอบว่า scan ซ้ำหรือไม่
    const existingHistory = await prisma.activityHistory.findUnique({
      where: {
        qrCodeId_studentId: {
          qrCodeId: qrCode.id,
          studentId: student.id,
        },
      },
    });

    if (existingHistory) {
      return NextResponse.json(
        { error: 'คุณได้ scan กิจกรรมนี้ไปแล้ว' },
        { status: 400 }
      );
    }

    // กำหนด field ชั่วโมงตามประเภทกิจกรรม
    const hoursField =
      qrCode.activity.group === 'CENTRAL' ? 'centralHours' :
      qrCode.activity.group === 'FACULTY' ? 'facultyHours' : 'freeHours';

    // บันทึกประวัติการ scan
    const history = await prisma.activityHistory.create({
      data: {
        activityId: qrCode.activityId,
        qrCodeId: qrCode.id,
        studentId: student.id,
        hoursEarned: qrCode.activity.hours,
      },
    });

    // อัปเดตจำนวนการใช้งาน QR Code
    await prisma.qRCode.update({
      where: { id: qrCode.id },
      data: {
        currentUses: { increment: 1 },
      },
    });

    // อัปเดตชั่วโมงกิจกรรมของนักศึกษา
    await prisma.student.update({
      where: { id: student.id },
      data: {
        [hoursField]: { increment: qrCode.activity.hours },
      },
    });

    // อัปเดตชั่วโมงใน User table
    await prisma.user.update({
      where: { id: user.id },
      data: {
        [hoursField]: { increment: qrCode.activity.hours },
      },
    });

    return NextResponse.json({
      success: true,
      message: `บันทึกกิจกรรม "${qrCode.activity.name}" สำเร็จ! ได้รับ ${qrCode.activity.hours} ชั่วโมง`,
      activity: {
        name: qrCode.activity.name,
        hours: qrCode.activity.hours,
        group: qrCode.activity.group,
      },
    });
  } catch (error) {
    console.error('Error scanning QR code:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการบันทึกกิจกรรม' },
      { status: 500 }
    );
  }
}