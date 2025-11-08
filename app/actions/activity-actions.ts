// app/actions/activity-actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { ActivityType } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function createActivity(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const type = formData.get('type') as ActivityType;
    const hours = parseFloat(formData.get('hours') as string);
    const date = new Date(formData.get('date') as string);
    const time = formData.get('time') as string;
    const location = formData.get('location') as string;
    const description = formData.get('description') as string;

    // ใช้ employee ตัวอย่าง (ใน production ควรดึงจาก session)
    const sampleEmployee = await prisma.employee.findFirst();
    if (!sampleEmployee) {
      throw new Error('No employee found');
    }

    // สร้างกิจกรรม
    const activity = await prisma.activity.create({
      data: {
        name,
        type,
        hours,
        date,
        time: time || null,
        location: location || null,
        description: description || null,
        status: 'ACTIVE',
        createdById: sampleEmployee.id,
      },
    });

    // สร้าง QR Code
    const qrCode = await prisma.qRCode.create({
      data: {
        activityId: activity.id,
        code: `QR_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    revalidatePath('/employee/activities');
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