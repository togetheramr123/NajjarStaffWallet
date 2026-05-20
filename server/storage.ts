import { 
  type User, 
  type InsertUser, 
  type Transaction, 
  type WithdrawalRequest,
  type ServiceFeeLog,
  type Notification,
  type Branch,
  type InsertBranch,
  type PushSubscription,
  type BroadcastMessage,
  type MessageReadStatus,
  users, 
  transactions, 
  withdrawalRequests,
  serviceFeeLog,
  notifications,
  branches,
  pushSubscriptions,
  broadcastMessages,
  messageReadStatus,
  systemSettings,
  type SystemSetting
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, or, isNull } from "drizzle-orm";
import { hashPassword } from "./auth";

export interface IStorage {
  getBranch(id: string): Promise<Branch | undefined>;
  getAllBranches(): Promise<Branch[]>;
  createBranch(data: InsertBranch): Promise<Branch>;
  updateBranch(id: string, data: Partial<Branch>): Promise<Branch | undefined>;
  deleteBranch(id: string): Promise<boolean>;
  
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getUsersByBranch(branchId: string): Promise<User[]>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  updateUserBalance(id: string, amount: number): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  
  getTransactions(userId: string): Promise<Transaction[]>;
  getAllTransactions(): Promise<Transaction[]>;
  createTransaction(data: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction>;
  
  getWithdrawalRequest(id: string): Promise<WithdrawalRequest | undefined>;
  getWithdrawalRequests(userId?: string): Promise<WithdrawalRequest[]>;
  getAllWithdrawalRequestsWithUsers(): Promise<(WithdrawalRequest & { user: User })[]>;
  getPendingWithdrawalRequests(): Promise<(WithdrawalRequest & { user: User })[]>;
  getPendingWithdrawalRequestsByBranch(branchId: string): Promise<(WithdrawalRequest & { user: User })[]>;
  createWithdrawalRequest(data: Omit<WithdrawalRequest, 'id' | 'createdAt' | 'status' | 'processedAt' | 'processedBy' | 'processingNotes' | 'modifiedAmount' | 'createdOnBehalfBy'> & { createdOnBehalfBy?: string | null }): Promise<WithdrawalRequest>;
  processWithdrawalRequest(id: string, processedBy: string, status: 'approved' | 'rejected', notes?: string, modifiedAmount?: number): Promise<WithdrawalRequest | undefined>;
  updateWithdrawalRequest(id: string, data: Partial<WithdrawalRequest>): Promise<WithdrawalRequest | undefined>;
  deleteWithdrawalRequest(id: string): Promise<boolean>;
  
  getPendingAmountForUser(userId: string): Promise<number>;
  
  getServiceFeeLog(userId: string, month: number, year: number): Promise<ServiceFeeLog | undefined>;
  createServiceFeeLog(userId: string, amount: number, month: number, year: number): Promise<ServiceFeeLog>;
  processMonthlyServiceFees(): Promise<number>;
  
  getNotifications(userId: string): Promise<Notification[]>;
  getUnreadNotificationsCount(userId: string): Promise<number>;
  createNotification(data: { userId: string; type: 'approved' | 'rejected' | 'modified'; title: string; message: string; amount?: number; remainingBalance?: number }): Promise<Notification>;
  markNotificationAsRead(id: string, userId: string): Promise<boolean>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  
  savePushSubscription(userId: string, subscription: { endpoint: string; keys: { p256dh: string; auth: string } }): Promise<PushSubscription>;
  getPushSubscriptions(userId: string): Promise<PushSubscription[]>;
  getAllManagerPushSubscriptions(): Promise<PushSubscription[]>;
  getBranchManagerPushSubscriptions(branchId: string): Promise<PushSubscription[]>;
  deletePushSubscription(userId: string, endpoint: string): Promise<boolean>;
  
  createBroadcastMessage(data: { senderId: string; targetType: 'all' | 'branch' | 'individual'; targetBranchId?: string | null; targetUserId?: string | null; title: string; content: string }): Promise<BroadcastMessage>;
  getMessagesForUser(userId: string, userBranchId: string | null): Promise<(BroadcastMessage & { sender: User; isRead: boolean })[]>;
  markMessageAsRead(messageId: string, userId: string): Promise<MessageReadStatus>;
  getUnreadMessagesCount(userId: string, userBranchId: string | null): Promise<number>;
  getSystemSetting(key: string): Promise<SystemSetting | undefined>;
  updateSystemSetting(key: string, value: string): Promise<SystemSetting>;
}

export class DatabaseStorage implements IStorage {
  async getBranch(id: string): Promise<Branch | undefined> {
    const [branch] = await db.select().from(branches).where(eq(branches.id, id));
    return branch;
  }

