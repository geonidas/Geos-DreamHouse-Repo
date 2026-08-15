// Run once after deploying to a new scratch org.
// Re-run to change the schedule (delete the old CronTrigger first, or use a new job name).
// FRED updates 30-Year Fixed Rate Conforming Mortgage Index (OBMMIC30YF) observations around 7AM CDT / 5AM PDT
// this scheduling script assumes an org with PDT Timezone, and runs at 6AM PDT
System.schedule('FRED Daily Rate Sync', '0 0 6 * * ?', new MarketRateCalloutScheduler());