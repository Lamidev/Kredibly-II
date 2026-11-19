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

  static async requestBankChangeOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const storeId = req.storeId!;
      const data = await WalletService.requestBankChangeOtp(storeId);

      return res.status(200).json({
        success: true,
        message: data.message,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateBankDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const storeId = req.storeId!;
      const { bankName, bankCode, accountNumber, accountName, otp } = req.body;

      const data = await WalletService.updateBankDetails(storeId, {
        bankName,
        bankCode,
        accountNumber,
        accountName,
        otp,
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

  static async requestWithdrawalOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const storeId = req.storeId!;
      const amount = Number(req.body.amount);
      const data = await WalletService.requestWithdrawalOtp(storeId, amount);

      return res.status(200).json({
        success: true,
        message: data.message,
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
      const otp = typeof req.body.otp === "string" ? req.body.otp : undefined;

      const result = await WalletService.withdrawFunds(storeId, amount, otp);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async submitKyc(req: Request, res: Response, next: NextFunction) {
    try {
      const storeId = req.storeId!;
      const idType = req.body.idType === "BVN" ? "BVN" : "NIN";
      const idNumber = String(req.body.idNumber || "").trim();

      const data = await WalletService.submitKycVerification(storeId, idType, idNumber);

      return res.status(200).json({
        success: true,
        message: data.message,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}
