"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Loader2, LogIn, UserPlus } from "lucide-react";

type AuthFormProps = {
  mode: "login" | "signup";
};

export function AuthForm({ mode }: AuthFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      email: String(formData.get("email") ?? ""),
      name: String(formData.get("name") ?? ""),
      password: String(formData.get("password") ?? "")
    };

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(result.error ?? "Authentication failed.");
        return;
      }

      window.location.href = "/";
    } catch {
      setError("Could not reach the account service.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-page-shell">
      <div className="card panel auth-card">
        <div>
          <p className="page-kicker">Umao account</p>
          <h1 className="page-title">{mode === "signup" ? "Create your account" : "Welcome back"}</h1>
          <p className="page-copy">
            Save interview results, review prior sessions, and track progress over time.
          </p>
        </div>

        <form className="auth-form" onSubmit={submitAuth}>
          {mode === "signup" ? (
            <label>
              <span>Name</span>
              <input autoComplete="name" name="name" placeholder="Uma Patel" required />
            </label>
          ) : null}

          <label>
            <span>Email</span>
            <input autoComplete="email" name="email" placeholder="you@example.com" required type="email" />
          </label>

          <label>
            <span>Password</span>
            <input autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={8} name="password" required type="password" />
          </label>

          {error ? <div className="console-notice warning">{error}</div> : null}

          <button className="button button-primary" disabled={isSubmitting} type="submit">
            {isSubmitting ? (
              <Loader2 aria-hidden className="spin-icon" size={17} />
            ) : mode === "signup" ? (
              <UserPlus aria-hidden size={17} />
            ) : (
              <LogIn aria-hidden size={17} />
            )}
            {mode === "signup" ? "Sign up" : "Login"}
          </button>
        </form>

        <div className="auth-switch">
          {mode === "signup" ? (
            <Link href="/login">Already have an account? Login</Link>
          ) : (
            <Link href="/signup">Need an account? Sign up</Link>
          )}
        </div>
      </div>
    </section>
  );
}
