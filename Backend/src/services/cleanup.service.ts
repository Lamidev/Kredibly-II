import fs from "fs/promises";
import path from "path";
import { prisma } from "../config/db";
import { ENV } from "../config/env";

const ORPHAN_MIN_AGE_MS = 24 * 60 * 60 * 1000;

function extractUploadFilename(urlOrPath?: string | null): string | null {
  if (!urlOrPath) return null;
  const clean = urlOrPath.split("?")[0].trim();
  if (!clean) return null;
  const base = path.basename(clean);
  return base || null;
}

export class CleanupService {
  /**
   * Remove unreferenced files in UPLOAD_DIR older than 24 hours.
   * Uses PostgreSQL as the single source of truth so active logos,
   * banners, and product images are never deleted.
   */
  static async cleanupOrphanUploads() {
    const uploadDir = path.resolve(ENV.UPLOAD_DIR);
    try {
      await fs.access(uploadDir);
    } catch {
      return { scanned: 0, deleted: 0 };
    }

    const [stores, products] = await Promise.all([
      prisma.store.findMany({
        select: { logoUrl: true, bannerUrl: true },
      }),
      prisma.product.findMany({
        select: { images: true },
      }),
    ]);

    const activeFiles = new Set<string>();
    for (const s of stores) {
      const logo = extractUploadFilename(s.logoUrl);
      const banner = extractUploadFilename(s.bannerUrl);
      if (logo) activeFiles.add(logo);
      if (banner) activeFiles.add(banner);
    }
    for (const p of products) {
      for (const img of p.images || []) {
        const name = extractUploadFilename(img);
        if (name) activeFiles.add(name);
      }
    }

    const entries = await fs.readdir(uploadDir);
    const cutoff = Date.now() - ORPHAN_MIN_AGE_MS;
    let deleted = 0;

    for (const entry of entries) {
      if (activeFiles.has(entry)) continue;
      const fullPath = path.join(uploadDir, entry);
      try {
        const stat = await fs.stat(fullPath);
        if (stat.isFile() && stat.mtimeMs < cutoff) {
          await fs.unlink(fullPath);
          deleted++;
        }
      } catch {
        // ignore transient file errors
      }
    }

    if (deleted > 0) {
      console.log(`[Cleanup] Removed ${deleted} orphan upload(s) from ${uploadDir}`);
    }
    return { scanned: entries.length, deleted };
  }
}