  async getAllBranches(): Promise<Branch[]> {
    return db.select().from(branches).orderBy(desc(branches.createdAt));
  }

  async createBranch(data: InsertBranch): Promise<Branch> {
    const [branch] = await db.insert(branches).values(data).returning();
    return branch;
  }

  async updateBranch(id: string, data: Partial<Branch>): Promise<Branch | undefined> {
    const [branch] = await db.update(branches).set(data).where(eq(branches.id, id)).returning();
    return branch;
  }

  async deleteBranch(id: string): Promise<boolean> {
    const result = await db.delete(branches).where(eq(branches.id, id)).returning();
    return result.length > 0;
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await hashPassword(insertUser.password);
    const [user] = await db.insert(users).values({
      ...insertUser,
      password: hashedPassword,
    }).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUsersByBranch(branchId: string): Promise<User[]> {
    return db.select().from(users)
      .where(eq(users.branchId, branchId))
      .orderBy(desc(users.createdAt));
  }

  async updateUser(id: string, data: Partial<User> & { password?: string }): Promise<User | undefined> {
    const updateData: Partial<User> = { ...data };
    
    if (data.password) {
      updateData.password = await hashPassword(data.password);
    }
    
    const [user] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return user;
  }

  async updateUserBalance(id: string, amount: number): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({ balance: sql`${users.balance} + ${amount}` })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    // Clear foreign key references before deleting
    // Clear processedBy references in transactions
    await db.update(transactions)
      .set({ processedBy: null })
      .where(eq(transactions.processedBy, id));
    
    // Clear processedBy and createdOnBehalfBy references in withdrawal_requests
    await db.update(withdrawalRequests)
      .set({ processedBy: null })
      .where(eq(withdrawalRequests.processedBy, id));
    
    await db.update(withdrawalRequests)
      .set({ createdOnBehalfBy: null })
      .where(eq(withdrawalRequests.createdOnBehalfBy, id));
    
    // Delete related records that reference this user
    await db.delete(transactions).where(eq(transactions.userId, id));
    await db.delete(withdrawalRequests).where(eq(withdrawalRequests.userId, id));
    await db.delete(serviceFeeLog).where(eq(serviceFeeLog.userId, id));
    await db.delete(notifications).where(eq(notifications.userId, id));
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, id));
    
    // Now delete the user
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  async getTransactions(userId: string): Promise<Transaction[]> {
    return db.select().from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return db.select().from(transactions).orderBy(desc(transactions.createdAt));
  }

  async createTransaction(data: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values(data).returning();
    return transaction;
  }

  async getWithdrawalRequest(id: string): Promise<WithdrawalRequest | undefined> {
    const [request] = await db.select().from(withdrawalRequests).where(eq(withdrawalRequests.id, id));
    return request;
  }

  async getWithdrawalRequests(userId?: string): Promise<WithdrawalRequest[]> {
    if (userId) {
      return db.select().from(withdrawalRequests)
        .where(eq(withdrawalRequests.userId, userId))
        .orderBy(desc(withdrawalRequests.createdAt));
    }
    return db.select().from(withdrawalRequests).orderBy(desc(withdrawalRequests.createdAt));
  }

  async getAllWithdrawalRequestsWithUsers(): Promise<(WithdrawalRequest & { user: User })[]> {
    const results = await db
      .select({
        request: withdrawalRequests,
        user: users,
      })
      .from(withdrawalRequests)
      .innerJoin(users, eq(withdrawalRequests.userId, users.id))
      .orderBy(desc(withdrawalRequests.createdAt));
    
    return results.map((r: { request: WithdrawalRequest; user: User }) => ({ ...r.request, user: r.user }));
  }

  async getPendingWithdrawalRequests(): Promise<(WithdrawalRequest & { user: User })[]> {
    const results = await db
      .select({
        request: withdrawalRequests,
        user: users,
      })
      .from(withdrawalRequests)
      .innerJoin(users, eq(withdrawalRequests.userId, users.id))
      .where(eq(withdrawalRequests.status, 'pending'))
      .orderBy(desc(withdrawalRequests.createdAt));
    
    return results.map((r: { request: WithdrawalRequest; user: User }) => ({ ...r.request, user: r.user }));
  }

