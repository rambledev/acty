// app/api/activities/[id]/qrcode/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const activityId = parseInt(id, 10);

    const qrCode = await prisma.qRCode.findFirst({
      where: { activityId },
      select: {
        id: true,
        code: true,
        maxUses: true,
        currentUses: true,
        expiredAt: true,
        createdAt: true,
      },
    });

    if (!qrCode) {
      return NextResponse.json(
        { error: 'ไม่พบ QR Code ของกิจกรรมนี้' },
        { status: 404 }
      );
    }

    return NextResponse.json({ qrCode });
  } catch (error) {
    console.error('Error fetching QR code:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    );
  }
}