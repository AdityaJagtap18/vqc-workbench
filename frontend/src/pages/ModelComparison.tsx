import { ExperimentList } from "../components/experiments/ExperimentList";
import { PageHeader } from "../components/layout/PageHeader";

export default function ModelComparison() {
  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Model Comparison"
        description="Pick a completed experiment to compare VQC against its classical baselines."
      />
      <div className="border border-border border-t-2 border-t-accent bg-surface p-5">
        <ExperimentList onlyCompleted emptyLabel="No completed experiments yet." />
      </div>
    </div>
  );
}
