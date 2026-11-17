import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env";
import { AppError } from "./errorHandler";
import { prisma } from "../config/db";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  storeId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      storeId?: string;
    }
  }
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      throw new AppError("Authentication required. Please login.", 401);
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET) as AuthenticatedUser;

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { stores: { select: { id: true, slug: true } } },
    });

    if (!user) {
      throw new AppError("User account not found or has been removed.", 401);
    }

    // Default to the first store if merchant has one
    const activeStoreId = decoded.storeId || user.stores[0]?.id;

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      storeId: activeStoreId,
    };
    req.storeId = activeStoreId;

    next();
  } catch (error: any) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return next(new AppError("Invalid or expired session. Please login again.", 401));
    }
    next(error);
  }
};
