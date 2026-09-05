"use client";

import Image from "next/image";
import { useActionState } from "react";
import { loginAction, type LoginFormState } from "@/features/auth/actions";

const initialState: LoginFormState = {};

export default function AdminLoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm rounded-md border border-border bg-surface-elevated p-6">
        <div className="mb-6 text-center">
          <Image src="/brand/logo-200.png" alt="ABAP Nusantara" width={56} height={56} className="h-14 w-14 object-contain mx-auto" />
          <h1 className="mt-3 text-lg font-semibold">Admin sign in</h1>
          <p className="text-sm text-foreground-muted mt-1">ABAP Nusantara</p>
        </div>
        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
          </div>
          {state.error && <p className="text-sm text-accent-red">{state.error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark transition-colors disabled:opacity-50"
          >
            {isPending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
