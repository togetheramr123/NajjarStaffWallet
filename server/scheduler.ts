import cron from 'node-cron';
import { storage } from './storage';
import { log } from './index';

export function startScheduler() {
  // Run monthly service fee deduction on the 1st of each month at 00:05
  cron.schedule('5 0 1 * *', async () => {
    log('Starting monthly service fee processing...', 'scheduler');
    try {
      const count = await storage.processMonthlyServiceFees();
      log(`Monthly service fees processed for ${count} users`, 'scheduler');
    } catch (error) {
      log(`Error processing monthly service fees: ${error}`, 'scheduler');
    }
  });

  // Also run on server startup to catch any missed fees
  runStartupFeeCheck();

  log('Scheduler started - monthly service fees will run on 1st of each month', 'scheduler');
}

async function runStartupFeeCheck() {
  try {
    log('Running startup service fee check...', 'scheduler');
    const count = await storage.processMonthlyServiceFees();
    if (count > 0) {
      log(`Processed ${count} missed monthly service fees on startup`, 'scheduler');
    } else {
      log('No pending service fees to process', 'scheduler');
    }
  } catch (error) {
    log(`Error in startup fee check: ${error}`, 'scheduler');
  }
}
