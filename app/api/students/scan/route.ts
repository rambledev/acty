// app/api/students/scan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }
    if (session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'เฉพาะนักศึกษาเท่านั้น' }, { status: 403 });
    }

    const { qrCode } = await request.json();
    if (!qrCode) {
      return NextResponse.json({ error: 'ไม่พบ QR Code' }, { status: 400 });
    }

    // ── หา QR ──────────────────────────────────────────────────────────────
    const qr = await prisma.qRCode.findUnique({
      where: { code: qrCode.trim() },
      include: { activity: true },
    });

    if (!qr)              return NextResponse.json({ error: 'ไม่พบ QR Code นี้ในระบบ' },       { status: 404 });
    if (!qr.isActive)     return NextResponse.json({ error: 'QR Code นี้ถูกปิดใช้งานแล้ว' },   { status: 400 });
    if (qr.activity.status !== 'ACTIVE')
                          return NextResponse.json({ error: 'กิจกรรมนี้ปิดรับสมัครแล้ว' },     { status: 400 });
    if (qr.expiredAt && qr.expiredAt < new Date())
                          return NextResponse.json({ error: 'QR Code หมดอายุแล้ว' },           { status: 400 });
    if (qr.type === 'SINGLE_USE'  && qr.isUsed)
                          return NextResponse.json({ error: 'QR Code นี้ถูกใช้งานแล้ว' },      { status: 400 });
    if (qr.type === 'LIMITED_USE' && qr.currentUses >= qr.maxUses)
                          return NextResponse.json({ error: 'QR Code ถึงขีดจำกัดการใช้งาน' }, { status: 400 });

    // ── หา Student จาก User ────────────────────────────────────────────────
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stdCode: true },
    });
    if (!user?.stdCode) {
      return NextResponse.json({ error: 'ไม่พบรหัสนักศึกษา กรุณาติดต่อเจ้าหน้าที่' }, { status: 404 });
    }

    // หรือสร้างใหม่ถ้ายังไม่มี
    let student = await prisma.student.findUnique({ where: { stdCode: user.stdCode } });
    if (!student) {
      const u = await prisma.user.findUnique({ where: { id: session.user.id } });
      student = await prisma.student.create({
        data: {
          stdCode:  user.stdCode,
          name:     u?.name    ?? 'ไม่ระบุชื่อ',
          title:    u?.title   ?? null,
          faculty:  u?.faculty ?? null,
          program:  u?.program ?? null,
        },
      });
    }

    // ── เช็คสแกนซ้ำ ────────────────────────────────────────────────────────
    const already = await prisma.activityHistory.findUnique({
      where: { qrCodeId_studentId: { qrCodeId: qr.id, studentId: student.id } },
    });
    if (already) return NextResponse.json({ error: 'คุณได้สแกนกิจกรรมนี้ไปแล้ว' }, { status: 400 });

    const hours = qr.activity.hours;
    const group = qr.activity.group;

    // ── Transaction ────────────────────────────────────────────────────────
    await prisma.$transaction([
      prisma.activityHistory.create({
        data: { activityId: qr.activityId, qrCodeId: qr.id, studentId: student.id, hoursEarned: hours },
      }),
      prisma.qRCode.update({
        where: { id: qr.id },
        data: {
          currentUses: { increment: 1 },
          ...(qr.type === 'SINGLE_USE' ? { isUsed: true, usedAt: new Date(), usedBy: student.id } : {}),
        },
      }),
      prisma.student.update({
        where: { id: student.id },
        data: {
          centralHours: group === 'CENTRAL' ? { increment: hours } : undefined,
          facultyHours: group === 'FACULTY' ? { increment: hours } : undefined,
          freeHours:    group === 'FREE'    ? { increment: hours } : undefined,
        },
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          centralHours: group === 'CENTRAL' ? { increment: hours } : undefined,
          facultyHours: group === 'FACULTY' ? { increment: hours } : undefined,
          freeHours:    group === 'FREE'    ? { increment: hours } : undefined,
        },
      }),
    ]);

    return NextResponse.json({
      message: `สแกนสำเร็จ! ได้รับ ${hours} ชั่วโมง${groupLabels[group]}`,
      activity: {
        id:        qr.activity.id,
        name:      qr.activity.name,
        group:     qr.activity.group,
        hours,
        organizer: qr.activity.organizer,
      },
    });

  } catch (err) {
    console.error('[students/scan]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดภายในระบบ' }, { status: 500 });
  }
}

const groupLabels: Record<string, string> = {
  CENTRAL: 'ส่วนกลาง',
  FACULTY: 'คณะ',
  FREE:    'เสรี',
};