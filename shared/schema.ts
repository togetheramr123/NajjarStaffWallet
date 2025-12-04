import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const roleEnum = pgEnum("role", ["employee", "manager"]);
export const statusEnum = pgEnum("status", ["active", "inactive"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["withdrawal", "deposit", "service_fee", "adjustment"]);
export const requestStatusEnum = pgEnum("request_status", ["pending", "approved", "rejected"]);
export const beneficiaryEnum = pgEnum("beneficiary", ["self", "family"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  employeeNumber: text("employee_number").notNull().unique(),
  role: roleEnum("role").notNull().default("employee"),
  status: statusEnum("status").notNull().default("active"),
  balance: integer("balance").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: transactionTypeEnum("type").notNull(),
  amount: integer("amount").notNull(),
  beneficiary: beneficiaryEnum("beneficiary"),
  status: requestStatusEnum("status").notNull().default("approved"),
  description: text("description"),
  attachmentPath: text("attachment_path"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  processedBy: varchar("processed_by").references(() => users.id),
  processedAt: timestamp("processed_at"),
  processingNotes: text("processing_notes"),
});

export const withdrawalRequests = pgTable("withdrawal_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  beneficiary: beneficiaryEnum("beneficiary").notNull(),
  notes: text("notes"),
  attachmentPath: text("attachment_path"),
  status: requestStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  processedBy: varchar("processed_by").references(() => users.id),
  processedAt: timestamp("processed_at"),
  processingNotes: text("processing_notes"),
  modifiedAmount: integer("modified_amount"),
});

export const serviceFeeLog = pgTable("service_fee_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull().default(50),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  processedAt: timestamp("processed_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  processedAt: true,
});

export const insertWithdrawalRequestSchema = createInsertSchema(withdrawalRequests).omit({
  id: true,
  createdAt: true,
  processedAt: true,
  processedBy: true,
  processingNotes: true,
  modifiedAmount: true,
  status: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "اسم المستخدم مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export const createEmployeeSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  employeeNumber: z.string().min(1, "رقم الموظف مطلوب"),
  username: z.string().min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل"),
  password: z.string().min(4, "كلمة المرور يجب أن تكون 4 أحرف على الأقل"),
  role: z.enum(["employee", "manager"]).default("employee"),
  initialBalance: z.number().min(0).default(0),
});

export const adjustBalanceSchema = z.object({
  amount: z.number().positive("المبلغ يجب أن يكون موجباً"),
  type: z.enum(["add", "subtract"]),
  reason: z.string().min(1, "سبب التعديل مطلوب"),
});

export const createWithdrawalSchema = z.object({
  amount: z.number().positive("المبلغ يجب أن يكون موجباً"),
  beneficiary: z.enum(["self", "family"]),
  notes: z.string().optional(),
});

export const processRequestSchema = z.object({
  action: z.enum(["approve", "reject", "modify"]),
  notes: z.string().optional(),
  modifiedAmount: z.number().positive().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;
export type ServiceFeeLog = typeof serviceFeeLog.$inferSelect;
