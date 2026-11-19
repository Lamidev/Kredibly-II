import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/db";
import { ENV } from "../config/env";
import { AppError } from "../middleware/errorHandler";
import { RegisterInput, LoginInput, BankDetailsInput } from "../validators/auth.validator";
import { sanitizeSlug, isValidSlug, RESERVED_SLUGS } from "../utils/slug";
import { isDisposableEmail } from "../utils/disposableEmail";
import { EmailService } from "./email.service";
import { WalletService } from "./wallet.service";

export class AuthService {
  /**
   * Register a new merchant, auto-provision their store and wallet in one transaction
   */
  static async register(data: RegisterInput) {
    if (isDisposableEmail(data.email)) {
      throw new AppError(
        "Temporary or disposable email addresses are not allowed. Please use a permanent business or personal email.",
        400
      );
    }

    // 1. Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email.toLowerCase() },
          { phoneNumber: data.phoneNumber },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === data.email.toLowerCase()) {
        throw new AppError("An account with this email already exists", 400);
      }
      throw new AppError("An account with this phone number already exists", 400);
    }

    // 2. Validate and sanitize slug
    let candidateSlug = data.slug ? sanitizeSlug(data.slug) : sanitizeSlug(data.storeName);

    if (!isValidSlug(candidateSlug)) {
      throw new AppError(
        "Store handle must be 3-40 alphanumeric characters (hyphens allowed)",
        400
      );
    }

    if (RESERVED_SLUGS.has(candidateSlug)) {
      throw new AppError("This store handle is reserved. Please choose another.", 400);
    }

    // Check slug uniqueness
    const existingStore = await prisma.store.findUnique({
      where: { slug: candidateSlug },
    });

    if (existingStore) {
      // Auto-append short random suffix if slug collision
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      candidateSlug = `${candidateSlug}${randomSuffix}`;
    }

    // 3. Hash password & generate 6-digit email verification code
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const rawCode = String(crypto.randomInt(100000, 1000000));
    const emailVerifyCodeHash = crypto
      .createHash("sha256")
      .update(rawCode)
      .digest("hex");
    const emailVerifyExpires = new Date(Date.now() + 15 * 60 * 1000);

    // 4. Create User, Store, and Wallet in an atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          fullName: data.fullName.trim(),
          email: data.email.toLowerCase().trim(),
          phoneNumber: data.phoneNumber.trim(),
          passwordHash,
          role: "MERCHANT",
          emailVerified: false,
          emailVerifyCodeHash,
          emailVerifyExpires,
        },
      });

      const newStore = await tx.store.create({
        data: {
          ownerId: newUser.id,
          name: data.storeName.trim(),
          slug: candidateSlug,
          description: data.description?.trim() || null,
          whatsappNumber: data.phoneNumber.trim(),
          currency: "NGN",
          subscriptionTier: "STARTER",
        },
      });

      const newWallet = await tx.wallet.create({
        data: {
          storeId: newStore.id,
          availableBalance: 0,
          escrowBalance: 0,
        },
      });

      return { user: newUser, store: newStore, wallet: newWallet };
    });

    // Dispatch 6-digit verification code email non-blocking
    EmailService.sendEmailVerificationCode({
      to: result.user.email,
      fullName: result.user.fullName,
      code: rawCode,
    }).catch((err) => console.error("Verification email dispatch failed:", err));

    return {
      requiresEmailVerification: true,
      email: result.user.email,
    };
  }

  /**
   * Verify merchant email with 6-digit code, issue JWT, and send Welcome email
   */
  static async verifyEmail(email: string, code: string) {
    const cleanEmail = email.toLowerCase().trim();
    const codeHash = crypto.createHash("sha256").update(code.trim()).digest("hex");

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        stores: {
          select: {
            id: true,
            name: true,
            slug: true,
            whatsappNumber: true,
            currency: true,
            subscriptionTier: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError("Account not found", 404);
    }

    if (user.emailVerified) {
      throw new AppError("Email is already verified. Please log in.", 400);
    }

    if (
      !user.emailVerifyCodeHash ||
      !user.emailVerifyExpires ||
      user.emailVerifyExpires.getTime() < Date.now() ||
      user.emailVerifyCodeHash !== codeHash
    ) {
      throw new AppError("Invalid or expired verification code", 400);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyCodeHash: null,
        emailVerifyExpires: null,
      },
    });

    const primaryStore = user.stores[0];

    if (primaryStore) {
      EmailService.sendWelcomeEmail({
        to: user.email,
        fullName: user.fullName,
        storeName: primaryStore.name,
        storeSlug: primaryStore.slug,
      }).catch((err) => console.error("Welcome email dispatch failed:", err));
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        storeId: primaryStore?.id,
      },
      ENV.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return {
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
      store: primaryStore || null,
    };
  }

  /**
   * Resend 6-digit email verification code
   */
  static async resendVerificationCode(email: string) {
    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      throw new AppError("Account not found", 404);
    }

    if (user.emailVerified) {
      throw new AppError("Email is already verified. Please log in.", 400);
    }

    const rawCode = String(crypto.randomInt(100000, 1000000));
    const emailVerifyCodeHash = crypto
      .createHash("sha256")
      .update(rawCode)
      .digest("hex");
    const emailVerifyExpires = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifyCodeHash,
        emailVerifyExpires,
      },
    });

    await EmailService.sendEmailVerificationCode({
      to: user.email,
      fullName: user.fullName,
      code: rawCode,
    });
  }

  /**
   * Merchant Login
   */
  static async login(data: LoginInput) {
    const identifier = data.emailOrPhone.trim();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { phoneNumber: identifier },
        ],
      },
      include: {
        stores: {
          select: {
            id: true,
            name: true,
            slug: true,
            whatsappNumber: true,
            currency: true,
            subscriptionTier: true,
            bankCode: true,
            bankName: true,
            accountNumber: true,
            accountName: true,
            wallet: {
              select: {
                availableBalance: true,
                escrowBalance: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new AppError("Invalid email/phone or password", 401);
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError("Invalid email/phone or password", 401);
    }

    if (!user.emailVerified) {
      await AuthService.resendVerificationCode(user.email);
      throw new AppError(
        "Please verify your email address. We just sent a 6-digit code to your inbox.",
        403
      );
    }

    const primaryStore = user.stores[0];

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        storeId: primaryStore?.id,
      },
      ENV.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return {
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
      stores: user.stores,
    };
  }

  /**
   * Get current authenticated merchant profile
   */
  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        role: true,
        createdAt: true,
        stores: {
          include: {
            wallet: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }

  /**
   * Check slug availability
   */
  static async checkSlug(slug: string) {
    const cleanSlug = sanitizeSlug(slug);

    if (!isValidSlug(cleanSlug)) {
      return {
        available: false,
        slug: cleanSlug,
        message: "Handle must be 3-40 alphanumeric characters (hyphens allowed)",
      };
    }

    if (RESERVED_SLUGS.has(cleanSlug)) {
      const suggestions = [`${cleanSlug}-ng`, `${cleanSlug}-store`, `shop-${cleanSlug}`];
      return {
        available: false,
        slug: cleanSlug,
        message: "This handle is reserved by system",
        suggestions,
      };
    }

    const existing = await prisma.store.findUnique({
      where: { slug: cleanSlug },
      select: { id: true },
    });

    if (existing) {
      const candidates = [
        `${cleanSlug}-ng`,
        `${cleanSlug}-store`,
        `shop-${cleanSlug}`,
        `${cleanSlug}-hub`,
        `get-${cleanSlug}`,
      ];
      const suggestions: string[] = [];
      for (const candidate of candidates) {
        if (!RESERVED_SLUGS.has(candidate)) {
          const taken = await prisma.store.findUnique({
            where: { slug: candidate },
            select: { id: true },
          });
          if (!taken) {
            suggestions.push(candidate);
          }
        }
        if (suggestions.length >= 3) break;
      }

      return {
        available: false,
        slug: cleanSlug,
        message: "Handle is already taken",
        suggestions,
      };
    }

    return {
      available: true,
      slug: cleanSlug,
      message: "Handle is available!",
      suggestions: [],
    };
  }

  /**
   * Update payout bank details for a store (enforces OTP & 24h lock if changing)
   */
  static async updateBankDetails(storeId: string, data: BankDetailsInput) {
    return WalletService.updateBankDetails(storeId, data);
  }

  /**
   * Request a password reset link
   */
  static async forgotPassword(email: string) {
    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: { id: true, email: true, fullName: true },
    });

    // Always return success message to prevent email enumeration
    if (!user) {
      return { message: "If an account exists with this email, a reset link has been sent." };
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: expiresAt,
      },
    });

    EmailService.sendPasswordResetEmail({
      to: user.email,
      fullName: user.fullName,
      resetToken: rawToken,
    }).catch((err) => console.error("Password reset email dispatch failed:", err));

    return { message: "If an account exists with this email, a reset link has been sent." };
  }

  /**
   * Reset password using a valid token
   */
  static async resetPassword(token: string, newPassword: string) {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new AppError("Reset link is invalid or has expired. Please request a new one.", 400);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return { message: "Password has been reset successfully. You can now sign in." };
  }
}
