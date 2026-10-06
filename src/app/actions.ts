"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  authenticateAdmin,
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/session";

export type LoginState = { error: string };

export async function loginAction(_state: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) return { error: "Informe usuário e senha." };
  if (!authenticateAdmin(username, password)) return { error: "Usuário ou senha inválidos." };

  (await cookies()).set(SESSION_COOKIE, createSessionToken(username), sessionCookieOptions());
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, "", {
    ...sessionCookieOptions(),
    expires: new Date(0),
    maxAge: 0,
  });
  redirect("/");
}
