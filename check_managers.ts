import { db } from "./server/db";
import { users } from "./shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  try {
    const managers = await db.select({
      name: users.name,
      username: users.username,
      employeeNumber: users.employeeNumber,
      status: users.status,
      role: users.role
    }).from(users).where(eq(users.role, "manager"));
    console.log("Managers:", JSON.stringify(managers, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
main();
