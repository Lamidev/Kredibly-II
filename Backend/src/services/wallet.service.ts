import crypto from "crypto";
import { prisma } from "../config/db";
import { ENV } from "../config/env";
import { AppError } from "../middleware/errorHandler";
import { NombaService } from "./nomba.service";
import { EmailService } from "./email.service";

export class WalletService {
  /**
   * Get store wallet balances, bank details, and transaction ledger
   */
  static async getWalletData(storeId: string) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        name: true,
        bankName: true,
        bankCode: true,
        accountNumber: true,
        accountName: true,
        withdrawalLockedUntil: true,
        wallet: {
          include: {
            transactions: {
              orderBy: { createdAt: "desc" },
              include: {
                order: {
                  select: {
                    orderNumber: true,
                    customer: { select: { fullName: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!store) {
      throw new AppError("Store not found", 404);
    }

    if (!store.wallet) {
      throw new AppError("Wallet not initialized", 400);
    }

    return {
      storeId: store.id,
      storeName: store.name,
      bank: {
        bankName: store.bankName,
        bankCode: store.bankCode,
        accountNumber: store.accountNumber,
        accountName: store.accountName,
      },
      withdrawalLockedUntil: store.withdrawalLockedUntil,
      availableBalance: store.wallet.availableBalance,
      escrowBalance: store.wallet.escrowBalance,
      transactions: store.wallet.transactions,
    };
  }

  /**
   * Verify bank account name via Nomba lookup API
   */
  static async verifyBankAccount(bankCode: string, accountNumber: string) {
    if (!bankCode || !accountNumber || accountNumber.length !== 10) {
      throw new AppError("Valid bank code and 10-digit account number required", 400);
    }

    if (ENV.NOMBA_CLIENT_ID && ENV.NOMBA_PRIVATE_KEY && ENV.NOMBA_ACCOUNT_ID) {
      try {
        const resolved = await NombaService.resolveAccount(
          accountNumber,
          bankCode
        );
        return resolved;
      } catch (err: any) {
        throw new AppError(err.message || "Failed to resolve bank account", 400);
      }
    }

    // Local dev mock lookup when Nomba API credentials are unset
    return {
      accountNumber,
      accountName: "VERIFIED MERCHANT (DEV MODE)",
    };
  }

  /**
   * Send 6-digit OTP to merchant email before changing an existing bank account
   */
  static async requestBankChangeOtp(storeId: string) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: { owner: { select: { email: true, fullName: true } } },
    });

    if (!store || !store.owner) {
      throw new AppError("Store or merchant account not found", 404);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.store.update({
      where: { id: storeId },
      data: {
        bankChangeOtpHash: otpHash,
        bankChangeOtpExpires: expiresAt,
      },
    });

    EmailService.sendBankChangeOtpEmail({
      to: store.owner.email,
      fullName: store.owner.fullName,
      storeName: store.name,
      otp,
    }).catch((err) => console.error("Bank change OTP email failed:", err));

    const maskedEmail = store.owner.email.replace(
      /(^.)(.*)(@.*$)/,
      (_, first, middle, domain) => `${first}${"*".repeat(Math.min(middle.length, 5))}${domain}`
    );

    return {
      message: `A 6-digit confirmation code has been sent to ${maskedEmail}`,
      maskedEmail,
    };
  }

  /**
   * Update and save verified bank payout details.
   * Changing an existing bank account requires email OTP and triggers a 24-hour withdrawal lock.
   */
  static async updateBankDetails(
    storeId: string,
    data: {
      bankName: string;
      bankCode: string;
      accountNumber: string;
      accountName: string;
      otp?: string;
    }
  ) {
    if (!data.accountNumber || data.accountNumber.length !== 10) {
      throw new AppError("Valid 10-digit account number required", 400);
    }

    const existingStore = await prisma.store.findUnique({
      where: { id: storeId },
      include: { owner: { select: { email: true, fullName: true } } },
    });

    if (!existingStore) {
      throw new AppError("Store not found", 404);
    }

    const isChangingExistingBank = Boolean(
      existingStore.accountNumber && existingStore.accountNumber !== data.accountNumber
    ) || Boolean(
      existingStore.accountNumber && existingStore.bankCode !== data.bankCode
    );

    let lockedUntil: Date | undefined;

    if (isChangingExistingBank) {
      if (!data.otp || data.otp.trim().length !== 6) {
        throw new AppError(
          "A 6-digit email confirmation code is required to change your payout bank account.",
          400
        );
      }

      const providedHash = crypto
        .createHash("sha256")
        .update(data.otp.trim())
        .digest("hex");

      if (
        !existingStore.bankChangeOtpHash ||
        existingStore.bankChangeOtpHash !== providedHash ||
        !existingStore.bankChangeOtpExpires ||
        existingStore.bankChangeOtpExpires < new Date()
      ) {
        throw new AppError(
          "Invalid or expired confirmation code. Please request a new code.",
          400
        );
      }

      lockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24-hour fraud lock
    }

    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: {
        bankName: data.bankName,
        bankCode: data.bankCode,
        accountNumber: data.accountNumber,
        accountName: data.accountName,
        bankChangeOtpHash: null,
        bankChangeOtpExpires: null,
        ...(lockedUntil ? { withdrawalLockedUntil: lockedUntil } : {}),
      },
      select: {
        id: true,
        bankName: true,
        bankCode: true,
        accountNumber: true,
        accountName: true,
        withdrawalLockedUntil: true,
      },
    });

    if (lockedUntil && existingStore.owner) {
      EmailService.sendBankChangedAlertEmail({
        to: existingStore.owner.email,
        fullName: existingStore.owner.fullName,
        storeName: existingStore.name,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        lockedUntil,
      }).catch((err) => console.error("Bank changed alert email failed:", err));
    }

    return updatedStore;
  }

  /**
   * Request withdrawal from Available Balance to registered Nigerian bank account via Nomba
   */
  static async withdrawFunds(storeId: string, amount: number) {
    if (!amount || amount < 1000) {
      throw new AppError("Minimum withdrawal amount is ₦1,000", 400);
    }

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: { wallet: true },
    });

    if (!store || !store.wallet) {
      throw new AppError("Store wallet not found", 404);
    }

    if (!store.accountNumber || !store.bankName) {
      throw new AppError(
        "Please link and verify your payout bank details before requesting a withdrawal",
        400
      );
    }

    if (store.withdrawalLockedUntil && store.withdrawalLockedUntil > new Date()) {
      const unlockStr = store.withdrawalLockedUntil.toLocaleString("en-NG", {
        dateStyle: "medium",
        timeStyle: "short",
      });
      throw new AppError(
        `Withdrawals are temporarily locked for 24 hours after a bank account change. Unlocks on ${unlockStr}.`,
        403
      );
    }

    const available = Number(store.wallet.availableBalance);
    if (available < amount) {
      throw new AppError(
        `Insufficient available balance. You requested ₦${amount.toLocaleString()} but only have ₦${available.toLocaleString()} available.`,
        400
      );
    }

    const TRANSFER_FEE = 100;
    const netPayout = amount - TRANSFER_FEE;
    const reference = `WD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    // 1. Atomically decrement available balance only if sufficient funds remain
    const withdrawalTx = await prisma.$transaction(async (tx) => {
      const debited = await tx.wallet.updateMany({
        where: {
          id: store.wallet!.id,
          availableBalance: { gte: amount },
        },
        data: {
          availableBalance: { decrement: amount },
        },
      });

      if (debited.count === 0) {
        throw new AppError("Insufficient available balance for withdrawal.", 400);
      }

      const updatedWallet = await tx.wallet.findUniqueOrThrow({
        where: { id: store.wallet!.id },
      });

      const transaction = await tx.transaction.create({
        data: {
          walletId: store.wallet!.id,
          amount,
          platformFee: TRANSFER_FEE,
          netAmount: netPayout,
          type: "WITHDRAWAL",
          status: "PENDING",
          reference,
        },
      });

      return { updatedWallet, transaction };
    });

    // 2. Dispatch Payout via Nomba Transfer Engine (net of ₦100 transfer fee)
    try {
      if (ENV.NOMBA_CLIENT_ID && ENV.NOMBA_PRIVATE_KEY && ENV.NOMBA_ACCOUNT_ID) {
        await NombaService.initiateTransfer({
          amount: netPayout,
          bankCode: store.bankCode || "058",
          accountNumber: store.accountNumber,
          accountName: store.accountName || store.name,
          narration: `KREDIBLY - ${store.name}`,
        });
      } else {
        console.log(`[Nomba Dev Transfer] Simulated payout of ₦${netPayout} (fee ₦${TRANSFER_FEE}) to ${store.bankName} (${store.accountNumber})`);
      }

      // Mark transaction completed
      await prisma.transaction.update({
        where: { id: withdrawalTx.transaction.id },
        data: { status: "COMPLETED" },
      });

      return {
        success: true,
        message: `Withdrawal of ₦${netPayout.toLocaleString()} (₦${TRANSFER_FEE} transfer fee) sent to ${store.bankName} (${store.accountNumber})`,
        reference,
        newAvailableBalance: withdrawalTx.updatedWallet.availableBalance,
        newEscrowBalance: withdrawalTx.updatedWallet.escrowBalance,
      };
    } catch (err: any) {
      console.error("Nomba Payout Transfer Failed:", err.message);

      // Revert funds back to wallet if transfer failed immediately
      await prisma.$transaction(async (tx) => {
        await tx.wallet.update({
          where: { id: store.wallet!.id },
          data: { availableBalance: { increment: amount } },
        });

        await tx.transaction.update({
          where: { id: withdrawalTx.transaction.id },
          data: { status: "FAILED" },
        });
      });

      throw new AppError(`Payout could not be processed: ${err.message}. Funds have been restored to your wallet.`, 502);
    }
  }
}
