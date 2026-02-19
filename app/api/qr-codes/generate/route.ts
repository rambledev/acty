// app/api/qr-codes/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/session';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // ตรวจสอบ session
    const sessionCookie = request.cookies.get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionData = await decrypt(sessionCookie.value);
    if (!sessionData) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const userRole = sessionData.user.role;
    if (userRole !== 'ADMIN' && userRole !== 'EMPLOYEE') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await request.json();
    const { activityId, maxUses, expiredAt } = body;

    if (!activityId) {
      return NextResponse.json({ error: 'กรุณาระบุกิจกรรม' }, { status: 400 });
    }

    // ตรวจสอบว่ากิจกรรมมีอยู่จริง
    const activity = await prisma.activity.findUnique({
      where: { id: Number(activityId) },
    });

    if (!activity) {
      return NextResponse.json({ error: 'ไม่พบกิจกรรม' }, { status: 404 });
    }

    // ตรวจสอบว่ากิจกรรมนี้มี QR Code อยู่แล้วหรือไม่ (1 กิจกรรม = 1 QR)
    const existingQR = await prisma.qRCode.findFirst({
      where: { activityId: Number(activityId) },
    });

    if (existingQR) {
      return NextResponse.json(
        { error: 'กิจกรรมนี้มี QR Code อยู่แล้ว' },
        { status: 400 }
      );
    }

    // สร้างรหัส QR Code แบบ unique
    const code = randomBytes(16).toString('hex');

    // สร้าง URL สำหรับ scan
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const scanUrl = `${baseUrl}/scan/${code}`;

    const qrCode = await prisma.qRCode.create({
      data: {
        code,
        activityId: Number(activityId),
        type: 'MULTI_USE',
        maxUses: maxUses || 50,
        currentUses: 0,
        isUsed: false,
        expiredAt: expiredAt ? new Date(expiredAt) : null,
      },
    });

    return NextResponse.json({
      success: true,
      qrCode: {
        ...qrCode,
        url: scanUrl,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้าง QR Code' },
      { status: 500 }
    );
  }
}