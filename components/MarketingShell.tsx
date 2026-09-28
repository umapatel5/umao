import Link from "next/link";
import { ArrowRight } from "lucide-react";

type MarketingShellProps = {
  children: React.ReactNode;
};

const navItems = [
  { href: "/product", label: "Product" },
  { href: "/use-cases", label: "Use Cases" },
  { href: "/pricing", label: "Pricing" },
  { href: "/resources", label: "Resources" },
  { href: "/about", label: "About" }
];

export function MarketingShell({ children }: MarketingShellProps) {
  return (
    <main className="site-page">
      <header className="site-header">
        <Link className="site-brand" href="/">
          <span>Umao</span>
        </Link>

        <nav className="site-nav" aria-label="Public navigation">
          {navItems.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="site-auth">
          <Link className="site-sign-in" href="/login">
            Sign in
          </Link>
          <Link className="site-button site-button-primary" href="/signup">
            Get started
            <ArrowRight aria-hidden size={17} />
          </Link>
        </div>
      </header>

      {children}

      <footer className="site-footer">
        <div>
          <Link className="site-brand" href="/">
            <span>Umao</span>
          </Link>
          <p>Technical interview practice built for clearer thinking, better communication, and real improvement.</p>
        </div>
        <div>
          <strong>Product</strong>
          <Link href="/product">Interview room</Link>
          <Link href="/use-cases">Use cases</Link>
          <Link href="/pricing">Pricing</Link>
        </div>
        <div>
          <strong>Resources</strong>
          <Link href="/resources">Practice guides</Link>
          <Link href="/practice">Start practice</Link>
          <Link href="/history">History</Link>
        </div>
        <div>
          <strong>Company</strong>
          <Link href="/about">About</Link>
          <Link href="/login">Sign in</Link>
          <Link href="/signup">Create account</Link>
        </div>
      </footer>
    </main>
  );
}
