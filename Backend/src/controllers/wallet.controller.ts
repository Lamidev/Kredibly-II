import { Request, Response, NextFunction } from "express";
import { WalletService } from "../services/wallet.service";

export class WalletController {
  static async getWallet(req: Request, res: Response, next: NextFunction) {
    try {
      const storeId = req.storeId!;
      const data = await WalletService.getWalletData(storeId);

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyBank(req: Request, res: Response, next: NextFunction) {
    try {
      const { bankCode, accountNumber } = req.body;
      const data = await WalletService.verifyBankAccount(bankCode, accountNumber);

      return res.status(200).json({
        success: true,
        message: "Bank account verified successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateBankDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const storeId = req.storeId!;
      const { bankName, bankCode, accountNumber, accountName } = req.body;

      const data = await WalletService.updateBankDetails(storeId, {
        bankName,
        bankCode,
        accountNumber,
        accountName,
      });

      return res.status(200).json({
        success: true,
        message: "Payout bank details updated successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async withdraw(req: Request, res: Response, next: NextFunction) {
    try {
      const storeId = req.storeId!;
      const amount = Number(req.body.amount);

      const result = await WalletService.withdrawFunds(storeId, amount);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
