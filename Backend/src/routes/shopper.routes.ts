import { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../config/db";
import { ENV } from "../config/env";
import { AppError } from "../middleware/errorHandler";
import { createRateLimiter } from "../middleware/rateLimit";
import { EmailService } from "../services/email.service";

const router = Router();

const shopperAuthLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many attempts. Please wait 15 minutes and try again.",
});

interface ShopperJwtPayload {
  customerId: string;
  storeId: string;
  type: "SHOPPER";
}

function hashCode(raw: string) {
  return crypto.createHash("sha256").update(raw.trim()).digest("hex");
}

function generateSixDigitCode() {
  const raw = String(crypto.randomInt(100000, 1000000));
  return {
    raw,
    hash: hashCode(raw),
    expires: new Date(Date.now() + 15 * 60 * 1000),
  };
}

function signShopperToken(customerId: string, storeId: string) {
  return jwt.sign(
    { customerId, storeId, type: "SHOPPER" } satisfies ShopperJwtPayload,
    ENV.JWT_SECRET,
    { expiresIn: "30d" }
  );
}

async function requireShopperAuth(
  req: Request & { shopper?: { customerId: string; storeId: string } },
  _res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : undefined;

    if (!token) {
      throw new AppError("Please log in to your account.", 401);
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET) as ShopperJwtPayload;
    if (decoded.type !== "SHOPPER" || !decoded.customerId || !decoded.storeId) {
      throw new AppError("Invalid shopper session.", 401);
    }

    req.shopper = { customerId: decoded.customerId, storeId: decoded.storeId };
    next();
  } catch (err: any) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return next(new AppError("Session expired. Please log in again.", 401));
    }
    next(err);
  }
}

async function resolveStore(slug: string) {
  const store = await prisma.store.findUnique({
    where: { slug: slug.toLowerCase().trim() },
    select: { id: true, name: true, slug: true, isActive: true },
  });
  if (!store || !store.isActive) {
    throw new AppError("Store not found", 404);
  }
  return store;
}

/**
 * POST /api/shopper/:storeSlug/register
 * Allows guests with previous purchases (matching phone or email) to upgrade into a registered account.
 */
