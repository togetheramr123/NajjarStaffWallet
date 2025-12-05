import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { storage } from "./storage";
import { comparePasswords } from "./auth";
import { 
  loginSchema, 
  createEmployeeSchema, 
  adjustBalanceSchema, 
  createWithdrawalSchema,
  processRequestSchema,
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
      role: "employee" | "manager";
      status: "active" | "inactive";
      balance: number;
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

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "hon-group-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
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

  app.get("/api/employees", requireManager, async (_req, res) => {
    try {
      const employees = await storage.getAllUsers();
      const safeEmployees = employees.map(({ password: _, ...emp }) => emp);
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
      });

      const { password: _, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error) {
      res.status(500).json({ message: "خطأ في إنشاء الموظف" });
    }
  });

  app.patch("/api/employees/:id", requireManager, async (req, res) => {
    const { id } = req.params;
    const { name, employeeNumber, role, status, password } = req.body;

    try {
      const user = await storage.updateUser(id, { name, employeeNumber, role, status, password });
      if (!user) {
        return res.status(404).json({ message: "الموظف غير موجود" });
      }
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ message: "خطأ في تحديث الموظف" });
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

      res.status(201).json(request);
    } catch (error) {
      res.status(500).json({ message: "خطأ في إنشاء الطلب" });
    }
  });

  app.get("/api/withdrawal-requests/pending", requireManager, async (_req, res) => {
    try {
      const requests = await storage.getPendingWithdrawalRequests();
      res.json(requests.map(r => ({
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

  app.get("/api/withdrawal-requests/all", requireManager, async (_req, res) => {
    try {
      const requests = await storage.getWithdrawalRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب الطلبات" });
    }
  });

  app.post("/api/withdrawal-requests/:id/process", requireManager, async (req, res) => {
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

      const { action, notes, modifiedAmount } = parsed.data;
      const status = action === "reject" ? "rejected" : "approved";
      const finalAmount = action === "modify" ? modifiedAmount : request.amount;
      
      const processedRequest = await storage.processWithdrawalRequest(
        id,
        req.user!.id,
        status,
        notes,
        action === "modify" ? modifiedAmount : undefined
      );

      const updatedEmployee = await storage.getUser(request.userId);
      
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

  app.get("/api/stats", requireManager, async (_req, res) => {
    try {
      const employees = await storage.getAllUsers();
      const pendingRequests = await storage.getPendingWithdrawalRequests();
      const allTransactions = await storage.getAllTransactions();

      const activeEmployees = employees.filter(e => e.status === "active").length;
      const totalBalance = employees.reduce((sum, e) => sum + e.balance, 0);
      const approvedThisMonth = allTransactions.filter(t => {
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
