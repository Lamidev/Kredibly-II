import crypto from "crypto";
import { prisma } from "../config/db";
import { ENV } from "../config/env";
import { AppError } from "../middleware/errorHandler";
import { NombaService } from "./nomba.service";
import { EmailService } from "./email.service";
import { DojahService } from "./dojah.service";

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
        kycStatus: true,
        kycIdType: true,
        kycIdLast4: true,
        kycVerifiedName: true,
        kycVerifiedAt: true,
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
      kyc: {
        status: store.kycStatus,
        idType: store.kycIdType,
        idLast4: store.kycIdLast4,
        verifiedName: store.kycVerifiedName,
        verifiedAt: store.kycVerifiedAt,
      },
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
        kycStatus: true,
        kycIdType: true,
        kycIdLast4: true,
        kycVerifiedName: true,
        kycVerifiedAt: true,
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
   * Send 6-digit OTP to merchant email before initiating a wallet withdrawal
   */
  static async requestWithdrawalOtp(storeId: string, amount: number) {
    if (!amount || amount < 1000) {
      throw new AppError("Minimum withdrawal amount is ₦1,000", 400);
    }

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        wallet: true,
        owner: { select: { email: true, fullName: true } },
      },
    });

    if (!store || !store.wallet) {
      throw new AppError("Store wallet not found", 404);
    }

    if (store.kycStatus !== "VERIFIED") {
      throw new AppError(
        "Please complete Identity Verification (KYC) before requesting a withdrawal.",
        403
      );
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

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.store.update({
      where: { id: storeId },
      data: {
        withdrawalOtpHash: otpHash,
        withdrawalOtpExpires: expiresAt,
      },
    });

    EmailService.sendWithdrawalOtpEmail({
      to: store.owner.email,
      fullName: store.owner.fullName,
      storeName: store.name,
      amount,
      bankName: store.bankName,
      accountNumber: store.accountNumber,
      otp,
    }).catch((err) => console.error("Withdrawal OTP email failed:", err));

    const maskedEmail = store.owner.email.replace(
      /(^.{2})(.*)(@.*)/,
      (_, a, b, c) => `${a}${"*".repeat(Math.min(b.length, 5))}${c}`
    );

    return {
      message: `A 6-digit confirmation code has been sent to ${maskedEmail}`,
      maskedEmail,
    };
  }

  static getTransferFee(amount: number): number {
    return amount < 5000 ? 20 : amount <= 50000 ? 25 : 50;
  }

  /**
   * Verify merchant identity via Dojah (NIN or BVN). Never stores the raw ID number.
   */
  static async submitKycVerification(
    storeId: string,
    idType: "NIN" | "BVN",
    idNumber: string
  ) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: { owner: { select: { fullName: true } } },
    });

    if (!store) {
      throw new AppError("Store not found", 404);
    }

    if (store.kycStatus === "VERIFIED") {
      return {
        status: store.kycStatus,
        idType: store.kycIdType,
        idLast4: store.kycIdLast4,
        verifiedName: store.kycVerifiedName,
        verifiedAt: store.kycVerifiedAt,
        message: "Your identity is already verified.",
      };
    }

    const result = await DojahService.verifyIdentity(idType, idNumber);
    const isAutoMatch = DojahService.namesMatch(result.fullName, [
      store.owner?.fullName,
      store.accountName,
    ]);

    const nextStatus = isAutoMatch ? "VERIFIED" : "PENDING";
    const verifiedAt = isAutoMatch ? new Date() : null;

    const updated = await prisma.store.update({
      where: { id: storeId },
      data: {
        kycStatus: nextStatus,
        kycIdType: idType,
        kycIdLast4: idNumber.trim().slice(-4),
        kycVerifiedName: result.fullName,
        kycVerifiedAt: verifiedAt,
      },
      select: {
        kycStatus: true,
        kycIdType: true,
        kycIdLast4: true,
        kycVerifiedName: true,
        kycVerifiedAt: true,
      },
    });

    return {
      status: updated.kycStatus,
      idType: updated.kycIdType,
      idLast4: updated.kycIdLast4,
      verifiedName: updated.kycVerifiedName,
      verifiedAt: updated.kycVerifiedAt,
      message: isAutoMatch
        ? "Identity verified! Withdrawals are now enabled."
        : "ID verified with Dojah and queued for quick compliance review (name differs from business/account name).",
    };
  }

  /**
   * Request withdrawal from Available Balance to registered Nigerian bank account via Nomba
   */
  static async withdrawFunds(storeId: string, amount: number, otp?: string) {
    if (!amount || amount < 1000) {
      throw new AppError("Minimum withdrawal amount is ₦1,000", 400);
    }

    if (!otp || otp.trim().length !== 6) {
      throw new AppError(
        "A 6-digit email confirmation code is required to authorize this withdrawal.",
        400
      );
    }

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: { wallet: true },
    });

    if (!store || !store.wallet) {
      throw new AppError("Store wallet not found", 404);
    }

    if (store.kycStatus !== "VERIFIED") {
      throw new AppError(
        "Please complete Identity Verification (KYC) before withdrawing funds.",
        403
      );
    }

    if (store.kycStatus !== "VERIFIED") {
      throw new AppError(
        "Please complete Identity Verification (KYC) before requesting a withdrawal.",
        403
      );
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

    const providedHash = crypto
      .createHash("sha256")
      .update(otp.trim())
      .digest("hex");

    const otpClaim = await prisma.store.updateMany({
      where: {
        id: storeId,
        withdrawalOtpHash: providedHash,
        withdrawalOtpExpires: { gt: new Date() },
      },
      data: {
        withdrawalOtpHash: null,
        withdrawalOtpExpires: null,
      },
    });

    if (otpClaim.count === 0) {
      throw new AppError(
        "Invalid or expired confirmation code. Please request a new code.",
        400
      );
    }

    const available = Number(store.wallet.availableBalance);
    if (available < amount) {
      throw new AppError(
        `Insufficient available balance. You requested ₦${amount.toLocaleString()} but only have ₦${available.toLocaleString()} available.`,
        400
      );
    }

    const TRANSFER_FEE = WalletService.getTransferFee(amount);
    const netPayout = Math.round((amount - TRANSFER_FEE) * 100) / 100;
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

  private static isAutoT1Running = false;

  /**
   * Automated T+1 Daily Settlement (runs at 8:00 AM WAT).
   * Settles cleared funds from previous days (>= ₦1,000) to merchants who haven't manually withdrawn.
   */
  static async processAutoT1Settlements() {
    if (this.isAutoT1Running) {
      console.log("[Auto T+1] Skipping overlapping run.");
      return { settledCount: 0 };
    }
    this.isAutoT1Running = true;

    try {
      const now = new Date();
      // Compute 00:00:00 WAT (UTC+1) for today so only T+1 (prior-day) funds are auto-settled
      const watNow = new Date(now.getTime() + 60 * 60 * 1000);
      const watDateStr = watNow.toISOString().slice(0, 10);
      const todayStartWat = new Date(
        Date.UTC(watNow.getUTCFullYear(), watNow.getUTCMonth(), watNow.getUTCDate(), 0, 0, 0) -
          60 * 60 * 1000
      );

      const candidateWallets = await prisma.wallet.findMany({
        where: {
          availableBalance: { gte: 1000 },
          store: {
            kycStatus: "VERIFIED",
            accountNumber: { not: null },
            bankName: { not: null },
            OR: [
              { withdrawalLockedUntil: null },
              { withdrawalLockedUntil: { lte: now } },
            ],
          },
        },
        include: {
          store: {
            include: {
              owner: { select: { email: true, fullName: true } },
            },
          },
        },
      });

      let settledCount = 0;

      for (const wallet of candidateWallets) {
        const { store } = wallet;
        if (!store.accountNumber || !store.bankName) continue;

        const reference = `T1-${watDateStr}-${store.id.slice(0, 8)}`;
        const alreadySettledToday = await prisma.transaction.findFirst({
          where: {
            walletId: wallet.id,
            reference: { startsWith: reference },
            status: { in: ["PENDING", "COMPLETED"] },
          },
        });
        if (alreadySettledToday) continue;

        const available = Number(wallet.availableBalance);
        const todayInflowsAgg = await prisma.transaction.aggregate({
          where: {
            walletId: wallet.id,
            type: "SALE",
            status: "COMPLETED",
            createdAt: { gte: todayStartWat },
          },
          _sum: { netAmount: true },
        });

        const todayInflows = Number(todayInflowsAgg._sum.netAmount || 0);
        const eligibleAmount = Math.floor((available - todayInflows) * 100) / 100;

        if (eligibleAmount < 1000) continue;

        const transferFee = WalletService.getTransferFee(eligibleAmount);
        const netPayout = Math.round((eligibleAmount - transferFee) * 100) / 100;

        try {
          const txRecord = await prisma.$transaction(async (tx) => {
            const debited = await tx.wallet.updateMany({
              where: {
                id: wallet.id,
                availableBalance: { gte: eligibleAmount },
              },
              data: {
                availableBalance: { decrement: eligibleAmount },
              },
            });

            if (debited.count === 0) return null;

            return tx.transaction.create({
              data: {
                walletId: wallet.id,
                amount: eligibleAmount,
                platformFee: transferFee,
                netAmount: netPayout,
                type: "WITHDRAWAL",
                status: "PENDING",
                reference,
              },
            });
          });

          if (!txRecord) continue;

          try {
            if (ENV.NOMBA_CLIENT_ID && ENV.NOMBA_PRIVATE_KEY && ENV.NOMBA_ACCOUNT_ID) {
              await NombaService.initiateTransfer({
                amount: netPayout,
                bankCode: store.bankCode || "058",
                accountNumber: store.accountNumber,
                accountName: store.accountName || store.name,
                narration: `KREDIBLY T1 - ${store.name}`,
              });
            } else {
              console.log(
                `[Nomba Dev T+1] Simulated auto-settlement of ₦${netPayout} (fee ₦${transferFee}) to ${store.bankName} (${store.accountNumber})`
              );
            }

            await prisma.transaction.update({
              where: { id: txRecord.id },
              data: { status: "COMPLETED" },
            });

            settledCount++;

            EmailService.sendAutoSettlementEmail({
              to: store.owner.email,
              fullName: store.owner.fullName,
              storeName: store.name,
              amount: netPayout,
              bankName: store.bankName,
              accountNumber: store.accountNumber,
              reference,
            }).catch((err) => console.error("Auto T+1 email failed:", err));
          } catch (transferErr: any) {
            console.error(`Auto T+1 transfer failed for ${store.slug}:`, transferErr.message);
            await prisma.$transaction(async (tx) => {
              await tx.wallet.update({
                where: { id: wallet.id },
                data: { availableBalance: { increment: eligibleAmount } },
              });
              await tx.transaction.update({
                where: { id: txRecord.id },
                data: { status: "FAILED" },
              });
            });
          }
        } catch (err) {
          console.error(`Auto T+1 settlement error for ${store.slug}:`, err);
        }
      }

      console.log(`[Auto T+1] Completed 8:00 AM WAT run. Settled ${settledCount} store(s).`);
      return { settledCount };
    } finally {
      this.isAutoT1Running = false;
    }
  }
}
