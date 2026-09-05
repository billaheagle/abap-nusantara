"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { loginSchema } from "@/lib/validation/schemas";
import { verifyAdminCredentials } from "@/lib/auth/password";
import { createAdminSession, destroyAdminSession } from "@/lib/auth/session";
import { rateLimit, getClientIp } from "@/lib/security/rate-limit";

export type LoginFormState = { error?: string };

const GENERIC_ERROR = "Invalid credentials";

export async function loginAction(_prev: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: GENERIC_ERROR };

  const requestHeaders = await headers();
  const ip = getClientIp(requestHeaders);

  // Throttle by IP AND by the attempted email, so an attacker can't spray
  // many emails from one IP, nor hammer one email from many IPs unnoticed.
  const ipLimit = rateLimit(`login-ip:${ip}`, 10, 15 * 60 * 1000);
  const emailLimit = rateLimit(`login-email:${parsed.data.email.toLowerCase()}`, 5, 15 * 60 * 1000);
  if (!ipLimit.allowed || !emailLimit.allowed) {
    return { error: "Too many attempts. Please try again later." };
  }

  const isValid = await verifyAdminCredentials(parsed.data.email, parsed.data.password);
  if (!isValid) return { error: GENERIC_ERROR };

  await createAdminSession(parsed.data.email.toLowerCase());
  redirect("/admin/dashboard");
}

export async function logoutAction() {
  await destroyAdminSession();
  redirect("/admin/login");
}
