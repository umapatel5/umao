import Link from "next/link";
import { BarChart3, Bell, BookOpen, Braces, History, LayoutDashboard, Settings } from "lucide-react";
import { AuthStatus } from "@/components/AuthStatus";

type AppShellProps = {
  children: React.ReactNode;
  active: "dashboard" | "history" | "interview" | "practice" | "resources" | "results" | "settings";
};

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, key: "dashboard" },
  { href: "/practice", label: "Practice", icon: Braces, key: "practice" },
  { href: "/history", label: "History", icon: History, key: "history" },
  { href: "/results", label: "Results", icon: BarChart3, key: "results" },
  { href: "/resources", label: "Resources", icon: BookOpen, key: "resources" },
  { href: "/settings", label: "Settings", icon: Settings, key: "settings" }
] as const;

export function AppShell({ children, active }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/dashboard">
          <span>umao</span>
        </Link>

        <nav className="nav" aria-label="Primary navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                aria-current={active === item.key ? "page" : undefined}
                className={active === item.key ? "active" : undefined}
                href={item.href}
                key={item.href}
              >
                <Icon aria-hidden size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="topbar-actions">
          <span className="streak-pill">12 day streak</span>
          <button className="icon-button" title="Notifications" type="button">
            <Bell aria-hidden size={17} />
          </button>
          <AuthStatus />
        </div>
      </header>
      <main className="main">{children}</main>
    </div>
  );
}
