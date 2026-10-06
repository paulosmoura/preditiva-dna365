"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { loginAction, type LoginState } from "@/app/actions";

const initialState: LoginState = { error: "" };

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);
  return (
    <form action={action} className="login-form">
      <label>
        <span>Usuário</span>
        <input name="username" autoComplete="username" required maxLength={100} />
      </label>
      <label>
        <span>Senha</span>
        <input name="password" type="password" autoComplete="current-password" required maxLength={200} />
      </label>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      <button className="primary-button" type="submit" disabled={pending}>
        <LogIn size={17} aria-hidden="true" /> {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
