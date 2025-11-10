
// ===================================================
// app/api/activities/[id]/route.ts
// API สำหรับจัดการกิจกรรมเดี่ยว
// ===================================================
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityType } from '@prisma/client';
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const activity = await prisma.activity.findUnique({
      where: { id: params.id },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
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

    // เพิ่มสถิติ QR Code
    const [qrCodesUsed, qrCodesUnused] = await Promise.all([
      prisma.qRCode.count({
        where: { activityId: params.id, isUsed: true }
      }),
      prisma.qRCode.count({
        where: { activityId: params.id, isUsed: false }
      })
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, message: 'Status is required' },
        { status: 400 }
      );
    }

    const activity = await prisma.activity.update({
      where: { id: params.id },
      data: { status },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      activity,
      message: 'อัพเดทสถานะกิจกรรมสำเร็จ'
    });
  } catch (error) {
    console.error('Error updating activity:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการอัพเดทกิจกรรม' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.activity.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'ลบกิจกรรมสำเร็จ'
    });
  } catch (error) {
    console.error('Error deleting activity:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการลบกิจกรรม' },
      { status: 500 }
    );
  }
}