import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

interface CompletedTaskCardProps {
  title: string;
  index: number;
}

export function CompletedTaskCard({ title, index }: CompletedTaskCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="flex items-center gap-4 px-5 py-3.5 rounded-xl bg-card border border-border/40 shadow-sm"
    >
      <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-green-500" />
      <span className="text-sm font-medium text-muted-foreground line-through decoration-muted-foreground/40">
        {title}
      </span>
    </motion.div>
  );
}
