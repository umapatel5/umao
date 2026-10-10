import Link from "next/link";

type MarketingShellProps = {
  children: React.ReactNode;
};

export function MarketingShell({ children }: MarketingShellProps) {
  return (
    <main className="site-page">
      <header className="site-header">
        <Link className="site-brand" href="/">
          <span>umao</span>
        </Link>

        <div className="site-auth">
          <Link className="site-button site-button-primary" href="/login">
            Login / Sign up
          </Link>
        </div>
      </header>

      {children}

      <footer className="site-footer">
        <div>
          <Link className="site-brand" href="/">
            <span>umao</span>
          </Link>
          <p>A soft place to rehearse the interview before the real one.</p>
        </div>
        <div className="site-footer-actions">
          <Link href="/login">Login</Link>
          <Link href="/signup">Sign up</Link>
          <Link href="/practice">Open app</Link>
        </div>
      </footer>
    </main>
  );
}
