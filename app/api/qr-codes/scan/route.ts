// app/api/qr-codes/scan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { code, studentId } = await request.json();

    if (!code || !studentId) {
      return NextResponse.json(
        { success: false, message: 'กรุณาระบุ QR Code และรหัสนักศึกษา' },
        { status: 400 }
      );
    }

    // ค้นหา QR Code
    const qrCode = await prisma.qRCode.findUnique({
      where: { code },
      include: { activity: true }
    });

    if (!qrCode) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบ QR Code นี้ในระบบ' },
        { status: 404 }
      );
    }

    // ตรวจสอบว่า QR Code หมดอายุหรือไม่
    if (qrCode.expiredAt && new Date() > qrCode.expiredAt) {
      return NextResponse.json(
        { success: false, message: 'QR Code นี้หมดอายุแล้ว' },
        { status: 400 }
      );
    }

    // ตรวจสอบจำนวนครั้งที่ใช้
    if (qrCode.currentUses >= qrCode.maxUses && qrCode.type === 'SINGLE_USE') {
      return NextResponse.json(
        { success: false, message: 'QR Code นี้ถูกใช้งานแล้ว' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่านักศึกษาเคยสแกนแล้วหรือไม่
    const existingHistory = await prisma.activityHistory.findUnique({
      where: {
        qrCodeId_studentId: {
          qrCodeId: qrCode.id,
          studentId: parseInt(studentId),
        }
      }
    });

    if (existingHistory) {
      return NextResponse.json(
        { success: false, message: 'คุณเคยสแกน QR Code นี้แล้ว' },
        { status: 400 }
      );
    }

    // บันทึกประวัติการสแกน
    const history = await prisma.activityHistory.create({
      data: {
        activityId: qrCode.activityId,
        qrCodeId: qrCode.id,
        studentId: parseInt(studentId),
        hoursEarned: qrCode.activity.hours,
      }
    });

    // อัพเดท QR Code
    await prisma.qRCode.update({
      where: { id: qrCode.id },
      data: {
        currentUses: { increment: 1 },
        isUsed: qrCode.type === 'SINGLE_USE' ? true : undefined,
        usedAt: qrCode.type === 'SINGLE_USE' ? new Date() : undefined,
        usedBy: qrCode.type === 'SINGLE_USE' ? parseInt(studentId) : undefined,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'สแกน QR Code สำเร็จ',
      activity: {
        name: qrCode.activity.name,
        hours: qrCode.activity.hours,
        group: qrCode.activity.group,
      },
      history
    });

  } catch (error) {
    console.error('Error scanning QR code:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการสแกน QR Code' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
