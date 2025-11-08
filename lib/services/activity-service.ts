// lib/services/activity-service.ts
import { prisma } from '@/lib/prisma'
import { ActivityType, ActivityStatus } from '@prisma/client'

export interface CreateActivityData {
  name: string;
  type: ActivityType;
  hours: number;
  date: Date;
  time?: string;
  location?: string;
  description?: string;
  createdById: string;
}

export interface QRCodeData {
  id: string;
  code: string;
  activityId: string;
  expiresAt: Date | null;
  isUsed: boolean;
}

export class ActivityService {
  // สร้างกิจกรรมใหม่
  async createActivity(activityData: CreateActivityData) {
    try {
      console.log('[Activity Service] Creating activity:', activityData.name);

      // ตรวจสอบว่า employee มีอยู่จริง
      const employee = await prisma.employee.findUnique({
        where: { id: activityData.createdById },
        select: { id: true }
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      const activity = await prisma.activity.create({
        data: {
          name: activityData.name,
          type: activityData.type,
          hours: activityData.hours,
          date: activityData.date,
          time: activityData.time,
          location: activityData.location,
          description: activityData.description,
          status: 'ACTIVE',
          createdById: activityData.createdById,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              titlePrefix: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
            },
          },
        },
      });

      console.log(`[Activity Service] ✅ Activity created: ${activity.id}`);
      return activity;
    } catch (error) {
      console.error('[Activity Service] Error creating activity:', error);
      throw new Error('ไม่สามารถสร้างกิจกรรมได้ในขณะนี้');
    }
  }

  // สร้าง QR Code สำหรับกิจกรรม
  async generateQRCode(activityId: string, expiresInHours: number = 24): Promise<QRCodeData> {
    try {
      // ตรวจสอบว่ากิจกรรมมีอยู่จริง
      const activity = await prisma.activity.findUnique({
        where: { id: activityId },
        select: { id: true }
      });

      if (!activity) {
        throw new Error('Activity not found');
      }

      const qrCodeString = this.generateQRCodeString();
      const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

      console.log(`[Activity Service] Generating QR code for activity: ${activityId}`);

      const qrCode = await prisma.qRCode.create({
        data: {
          activityId: activityId,
          code: qrCodeString,
          expiresAt: expiresAt,
        },
      });

      console.log(`[Activity Service] ✅ QR Code generated: ${qrCode.code}`);
      return qrCode;
    } catch (error) {
      console.error('[Activity Service] Error generating QR code:', error);
      throw new Error('ไม่สามารถสร้าง QR Code ได้ในขณะนี้');
    }
  }

  // ดึงข้อมูลกิจกรรมโดย ID
  async getActivityById(activityId: string) {
    try {
      const activity = await prisma.activity.findUnique({
        where: { id: activityId },
        include: {
          createdBy: {
            select: {
              id: true,
              titlePrefix: true,
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

      return activity;
    } catch (error) {
      console.error('[Activity Service] Error getting activity:', error);
      throw new Error('ไม่สามารถดึงข้อมูลกิจกรรมได้');
    }
  }

  // ดึงกิจกรรมทั้งหมดที่สร้างโดย employee
  async getActivitiesByEmployee(employeeId: string) {
    try {
      const activities = await prisma.activity.findMany({
        where: { createdById: employeeId },
        include: {
          createdBy: {
            select: {
              id: true,
              titlePrefix: true,
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
        orderBy: [
          { date: 'desc' },
          { createdAt: 'desc' },
        ],
      });

      return activities;
    } catch (error) {
      console.error('[Activity Service] Error getting employee activities:', error);
      throw new Error('ไม่สามารถดึงรายการกิจกรรมได้');
    }
  }

  // ดึง employee ตัวอย่าง (สำหรับ development)
  async getSampleEmployee() {
    try {
      const employees = await prisma.employee.findMany({
        take: 1,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeCode: true,
          user: {
            select: {
              username: true,
              role: true,
            }
          }
        },
      });
      return employees;
    } catch (error) {
      console.error('[Activity Service] Error getting sample employee:', error);
      return [];
    }
  }

  // สร้าง employee ตัวอย่างถ้ายังไม่มี (สำหรับ development)
  async createSampleEmployee() {
    try {
      // ตรวจสอบว่ามี employee อยู่แล้วหรือไม่
      const existingEmployee = await prisma.employee.findFirst({
        select: { id: true }
      });

      if (existingEmployee) {
        return existingEmployee;
      }

      // สร้าง user ก่อน
      const user = await prisma.user.create({
        data: {
          username: 'employee01',
          password: '$2a$10$K7V/MsR5C2JY2W5Q8b8b5e5Q5Z5Q5Z5Q5Z5Q5Z5Q5Z5Q5Z5Q5Z5Q', // password: 123456
          role: 'EMPLOYEE',
        },
      });

      // สร้าง employee
      const employee = await prisma.employee.create({
        data: {
          userId: user.id,
          titlePrefix: 'MR',
          firstName: 'สมชาย',
          lastName: 'เกิดมี',
          employeeCode: 'EMP001',
          affiliation: 'คณะเทคโนโลยีสารสนเทศ',
          email: 'employee01@university.ac.th',
          phone: '0812345678',
        },
      });

      console.log(`[Activity Service] ✅ Sample employee created: ${employee.id}`);
      return employee;
    } catch (error) {
      console.error('[Activity Service] Error creating sample employee:', error);
      throw error;
    }
  }

  // สร้าง QR Code string
  private generateQRCodeString(): string {
    return `QR_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }
}

export const activityService = new ActivityService();