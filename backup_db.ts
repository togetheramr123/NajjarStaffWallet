import { pool } from "./server/db";
import fs from "fs";

async function main() {
  try {
    console.log("Starting backup of all 10 tables...");
    const tables = ['users', 'transactions', 'withdrawal_requests', 'service_fee_log', 'notifications', 'branches', 'push_subscriptions', 'broadcast_messages', 'message_read_status', 'system_settings'];
    const backup: Record<string, any> = {};
    
    for (const table of tables) {
      const { rows } = await pool.query(`SELECT * FROM ${table}`);
      backup[table] = rows;
    }
    
    fs.writeFileSync('live_db_backup.json', JSON.stringify(backup, null, 2));
    
    const stats = fs.statSync('live_db_backup.json');
    console.log(`Backup file size: ${stats.size} bytes`);
    console.log(`Users count: ${backup.users.length}`);
    console.log(`Transactions count: ${backup.transactions.length}`);
    console.log(`Withdrawal Requests count: ${backup.withdrawal_requests.length}`);
    
    if (backup.users.length > 0) {
      const sampleUser = { ...backup.users[0] };
      delete sampleUser.password;
      console.log("Sample User:", JSON.stringify(sampleUser, null, 2));
    }
    
    console.log("Backup completed successfully.");
  } catch (e) {
    console.error("Error:", e);
  } finally {
    process.exit(0);
  }
}
main();
