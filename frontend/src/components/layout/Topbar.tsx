import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/", label: "Overview" },
  { to: "/datasets", label: "Dataset Explorer" },
  { to: "/experiments/new", label: "New Experiment", primary: true },
  { to: "/history", label: "History" },
  { to: "/comparison", label: "Comparison" },
  { to: "/docs", label: "Docs" },
];

export function Topbar() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3 sm:px-8">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 bg-accent" />
          <span className="font-display text-sm font-semibold tracking-tight text-ink">
            VQC<span className="text-accent">::</span>Workbench
          </span>
        </div>
        <nav className="flex flex-1 flex-wrap gap-1 overflow-x-auto">
          {NAV_ITEMS.map(({ to, label, primary }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `shrink-0 border-b-2 px-2.5 py-1 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-accent text-accent"
                    : primary
                    ? "border-transparent text-accent hover:border-accent/50"
                    : "border-transparent text-muted hover:text-ink"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
