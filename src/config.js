import "dotenv/config";

const isProduction = process.env.NODE_ENV === "production";
const sessionSecret = process.env.SESSION_SECRET || "development-only-session-secret-change-me";

if (isProduction && sessionSecret.length < 32) {
  throw new Error("SESSION_SECRET must contain at least 32 characters in production");
}

export const config = {
  isProduction,
  port: Number.parseInt(process.env.PORT || "4174", 10),
  appUrl: process.env.APP_URL || "http://localhost:4174",
  databaseUrl: process.env.DATABASE_URL || "",
  sessionSecret,
  sessionDays: 30,
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || "",
  telegramChatId: process.env.TELEGRAM_CHAT_ID || "",
};
