import {
  BookOpen,
  Database,
  FlaskConical,
  History,
  LayoutDashboard,
  SplitSquareHorizontal,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/datasets", label: "Dataset Explorer", icon: Database },
  { to: "/experiments/new", label: "New Experiment", icon: FlaskConical, primary: true },
  { to: "/history", label: "Experiment History", icon: History },
  { to: "/comparison", label: "Model Comparison", icon: SplitSquareHorizontal },
  { to: "/docs", label: "Documentation", icon: BookOpen },
];

export function Sidebar() {
  return (
    <aside className="shrink-0 border-b border-border bg-surface px-3 py-3 md:w-60 md:border-b-0 md:border-r md:py-4">
      <div className="mb-3 px-2 md:mb-6">
        <p className="text-sm font-semibold text-ink">VQC Workbench</p>
      </div>
      <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
        {NAV_ITEMS.map(({ to, label, icon: Icon, primary }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex shrink-0 items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors ${
                isActive
                  ? "bg-accent/10 font-medium text-accent"
                  : primary
                  ? "font-medium text-accent hover:bg-accent/5"
                  : "text-muted hover:bg-canvas hover:text-ink"
              }`
            }
          >
            <Icon size={16} />
            <span className="hidden sm:inline">{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
