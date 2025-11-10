// app/api/qr-codes/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// กำหนด type ชั่วคราวแทน QRType
type TempQRType = 'SINGLE_USE' | 'MULTI_USE' | 'LIMITED_USE';

export async function POST(request: NextRequest) {
  try {
    const { activityId, type, maxUses, expiredAt, quantity = 1 } = await request.json();

    // ตรวจสอบว่ามีกิจกรรมอยู่จริง
    const activity = await prisma.activity.findUnique({
      where: { id: parseInt(activityId) }
    });

    if (!activity) {
      return NextResponse.json(
        { error: 'ไม่พบกิจกรรม' },
        { status: 404 }
      );
    }

    const qrCodes = [];

    // สร้าง QR Codes ตามจำนวนที่ต้องการ
    for (let i = 0; i < quantity; i++) {
      const qrCodeData = {
        code: `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        activityId: parseInt(activityId),
        type: type as TempQRType,
        maxUses: parseInt(maxUses),
        currentUses: 0,
        isUsed: false,
        expiredAt: expiredAt ? new Date(expiredAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 วัน
      };

      // ใช้ any ชั่วคราวเพื่อ bypass type checking
      const qrCode = await prisma.qRCode.create({
        data: qrCodeData as any
      }) as any;

      qrCodes.push({
        id: qrCode.id,
        code: qrCode.code,
        url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/scan/${qrCode.code}`,
        expiredAt: qrCode.expiredAt,
        type: qrCode.type,
        maxUses: qrCode.maxUses,
        currentUses: qrCode.currentUses
      });
    }

    return NextResponse.json({
      success: true,
      qrCodes,
      message: `สร้าง QR Code สำเร็จ ${quantity} ตัว`
    });

  } catch (error: any) {
    console.error('Error generating QR codes:', error);
    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาดในการสร้าง QR Code',
        details: error.message 
      },
      { status: 500 }
    );
  }
}