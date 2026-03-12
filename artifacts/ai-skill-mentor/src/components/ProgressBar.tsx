import { motion } from "framer-motion";

interface ProgressBarProps {
  progress: number;
  completed?: number;
  total?: number;
}

const MILESTONES = [25, 50, 75];

export function ProgressBar({ progress, completed, total }: ProgressBarProps) {
  const rounded = Math.round(progress);

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-3">
        <span className="font-display font-semibold text-foreground text-lg">Your Progress</span>
        <div className="flex items-baseline gap-2">
          {completed !== undefined && total !== undefined && (
            <span className="text-sm text-muted-foreground">
              {completed} / {total} steps
            </span>
          )}
          <motion.span
            key={rounded}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`text-lg font-bold tabular-nums ${rounded === 100 ? "text-green-600" : "text-primary"}`}
          >
            {rounded}%
          </motion.span>
        </div>
      </div>

      {/* Bar */}
      <div className="relative h-4 w-full bg-border/40 rounded-full overflow-hidden shadow-inner">
        <motion.div
          className="absolute top-0 left-0 h-full rounded-full"
          style={{
            background:
              rounded === 100
                ? "linear-gradient(to right, #22c55e, #16a34a)"
                : "linear-gradient(to right, hsl(var(--primary)), hsl(var(--accent-foreground)))",
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 50, damping: 15 }}
        >
          {/* Shimmer sweep */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_ease-in-out_infinite]" />
        </motion.div>

        {/* Milestone markers */}
        {MILESTONES.map((m) => (
          <div
            key={m}
            className="absolute top-0 bottom-0 w-0.5 flex flex-col items-center justify-center"
            style={{ left: `${m}%` }}
          >
            <div
              className={`w-0.5 h-full transition-colors duration-500 ${
                progress >= m ? "bg-white/30" : "bg-border/60"
              }`}
            />
          </div>
        ))}
      </div>

      {/* Milestone labels */}
      <div className="relative mt-1.5 h-4">
        {MILESTONES.map((m) => (
          <span
            key={m}
            className={`absolute text-[10px] font-semibold -translate-x-1/2 transition-colors duration-500 ${
              progress >= m ? "text-primary/60" : "text-muted-foreground/40"
            }`}
            style={{ left: `${m}%` }}
          >
            {m}%
          </span>
        ))}
      </div>
    </div>
  );
}
