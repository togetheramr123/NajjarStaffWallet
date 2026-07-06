import { pool } from "./server/db";

async function main() {
  try {
    const { rows } = await pool.query("SELECT id, name, username, employee_number, role, status FROM users WHERE employee_number = '19939'");
    console.log("Users with 19939:", JSON.stringify(rows, null, 2));
    
    // Check if is_pin_set exists
    const columns = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
    console.log("User columns:", columns.rows.map(r => r.column_name).join(', '));
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
main();
