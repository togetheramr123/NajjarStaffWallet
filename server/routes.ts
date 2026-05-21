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
  sendMessageSchema,
  type User
} from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { sendPushNotification, sendPushToManagers, sendPushToBranchManagers, getVapidPublicKey } from "./pushService";
import { registerObjectStorageRoutes, ObjectStorageService, ObjectNotFoundError, objectStorageClient, parseObjectPath } from "./replit_integrations/object_storage";

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
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      "image/jpeg", 
      "image/png", 
      "image/gif", 
      "image/webp",
      "image/heic",
      "image/heif",
      "application/pdf"
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("نوع الملف غير مدعوم. يرجى رفع صورة أو ملف PDF."));
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

    passport.authenticate("local", async (err: Error | null, user: User | false, info: { message: string }) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "فشل تسجيل الدخول" });
      }
      
      // Check if password matches 123456 or 1234 to enforce password change
      const requiresPasswordChange = (await comparePasswords("123456", user.password)) || (await comparePasswords("1234", user.password));
      
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        const { password: _, ...safeUser } = user;
        return res.json({ user: { ...safeUser, requiresPasswordChange } });
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

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    const requiresPasswordChange = (await comparePasswords("123456", req.user!.password)) || (await comparePasswords("1234", req.user!.password));
    const { password: _, ...safeUser } = req.user!;
    res.json({ user: { ...safeUser, requiresPasswordChange } });
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
      let picturePath: string;
      
      try {
        const objectStorage = new ObjectStorageService();
        const privateDir = objectStorage.getPrivateObjectDir();
        const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(req.file.originalname)}`;
        const objectPath = `${privateDir}/profiles/${uniqueFilename}`;
        
        const { bucketName, objectName } = parseObjectPath(objectPath);
        const bucket = objectStorageClient.bucket(bucketName);
        const file = bucket.file(objectName);
        
        await file.save(req.file.buffer, {
          metadata: {
            contentType: req.file.mimetype,
          },
        });
        
        picturePath = `/objects/profiles/${uniqueFilename}`;
      } catch (objectStorageError) {
        console.warn("Object Storage upload failed, falling back to local storage:", objectStorageError);
        const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(req.file.originalname)}`;
        const localDir = path.join(uploadDir, "profiles");
        if (!fs.existsSync(localDir)) {
          fs.mkdirSync(localDir, { recursive: true });
        }
        const localPath = path.join(localDir, uniqueFilename);
        fs.writeFileSync(localPath, req.file.buffer);
        picturePath = `/objects/profiles/${uniqueFilename}`;
      }

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
      
      // Branch managers can only see regular employees from their branch (not other managers)
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
        password: "123456", // Default unified password
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
    const { name, username, employeeNumber, role, status, password, branchId } = req.body;

    try {
      const user = await storage.updateUser(id, { name, username, employeeNumber, role, status, password, branchId });
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

      // Check if user was deactivated instead of hard-deleted to preserve history
      const checkUser = await storage.getUser(id);
      if (checkUser && checkUser.status === "inactive") {
        return res.json({ message: "تم تعطيل حساب الموظف بنجاح للحفاظ على سجلاته المالية" });
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

      const updatedUser = await storage.adjustUserBalance(id, amount, type, reason, req.user!.id);
      if (!updatedUser) {
        return res.status(404).json({ message: "الموظف غير موجود" });
      }

      const { password: _, ...safeUser } = updatedUser;
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

        const updatedUser = await storage.adjustUserBalance(employeeId, amount, type, reason, req.user!.id);
        if (updatedUser) {
          results.success.push(employeeId);
        } else {
          results.failed.push(employeeId);
        }
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
      
      let filteredEmployees = employees;
      // Branch managers can only see regular employees from their branch (not other managers)
      if (req.user?.role === "branch_manager") {
        filteredEmployees = employees.filter(emp => emp.role === "employee");
      }
      
      const safeEmployees = filteredEmployees.map(({ password: _, ...emp }) => emp);
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
      let filteredRequests = requests;
      // Hide requests from peer branch managers
      if (req.user?.role === "branch_manager") {
        filteredRequests = requests.filter(r => r.user.role === "employee");
      }
      res.json(filteredRequests);
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

  app.get("/api/transactions/all", requireBranchManagerOrAbove, async (req, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      
      if (req.user?.role === "branch_manager" && req.user?.branchId) {
        const branchEmployees = await storage.getUsersByBranch(req.user.branchId);
        // Only include regular employees to avoid seeing other managers' transactions
        const employeeIds = new Set(
          branchEmployees.filter(e => e.role === "employee").map(e => e.id)
        );
        employeeIds.add(req.user.id); // Add self
        
        const filtered = transactions.filter(t => employeeIds.has(t.userId));
        return res.json(filtered);
      }
      
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب المعاملات" });
    }
  });

  // Get managers for current user's branch (used for directing withdrawal requests)
  app.get("/api/my-branch-managers", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user || !user.branchId) {
        return res.json([]);
      }
      
      const branchUsers = await storage.getUsersByBranch(user.branchId);
      const managers = branchUsers
        .filter(u => u.role === "branch_manager")
        .map(({ password: _, ...manager }) => manager);
        
      res.json(managers);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب المدراء" });
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

      let attachmentPath: string | null = null;
      
      if (req.file) {
        try {
          const objectStorage = new ObjectStorageService();
          const privateDir = objectStorage.getPrivateObjectDir();
          const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(req.file.originalname)}`;
          const objectPath = `${privateDir}/withdrawals/${uniqueFilename}`;
          
          const { bucketName, objectName } = parseObjectPath(objectPath);
          const bucket = objectStorageClient.bucket(bucketName);
          const file = bucket.file(objectName);
          
          await file.save(req.file.buffer, {
            metadata: {
              contentType: req.file.mimetype,
            },
          });
          
          attachmentPath = `/objects/withdrawals/${uniqueFilename}`;
        } catch (objectStorageError) {
          console.warn("Object Storage upload failed, falling back to local storage:", objectStorageError);
          const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(req.file.originalname)}`;
          const localDir = path.join(uploadDir, "withdrawals");
          if (!fs.existsSync(localDir)) {
            fs.mkdirSync(localDir, { recursive: true });
          }
          const localPath = path.join(localDir, uniqueFilename);
          fs.writeFileSync(localPath, req.file.buffer);
          attachmentPath = `/objects/withdrawals/${uniqueFilename}`;
        }
      }

      const request = await storage.createWithdrawalRequest({
        userId: req.user!.id,
        amount: parsed.data.amount,
        beneficiary: parsed.data.beneficiary,
        notes: parsed.data.notes || null,
        attachmentPath,
      });

      // Send to Main Managers
      sendPushToManagers(
        "طلب سحب جديد",
        `${user.name} طلب سحب ${parsed.data.amount.toLocaleString('ar-EG')} ج.م`,
        '/'
      ).catch((err: Error) => console.error('Push to managers failed:', err));

      // Send to Branch Manager
      if (user.branchId) {
        sendPushToBranchManagers(
          user.branchId,
          "طلب سحب جديد",
          `${user.name} طلب سحب ${parsed.data.amount.toLocaleString('ar-EG')} ج.م`,
          '/'
        ).catch((err: Error) => console.error('Push to branch managers failed:', err));
      }

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
      // Send to Main Managers
      sendPushToManagers(
        "طلب سحب جديد (عن طريق الإدارة)",
        `${employee.name} لديه طلب سحب بـ ${amount.toLocaleString('ar-EG')} ج.م`,
        '/'
      ).catch((err: Error) => console.error('Push to managers failed:', err));

      // Also notify the employee themselves
      sendPushNotification(
        employeeId,
        "تم تقديم طلب سحب لك",
        `تم تقديم طلب سحب بـ ${amount.toLocaleString('ar-EG')} ج.م نيابة عنك`,
        '/withdraw'
      ).catch((err: Error) => console.error('Push to employee failed:', err));
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
      
      // Branch managers can only see pending requests from their branch regular employees
      let filteredRequests = allRequests;
      if (req.user?.role === "branch_manager" && req.user?.branchId) {
        filteredRequests = allRequests.filter(r => 
          r.user.branchId === req.user!.branchId && r.user.role === "employee"
        );
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
      const allRequests = await storage.getAllWithdrawalRequestsWithUsers();
      
      // Branch managers can only see requests from their branch regular employees
      let filteredRequests = allRequests;
      if (req.user?.role === "branch_manager" && req.user?.branchId) {
        filteredRequests = allRequests.filter(r => 
          r.user.branchId === req.user!.branchId && r.user.role === "employee"
        );
      }
      
      res.json(filteredRequests.map(r => ({
        id: r.id,
        userId: r.userId,
        amount: r.amount,
        beneficiary: r.beneficiary,
        notes: r.notes,
        attachmentPath: r.attachmentPath,
        status: r.status,
        createdAt: r.createdAt,
        processedBy: r.processedBy,
        processedAt: r.processedAt,
        processingNotes: r.processingNotes,
        modifiedAmount: r.modifiedAmount,
        employeeName: r.user.name,
        employeeNumber: r.user.employeeNumber,
      })));
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
        
        sendPushNotification(request.userId, notificationTitle, notificationMessage, '/').catch((err: Error) => console.error('Push failed:', err));
      } else {
        const rejectMessage = `تم رفض طلب سحب ${request.amount.toLocaleString('ar-EG')} ج.م${notes ? `. السبب: ${notes}` : ''}`;
        await storage.createNotification({
          userId: request.userId,
          type: "rejected",
          title: "تم رفض طلب السحب",
          message: rejectMessage,
          amount: request.amount,
        });
        
        sendPushNotification(request.userId, "تم رفض طلب السحب", rejectMessage, '/').catch((err: Error) => console.error('Push failed:', err));
      }
      
      const processingUser = await storage.getUser(req.user!.id);
      const processingUserName = processingUser?.name || "الإدارة";

      // If a branch manager processed it, notify the main manager
      if (processingUser?.role === "branch_manager") {
        sendPushToManagers(
          "معالجة طلب سحب",
          `قام ${processingUserName} بـ ${status === "approved" ? "الموافقة على" : "رفض"} طلب سحب لـ ${employee?.name}`,
          '/'
        ).catch((err: Error) => console.error('Push to managers failed:', err));
      }
      
      // If a main manager processed it, notify the branch manager
      if (processingUser?.role === "manager" && employee?.branchId) {
        sendPushToBranchManagers(
          employee.branchId,
          "معالجة طلب سحب",
          `قامت الإدارة بـ ${status === "approved" ? "الموافقة على" : "رفض"} طلب سحب لـ ${employee.name}`,
          '/'
        ).catch((err: Error) => console.error('Push to branch managers failed:', err));
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

  // Employee edits their own pending withdrawal request
  const editRequestSchema = z.object({
    amount: z.number().positive("المبلغ يجب أن يكون موجباً").optional(),
    beneficiary: z.enum(["self", "family"]).optional(),
    notes: z.string().optional(),
  });

  app.patch("/api/withdrawal-requests/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    const parsed = editRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ message: "بيانات غير صالحة", errors: parsed.error.errors });
    }

    try {
      const request = await storage.getWithdrawalRequest(id);
      if (!request) {
        return res.status(404).json({ message: "الطلب غير موجود" });
      }

      // Only the request owner can edit
      if (request.userId !== req.user!.id) {
        return res.status(403).json({ message: "لا يمكنك تعديل طلب موظف آخر" });
      }

      // Can only edit pending requests
      if (request.status !== "pending") {
        return res.status(400).json({ message: "لا يمكن تعديل طلب تمت معالجته" });
      }

      const { amount, beneficiary, notes } = parsed.data;

      // If amount is changing, validate balance
      if (amount && amount !== request.amount) {
        const user = await storage.getUser(req.user!.id);
        if (!user) {
          return res.status(404).json({ message: "المستخدم غير موجود" });
        }
        const pendingAmount = await storage.getPendingAmountForUser(req.user!.id);
        const availableBalance = user.balance - pendingAmount + request.amount; // add back old amount
        if (amount > availableBalance) {
          return res.status(400).json({ message: "المبلغ المطلوب يتجاوز الرصيد المتاح" });
        }
      }

      const updateData: Record<string, unknown> = {};
      if (amount !== undefined) updateData.amount = amount;
      if (beneficiary !== undefined) updateData.beneficiary = beneficiary;
      if (notes !== undefined) updateData.notes = notes;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "لا توجد بيانات للتحديث" });
      }

      const updatedRequest = await storage.updateWithdrawalRequest(id, updateData);
      res.json({ message: "تم تعديل الطلب بنجاح", request: updatedRequest });
    } catch (error) {
      res.status(500).json({ message: "خطأ في تعديل الطلب" });
    }
  });

  // Employee cancels their own pending withdrawal request
  app.delete("/api/withdrawal-requests/:id", requireAuth, async (req, res) => {
    const { id } = req.params;

    try {
      const request = await storage.getWithdrawalRequest(id);
      if (!request) {
        return res.status(404).json({ message: "الطلب غير موجود" });
      }

      // Only the request owner can cancel
      if (request.userId !== req.user!.id) {
        return res.status(403).json({ message: "لا يمكنك إلغاء طلب موظف آخر" });
      }

      // Can only cancel pending requests
      if (request.status !== "pending") {
        return res.status(400).json({ message: "لا يمكن إلغاء طلب تمت معالجته" });
      }

      await storage.deleteWithdrawalRequest(id);
      res.json({ message: "تم إلغاء الطلب بنجاح" });
    } catch (error) {
      res.status(500).json({ message: "خطأ في إلغاء الطلب" });
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

  app.get("/api/push/vapid-key", requireAuth, (_req, res) => {
    const key = getVapidPublicKey();
    if (!key) {
      return res.status(500).json({ message: "VAPID key not configured" });
    }
    res.json({ publicKey: key });
  });

  app.post("/api/push/subscribe", requireAuth, async (req, res) => {
    try {
      const { subscription } = req.body;
      if (!subscription || !subscription.endpoint || !subscription.keys) {
        return res.status(400).json({ message: "بيانات الاشتراك غير صحيحة" });
      }
      await storage.savePushSubscription(req.user!.id, subscription);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "خطأ في حفظ الاشتراك" });
    }
  });

  app.post("/api/push/unsubscribe", requireAuth, async (req, res) => {
    try {
      const { endpoint } = req.body;
      if (!endpoint) {
        return res.status(400).json({ message: "نقطة النهاية مطلوبة" });
      }
      await storage.deletePushSubscription(req.user!.id, endpoint);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "خطأ في إلغاء الاشتراك" });
    }
  });

  // Broadcast Messages API
  app.post("/api/messages", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== 'manager') {
        return res.status(403).json({ message: "غير مصرح" });
      }
      
      const parsed = sendMessageSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "بيانات غير صحيحة", errors: parsed.error.errors });
      }
      
      const { targetType, targetBranchId, targetUserId, title, content } = parsed.data;
      
      if (targetType === 'branch' && !targetBranchId) {
        return res.status(400).json({ message: "يجب تحديد الفرع" });
      }
      if (targetType === 'individual' && !targetUserId) {
        return res.status(400).json({ message: "يجب تحديد الموظف" });
      }
      
      const message = await storage.createBroadcastMessage({
        senderId: req.user!.id,
        targetType,
        targetBranchId: targetType === 'branch' ? targetBranchId : null,
        targetUserId: targetType === 'individual' ? targetUserId : null,
        title,
        content,
      });
      
      // Send push notifications to recipients
      if (targetType === 'all') {
        const allUsers = await storage.getAllUsers();
        for (const user of allUsers) {
          if (user.id !== req.user!.id) {
            sendPushNotification(user.id, title, content, '/').catch((err: Error) => console.error('Push failed:', err));
          }
        }
      } else if (targetType === 'branch' && targetBranchId) {
        const branchUsers = await storage.getUsersByBranch(targetBranchId);
        for (const user of branchUsers) {
          sendPushNotification(user.id, title, content, '/').catch((err: Error) => console.error('Push failed:', err));
        }
      } else if (targetType === 'individual' && targetUserId) {
        sendPushNotification(targetUserId, title, content, '/').catch((err: Error) => console.error('Push failed:', err));
      }
      
      res.status(201).json(message);
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ message: "خطأ في إرسال الرسالة" });
    }
  });

  app.get("/api/messages", requireAuth, async (req, res) => {
    try {
      const messages = await storage.getMessagesForUser(req.user!.id, req.user!.branchId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب الرسائل" });
    }
  });

  app.post("/api/messages/:id/read", requireAuth, async (req, res) => {
    try {
      await storage.markMessageAsRead(req.params.id, req.user!.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "خطأ في تحديث حالة القراءة" });
    }
  });

  app.get("/api/messages/unread-count", requireAuth, async (req, res) => {
    try {
      const count = await storage.getUnreadMessagesCount(req.user!.id, req.user!.branchId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب عدد الرسائل" });
    }
  });

  // Serve files from Object Storage for /objects/* paths
  app.get("/objects/*", requireAuth, async (req, res) => {
    try {
      const requestedPath = req.path.replace("/objects/", "");
      
      // First, try local storage fallback
      const localFilePath = path.join(uploadDir, requestedPath);
      if (fs.existsSync(localFilePath)) {
        return res.sendFile(localFilePath);
      }
      
      // If not found locally, try Replit Object Storage
      const objectStorage = new ObjectStorageService();
      const privateDir = objectStorage.getPrivateObjectDir();
      const fullPath = `${privateDir}/${requestedPath}`;
      
      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      
      const [exists] = await file.exists();
      if (!exists) {
        return res.status(404).json({ message: "الملف غير موجود" });
      }
      
      await objectStorage.downloadObject(file, res);
    } catch (error) {
      console.error("Error serving object:", error);
      res.status(500).json({ message: "خطأ في جلب الملف" });
    }
  });

  // Fallback for old /uploads paths - try local files first
  app.use("/uploads", requireAuth, (req, res, next) => {
    const filePath = path.join(uploadDir, path.basename(req.path));
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: "الملف غير موجود" });
    }
  });

  // System Settings routes
  app.get("/api/settings/:key", requireAuth, async (req, res) => {
    try {
      const setting = await storage.getSystemSetting(req.params.key);
      res.json(setting || { key: req.params.key, value: "" });
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب الإعدادات" });
    }
  });

  app.post("/api/settings", requireManager, async (req, res) => {
    const schema = z.object({
      key: z.string(),
      value: z.string(),
    });
    
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "بيانات غير صالحة" });
    }

    try {
      const setting = await storage.updateSystemSetting(parsed.data.key, parsed.data.value);
      res.json(setting);
    } catch (error) {
      res.status(500).json({ message: "خطأ في حفظ الإعدادات" });
    }
  });

  // Register Object Storage routes for file uploads
  registerObjectStorageRoutes(app);

  return httpServer;
}
