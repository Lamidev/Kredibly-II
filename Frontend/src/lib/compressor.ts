import imageCompression from "browser-image-compression";

export interface CompressionResult {
  file: File;
  originalSizeKB: number;
  compressedSizeKB: number;
  previewUrl: string;
}

/**
 * Compresses an image file on the client side:
 * - Converts to WebP format
 * - Resizes to max width 1080px
 * - Keeps file size under ~100KB
 * - Saves VPS CPU and bandwidth
 */
export async function compressProductImage(file: File): Promise<CompressionResult> {
  const originalSizeKB = Math.round(file.size / 1024);

  const options = {
    maxSizeMB: 0.1, // 100KB target
    maxWidthOrHeight: 1080,
    useWebWorker: true,
    fileType: "image/webp",
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    const compressedFile = new File(
      [compressedBlob],
      file.name.replace(/\.[^/.]+$/, "") + ".webp",
      { type: "image/webp" }
    );
    const compressedSizeKB = Math.round(compressedFile.size / 1024);
    const previewUrl = URL.createObjectURL(compressedFile);

    return {
      file: compressedFile,
      originalSizeKB,
      compressedSizeKB,
      previewUrl,
    };
  } catch (error) {
    console.warn("Client compression fallback:", error);
    return {
      file,
      originalSizeKB,
      compressedSizeKB: originalSizeKB,
      previewUrl: URL.createObjectURL(file),
    };
  }
}
