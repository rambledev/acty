// app/actions/activity-actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { ActivityGroup } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function createActivity(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const group = (formData.get('type') || 'CENTRAL') as ActivityGroup;
    const hours = parseInt(formData.get('hours') as string, 10) || 1;
    const date = formData.get('date') as string;
    const location = formData.get('location') as string;
    const description = formData.get('description') as string;
    const organizer = formData.get('organizer') as string;

    // สร้างกิจกรรม
    const activity = await prisma.activity.create({
      data: {
        name,
        group,
        hours,
        startDate: date ? new Date(date) : null,
        location: location || null,
        description: description || null,
        organizer: organizer || null,
        status: 'ACTIVE',
      },
    });

    // สร้าง QR Code
    const qrCode = await prisma.qRCode.create({
      data: {
        activityId: activity.id,
        code: `QR_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`,
        expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    revalidatePath('/emp/activity');
    return {
      success: true,
      activity,
      qrCode,
      message: 'สร้างกิจกรรมสำเร็จ'
    };
  } catch (error) {
    console.error('Error creating activity:', error);
    return {
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างกิจกรรม'
    };
  }
}
