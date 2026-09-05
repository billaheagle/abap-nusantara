import { randomBytes } from "crypto";
import path from "path";
import { mkdir, writeFile } from "fs/promises";
import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";
import { getEnv } from "@/lib/env";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8MB
const MAX_WIDTH = 2000;

export class UploadError extends Error {}

/**
 * Save an uploaded image safely:
 *  - size-limited
 *  - MIME type verified from the actual file bytes (never trusted from the
 *    client-supplied Content-Type or file extension), preventing disguised
 *    executable/script uploads
 *  - re-encoded via sharp, which also strips EXIF and drops anything that
 *    isn't valid image data
 *  - written under a randomly generated filename (no path traversal, no
 *    collisions, no user-controlled paths)
 *
 * Storage: for local/dev this writes to the public/uploads directory
 * configured by UPLOAD_DIR. For production behind a platform like Vercel
 * (read-only filesystem) swap this for an object-storage adapter (S3 /
 * Cloudflare R2 / Supabase Storage) — the function signature here is the
 * seam to do that behind.
 */
export async function saveUploadedImage(fileBuffer: Buffer): Promise<{ url: string; width: number; height: number }> {
  if (fileBuffer.byteLength > MAX_UPLOAD_BYTES) {
    throw new UploadError("File too large (max 8MB)");
  }

  const detected = await fileTypeFromBuffer(fileBuffer);
  if (!detected || !ALLOWED_MIME_TYPES.has(detected.mime)) {
    throw new UploadError("Unsupported file type. Only JPEG, PNG, and WebP images are allowed.");
  }

  const safeExt = detected.ext === "jpg" ? "jpg" : detected.ext;
  const filename = `${Date.now()}-${randomBytes(8).toString("hex")}.${safeExt}`;

  const image = sharp(fileBuffer).rotate(); // auto-orient, then strips EXIF on output
  const resized = image.resize({ width: MAX_WIDTH, withoutEnlargement: true });
  const outputBuffer =
    detected.ext === "png" ? await resized.png({ compressionLevel: 9 }).toBuffer() : await resized.webp({ quality: 82 }).toBuffer();

  const finalFilename = detected.ext === "png" ? filename : filename.replace(/\.[a-z]+$/, ".webp");
  const metadata = await sharp(outputBuffer).metadata();

  const env = getEnv();
  // UPLOAD_DIR is operator-configured, not user input; the turbopackIgnore
  // hints keep this dynamic path from forcing a trace of the whole project
  // into the server bundle (see the storage note at the top of this file).
  const uploadDir = path.join(/*turbopackIgnore: true*/ process.cwd(), env.UPLOAD_DIR);
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(/*turbopackIgnore: true*/ uploadDir, finalFilename), outputBuffer);

  return {
    url: `/uploads/${finalFilename}`,
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
  };
}
