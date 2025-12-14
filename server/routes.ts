import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { z } from "zod";
import { storage } from "./storage";
import { comparePasswords } from "./auth";
import { 
  loginSchema, 
  createEmployeeSchema, 
  adjustBalanceSchema, 
  createWithdrawalSchema,
  processRequestSchema,
  createBranchSchema,
  type User
} from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      name: string;
      employeeNumber: string;
      role: "employee" | "branch_manager" | "manager";
      status: "active" | "inactive";
      balance: number;
      branchId: string | null;
      createdAt: Date;
      password: string;
    }
  }
}

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("نوع الملف غير مدعوم"));
    }
  },
});

function requireAuth(req: Request, res: Response, next: () => void) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "غير مصرح" });
}

function requireManager(req: Request, res: Response, next: () => void) {
  if (req.isAuthenticated() && req.user?.role === "manager") {
    return next();
  }
  res.status(403).json({ message: "صلاحيات غير كافية" });
}

function requireBranchManagerOrAbove(req: Request, res: Response, next: () => void) {
  if (req.isAuthenticated() && (req.user?.role === "manager" || req.user?.role === "branch_manager")) {
    return next();
  }
  res.status(403).json({ message: "صلاحيات غير كافية" });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "اسم المستخدم أو كلمة المرور غير صحيحة" });
        }
        if (user.status === "inactive") {
          return done(null, false, { message: "الحساب معطل" });
        }
        const isValid = await comparePasswords(password, user.password);
        if (!isValid) {
          return done(null, false, { message: "اسم المستخدم أو كلمة المرور غير صحيحة" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || undefined);
    } catch (err) {
      done(err);
    }
  });

  // Trust proxy for production (Replit uses reverse proxy)
  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "hon-group-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.post("/api/auth/login", (req, res, next) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "بيانات غير صالحة", errors: parsed.error.errors });
    }

    passport.authenticate("local", (err: Error | null, user: User | false, info: { message: string }) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "فشل تسجيل الدخول" });
      }
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        const { password: _, ...safeUser } = user;
        return res.json({ user: safeUser });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "خطأ في تسجيل الخروج" });
      }
      res.json({ message: "تم تسجيل الخروج بنجاح" });
    });
  });

  app.get("/api/auth/me", requireAuth, (req, res) => {
    const { password: _, ...safeUser } = req.user!;
    res.json({ user: safeUser });
  });

  // Employee profile update (name and password)
  const updateProfileSchema = z.object({
    name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل").optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(4, "كلمة المرور يجب أن تكون 4 أحرف على الأقل").optional(),
  }).refine((data) => {
    // If newPassword is provided, currentPassword must also be provided
    if (data.newPassword && !data.currentPassword) {
      return false;
    }
    return true;
  }, { message: "يجب إدخال كلمة المرور الحالية لتغيير كلمة المرور" });

  app.patch("/api/profile", requireAuth, async (req, res) => {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0]?.message || "بيانات غير صالحة" });
    }

    try {
      const { name, currentPassword, newPassword } = parsed.data;
      const userId = req.user!.id;

      // If changing password, verify current password first
      if (newPassword && currentPassword) {
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "المستخدم غير موجود" });
        }
        
        const isValidPassword = await comparePasswords(currentPassword, user.password);
        if (!isValidPassword) {
          return res.status(400).json({ message: "كلمة المرور الحالية غير صحيحة" });
        }
      }

      // Build update object
      const updateData: { name?: string; password?: string } = {};
      if (name) updateData.name = name;
      if (newPassword) updateData.password = newPassword;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "لا توجد بيانات للتحديث" });
      }

      const updatedUser = await storage.updateUser(userId, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }

      const { password: _, ...safeUser } = updatedUser;
      res.json({ user: safeUser, message: "تم تحديث البيانات بنجاح" });
    } catch (error) {
      res.status(500).json({ message: "خطأ في تحديث البيانات" });
    }
  });

  // Profile picture upload
  app.post("/api/profile/picture", requireAuth, upload.single("picture"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "الرجاء اختيار صورة" });
      }

      const userId = req.user!.id;
      const picturePath = `/uploads/${req.file.filename}`;

      const updatedUser = await storage.updateUser(userId, { profilePicture: picturePath });
      if (!updatedUser) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }

      const { password: _, ...safeUser } = updatedUser;
      res.json({ user: safeUser, message: "تم تحديث الصورة بنجاح" });
    } catch (error) {
      res.status(500).json({ message: "خطأ في تحديث الصورة" });
    }
  });

  // Delete profile picture
  app.delete("/api/profile/picture", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;

      const updatedUser = await storage.updateUser(userId, { profilePicture: null });
      if (!updatedUser) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }

      const { password: _, ...safeUser } = updatedUser;
      res.json({ user: safeUser, message: "تم حذف الصورة بنجاح" });
    } catch (error) {
      res.status(500).json({ message: "خطأ في حذف الصورة" });
    }
  });

  app.get("/api/employees", requireBranchManagerOrAbove, async (req, res) => {
    try {
      const employees = await storage.getAllUsers();
      let filteredEmployees = employees;
      
      // Branch managers can only see employees from their branch
      if (req.user?.role === "branch_manager" && req.user?.branchId) {
        filteredEmployees = employees.filter(emp => 
          emp.branchId === req.user!.branchId && emp.role === "employee"
        );
      }
      
      const safeEmployees = filteredEmployees.map(({ password: _, ...emp }) => emp);
      res.json(safeEmployees);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب الموظفين" });
    }
  });

  app.post("/api/employees", requireManager, async (req, res) => {
    const parsed = createEmployeeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "بيانات غير صالحة", errors: parsed.error.errors });
    }

    try {
      const existingUser = await storage.getUserByUsername(parsed.data.username);
      if (existingUser) {
        return res.status(400).json({ message: "اسم المستخدم مستخدم بالفعل" });
      }

      const user = await storage.createUser({
        name: parsed.data.name,
        employeeNumber: parsed.data.employeeNumber,
        username: parsed.data.username,
        password: parsed.data.password,
        role: parsed.data.role,
        status: "active",
        balance: parsed.data.initialBalance,
        branchId: parsed.data.branchId || null,
      });

      const { password: _, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error) {
      res.status(500).json({ message: "خطأ في إنشاء الموظف" });
    }
  });

  app.patch("/api/employees/:id", requireManager, async (req, res) => {
    const { id } = req.params;
    const { name, employeeNumber, role, status, password, branchId } = req.body;

    try {
      const user = await storage.updateUser(id, { name, employeeNumber, role, status, password, branchId });
      if (!user) {
        return res.status(404).json({ message: "الموظف غير موجود" });
      }
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ message: "خطأ في تحديث الموظف" });
    }
  });

  app.delete("/api/employees/:id", requireManager, async (req, res) => {
    const { id } = req.params;
    const currentUser = req.user!;

    // Prevent deleting yourself
    if (id === currentUser.id) {
      return res.status(400).json({ message: "لا يمكنك حذف حسابك الخاص" });
    }

    try {
      const userToDelete = await storage.getUser(id);
      if (!userToDelete) {
        return res.status(404).json({ message: "الموظف غير موجود" });
      }

      // Only main manager can delete
      if (currentUser.role !== "manager") {
        return res.status(403).json({ message: "صلاحيات غير كافية" });
      }

      const deleted = await storage.deleteUser(id);
      if (!deleted) {
        return res.status(500).json({ message: "فشل في حذف الموظف" });
      }

      res.json({ message: "تم حذف الموظف بنجاح" });
    } catch (error) {
      res.status(500).json({ message: "خطأ في حذف الموظف" });
    }
  });

  app.post("/api/employees/:id/balance", requireManager, async (req, res) => {
    const { id } = req.params;
    const parsed = adjustBalanceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "بيانات غير صالحة", errors: parsed.error.errors });
    }

    try {
      const { amount, type, reason } = parsed.data;
      const adjustAmount = type === "add" ? amount : -amount;
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "الموظف غير موجود" });
      }

      if (type === "subtract" && user.balance < amount) {
        return res.status(400).json({ message: "الرصيد غير كافٍ" });
      }

      await storage.updateUserBalance(id, adjustAmount);

      await storage.createTransaction({
        userId: id,
        type: "adjustment",
        amount,
        status: "approved",
        description: reason,
        beneficiary: null,
        attachmentPath: null,
        processedBy: req.user!.id,
        processedAt: new Date(),
        processingNotes: type === "add" ? "إضافة رصيد" : "خصم رصيد",
      });

      const updatedUser = await storage.getUser(id);
      const { password: _, ...safeUser } = updatedUser!;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ message: "خطأ في تعديل الرصيد" });
    }
  });

  // Bulk balance adjustment (manager only)
  const bulkBalanceSchema = z.object({
    employeeIds: z.array(z.string()).min(1),
    amount: z.number().positive(),
    type: z.enum(["add", "subtract"]),
    reason: z.string().min(1),
  });

  app.post("/api/employees/bulk-balance", requireManager, async (req, res) => {
    const parsed = bulkBalanceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "بيانات غير صالحة", errors: parsed.error.errors });
    }

    try {
      const { employeeIds, amount, type, reason } = parsed.data;
      const adjustAmount = type === "add" ? amount : -amount;
      const results: { success: string[]; failed: string[] } = { success: [], failed: [] };

      for (const employeeId of employeeIds) {
        const user = await storage.getUser(employeeId);
        if (!user) {
          results.failed.push(employeeId);
          continue;
        }

        if (type === "subtract" && user.balance < amount) {
          results.failed.push(employeeId);
          continue;
        }

        await storage.updateUserBalance(employeeId, adjustAmount);

        await storage.createTransaction({
          userId: employeeId,
          type: "adjustment",
          amount,
          status: "approved",
          description: reason,
          beneficiary: null,
          attachmentPath: null,
          processedBy: req.user!.id,
          processedAt: new Date(),
          processingNotes: type === "add" ? "إضافة رصيد جماعي" : "خصم رصيد جماعي",
        });

        results.success.push(employeeId);
      }

      res.json({
        message: `تم تعديل رصيد ${results.success.length} موظف`,
        success: results.success.length,
        failed: results.failed.length,
      });
    } catch (error) {
      res.status(500).json({ message: "خطأ في تعديل الرصيد الجماعي" });
    }
  });

  // Branch routes (manager only)
  app.get("/api/branches", requireBranchManagerOrAbove, async (_req, res) => {
    try {
      const branches = await storage.getAllBranches();
      res.json(branches);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب الفروع" });
    }
  });

  app.post("/api/branches", requireManager, async (req, res) => {
    const parsed = createBranchSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "بيانات غير صالحة", errors: parsed.error.errors });
    }

    try {
      const branch = await storage.createBranch({
        name: parsed.data.name,
        code: parsed.data.code,
      });
      res.status(201).json(branch);
    } catch (error) {
      res.status(500).json({ message: "خطأ في إنشاء الفرع" });
    }
  });

  app.patch("/api/branches/:id", requireManager, async (req, res) => {
    const { id } = req.params;
    const { name, code } = req.body;

    try {
      const branch = await storage.updateBranch(id, { name, code });
      if (!branch) {
        return res.status(404).json({ message: "الفرع غير موجود" });
      }
      res.json(branch);
    } catch (error) {
      res.status(500).json({ message: "خطأ في تحديث الفرع" });
    }
  });

  app.delete("/api/branches/:id", requireManager, async (req, res) => {
    const { id } = req.params;

    try {
      const deleted = await storage.deleteBranch(id);
      if (!deleted) {
        return res.status(404).json({ message: "الفرع غير موجود" });
      }
      res.json({ message: "تم حذف الفرع بنجاح" });
    } catch (error) {
      res.status(500).json({ message: "خطأ في حذف الفرع" });
    }
  });

  // Branch employees (for branch managers)
  app.get("/api/branches/:branchId/employees", requireBranchManagerOrAbove, async (req, res) => {
    const { branchId } = req.params;
    
    // Branch managers can only see their own branch
    if (req.user?.role === "branch_manager" && req.user?.branchId !== branchId) {
      return res.status(403).json({ message: "لا يمكنك الوصول لهذا الفرع" });
    }

    try {
      const employees = await storage.getUsersByBranch(branchId);
      const safeEmployees = employees.map(({ password: _, ...emp }) => emp);
      res.json(safeEmployees);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب موظفي الفرع" });
    }
  });

  // Branch pending requests (for branch managers)
  app.get("/api/branches/:branchId/withdrawal-requests/pending", requireBranchManagerOrAbove, async (req, res) => {
    const { branchId } = req.params;
    
    // Branch managers can only see their own branch
    if (req.user?.role === "branch_manager" && req.user?.branchId !== branchId) {
      return res.status(403).json({ message: "لا يمكنك الوصول لهذا الفرع" });
    }

    try {
      const requests = await storage.getPendingWithdrawalRequestsByBranch(branchId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب طلبات الفرع" });
    }
  });

  app.get("/api/balance", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      
      const pendingAmount = await storage.getPendingAmountForUser(req.user!.id);
      
      res.json({
        currentBalance: user.balance,
        pendingAmount,
        availableBalance: user.balance - pendingAmount,
        monthlyFee: 50,
      });
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب الرصيد" });
    }
  });

  app.get("/api/transactions", requireAuth, async (req, res) => {
    try {
      const transactions = await storage.getTransactions(req.user!.id);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب المعاملات" });
    }
  });

  app.get("/api/transactions/all", requireManager, async (_req, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب المعاملات" });
    }
  });

  app.get("/api/withdrawal-requests", requireAuth, async (req, res) => {
    try {
      const requests = await storage.getWithdrawalRequests(req.user!.id);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب الطلبات" });
    }
  });

  app.post("/api/withdrawal-requests", requireAuth, upload.single("attachment"), async (req, res) => {
    const parsed = createWithdrawalSchema.safeParse({
      amount: parseInt(req.body.amount),
      beneficiary: req.body.beneficiary,
      notes: req.body.notes,
    });
    
    if (!parsed.success) {
      return res.status(400).json({ message: "بيانات غير صالحة", errors: parsed.error.errors });
    }

    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }

      const pendingAmount = await storage.getPendingAmountForUser(req.user!.id);
      const availableBalance = user.balance - pendingAmount;

      if (parsed.data.amount > availableBalance) {
        return res.status(400).json({ message: "المبلغ المطلوب يتجاوز الرصيد المتاح" });
      }

      const request = await storage.createWithdrawalRequest({
        userId: req.user!.id,
        amount: parsed.data.amount,
        beneficiary: parsed.data.beneficiary,
        notes: parsed.data.notes || null,
        attachmentPath: req.file ? `/uploads/${req.file.filename}` : null,
      });

      res.status(201).json({ 
        message: "تم إرسال الطلب بنجاح",
        request: {
          id: request.id,
          amount: request.amount,
          beneficiary: request.beneficiary,
          notes: request.notes,
          createdAt: request.createdAt,
        }
      });
    } catch (error) {
      res.status(500).json({ message: "خطأ في إنشاء الطلب" });
    }
  });

  // Branch manager creates withdrawal request on behalf of employee
  const onBehalfWithdrawalSchema = z.object({
    employeeId: z.string().min(1, "معرف الموظف مطلوب"),
    amount: z.number().positive("المبلغ يجب أن يكون موجباً"),
    beneficiary: z.enum(["self", "family"]),
    notes: z.string().optional(),
  });

  app.post("/api/withdrawal-requests/on-behalf", requireBranchManagerOrAbove, async (req, res) => {
    const parsed = onBehalfWithdrawalSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ message: "بيانات غير صالحة", errors: parsed.error.errors });
    }

    try {
      const { employeeId, amount, beneficiary, notes } = parsed.data;
      
      // Get the employee
      const employee = await storage.getUser(employeeId);
      if (!employee) {
        return res.status(404).json({ message: "الموظف غير موجود" });
      }

      // Branch managers can only create requests for their branch employees
      if (req.user?.role === "branch_manager") {
        if (employee.branchId !== req.user.branchId) {
          return res.status(403).json({ message: "لا يمكنك إنشاء طلب لموظف من فرع آخر" });
        }
      }

      // Check available balance
      const pendingAmount = await storage.getPendingAmountForUser(employeeId);
      const availableBalance = employee.balance - pendingAmount;

      if (amount > availableBalance) {
        return res.status(400).json({ message: "المبلغ المطلوب يتجاوز الرصيد المتاح للموظف" });
      }

      const request = await storage.createWithdrawalRequest({
        userId: employeeId,
        amount,
        beneficiary,
        notes: notes || null,
        attachmentPath: null,
        createdOnBehalfBy: req.user!.id,
      });

      res.status(201).json({ 
        message: "تم إرسال الطلب بنجاح بالنيابة عن الموظف",
        request: {
          id: request.id,
          amount: request.amount,
          beneficiary: request.beneficiary,
          notes: request.notes,
          createdAt: request.createdAt,
          createdOnBehalfBy: request.createdOnBehalfBy,
        }
      });
    } catch (error) {
      res.status(500).json({ message: "خطأ في إنشاء الطلب" });
    }
  });

  app.get("/api/withdrawal-requests/pending", requireBranchManagerOrAbove, async (req, res) => {
    try {
      const allRequests = await storage.getPendingWithdrawalRequests();
      
      // Branch managers can only see pending requests from their branch employees
      let filteredRequests = allRequests;
      if (req.user?.role === "branch_manager" && req.user?.branchId) {
        filteredRequests = allRequests.filter(r => r.user.branchId === req.user!.branchId);
      }
      
      res.json(filteredRequests.map(r => ({
        id: r.id,
        employeeName: r.user.name,
        employeeId: r.user.employeeNumber,
        amount: r.amount,
        beneficiary: r.beneficiary,
        requestDate: r.createdAt,
        hasAttachment: !!r.attachmentPath,
        notes: r.notes,
        userId: r.userId,
        attachmentPath: r.attachmentPath,
      })));
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب الطلبات المعلقة" });
    }
  });

  app.get("/api/withdrawal-requests/all", requireBranchManagerOrAbove, async (req, res) => {
    try {
      const allRequests = await storage.getWithdrawalRequests();
      
      // Branch managers can only see requests from their branch employees
      let filteredRequests = allRequests;
      if (req.user?.role === "branch_manager" && req.user?.branchId) {
        const branchEmployees = await storage.getAllUsers();
        const branchEmployeeIds = branchEmployees
          .filter(emp => emp.branchId === req.user!.branchId)
          .map(emp => emp.id);
        filteredRequests = allRequests.filter(r => branchEmployeeIds.includes(r.userId));
      }
      
      res.json(filteredRequests);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب الطلبات" });
    }
  });

  app.post("/api/withdrawal-requests/:id/process", requireBranchManagerOrAbove, async (req, res) => {
    const { id } = req.params;
    const parsed = processRequestSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ message: "بيانات غير صالحة", errors: parsed.error.errors });
    }

    try {
      const request = await storage.getWithdrawalRequest(id);
      if (!request) {
        return res.status(404).json({ message: "الطلب غير موجود" });
      }

      if (request.status !== "pending") {
        return res.status(400).json({ message: "الطلب تمت معالجته مسبقاً" });
      }

      const employee = await storage.getUser(request.userId);
      if (!employee) {
        return res.status(404).json({ message: "الموظف غير موجود" });
      }

      // Branch managers can only process requests for their branch employees
      if (req.user?.role === "branch_manager") {
        if (employee.branchId !== req.user.branchId) {
          return res.status(403).json({ message: "لا يمكنك معالجة طلبات موظفين من فرع آخر" });
        }
      }

      const { action, notes, modifiedAmount } = parsed.data;
      const status = action === "reject" ? "rejected" : "approved";
      const finalAmount = action === "modify" ? modifiedAmount : request.amount;
      
      // Check for overdraw protection when approving
      if (status === "approved" && finalAmount) {
        // Get pending amount excluding the current request
        const allPendingRequests = await storage.getPendingWithdrawalRequests();
        const otherPendingAmount = allPendingRequests
          .filter(r => r.id !== id && r.userId === request.userId)
          .reduce((sum, r) => sum + r.amount, 0);
        
        const availableBalance = employee.balance - otherPendingAmount;
        
        if (finalAmount > availableBalance) {
          return res.status(400).json({ 
            message: `الرصيد غير كافي. الرصيد المتاح: ${availableBalance.toLocaleString('ar-EG')} ج.م` 
          });
        }
      }
      
      const processedRequest = await storage.processWithdrawalRequest(
        id,
        req.user!.id,
        status,
        notes,
        action === "modify" ? modifiedAmount : undefined
      );

      const updatedEmployee = await storage.getUser(request.userId);
      
      if (status === "approved") {
        const notificationType = action === "modify" ? "modified" : "approved";
        const notificationTitle = action === "modify" ? "تم تعديل طلب السحب والموافقة عليه" : "تمت الموافقة على طلب السحب";
        const notificationMessage = action === "modify" 
          ? `تم تعديل مبلغ السحب من ${request.amount.toLocaleString('ar-EG')} ج.م إلى ${finalAmount?.toLocaleString('ar-EG')} ج.م والموافقة عليه`
          : `تمت الموافقة على طلب سحب ${(finalAmount || request.amount).toLocaleString('ar-EG')} ج.م`;
        
        await storage.createNotification({
          userId: request.userId,
          type: notificationType,
          title: notificationTitle,
          message: notificationMessage,
          amount: finalAmount || request.amount,
          remainingBalance: updatedEmployee?.balance || 0,
        });
      } else {
        await storage.createNotification({
          userId: request.userId,
          type: "rejected",
          title: "تم رفض طلب السحب",
          message: `تم رفض طلب سحب ${request.amount.toLocaleString('ar-EG')} ج.م${notes ? `. السبب: ${notes}` : ''}`,
          amount: request.amount,
        });
      }
      
      res.json({
        ...processedRequest,
        receipt: status === "approved" ? {
          id: processedRequest!.id,
          employeeName: employee.name,
          employeeNumber: employee.employeeNumber,
          amount: finalAmount || request.amount,
          remainingBalance: updatedEmployee?.balance || 0,
          beneficiary: request.beneficiary,
          approvedBy: req.user!.name,
          approvedAt: new Date().toISOString(),
          notes: notes || undefined,
        } : undefined,
      });
    } catch (error) {
      res.status(500).json({ message: "خطأ في معالجة الطلب" });
    }
  });

  app.get("/api/stats", requireBranchManagerOrAbove, async (req, res) => {
    try {
      const allEmployees = await storage.getAllUsers();
      const allPendingRequests = await storage.getPendingWithdrawalRequests();
      const allTransactions = await storage.getAllTransactions();

      // Filter for branch managers
      let employees = allEmployees;
      let pendingRequests = allPendingRequests;
      let transactions = allTransactions;
      
      if (req.user?.role === "branch_manager" && req.user?.branchId) {
        employees = allEmployees.filter(e => e.branchId === req.user!.branchId && e.role === "employee");
        pendingRequests = allPendingRequests.filter(r => r.user.branchId === req.user!.branchId);
        const branchEmployeeIds = employees.map(e => e.id);
        transactions = allTransactions.filter(t => branchEmployeeIds.includes(t.userId));
      }

      const activeEmployees = employees.filter(e => e.status === "active").length;
      const totalBalance = employees.reduce((sum, e) => sum + e.balance, 0);
      const approvedThisMonth = transactions.filter(t => {
        const date = new Date(t.createdAt);
        const now = new Date();
        return t.type === "withdrawal" && 
               t.status === "approved" && 
               date.getMonth() === now.getMonth() && 
               date.getFullYear() === now.getFullYear();
      }).length;

      res.json({
        totalEmployees: activeEmployees,
        totalBalance,
        pendingRequests: pendingRequests.length,
        approvedThisMonth,
      });
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب الإحصائيات" });
    }
  });

  app.post("/api/service-fees/process", requireManager, async (_req, res) => {
    try {
      const count = await storage.processMonthlyServiceFees();
      res.json({ message: `تم معالجة رسوم الخدمة لـ ${count} موظف` });
    } catch (error) {
      res.status(500).json({ message: "خطأ في معالجة رسوم الخدمة" });
    }
  });

  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const notifications = await storage.getNotifications(req.user!.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب الإشعارات" });
    }
  });

  app.get("/api/notifications/unread-count", requireAuth, async (req, res) => {
    try {
      const count = await storage.getUnreadNotificationsCount(req.user!.id);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب عدد الإشعارات" });
    }
  });

  app.post("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      const updated = await storage.markNotificationAsRead(req.params.id, req.user!.id);
      if (!updated) {
        return res.status(404).json({ message: "الإشعار غير موجود" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "خطأ في تحديث الإشعار" });
    }
  });

  app.post("/api/notifications/read-all", requireAuth, async (req, res) => {
    try {
      await storage.markAllNotificationsAsRead(req.user!.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "خطأ في تحديث الإشعارات" });
    }
  });

  app.use("/uploads", requireAuth, (req, res, next) => {
    const filePath = path.join(uploadDir, path.basename(req.path));
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: "الملف غير موجود" });
    }
  });

  return httpServer;
}
