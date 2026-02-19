// scripts/check-tables.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTables() {
  try {
    console.log('📋 Checking table structure...');
    
    // ตรวจสอบว่ามี tables ตาม schema หรือไม่
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    console.log('📦 Available tables:');
    console.log(tables);

    // ตรวจสอบแต่ละ table ว่ามี columns อะไรบ้าง
    for (const table of ['activities', 'students', 'faculty_requirements', 'qr_codes']) {
      const columns = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = ${table}
        ORDER BY ordinal_position
      `;
      console.log(`\n🏷️  Table: ${table}`);
      console.log(columns);
    }

  } catch (error) {
    console.error('❌ Error checking tables:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();