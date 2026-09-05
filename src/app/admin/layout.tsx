import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { getAdminSession } from "@/lib/auth/session";
import { logoutAction } from "@/features/auth/actions";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();

  // /admin/login renders through this same layout with no session — show it
  // bare (its own page centres itself full-screen).
  if (!session) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Fiori shell bar */}
      <header className="admin-shell sticky top-0 z-30 flex h-12 items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-2.5">
          <Image src="/brand/logo-200.png" alt="" width={24} height={24} className="h-6 w-6 object-contain" />
          <span className="text-sm font-semibold tracking-tight">
            ABAP <span className="text-gold">Nusantara</span>
          </span>
          <span className="ml-1 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/75">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="hidden text-white/65 sm:inline">{session.email}</span>
          <Link href="/" className="hidden text-white/65 transition-colors hover:text-white sm:inline">
            View site
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" /> Log out
            </button>
          </form>
        </div>
      </header>

      <div className="flex flex-1 flex-col md:flex-row">
        <aside className="shrink-0 border-b border-border bg-surface-elevated md:w-56 md:border-b-0 md:border-r md:border-border">
          <div className="md:sticky md:top-12 md:max-h-[calc(100vh-3rem)] md:overflow-y-auto">
            <AdminNav />
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
