// ===================================================
// app/api/activities/[id]/route.ts
// API สำหรับจัดการกิจกรรมเดี่ยว
// ===================================================
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/session';

// ฟังก์ชันตรวจสอบ session
async function getSession(request: NextRequest) {
  const sessionCookie = request.cookies.get('session');
  if (!sessionCookie) return null;
  return await decrypt(sessionCookie.value);
}

// ฟังก์ชันตรวจสอบสิทธิ์ (ผู้สร้างหรือ ADMIN)
async function checkPermission(request: NextRequest, activityId: number) {
  const sessionData = await getSession(request);
  if (!sessionData) {
    return { error: 'Unauthorized', status: 401 };
  }

  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
  });

  if (!activity) {
    return { error: 'ไม่พบกิจกรรม', status: 404 };
  }

  const userId = sessionData.user.id;
  const userRole = sessionData.user.role;

  // อนุญาตเฉพาะผู้สร้างหรือ ADMIN
  if (activity.createdById !== userId && userRole !== 'ADMIN') {
    return { error: 'คุณไม่มีสิทธิ์ดำเนินการกับกิจกรรมนี้', status: 403 };
  }

  return { activity, sessionData };
}

// GET - ดึงข้อมูลกิจกรรมเดี่ยว
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const activityId = parseInt(id, 10);

    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
        _count: {
          select: {
            activityHistories: true,
            qrCodes: true,
          },
        },
      },
    });

    if (!activity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      );
    }

    const [qrCodesUsed, qrCodesUnused] = await Promise.all([
      prisma.qRCode.count({
        where: { activityId: activityId, isUsed: true },
      }),
      prisma.qRCode.count({
        where: { activityId: activityId, isUsed: false },
      }),
    ]);

    return NextResponse.json({
      ...activity,
      qrCodesUsed,
      qrCodesUnused,
    });
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    );
  }
}

// PUT - แก้ไขข้อมูลกิจกรรมทั้งหมด (เฉพาะผู้สร้างหรือ ADMIN)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const activityId = parseInt(id, 10);

    const permission = await checkPermission(request, activityId);
    if ('error' in permission) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    const body = await request.json();
    const { name, description, startDate, endDate, group, hours, location, organizer, status } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'กรุณาระบุชื่อกิจกรรม' },
        { status: 400 }
      );
    }

    const updated = await prisma.activity.update({
      where: { id: activityId },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        group: group || 'CENTRAL',
        hours: hours || 1,
        location: location?.trim() || null,
        organizer: organizer?.trim() || null,
        ...(status && { status }),
      },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      activity: updated,
      message: 'แก้ไขกิจกรรมสำเร็จ',
    });
  } catch (error) {
    console.error('Error updating activity:', error);
    return NextResponse.json(
      { error: 'แก้ไขกิจกรรมไม่สำเร็จ' },
      { status: 500 }
    );
  }
}

// PATCH - อัปเดตบางฟิลด์ เช่น สถานะ (เฉพาะผู้สร้างหรือ ADMIN)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const activityId = parseInt(id, 10);

    const permission = await checkPermission(request, activityId);
    if ('error' in permission) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const activity = await prisma.activity.update({
      where: { id: activityId },
      data: { status },
    });

    return NextResponse.json({
      success: true,
      activity,
      message: 'อัปเดตสถานะกิจกรรมสำเร็จ',
    });
  } catch (error) {
    console.error('Error updating activity:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัปเดตกิจกรรม' },
      { status: 500 }
    );
  }
}

// DELETE - ลบกิจกรรม (เฉพาะผู้สร้างหรือ ADMIN)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const activityId = parseInt(id, 10);

    const permission = await checkPermission(request, activityId);
    if ('error' in permission) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    await prisma.activity.delete({
      where: { id: activityId },
    });

    return NextResponse.json({
      success: true,
      message: 'ลบกิจกรรมสำเร็จ',
    });
  } catch (error) {
    console.error('Error deleting activity:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบกิจกรรม' },
      { status: 500 }
    );
  }
}
