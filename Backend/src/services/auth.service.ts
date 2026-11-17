import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/db";
import { ENV } from "../config/env";
import { AppError } from "../middleware/errorHandler";
import { RegisterInput, LoginInput, BankDetailsInput } from "../validators/auth.validator";
import { sanitizeSlug, isValidSlug, RESERVED_SLUGS } from "../utils/slug";

export class AuthService {
  /**
   * Register a new merchant, auto-provision their store and wallet in one transaction
   */
  static async register(data: RegisterInput) {
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
      candidateSlug = `${candidateSlug}-${randomSuffix}`;
    }

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    // 4. Create User, Store, and Wallet in an atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          fullName: data.fullName.trim(),
          email: data.email.toLowerCase().trim(),
          phoneNumber: data.phoneNumber.trim(),
          passwordHash,
          role: "MERCHANT",
        },
      });

      const newStore = await tx.store.create({
        data: {
          ownerId: newUser.id,
          name: data.storeName.trim(),
          slug: candidateSlug,
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

    // 5. Generate JWT token
    const token = jwt.sign(
      {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        storeId: result.store.id,
      },
      ENV.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return {
      token,
      user: {
        id: result.user.id,
        fullName: result.user.fullName,
        email: result.user.email,
        phoneNumber: result.user.phoneNumber,
        role: result.user.role,
      },
      store: {
        id: result.store.id,
        name: result.store.name,
        slug: result.store.slug,
        whatsappNumber: result.store.whatsappNumber,
        currency: result.store.currency,
        subscriptionTier: result.store.subscriptionTier,
      },
    };
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
      return {
        available: false,
        slug: cleanSlug,
        message: "This handle is reserved by system",
      };
    }

    const existing = await prisma.store.findUnique({
      where: { slug: cleanSlug },
      select: { id: true },
    });

    return {
      available: !existing,
      slug: cleanSlug,
      message: existing ? "Handle is already taken" : "Handle is available!",
    };
  }

  /**
   * Update payout bank details for a store
   */
  static async updateBankDetails(storeId: string, data: BankDetailsInput) {
    const updated = await prisma.store.update({
      where: { id: storeId },
      data: {
        bankCode: data.bankCode,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        accountName: data.accountName,
      },
      select: {
        id: true,
        bankCode: true,
        bankName: true,
        accountNumber: true,
        accountName: true,
      },
    });

    return updated;
  }
}
