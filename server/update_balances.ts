import pg from "pg";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// ========================
// قائمة الموظفين وأرصدتهم
// ========================
const employees = [
  { name: "محمد فلوجي", balance: 5000 },
  { name: "عمر عامر", balance: 100 },
  { name: "نويشي", balance: 4890 },
  { name: "احمد رمضان", balance: 5000 },
  { name: "منعم", balance: 4500 },
  { name: "محمد ياسر", balance: 2475 },
  { name: "الحملاوي", balance: 1300 },
  { name: "عمرو مرسي", balance: 5000 },
  { name: "احمد قاسم", balance: 5000 },
  { name: "عمر صابر", balance: 4425 },
  { name: "صلاح سعيد", balance: 2500 },
  { name: "سامح", balance: 1760 },
  { name: "محمد سعيد", balance: 4000 },
  { name: "محمود حرموش", balance: 2770 },
  { name: "عمرو القرش", balance: 1740 },
  { name: "محمد صلاح", balance: 5000 },
  { name: "عبد الرحمن البنا", balance: 500 },
  { name: "اسماعيل فتحي", balance: 3800 },
  { name: "أبو عمر", balance: 4000 },
  { name: "معاذ", balance: 1755 },
];

// الباسورد الموحد لجميع الموظفين
const DEFAULT_PASSWORD = "123456";
// رصيد المدير
const ADMIN_BALANCE = 5000;

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set!");
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString: DATABASE_URL });

  try {
    console.log("🔄 جاري تجهيز كلمة المرور الموحدة...");
    const hashedPassword = await hashPassword(DEFAULT_PASSWORD);
    console.log("✅ تم تجهيز كلمة المرور");

    // 1. Update admin balance and password
    console.log("\n📋 تحديث حساب المدير (admin)...");
    const adminResult = await pool.query(
      `UPDATE users SET balance = $1, password = $2 WHERE username = 'admin'`,
      [ADMIN_BALANCE, hashedPassword]
    );
    console.log(`✅ المدير: تم تحديث الرصيد إلى ${ADMIN_BALANCE} وكلمة المرور إلى ${DEFAULT_PASSWORD} (${adminResult.rowCount} row)`);

    // 2. Get all existing users
    const existingUsers = await pool.query(`SELECT id, name, username, balance FROM users`);
    console.log(`\n📊 عدد المستخدمين الحاليين: ${existingUsers.rows.length}`);
    console.log("الأسماء الموجودة:", existingUsers.rows.map((u: { name: string }) => u.name).join(", "));

    // 3. Update each employee
    console.log("\n🔄 جاري تحديث الموظفين...");
    let updated = 0;
    let created = 0;
    let notFound = 0;

    for (const emp of employees) {
      // Try to find employee by name (partial match)
      const found = await pool.query(
        `SELECT id, name, username, balance FROM users WHERE name ILIKE $1`,
        [`%${emp.name}%`]
      );

      if (found.rows.length > 0) {
        const user = found.rows[0] as { id: string; name: string; username: string; balance: number };
        // Update balance, username = name, password = 123456
        await pool.query(
          `UPDATE users SET balance = $1, username = $2, password = $3 WHERE id = $4`,
          [emp.balance, emp.name, hashedPassword, user.id]
        );
        console.log(`  ✅ ${emp.name}: رصيد ${user.balance} → ${emp.balance} | يوزر: ${user.username} → ${emp.name}`);
        updated++;
      } else {
        // Employee not found - create new one
        const empNumber = `EMP${String(Date.now()).slice(-6)}${Math.floor(Math.random() * 100)}`;
        await pool.query(
          `INSERT INTO users (id, name, username, password, employee_number, role, status, balance)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, 'employee', 'active', $5)`,
          [emp.name, emp.name, hashedPassword, empNumber, emp.balance]
        );
        console.log(`  🆕 ${emp.name}: تم إنشاء حساب جديد برصيد ${emp.balance}`);
        created++;
      }
    }

    console.log(`\n📊 ملخص التحديثات:`);
    console.log(`  ✅ تم تحديث: ${updated} موظف`);
    console.log(`  🆕 تم إنشاء: ${created} موظف جديد`);
    console.log(`  ❌ لم يتم العثور: ${notFound}`);
    console.log(`\n🎉 تم الانتهاء بنجاح!`);
    console.log(`📌 كلمة المرور لجميع الموظفين: ${DEFAULT_PASSWORD}`);
    console.log(`📌 اسم المستخدم = الاسم الحقيقي للموظف`);

  } catch (error) {
    console.error("❌ خطأ:", error);
  } finally {
    await pool.end();
  }
}

main();
