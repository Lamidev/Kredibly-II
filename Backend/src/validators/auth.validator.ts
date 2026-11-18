import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number is too long"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  storeName: z.string().min(2, "Store name must be at least 2 characters"),
  slug: z.string().optional(),
  description: z.string().max(300, "Keep description under 300 characters").optional(),
});

export const loginSchema = z.object({
  emailOrPhone: z.string().min(1, "Email or phone number is required"),
  password: z.string().min(1, "Password is required"),
});

export const bankDetailsSchema = z.object({
  bankCode: z.string().min(2, "Bank code is required"),
  bankName: z.string().min(2, "Bank name is required"),
  accountNumber: z.string().length(10, "Account number must be exactly 10 digits"),
  accountName: z.string().min(2, "Account name is required"),
  otp: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export const verifyEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit verification code"),
});

export const resendVerificationSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type BankDetailsInput = z.infer<typeof bankDetailsSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
