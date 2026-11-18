import dotenv from "dotenv";
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: process.env.DATABASE_URL || "",
  JWT_SECRET: process.env.JWT_SECRET || "kredibly_dev_super_secret_jwt_key_2026",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY || "",
  PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY || "",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
  UPLOAD_DIR: process.env.UPLOAD_DIR || "./uploads",
  RESEND_API_KEY: process.env.RESEND_API_KEY || "",
  SENDER_EMAIL: process.env.SENDER_EMAIL || "hello@usekredibly.com",
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || "usekredibly@gmail.com",
  NOMBA_ENV: process.env.NOMBA_ENV || "production",
  NOMBA_ACCOUNT_ID: process.env.NOMBA_ACCOUNT_ID || "",
  NOMBA_CLIENT_ID: process.env.NOMBA_CLIENT_ID || "",
  NOMBA_PRIVATE_KEY: process.env.NOMBA_PRIVATE_KEY || "",
  NOMBA_WEBHOOK_SECRET: process.env.NOMBA_WEBHOOK_SECRET || "",
  VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY || "",
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY || "",
  VAPID_SUBJECT: process.env.VAPID_SUBJECT || "mailto:hello@usekredibly.com",
};
