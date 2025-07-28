const cron = require('node-cron');
let job;
let continueSyncJobFn = null;

function registerContinueSyncJob(fn) {
  continueSyncJobFn = fn;
}

function startSyncCron() {
  if (!continueSyncJobFn) {
    console.warn("⚠️ continueSyncJobFn not registered");
    return;
  }

  if (!job) {
    job = cron.schedule("*/30 * * * * *", async () => {
      console.log("🔁 Running sync job...");
      await continueSyncJobFn(); 
    });
    console.log("✅ Sync cron started");
  }
}

function stopSyncCron() {
  if (job) {
    job.stop();
    job = null;
    console.log("🛑 Sync cron stopped");
  }
}

module.exports = {
  startSyncCron,
  stopSyncCron,
  registerContinueSyncJob,
};
