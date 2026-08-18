import Link from "next/link";
import { BarChart3, Braces, LayoutDashboard, Settings } from "lucide-react";

type AppShellProps = {
  children: React.ReactNode;
  active: "dashboard" | "interview" | "results";
};

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, key: "dashboard" },
  { href: "/interview/system-design-lite", label: "Interview", icon: Braces, key: "interview" },
  { href: "/results/system-design-lite", label: "Results", icon: BarChart3, key: "results" }
] as const;

export function AppShell({ children, active }: AppShellProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/">
          <span className="brand-mark">IO</span>
          <span>InterviewOS</span>
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
            <Settings aria-hidden size={18} />
            Settings
          </Link>
        </nav>

        <div className="sidebar-footer">
          Architecture placeholders are ready for Monaco, transcription, webcam input, and API routes.
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
