import cron from "node-cron";
import { storage } from "./storage";
import { log } from "./index";

export function startScheduler() {
  log("Scheduler started", "scheduler");

  // 1. Monthly Service Fees - 1st of each month at 00:05
  cron.schedule("5 0 1 * *", async () => {
    try {
      log("Running monthly service fees processing...", "scheduler");
      const count = await storage.processMonthlyServiceFees();
      log(`Processed monthly service fees for ${count} users.`, "scheduler");
    } catch (error) {
      log(`Error processing monthly service fees: ${error}`, "scheduler");
    }
  });

  // 2. Data Cleanup - Daily at 00:00 (Midnight)
  cron.schedule("0 0 * * *", async () => {
    try {
      log("Running automatic cleanup of old data (older than 13 months)...", "scheduler");
      const results = await storage.cleanupOldData();
      log(`Cleanup complete: deleted ${results.deletedTransactions} transactions, ${results.deletedRequests} requests, ${results.deletedFees} fee logs, ${results.deletedNotifications} notifications, ${results.deletedMessages} messages.`, "scheduler");
    } catch (error) {
      log(`Error running data cleanup: ${error}`, "scheduler");
    }
  });

  // Run immediately on startup to process any missed items and perform cleanup
  (async () => {
    try {
      log("Running startup service fees check...", "scheduler");
      const count = await storage.processMonthlyServiceFees();
      log(`Startup service fees processed for ${count} users.`, "scheduler");
    } catch (error) {
      log(`Error in startup service fees processing: ${error}`, "scheduler");
    }

    try {
      log("Running startup data cleanup check...", "scheduler");
      const results = await storage.cleanupOldData();
      log(`Startup cleanup complete: deleted ${results.deletedTransactions} transactions, ${results.deletedRequests} requests, ${results.deletedFees} fee logs, ${results.deletedNotifications} notifications, ${results.deletedMessages} messages.`, "scheduler");
    } catch (error) {
      log(`Error in startup data cleanup: ${error}`, "scheduler");
    }
  })();
}
