import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { SignJWT } from 'jose';

const prisma = new PrismaClient();
const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-this');

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // ตรวจสอบว่ามีการกรอกข้อมูลครบหรือไม่
    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกรหัสผู้ใช้และรหัสผ่าน' },
        { status: 400 }
      );
    }

    // ค้นหานักศึกษาจาก stdCode
    const student = await prisma.student.findUnique({
      where: { stdCode: username },
      select: {
        id: true,
        stdCode: true,
        title: true,
        name: true,
        faculty: true,
        program: true,
        centralHours: true,
        facultyHours: true,
        freeHours: true,
      }
    });

    if (!student) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบรหัสนักศึกษาในระบบ' },
        { status: 401 }
      );
    }

    // ตรวจสอบรหัสผ่าน (ตัวอย่าง: ใช้ stdCode เป็นรหัสผ่านชั่วคราว)
    // ในระบบจริงควรเก็บ password ที่ hash ไว้ในฐานข้อมูล
    const isPasswordValid = password === student.stdCode; // เปลี่ยนตามระบบจริง

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'รหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    // สร้าง JWT token
    const token = await new SignJWT({
        id: student.id,
        stdCode: student.stdCode,
        role: 'student'
      })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secretKey);

    // คำนวณชั่วโมงรวม
    const totalHours = student.centralHours + student.facultyHours + student.freeHours;

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: student.id,
        stdCode: student.stdCode,
        fullName: `${student.title || ''}${student.name}`.trim(),
        title: student.title,
        name: student.name,
        faculty: student.faculty,
        program: student.program,
        hours: {
          central: student.centralHours,
          faculty: student.facultyHours,
          free: student.freeHours,
          total: totalHours
        },
        role: 'student'
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในระบบ' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}