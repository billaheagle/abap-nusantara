import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { saveUploadedImage, UploadError } from "@/lib/storage/upload";
import { rateLimit, getClientIp } from "@/lib/security/rate-limit";
import { prisma } from "@/lib/db/prisma";

// The proxy (src/proxy.ts) already gates every /api/admin/* path on a valid
// admin session; we re-check here too — never rely on a single layer of
// authorization for a state-changing endpoint.
export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIp(request.headers);
  const { allowed } = rateLimit(`upload:${ip}`, 30, 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many uploads, please slow down." }, { status: 429 });
  }

  // Cheap early bail-out before buffering the whole body into memory; the
  // exact byte-count limit is enforced on the decoded image in saveUploadedImage.
  const declaredBytes = Number(request.headers.get("content-length") ?? 0);
  if (declaredBytes > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 4MB)" }, { status: 413 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await saveUploadedImage(buffer);
    await prisma.media.create({ data: { url: result.url, alt: file.name, width: result.width, height: result.height } });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof UploadError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("Upload failed:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
