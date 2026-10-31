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
    <ol className="mb-8 flex flex-wrap items-start gap-y-3 border-b border-border pb-5">
      {steps.map((step, i) => {
        const state = i < currentIndex ? "done" : i === currentIndex ? "current" : "upcoming";
        const reachable = i <= furthestIndex;
        const isLast = i === steps.length - 1;
        return (
          <li key={step.key} className="flex items-center">
            <button
              type="button"
              disabled={!reachable}
              onClick={() => reachable && onJump(i)}
              className={`flex shrink-0 flex-col items-center gap-1.5 px-1.5 ${
                reachable ? "cursor-pointer" : "cursor-not-allowed opacity-50"
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full font-mono-tech text-[11px] font-medium ${
                  state === "current"
                    ? "bg-accent text-white"
                    : state === "done"
                    ? "border border-accent text-accent"
                    : "border border-border text-muted"
                }`}
              >
                {state === "done" ? <Check size={12} /> : i + 1}
              </span>
              <span
                className={`whitespace-nowrap text-[10px] font-medium uppercase tracking-wide ${
                  state === "current" ? "text-accent" : state === "done" ? "text-ink" : "text-muted"
                }`}
              >
                {step.label}
              </span>
            </button>
            {!isLast && <span className="mx-0.5 mb-4 h-px w-3 shrink-0 bg-border sm:w-6" />}
          </li>
        );
      })}
    </ol>
  );
}
