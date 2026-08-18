type PageHeaderProps = {
  eyebrow: string;
  title: string;
  copy: string;
  actions?: React.ReactNode;
};

export function PageHeader({ eyebrow, title, copy, actions }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
        <p className="page-kicker">{eyebrow}</p>
        <h1 className="page-title">{title}</h1>
        <p className="page-copy">{copy}</p>
      </div>
      {actions ? <div className="toolbar">{actions}</div> : null}
    </header>
  );
}
