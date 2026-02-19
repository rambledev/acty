// app/api/activities/[id]/qrcode/toggle/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const { isActive } = await request.json();
    const { id } = await params;
    const activityId = parseInt(id);

    if (isNaN(activityId)) {
      return NextResponse.json({ error: 'Activity ID ไม่ถูกต้อง' }, { status: 400 });
    }

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'isActive ต้องเป็น boolean' }, { status: 400 });
    }

    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        qrCodes: {
          select: {
            id: true,
            code: true,
            isActive: true,
            isUsed: true,
            currentUses: true,
            maxUses: true,
          },
        },
      },
    });

    if (!activity) {
      return NextResponse.json({ error: 'ไม่พบกิจกรรม' }, { status: 404 });
    }

    const canEdit =
      session.user.role === 'ADMIN' ||
      activity.createdById === session.user.id;

    if (!canEdit) {
      return NextResponse.json(
        { error: 'ไม่มีสิทธิ์แก้ไขกิจกรรมนี้' },
        { status: 403 }
      );
    }

    if (!activity.qrCodes || activity.qrCodes.length === 0) {
      return NextResponse.json(
        { error: 'ไม่พบ QR Code สำหรับกิจกรรมนี้' },
        { status: 404 }
      );
    }

    console.log(`User ${session.user.id} (${session.user.role}) toggling QR code status for activity ${activityId} to ${isActive}`);

    const updatedQRCode = await prisma.qRCode.updateMany({
      where: { activityId },
      data: { isActive },
    });

    console.log(`Updated ${updatedQRCode.count} QR codes to isActive: ${isActive}`);

    const updatedQRCodes = await prisma.qRCode.findMany({
      where: { activityId },
      select: {
        id: true,
        code: true,
        isActive: true,
        isUsed: true,
        currentUses: true,
        maxUses: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `QR Code ${isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}สำเร็จ`,
      updatedCount: updatedQRCode.count,
      isActive,
      qrCodes: updatedQRCodes,
    });
  } catch (error) {
    console.error('Error toggling QR code status:', error);

    if (error instanceof Error) {
      if (error.message.includes('Record to update not found')) {
        return NextResponse.json(
          { error: 'ไม่พบ QR Code ที่ต้องการอัพเดท' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัพเดทสถานะ QR Code' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const { id } = await params;
    const activityId = parseInt(id);

    if (isNaN(activityId)) {
      return NextResponse.json({ error: 'Activity ID ไม่ถูกต้อง' }, { status: 400 });
    }

    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      select: {
        id: true,
        name: true,
        createdById: true,
      },
    });

    if (!activity) {
      return NextResponse.json({ error: 'ไม่พบกิจกรรม' }, { status: 404 });
    }

    const canView =
      session.user.role === 'ADMIN' ||
      activity.createdById === session.user.id;

    if (!canView) {
      return NextResponse.json(
        { error: 'ไม่มีสิทธิ์ดูข้อมูลกิจกรรมนี้' },
        { status: 403 }
      );
    }

    const qrCodes = await prisma.qRCode.findMany({
      where: { activityId },
      select: {
        id: true,
        code: true,
        isActive: true,
        isUsed: true,
        currentUses: true,
        maxUses: true,
        type: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      activityId,
      activityName: activity.name,
      qrCodes,
      count: qrCodes.length,
      activeCount: qrCodes.filter(qr => qr.isActive).length,
      inactiveCount: qrCodes.filter(qr => !qr.isActive).length,
      usedCount: qrCodes.filter(qr => qr.isUsed).length,
      unusedCount: qrCodes.filter(qr => !qr.isUsed).length,
    });
  } catch (error) {
    console.error('Error fetching QR code status:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูล QR Code' },
      { status: 500 }
    );
  }
}