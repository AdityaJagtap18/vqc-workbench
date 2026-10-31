import { Check } from "lucide-react";

export interface StepDef {
  key: string;
  label: string;
}

export function Stepper({
  steps,
  currentIndex,
  furthestIndex,
  onJump,
}: {
  steps: StepDef[];
  currentIndex: number;
  furthestIndex: number;
  onJump: (index: number) => void;
}) {
  return (
    <ol className="mb-6 flex flex-wrap gap-2 border-b border-border pb-4">
      {steps.map((step, i) => {
        const state = i < currentIndex ? "done" : i === currentIndex ? "current" : "upcoming";
        const reachable = i <= furthestIndex;
        return (
          <li key={step.key}>
            <button
              type="button"
              disabled={!reachable}
              onClick={() => reachable && onJump(i)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                state === "current"
                  ? "border-accent bg-accent/10 text-accent"
                  : state === "done"
                  ? "border-border bg-canvas text-ink hover:bg-border/40"
                  : "border-border text-muted"
              } ${reachable ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
            >
              {state === "done" ? <Check size={12} /> : <span className="font-mono-tech">{i + 1}</span>}
              {step.label}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
