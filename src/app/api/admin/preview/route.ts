import { NextRequest, NextResponse } from "next/server";
import { draftMode } from "next/headers";
import { getAdminSession } from "@/lib/auth/session";
import { SLUG_PATTERN } from "@/lib/auth/preview";

// Turns on draft mode for this browser and opens the article, so an admin can
// read a draft exactly as it will look once published. The proxy already
// gates /api/admin/*; the session is re-checked here.
export async function GET(request: NextRequest) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slug = request.nextUrl.searchParams.get("slug") ?? "";
  if (!SLUG_PATTERN.test(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  (await draftMode()).enable();
  return NextResponse.redirect(new URL(`/articles/${slug}`, request.url));
}
