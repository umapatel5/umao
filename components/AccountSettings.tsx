"use client";

import { useState, type FormEvent } from "react";
import { Save, LockKeyhole } from "lucide-react";
import type { AuthUser } from "@/types/account";

export function AccountSettings({ user, onChange }: { user: AuthUser; onChange: (user: AuthUser) => void }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>, password: boolean) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const newPassword = String(values.get("newPassword") ?? "");
    if (password && newPassword !== values.get("confirmPassword")) { setMessage("New passwords do not match."); return; }
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/auth/account", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(password ? { currentPassword: values.get("currentPassword"), newPassword } : { name: values.get("name") }) });
      const payload = await response.json();
      if (!response.ok) { setMessage(payload.error ?? "Could not save changes."); return; }
      onChange(payload.user);
      window.dispatchEvent(new Event("umao:account-updated"));
      setMessage(password ? "Password changed. Other sessions have been signed out." : "Name updated.");
      if (password) form.reset();
    } catch { setMessage("Could not reach the account service."); }
    finally { setBusy(false); }
  }
  return <div>
    <form className="settings-form" onSubmit={(event) => submit(event, false)}>
      <label><span>Name</span><input name="name" defaultValue={user.name} autoComplete="name" minLength={2} maxLength={80} required /></label>
      <button className="button button-secondary" type="submit" disabled={busy}><Save size={16} aria-hidden />Save name</button>
    </form>
    <form className="settings-form" style={{ marginTop: 24 }} onSubmit={(event) => submit(event, true)}>
      <h3 className="section-title">Change password</h3>
      <label><span>Current password</span><input name="currentPassword" type="password" autoComplete="current-password" maxLength={128} required /></label>
      <label><span>New password</span><input name="newPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} required /></label>
      <label><span>Confirm new password</span><input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} required /></label>
      <button className="button button-primary" type="submit" disabled={busy}><LockKeyhole size={16} aria-hidden />Change password</button>
    </form>
    {message ? <p role="status" className="meta">{message}</p> : null}
  </div>;
}
