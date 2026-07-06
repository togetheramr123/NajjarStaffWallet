import { pool } from "./server/db";
import { hashPassword } from "./server/auth";

async function main() {
  try {
    console.log("Generating hashed password for '123456'...");
    const hashedPassword = await hashPassword("123456");
    
    console.log("Updating admin account...");
    const result = await pool.query(
      `UPDATE users 
       SET employee_number = '19939', password = $1 
       WHERE username = 'admin' 
       RETURNING id, username, employee_number, role`,
      [hashedPassword]
    );
    
    if (result.rows.length > 0) {
      console.log("Success! Updated admin:", JSON.stringify(result.rows[0], null, 2));
    } else {
      console.log("Error: Admin user not found.");
    }

    console.log("Checking for duplicate 19939...");
    const duplicates = await pool.query(`SELECT username, employee_number, role FROM users WHERE employee_number = '19939'`);
    console.log(`Found ${duplicates.rows.length} users with 19939:`, JSON.stringify(duplicates.rows, null, 2));

  } catch (e) {
    console.error("Error:", e);
  } finally {
    process.exit(0);
  }
}
main();
