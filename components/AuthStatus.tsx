"use client";

import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import type { AuthUser } from "@/types/account";

export function AuthStatus() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((payload: { user: AuthUser | null }) => setUser(payload.user))
      .catch(() => setUser(null));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/login";
  }

  if (!user) {
    return (
      <div className="auth-status">
        <Link className="button button-secondary" href="/login">
          Login
        </Link>
        <Link className="button button-primary" href="/signup">
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="auth-status signed-in">
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
