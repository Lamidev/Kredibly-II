import { Request, Response, NextFunction } from "express";

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
}

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Lightweight, memory-bounded in-memory rate limiter keyed by client IP + route path.
 */
export function createRateLimiter({
  windowMs,
  max,
  message = "Too many requests. Please try again later.",
}: RateLimitOptions) {
  const buckets = new Map<string, Bucket>();
  const MAX_ENTRIES = 10_000;

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();

    if (buckets.size > MAX_ENTRIES) {
      for (const [key, bucket] of buckets.entries()) {
        if (bucket.resetAt <= now) {
          buckets.delete(key);
        }
      }
    }

    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const key = `${ip}:${req.baseUrl}${req.path}`;
    const existing = buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (existing.count >= max) {
      const retryAfterSec = Math.ceil((existing.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(Math.max(1, retryAfterSec)));
      return res.status(429).json({
        success: false,
        message,
      });
    }

    existing.count += 1;
    return next();
  };
}