  async getPendingWithdrawalRequestsByBranch(branchId: string): Promise<(WithdrawalRequest & { user: User })[]> {
    const results = await db
      .select({
        request: withdrawalRequests,
        user: users,
      })
      .from(withdrawalRequests)
      .innerJoin(users, eq(withdrawalRequests.userId, users.id))
      .where(and(
        eq(withdrawalRequests.status, 'pending'),
        eq(users.branchId, branchId)
      ))
      .orderBy(desc(withdrawalRequests.createdAt));
    
    return results.map((r: { request: WithdrawalRequest; user: User }) => ({ ...r.request, user: r.user }));
  }

  async createWithdrawalRequest(data: Omit<WithdrawalRequest, 'id' | 'createdAt' | 'status' | 'processedAt' | 'processedBy' | 'processingNotes' | 'modifiedAmount' | 'createdOnBehalfBy'> & { createdOnBehalfBy?: string | null }): Promise<WithdrawalRequest> {
    const [request] = await db.insert(withdrawalRequests).values({
      ...data,
      status: 'pending',
      createdOnBehalfBy: data.createdOnBehalfBy || null,
    }).returning();
    return request;
  }

  async processWithdrawalRequest(id: string, processedBy: string, status: 'approved' | 'rejected', notes?: string, modifiedAmount?: number): Promise<WithdrawalRequest | undefined> {
    const [request] = await db.update(withdrawalRequests)
      .set({
        status,
        processedBy,
        processedAt: new Date(),
        processingNotes: notes,
        modifiedAmount,
      })
      .where(eq(withdrawalRequests.id, id))
      .returning();
    
    if (request && status === 'approved') {
      const finalAmount = modifiedAmount || request.amount;
      await this.updateUserBalance(request.userId, -finalAmount);
      
      await this.createTransaction({
        userId: request.userId,
        type: 'withdrawal',
        amount: finalAmount,
        beneficiary: request.beneficiary,
        status: 'approved',
        description: notes || 'سحب رصيد',
        attachmentPath: request.attachmentPath,
        processedBy,
        processedAt: new Date(),
        processingNotes: notes || null,
      });
    }
    
    return request;
  }

  async updateWithdrawalRequest(id: string, data: Partial<WithdrawalRequest>): Promise<WithdrawalRequest | undefined> {
    const [request] = await db.update(withdrawalRequests)
      .set(data)
      .where(eq(withdrawalRequests.id, id))
      .returning();
    return request;
  }

  async deleteWithdrawalRequest(id: string): Promise<boolean> {
    const result = await db.delete(withdrawalRequests)
      .where(eq(withdrawalRequests.id, id))
      .returning();
    return result.length > 0;
  }

  async getPendingAmountForUser(userId: string): Promise<number> {
    const pendingRequests = await db.select()
      .from(withdrawalRequests)
      .where(and(
        eq(withdrawalRequests.userId, userId),
        eq(withdrawalRequests.status, 'pending')
      ));
    
    return pendingRequests.reduce((sum: number, req: WithdrawalRequest) => sum + req.amount, 0);
  }

  async getServiceFeeLog(userId: string, month: number, year: number): Promise<ServiceFeeLog | undefined> {
    const [log] = await db.select().from(serviceFeeLog)
      .where(and(
        eq(serviceFeeLog.userId, userId),
        eq(serviceFeeLog.month, month),
        eq(serviceFeeLog.year, year)
      ));
    return log;
  }

  async createServiceFeeLog(userId: string, amount: number, month: number, year: number): Promise<ServiceFeeLog> {
    const [log] = await db.insert(serviceFeeLog).values({
      userId,
      amount,
      month,
      year,
    }).returning();
    return log;
  }

  async processMonthlyServiceFees(): Promise<number> {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const feeAmount = 50;
    
    const activeUsers = await db.select().from(users)
      .where(eq(users.status, 'active'));
    
    let processedCount = 0;
    
    for (const user of activeUsers) {
      const existingLog = await this.getServiceFeeLog(user.id, month, year);
      if (existingLog) continue;
      
      if (user.balance >= feeAmount) {
        await this.updateUserBalance(user.id, -feeAmount);
        await this.createServiceFeeLog(user.id, feeAmount, month, year);
        await this.createTransaction({
          userId: user.id,
          type: 'service_fee',
          amount: feeAmount,
          status: 'approved',
          description: `رسوم الخدمة الشهرية - ${month}/${year}`,
          beneficiary: null,
          attachmentPath: null,
          processedBy: null,
          processedAt: new Date(),
          processingNotes: null,
        });
        processedCount++;
      }
    }
    
    return processedCount;
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async getUnreadNotificationsCount(userId: string): Promise<number> {
    const result = await db.select().from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
    return result.length;
  }

  async createNotification(data: { userId: string; type: 'approved' | 'rejected' | 'modified'; title: string; message: string; amount?: number; remainingBalance?: number }): Promise<Notification> {
    const [notification] = await db.insert(notifications).values({
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      amount: data.amount || null,
      remainingBalance: data.remainingBalance || null,
    }).returning();
    return notification;
  }

  async markNotificationAsRead(id: string, userId: string): Promise<boolean> {
    const result = await db.update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async savePushSubscription(userId: string, subscription: { endpoint: string; keys: { p256dh: string; auth: string } }): Promise<PushSubscription> {
    await db.delete(pushSubscriptions).where(
      and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.endpoint, subscription.endpoint)
      )
    );
    
    const [sub] = await db.insert(pushSubscriptions).values({
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    }).returning();
    return sub;
  }

