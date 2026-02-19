// lib/services/activity-service.ts
import { prisma } from '@/lib/prisma'
import { ActivityGroup, ActivityStatus } from '@prisma/client'

export interface CreateActivityData {
  name: string;
  group: ActivityGroup;
  hours: number;
  startDate?: Date | null;
  endDate?: Date | null;
  location?: string;
  description?: string;
  organizer?: string;
}

export interface QRCodeData {
  id: number;
  code: string;
  activityId: number;
  expiredAt: Date | null;
  isUsed: boolean;
}

export class ActivityService {
  // สร้างกิจกรรมใหม่
  async createActivity(activityData: CreateActivityData) {
    try {
      console.log('[Activity Service] Creating activity:', activityData.name);

      const activity = await prisma.activity.create({
        data: {
          name: activityData.name,
          group: activityData.group,
          hours: activityData.hours,
          startDate: activityData.startDate || null,
          endDate: activityData.endDate || null,
          location: activityData.location || null,
          description: activityData.description || null,
          organizer: activityData.organizer || null,
          status: 'ACTIVE',
        },
      });

      console.log(`[Activity Service] Activity created: ${activity.id}`);
      return activity;
    } catch (error) {
      console.error('[Activity Service] Error creating activity:', error);
      throw new Error('ไม่สามารถสร้างกิจกรรมได้ในขณะนี้');
    }
  }

  // สร้าง QR Code สำหรับกิจกรรม
  async generateQRCode(activityId: number, expiresInHours: number = 24): Promise<QRCodeData> {
    try {
      const activity = await prisma.activity.findUnique({
        where: { id: activityId },
        select: { id: true }
      });

      if (!activity) {
        throw new Error('Activity not found');
      }

      const qrCodeString = this.generateQRCodeString();
      const expiredAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

      const qrCode = await prisma.qRCode.create({
        data: {
          activityId: activityId,
          code: qrCodeString,
          expiredAt: expiredAt,
        },
      });

      console.log(`[Activity Service] QR Code generated: ${qrCode.code}`);
      return qrCode;
    } catch (error) {
      console.error('[Activity Service] Error generating QR code:', error);
      throw new Error('ไม่สามารถสร้าง QR Code ได้ในขณะนี้');
    }
  }

  // ดึงข้อมูลกิจกรรมโดย ID
  async getActivityById(activityId: number) {
    try {
      const activity = await prisma.activity.findUnique({
        where: { id: activityId },
        include: {
          _count: {
            select: {
              activityHistories: true,
              qrCodes: true,
            },
          },
        },
      });

      return activity;
    } catch (error) {
      console.error('[Activity Service] Error getting activity:', error);
      throw new Error('ไม่สามารถดึงข้อมูลกิจกรรมได้');
    }
  }

  // ดึงกิจกรรมทั้งหมด
  async getAllActivities() {
    try {
      const activities = await prisma.activity.findMany({
        include: {
          _count: {
            select: {
              activityHistories: true,
              qrCodes: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return activities;
    } catch (error) {
      console.error('[Activity Service] Error getting activities:', error);
      throw new Error('ไม่สามารถดึงรายการกิจกรรมได้');
    }
  }

  // สร้าง QR Code string
  private generateQRCodeString(): string {
    return `QR_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }
}

export const activityService = new ActivityService();
