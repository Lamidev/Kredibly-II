import { prisma } from "../config/db";
import { ENV } from "../config/env";
import { AppError } from "../middleware/errorHandler";
import { NombaService } from "./nomba.service";

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
   * Update and save verified bank payout details
   */
  static async updateBankDetails(
    storeId: string,
    data: {
      bankName: string;
      bankCode: string;
      accountNumber: string;
      accountName: string;
    }
  ) {
    if (!data.accountNumber || data.accountNumber.length !== 10) {
      throw new AppError("Valid 10-digit account number required", 400);
    }

    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: {
        bankName: data.bankName,
        bankCode: data.bankCode,
        accountNumber: data.accountNumber,
        accountName: data.accountName,
      },
      select: {
        id: true,
        bankName: true,
        bankCode: true,
        accountNumber: true,
        accountName: true,
      },
    });

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

    const available = Number(store.wallet.availableBalance);
    if (available < amount) {
      throw new AppError(
        `Insufficient available balance. You requested ₦${amount.toLocaleString()} but only have ₦${available.toLocaleString()} available.`,
        400
      );
    }

    const reference = `WD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    // 1. Decrement available balance & record transaction
    const withdrawalTx = await prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { id: store.wallet!.id },
        data: {
          availableBalance: { decrement: amount },
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          walletId: store.wallet!.id,
          amount,
          platformFee: 0,
          netAmount: amount,
          type: "WITHDRAWAL",
          status: "PENDING",
          reference,
        },
      });

      return { updatedWallet, transaction };
    });

    // 2. Dispatch Payout via Nomba Transfer Engine
    try {
      if (ENV.NOMBA_CLIENT_ID && ENV.NOMBA_PRIVATE_KEY && ENV.NOMBA_ACCOUNT_ID) {
        await NombaService.initiateTransfer({
          amount,
          bankCode: store.bankCode || "058",
          accountNumber: store.accountNumber,
          accountName: store.accountName || store.name,
          narration: `KREDIBLY - ${store.name}`,
        });
      } else {
        console.log(`[Nomba Dev Transfer] Simulated payout of ₦${amount} to ${store.bankName} (${store.accountNumber})`);
      }

      // Mark transaction completed
      await prisma.transaction.update({
        where: { id: withdrawalTx.transaction.id },
        data: { status: "COMPLETED" },
      });

      return {
        success: true,
        message: `Withdrawal of ₦${amount.toLocaleString()} successfully sent to ${store.bankName} (${store.accountNumber})`,
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
