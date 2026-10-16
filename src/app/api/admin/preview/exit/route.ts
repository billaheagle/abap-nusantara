import { NextRequest, NextResponse } from "next/server";
import { draftMode } from "next/headers";

// Leaves preview. `to` must be a path on this site; anything else goes back
// to the article list.
export async function GET(request: NextRequest) {
  (await draftMode()).disable();
  const to = request.nextUrl.searchParams.get("to") ?? "";
  const target = to.startsWith("/") && !to.startsWith("//") ? to : "/admin/articles";
  return NextResponse.redirect(new URL(target, request.url));
}
