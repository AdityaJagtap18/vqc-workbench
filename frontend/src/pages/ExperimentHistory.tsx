import { ExperimentList } from "../components/experiments/ExperimentList";
import { PageHeader } from "../components/layout/PageHeader";

export default function ExperimentHistory() {
  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Experiment History"
        description="Browse, search, and revisit previously run VQC experiments."
      />
      <div className="border border-border border-t-2 border-t-accent bg-surface p-5">
        <ExperimentList emptyLabel="No experiments have been run yet. Start one from New Experiment." />
      </div>
    </div>
  );
}
