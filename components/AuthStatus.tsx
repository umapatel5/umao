"use client";

import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import type { AuthUser } from "@/types/account";

export function AuthStatus({ marketing = false }: { marketing?: boolean }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { user: AuthUser | null }) => setUser(payload.user))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/login";
  }

  if (isLoading) return <span className="meta" role="status">Checking account...</span>;

  if (!user) {
    return (
      <div className="auth-status">
        {!marketing ? <span className="meta">Guest</span> : null}
        <Link className={marketing ? "site-button site-button-primary" : "button button-secondary"} href="/login">
          {marketing ? "Login / Sign up" : "Sign in"}
        </Link>
      </div>
    );
  }

  return (
    <div className="auth-status signed-in">
      {marketing ? <Link className="site-button site-button-primary" href="/dashboard">Open app</Link> : null}
      <div>
        <UserRound aria-hidden size={16} />
        <span>{user.name}</span>
      </div>
      <button className="icon-button" onClick={logout} title="Log out" type="button">
        <LogOut aria-hidden size={16} />
      </button>
    </div>
  );
}
