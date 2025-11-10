// check-db.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 ตรวจสอบตารางใน database...');
    
    // 1. ตรวจสอบตารางทั้งหมด
    const tables = await prisma.$queryRaw`
      SELECT 
        table_schema,
        table_name,
        table_type
      FROM information_schema.tables 
      WHERE table_catalog = 'acty_db'
      ORDER BY table_schema, table_name
    `;
    
    console.log('📊 ตารางทั้งหมด:');
    console.table(tables);

    // 2. ตรวจสอบข้อมูลในแต่ละตาราง
    if (tables.length > 0) {
      for (const table of tables) {
        if (table.table_type === 'BASE TABLE') {
          const tableName = `${table.table_schema}.${table.table_name}`;
          const count = await prisma.$queryRawUnsafe(
            `SELECT COUNT(*) as count FROM ${tableName}`
          );
          console.log(`📈 ${tableName}: ${count[0].count} records`);
        }
      }
    }

  } catch (error) {
    console.error('❌ ข้อผิดพลาด:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();