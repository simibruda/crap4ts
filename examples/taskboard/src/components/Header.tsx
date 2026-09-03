export function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="header">
      <div>
        <p className="eyebrow">Taskboard demo</p>
        <h1>{title}</h1>
        <p className="subtitle">{subtitle}</p>
      </div>
    </header>
  );
}
