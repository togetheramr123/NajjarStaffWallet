import { pool } from "./server/db";

async function main() {
  try {
    console.log("Adding is_pin_set column to users table...");
    await pool.query(`ALTER TABLE users ADD COLUMN is_pin_set BOOLEAN NOT NULL DEFAULT false;`);
    console.log("Successfully added is_pin_set column.");
  } catch (e) {
    console.error("Error:", e);
  } finally {
    process.exit(0);
  }
}
main();
