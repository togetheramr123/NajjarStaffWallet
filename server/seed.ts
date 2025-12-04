import { db } from "./db";
import { users } from "@shared/schema";
import { hashPassword } from "./auth";

async function seed() {
  console.log("Starting database seed...");

  const managerPassword = await hashPassword("admin123");
  const employeePassword = await hashPassword("1234");

  const existingManager = await db.select().from(users).limit(1);
  
  if (existingManager.length > 0) {
    console.log("Database already has users, skipping seed.");
    return;
  }

  await db.insert(users).values([
    {
      username: "admin",
      password: managerPassword,
      name: "محمد المدير",
      employeeNumber: "MGR001",
      role: "manager",
      status: "active",
      balance: 0,
    },
    {
      username: "ahmed",
      password: employeePassword,
      name: "أحمد الخالد",
      employeeNumber: "EMP001",
      role: "employee",
      status: "active",
      balance: 5000,
    },
    {
      username: "sara",
      password: employeePassword,
      name: "سارة أحمد",
      employeeNumber: "EMP002",
      role: "employee",
      status: "active",
      balance: 3500,
    },
  ]);

  console.log("Database seeded successfully!");
  console.log("\nTest Accounts:");
  console.log("Manager: admin / admin123");
  console.log("Employee: ahmed / 1234");
  console.log("Employee: sara / 1234");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
