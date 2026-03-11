import { motion } from "framer-motion";

interface ProgressBarProps {
  progress: number;
}

export function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-3">
        <span className="font-display font-semibold text-foreground text-lg">Your Progress</span>
        <motion.span 
          key={progress}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-lg font-bold text-primary"
        >
          {Math.round(progress)}%
        </motion.span>
      </div>
      <div className="h-4 w-full bg-border/50 rounded-full overflow-hidden p-1 shadow-inner">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-accent-foreground rounded-full shadow-sm"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 50, damping: 15 }}
        />
      </div>
    </div>
  );
}
