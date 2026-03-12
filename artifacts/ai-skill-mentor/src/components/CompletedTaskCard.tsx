import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

interface CompletedTaskCardProps {
  title: string;
  index: number;
  stepNumber?: number;
}

export function CompletedTaskCard({ title, index, stepNumber }: CompletedTaskCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 28,
        delay: index * 0.04,
      }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border/40 shadow-sm"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 20, delay: index * 0.04 + 0.1 }}
      >
        <CheckCircle2 className="w-4.5 h-4.5 flex-shrink-0 text-green-500" />
      </motion.div>

      <span className="text-sm font-medium text-muted-foreground line-through decoration-muted-foreground/30 flex-1">
        {title}
      </span>

      {stepNumber !== undefined && (
        <span className="text-xs text-muted-foreground/50 font-mono flex-shrink-0">
          #{stepNumber}
        </span>
      )}
    </motion.div>
  );
}
