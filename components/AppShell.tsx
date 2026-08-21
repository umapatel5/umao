import Link from "next/link";
import { BarChart3, Bell, BookOpen, Braces, History, LayoutDashboard, Settings } from "lucide-react";
import { AuthStatus } from "@/components/AuthStatus";

type AppShellProps = {
  children: React.ReactNode;
  active: "dashboard" | "history" | "interview" | "results";
};

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, key: "dashboard" },
  { href: "/interview/system-design-lite", label: "Interview", icon: Braces, key: "interview" },
  { href: "/history", label: "History", icon: History, key: "history" },
  { href: "/results/system-design-lite", label: "Results", icon: BarChart3, key: "results" }
] as const;

export function AppShell({ children, active }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/">
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
          <Link href="#">
            <BookOpen aria-hidden size={18} />
            Resources
          </Link>
          <Link href="#">
            <Settings aria-hidden size={18} />
            Settings
          </Link>
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