router.post(
  "/:storeSlug/register",
  shopperAuthLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const store = await resolveStore(req.params.storeSlug);
      const data = z
        .object({
          fullName: z.string().trim().min(2, "Full name is required"),
          email: z.string().trim().email("Enter a valid email"),
          phoneNumber: z.string().trim().min(10, "Enter a valid phone number").max(16),
          password: z.string().min(6, "Password must be at least 6 characters"),
        })
        .parse(req.body);

      const cleanEmail = data.email.toLowerCase();
      const cleanPhone = data.phoneNumber;

      const existingRegistered = await prisma.customer.findFirst({
        where: {
          storeId: store.id,
          isRegistered: true,
          OR: [{ email: cleanEmail }, { phoneNumber: cleanPhone }],
        },
      });

      if (existingRegistered) {
        throw new AppError(
          "An account with this email or phone number already exists on this store. Please log in.",
          400
        );
      }

      const passwordHash = await bcrypt.hash(data.password, 10);
      const { raw, hash, expires } = generateSixDigitCode();

      // Check if an unregistered guest record exists with the same phone or email
      const guestByPhone = await prisma.customer.findUnique({
        where: { storeId_phoneNumber: { storeId: store.id, phoneNumber: cleanPhone } },
      });
      const guestByEmail = await prisma.customer.findUnique({
        where: { storeId_email: { storeId: store.id, email: cleanEmail } },
      });

      // Prevent guest account takeover: if phone matches an existing guest with a different email, reject
      if (
        guestByPhone &&
        guestByPhone.email &&
        guestByPhone.email.toLowerCase() !== cleanEmail
      ) {
        throw new AppError(
          "This phone number is already linked to another email on this store. Please register with that email or use a different phone number.",
          400
        );
      }

      const targetGuest = guestByPhone || guestByEmail;

      if (targetGuest) {
        await prisma.customer.update({
          where: { id: targetGuest.id },
          data: {
            fullName: data.fullName,
            email: cleanEmail,
            phoneNumber: cleanPhone,
            passwordHash,
            isRegistered: true,
            emailVerified: false,
            emailVerifyCodeHash: hash,
            emailVerifyExpires: expires,
          },
        });

        // If a second duplicate guest row existed by email, merge its orders
        if (guestByPhone && guestByEmail && guestByPhone.id !== guestByEmail.id) {
          await prisma.order.updateMany({
            where: { customerId: guestByEmail.id, storeId: store.id },
            data: { customerId: guestByPhone.id },
          });
          await prisma.customer.delete({ where: { id: guestByEmail.id } });
        }
      } else {
        await prisma.customer.create({
          data: {
            storeId: store.id,
            fullName: data.fullName,
            email: cleanEmail,
            phoneNumber: cleanPhone,
            passwordHash,
            isRegistered: true,
            emailVerified: false,
            emailVerifyCodeHash: hash,
            emailVerifyExpires: expires,
          },
        });
      }

      EmailService.sendShopperCodeEmail({
        to: cleanEmail,
        fullName: data.fullName,
        storeName: store.name,
        code: raw,
        purpose: "verify",
      }).catch((err) => console.error("Shopper verification email error:", err));

      return res.status(201).json({
        success: true,
        message: "Verification code sent to your email.",
        data: { requiresEmailVerification: true, email: cleanEmail },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/shopper/:storeSlug/verify-email
 */
router.post(
  "/:storeSlug/verify-email",
  shopperAuthLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const store = await resolveStore(req.params.storeSlug);
      const { email, code } = z
        .object({
          email: z.string().trim().email(),
          code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
        })
        .parse(req.body);

      const cleanEmail = email.toLowerCase();
      const customer = await prisma.customer.findUnique({
        where: { storeId_email: { storeId: store.id, email: cleanEmail } },
      });

      if (!customer || !customer.isRegistered) {
        throw new AppError("Account not found", 404);
      }

      if (
        !customer.emailVerifyCodeHash ||
        !customer.emailVerifyExpires ||
        customer.emailVerifyExpires < new Date() ||
        customer.emailVerifyCodeHash !== hashCode(code)
      ) {
        throw new AppError("Invalid or expired verification code", 400);
      }

      const updated = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          emailVerified: true,
          emailVerifyCodeHash: null,
          emailVerifyExpires: null,
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
          address: true,
          city: true,
          state: true,
          createdAt: true,
        },
      });

      const token = signShopperToken(updated.id, store.id);
      return res.status(200).json({
        success: true,
        data: { token, customer: updated },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/shopper/:storeSlug/resend-verification
 */
router.post(
  "/:storeSlug/resend-verification",
  shopperAuthLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const store = await resolveStore(req.params.storeSlug);
      const { email } = z.object({ email: z.string().trim().email() }).parse(req.body);
      const cleanEmail = email.toLowerCase();

      const customer = await prisma.customer.findUnique({
        where: { storeId_email: { storeId: store.id, email: cleanEmail } },
      });
      if (!customer || !customer.isRegistered) {
        throw new AppError("Account not found", 404);
      }

      const { raw, hash, expires } = generateSixDigitCode();
      await prisma.customer.update({
        where: { id: customer.id },
        data: { emailVerifyCodeHash: hash, emailVerifyExpires: expires },
      });

      await EmailService.sendShopperCodeEmail({
        to: cleanEmail,
        fullName: customer.fullName,
        storeName: store.name,
        code: raw,
        purpose: "verify",
      });

      return res.status(200).json({ success: true, message: "Code resent." });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/shopper/:storeSlug/login
 */
router.post(
  "/:storeSlug/login",
  shopperAuthLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const store = await resolveStore(req.params.storeSlug);
      const { email, password } = z
        .object({
          email: z.string().trim().email("Enter a valid email"),
          password: z.string().min(1, "Password is required"),
        })
        .parse(req.body);

      const cleanEmail = email.toLowerCase();
      const customer = await prisma.customer.findUnique({
        where: { storeId_email: { storeId: store.id, email: cleanEmail } },
      });

      if (!customer || !customer.isRegistered || !customer.passwordHash) {
        throw new AppError("Invalid email or password", 401);
      }

      const ok = await bcrypt.compare(password, customer.passwordHash);
      if (!ok) {
        throw new AppError("Invalid email or password", 401);
      }

      if (!customer.emailVerified) {
        const { raw, hash, expires } = generateSixDigitCode();
        await prisma.customer.update({
          where: { id: customer.id },
          data: { emailVerifyCodeHash: hash, emailVerifyExpires: expires },
        });
        EmailService.sendShopperCodeEmail({
          to: cleanEmail,
          fullName: customer.fullName,
          storeName: store.name,
          code: raw,
          purpose: "verify",
        }).catch(() => {});
        throw new AppError(
          "Please verify your email first. We sent a 6-digit code to your inbox.",
          403
        );
      }

      const token = signShopperToken(customer.id, store.id);
      return res.status(200).json({
        success: true,
        data: {
          token,
          customer: {
            id: customer.id,
            fullName: customer.fullName,
            email: customer.email,
            phoneNumber: customer.phoneNumber,
            address: customer.address,
            city: customer.city,
            state: customer.state,
            createdAt: customer.createdAt,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/shopper/:storeSlug/forgot-password
 */
router.post(
  "/:storeSlug/forgot-password",
  shopperAuthLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const store = await resolveStore(req.params.storeSlug);
      const { email } = z.object({ email: z.string().trim().email() }).parse(req.body);
      const cleanEmail = email.toLowerCase();

      const customer = await prisma.customer.findUnique({
        where: { storeId_email: { storeId: store.id, email: cleanEmail } },
      });

      if (customer && customer.isRegistered) {
        const { raw, hash, expires } = generateSixDigitCode();
        await prisma.customer.update({
          where: { id: customer.id },
          data: { resetCodeHash: hash, resetCodeExpires: expires },
        });
        await EmailService.sendShopperCodeEmail({
          to: cleanEmail,
          fullName: customer.fullName,
          storeName: store.name,
          code: raw,
          purpose: "reset",
        });
      }

      return res.status(200).json({
        success: true,
        message: "If an account exists for that email, a 6-digit reset code has been sent.",
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/shopper/:storeSlug/reset-password
 */
router.post(
  "/:storeSlug/reset-password",
  shopperAuthLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const store = await resolveStore(req.params.storeSlug);
      const { email, code, newPassword } = z
        .object({
          email: z.string().trim().email(),
          code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
          newPassword: z.string().min(6, "Password must be at least 6 characters"),
        })
        .parse(req.body);

      const cleanEmail = email.toLowerCase();
      const customer = await prisma.customer.findUnique({
        where: { storeId_email: { storeId: store.id, email: cleanEmail } },
      });

      if (
        !customer ||
        !customer.resetCodeHash ||
        !customer.resetCodeExpires ||
        customer.resetCodeExpires < new Date() ||
        customer.resetCodeHash !== hashCode(code)
      ) {
        throw new AppError("Invalid or expired reset code", 400);
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          passwordHash,
          resetCodeHash: null,
          resetCodeExpires: null,
        },
      });

      return res.status(200).json({
        success: true,
        message: "Password reset successful. You can now log in.",
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/shopper/me
 */
router.get(
  "/me",
  requireShopperAuth,
  async (req: Request & { shopper?: { customerId: string; storeId: string } }, res, next) => {
    try {
      const customer = await prisma.customer.findFirst({
        where: { id: req.shopper!.customerId, storeId: req.shopper!.storeId },
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
          address: true,
          city: true,
          state: true,
          createdAt: true,
          orders: {
            where: { paymentStatus: "PAID" },
            orderBy: { createdAt: "desc" },
            include: {
              items: {
                include: {
                  product: {
                    select: { images: true, slug: true },
                  },
                },
              },
            },
          },
        },
      });
      if (!customer) throw new AppError("Account not found", 404);
      return res.status(200).json({ success: true, data: customer });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/shopper/address (No email confirmation required)
 */
router.put(
  "/address",
  requireShopperAuth,
  async (req: Request & { shopper?: { customerId: string; storeId: string } }, res, next) => {
    try {
      const data = z
        .object({
          address: z.string().trim().min(5, "Address must be at least 5 characters").max(250),
          state: z.string().trim().min(2, "State is required").max(60),
          city: z.string().trim().max(80).optional().nullable(),
          phoneNumber: z.string().trim().min(10).max(16).optional(),
        })
        .parse(req.body);

      const updated = await prisma.customer.update({
        where: { id: req.shopper!.customerId },
        data: {
          address: data.address,
          state: data.state,
          city: data.city || null,
          ...(data.phoneNumber ? { phoneNumber: data.phoneNumber } : {}),
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
          address: true,
          city: true,
          state: true,
          createdAt: true,
        },
      });

      return res.status(200).json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/shopper/profile-otp (Send 6-digit code to edit Name, Email, or Password)
 */
router.post(
  "/profile-otp",
  requireShopperAuth,
  shopperAuthLimiter,
  async (req: Request & { shopper?: { customerId: string; storeId: string } }, res, next) => {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: req.shopper!.customerId },
        include: { store: { select: { name: true } } },
      });
      if (!customer || !customer.email) {
        throw new AppError("Verified email not found", 400);
      }

      const { raw, hash, expires } = generateSixDigitCode();
      await prisma.customer.update({
        where: { id: customer.id },
        data: { profileOtpHash: hash, profileOtpExpires: expires },
      });

      await EmailService.sendShopperCodeEmail({
        to: customer.email,
        fullName: customer.fullName,
        storeName: customer.store.name,
        code: raw,
        purpose: "profile",
      });

      return res.status(200).json({
        success: true,
        message: "6-digit confirmation code sent to your email.",
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/shopper/profile (Requires 6-digit email confirmation code for Name, Email, or Password)
 */
router.put(
  "/profile",
  requireShopperAuth,
  async (req: Request & { shopper?: { customerId: string; storeId: string } }, res, next) => {
    try {
      const data = z
        .object({
          code: z.string().trim().regex(/^\d{6}$/, "6-digit confirmation code is required"),
          fullName: z.string().trim().min(2).max(120).optional(),
          email: z.string().trim().email().optional(),
          newPassword: z.string().min(6).optional(),
        })
        .parse(req.body);

      const customer = await prisma.customer.findUnique({
        where: { id: req.shopper!.customerId },
      });

      if (
        !customer ||
        !customer.profileOtpHash ||
        !customer.profileOtpExpires ||
        customer.profileOtpExpires < new Date() ||
        customer.profileOtpHash !== hashCode(data.code)
      ) {
        throw new AppError("Invalid or expired confirmation code", 400);
      }

      const updateData: any = {
        profileOtpHash: null,
        profileOtpExpires: null,
      };
      if (data.fullName) updateData.fullName = data.fullName;
      if (data.email) updateData.email = data.email.toLowerCase();
      if (data.newPassword) {
        updateData.passwordHash = await bcrypt.hash(data.newPassword, 10);
      }

      const updated = await prisma.customer.update({
        where: { id: customer.id },
        data: updateData,
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
          address: true,
          city: true,
          state: true,
          createdAt: true,
        },
      });

      return res.status(200).json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
