import foodModel from "../models/foodModel.js";
import systemConfigModel from "../models/systemConfigModel.js";

const DAILY_STOCK_RESET_KEY = "daily_stock_reset_date";
const DEFAULT_STOCK_VALUE = 20;
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

const getVnDateKey = (date = new Date()) => {
  const vnDate = new Date(date.getTime() + VN_OFFSET_MS);
  const year = vnDate.getUTCFullYear();
  const month = String(vnDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(vnDate.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const resetStockIfNeededForToday = async () => {
  const todayKey = getVnDateKey();
  const existingConfig = await systemConfigModel.findOne({ key: DAILY_STOCK_RESET_KEY });

  if (existingConfig?.value === todayKey) {
    return;
  }

  await foodModel.updateMany({}, { $set: { stock: DEFAULT_STOCK_VALUE } });
  await systemConfigModel.findOneAndUpdate(
    { key: DAILY_STOCK_RESET_KEY },
    { value: todayKey },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`[stock-reset] Reset all product stock to ${DEFAULT_STOCK_VALUE} for ${todayKey}`);
};

const getMsUntilNextMidnight = () => {
  const now = new Date();
  const vnNow = new Date(now.getTime() + VN_OFFSET_MS);
  const vnNextMidnightUtcMs = Date.UTC(
    vnNow.getUTCFullYear(),
    vnNow.getUTCMonth(),
    vnNow.getUTCDate() + 1,
    0,
    0,
    2,
    0
  );
  const nextRunMs = vnNextMidnightUtcMs - VN_OFFSET_MS;
  return Math.max(1000, nextRunMs - now.getTime());
};

const startDailyStockResetScheduler = () => {
  const scheduleNext = () => {
    const timeout = getMsUntilNextMidnight();
    setTimeout(async () => {
      try {
        await resetStockIfNeededForToday();
      } catch (error) {
        console.error("[stock-reset] Failed to reset stock:", error);
      } finally {
        scheduleNext();
      }
    }, timeout);
  };

  (async () => {
    try {
      await resetStockIfNeededForToday();
    } catch (error) {
      console.error("[stock-reset] Initial check failed:", error);
    }
  })();

  scheduleNext();
};

export { startDailyStockResetScheduler };
