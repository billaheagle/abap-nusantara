import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { saveUploadedDocument, UploadError } from "@/lib/storage/upload";
import { rateLimit, getClientIp } from "@/lib/security/rate-limit";
import { prisma } from "@/lib/db/prisma";

// PDF uploads (the Hire Me CV). Mirrors the image upload route: the proxy
// already gates /api/admin/*, and the session is re-checked here.
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

  const declaredBytes = Number(request.headers.get("content-length") ?? 0);
  if (declaredBytes > 12 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 413 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  try {
    const result = await saveUploadedDocument(Buffer.from(await file.arrayBuffer()));
    await prisma.media.create({ data: { url: result.url, alt: file.name } });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof UploadError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("Document upload failed:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
