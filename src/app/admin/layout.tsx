import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Bell, ExternalLink, Plus } from "lucide-react";
import { getAdminSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminUserMenu } from "@/components/admin/admin-user-menu";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();

  // /admin/login renders through this same layout with no session — show it
  // bare (its own page centres itself full-screen).
  if (!session) return <>{children}</>;

  const pendingComments = await prisma.comment.count({ where: { status: "PENDING" } });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Fiori shell bar */}
      <header className="admin-shell sticky top-0 z-30 flex h-14 items-center justify-between gap-4 px-4">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5 rounded-md">
          <Image src="/brand/logo-200.png" alt="" width={28} height={28} className="h-7 w-7 object-contain" />
          <span className="text-sm font-semibold tracking-tight">
            ABAP <span className="text-gold">Nusantara</span>
          </span>
          <span className="ml-1 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/75">
            Admin
          </span>
        </Link>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link
            href="/admin/articles/new"
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-gold px-3 text-xs font-semibold text-ink transition-colors hover:bg-[#f0b83a]"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            <span className="hidden sm:inline">New article</span>
          </Link>

          <span className="mx-1 hidden h-5 w-px bg-white/15 sm:block" aria-hidden="true" />

          <Link
            href="/admin/comments?status=PENDING"
            className="shell-icon-btn relative"
            aria-label={pendingComments > 0 ? `${pendingComments} comments awaiting moderation` : "No comments awaiting moderation"}
            title={pendingComments > 0 ? `${pendingComments} awaiting moderation` : "No comments awaiting moderation"}
          >
            <Bell className="h-4 w-4" />
            {pendingComments > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-red px-1 text-[10px] font-bold leading-none text-white ring-2 ring-ink">
                {pendingComments > 99 ? "99+" : pendingComments}
              </span>
            )}
          </Link>

          <Link href="/" target="_blank" className="shell-icon-btn" aria-label="View site (opens in new tab)" title="View site">
            <ExternalLink className="h-4 w-4" />
          </Link>

          <span className="mx-1 h-5 w-px bg-white/15" aria-hidden="true" />

          <AdminUserMenu email={session.email} />
        </div>
      </header>

      <div className="flex flex-1 flex-col md:flex-row">
        <aside className="shrink-0 border-b border-border bg-surface-elevated md:w-56 md:border-b-0 md:border-r md:border-border">
          <div className="md:sticky md:top-14 md:max-h-[calc(100vh-3.5rem)] md:overflow-y-auto">
            <AdminNav />
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
