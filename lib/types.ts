// lib/types.ts
// ไฟล์นี้เป็น Optional - ใช้สำหรับแชร์ Types ระหว่างไฟล์ต่างๆ

// ===================== Student Types =====================
export interface Student {
  id: number;
  stdCode: string;
  title?: string | null;
  name: string;
  faculty?: string | null;
  program?: string | null;
}

// ===================== Activity Types =====================
export interface Activity {
  id: number;
  name: string;
  description?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  group: number; // 1 = ส่วนกลาง, 2 = คณะ, 3 = เสรี
  hours: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityWithGroupName extends Omit<Activity, 'createdAt' | 'updatedAt' | 'description' | 'startDate' | 'endDate'> {
  groupName: string;
  date: string;
}

// ===================== QR Code Types =====================
export interface QRCode {
  id: number;
  code: string;
  activityId: number;
  usedBy?: number | null;
  isUsed: boolean;
  usedAt?: Date | null;
  createdAt: Date;
}

// ===================== Activity History Types =====================
export interface ActivityHistory {
  id: number;
  activityId: number;
  qrCodeId: number;
  studentId: number;
  scannedAt: Date;
}

export interface ActivityHistoryWithDetails {
  id: number;
  name: string;
  group: number;
  groupName: string;
  hours: number;
  date: string;
  scannedAt: string;
}

// ===================== Dashboard Types =====================
export interface Hours {
  group1: number;
  group2: number;
  group3: number;
  total: number;
}

export interface RequiredHours {
  group1: number;
  group2: number;
  group3: number;
}

export interface CompletionStatus {
  group1Passed: boolean;
  group2Passed: boolean;
  group3Passed: boolean;
  allPassed: boolean;
}

export interface StudentDashboardData {
  student: Pick<Student, 'id' | 'stdCode' | 'name' | 'faculty' | 'program'>;
  hours: Hours;
  required: RequiredHours;
  status: CompletionStatus;
  recentActivities: ActivityHistoryWithDetails[];
}

// ===================== API Response Types =====================
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: string;
  statusCode?: number;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ===================== Form Types =====================
export interface ScanQRCodeInput {
  qrCode: string;
  studentId: number;
}

export interface CreateActivityInput {
  name: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  group: 1 | 2 | 3;
  hours: number;
  qrCodeCount: number; // จำนวน QR Code ที่ต้องสร้าง
}

// ===================== Constants =====================
export const ACTIVITY_GROUPS = {
  CENTRAL: 1,
  FACULTY: 2,
  OPTIONAL: 3,
} as const;

export const ACTIVITY_GROUP_NAMES = {
  [ACTIVITY_GROUPS.CENTRAL]: 'ส่วนกลาง',
  [ACTIVITY_GROUPS.FACULTY]: 'คณะ',
  [ACTIVITY_GROUPS.OPTIONAL]: 'เสรี',
} as const;

export const DEFAULT_REQUIRED_HOURS: RequiredHours = {
  group1: 90,
  group2: 90,
  group3: 50,
} as const;

// ===================== Type Guards =====================
export function isApiError(response: any): response is ApiErrorResponse {
  return response && response.success === false && 'error' in response;
}

export function isApiSuccess<T>(response: any): response is ApiSuccessResponse<T> {
  return response && response.success === true && 'data' in response;
}

// ===================== Utility Types =====================
export type ActivityGroup = typeof ACTIVITY_GROUPS[keyof typeof ACTIVITY_GROUPS];

export type GroupName = typeof ACTIVITY_GROUP_NAMES[ActivityGroup];

// สำหรับ Prisma Include
export interface StudentWithHistory extends Student {
  histories: (ActivityHistory & {
    activity: Activity;
  })[];
}