  async getPushSubscriptions(userId: string): Promise<PushSubscription[]> {
    return db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
  }

  async getAllManagerPushSubscriptions(): Promise<PushSubscription[]> {
    const managers = await db.select().from(users).where(eq(users.role, 'manager'));
    const managerIds = managers.map(m => m.id);
    if (managerIds.length === 0) return [];
    
    const allSubs: PushSubscription[] = [];
    for (const managerId of managerIds) {
      const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, managerId));
      allSubs.push(...subs);
    }
    return allSubs;
  }

  async getBranchManagerPushSubscriptions(branchId: string): Promise<PushSubscription[]> {
    const managers = await db.select().from(users).where(
      and(
        eq(users.role, 'branch_manager'),
        eq(users.branchId, branchId)
      )
    );
    const managerIds = managers.map(m => m.id);
    if (managerIds.length === 0) return [];
    
    const allSubs: PushSubscription[] = [];
    for (const managerId of managerIds) {
      const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, managerId));
      allSubs.push(...subs);
    }
    return allSubs;
  }

  async deletePushSubscription(userId: string, endpoint: string): Promise<boolean> {
    const result = await db.delete(pushSubscriptions).where(
      and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.endpoint, endpoint)
      )
    ).returning();
    return result.length > 0;
  }

  async createBroadcastMessage(data: { senderId: string; targetType: 'all' | 'branch' | 'individual'; targetBranchId?: string | null; targetUserId?: string | null; title: string; content: string }): Promise<BroadcastMessage> {
    const [message] = await db.insert(broadcastMessages).values({
      senderId: data.senderId,
      targetType: data.targetType,
      targetBranchId: data.targetBranchId || null,
      targetUserId: data.targetUserId || null,
      title: data.title,
      content: data.content,
    }).returning();
    return message;
  }

  async getMessagesForUser(userId: string, userBranchId: string | null): Promise<(BroadcastMessage & { sender: User; isRead: boolean })[]> {
    const allMessages = await db
      .select({
        message: broadcastMessages,
        sender: users,
      })
      .from(broadcastMessages)
      .innerJoin(users, eq(broadcastMessages.senderId, users.id))
      .orderBy(desc(broadcastMessages.createdAt));
    
    const readStatuses = await db.select().from(messageReadStatus).where(eq(messageReadStatus.userId, userId));
    const readMessageIds = new Set(readStatuses.map(r => r.messageId));
    
    const filteredMessages = allMessages.filter(({ message }) => {
      if (message.targetType === 'all') return true;
      if (message.targetType === 'individual' && message.targetUserId === userId) return true;
      if (message.targetType === 'branch' && message.targetBranchId === userBranchId) return true;
      return false;
    });
    
    return filteredMessages.map(({ message, sender }) => {
      const { password, ...senderWithoutPassword } = sender;
      return {
        ...message,
        sender: senderWithoutPassword as User,
        isRead: readMessageIds.has(message.id),
      };
    });
  }

  async markMessageAsRead(messageId: string, userId: string): Promise<MessageReadStatus> {
    const existing = await db.select().from(messageReadStatus).where(
      and(
        eq(messageReadStatus.messageId, messageId),
        eq(messageReadStatus.userId, userId)
      )
    );
    if (existing.length > 0) return existing[0];
    
    const [status] = await db.insert(messageReadStatus).values({
      messageId,
      userId,
    }).returning();
    return status;
  }

  async getUnreadMessagesCount(userId: string, userBranchId: string | null): Promise<number> {
    const messages = await this.getMessagesForUser(userId, userBranchId);
    return messages.filter(m => !m.isRead).length;
  }

  async getSystemSetting(key: string): Promise<SystemSetting | undefined> {
    const [setting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key));
    return setting;
  }

  async updateSystemSetting(key: string, value: string): Promise<SystemSetting> {
    const [setting] = await db
      .insert(systemSettings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value, updatedAt: new Date() },
      })
      .returning();
    return setting;
  }
}

export const storage = new DatabaseStorage();
