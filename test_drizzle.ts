import { db } from "./server/db";
import { users } from "./shared/schema";

async function main() {
  try {
    const allUsers = await db.select().from(users);
    console.log(`Drizzle query successful! Total users: ${allUsers.length}`);
    
    const sample = allUsers.find(u => u.username === "نويشي");
    if (sample) {
      console.log(`User ${sample.name} balance is still: ${sample.balance}`);
      console.log(`is_pin_set status: ${sample.isPinSet}`);
    }
  } catch (e) {
    console.error("Error connecting with Drizzle:", e);
  } finally {
    process.exit(0);
  }
}
main();
