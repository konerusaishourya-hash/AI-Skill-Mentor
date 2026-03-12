import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, Clock, Lightbulb, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  title: string;
  description: string;
  importance?: string;
  estimatedHours?: number;
  checked: boolean;
  onToggle: () => void;
  index: number;
  stepNumber?: number;
  totalSteps?: number;
}

export function TaskCard({
  title,
  description,
  importance,
  estimatedHours,
  checked,
  onToggle,
  index,
  stepNumber,
  totalSteps,
}: TaskCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [completing, setCompleting] = useState(false);

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (completing) return;
    setCompleting(true);
    setTimeout(() => {
      onToggle();
      setCompleting(false);
    }, 400);
  };

  const formatTime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    if (hours === 1) return "1 hour";
    return `${hours} hours`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{
        opacity: completing ? 0.6 : 1,
        y: 0,
        scale: completing ? 0.97 : 1,
      }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className={cn(
        "group relative rounded-2xl border-2 transition-all duration-300 shadow-lg overflow-hidden",
        checked
          ? "bg-primary/5 border-primary/30 shadow-primary/10"
          : "bg-card border-border/40 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 shadow-black/5"
      )}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/60 via-primary to-accent-foreground/60" />

      {/* Step + time header */}
      {(stepNumber !== undefined || estimatedHours !== undefined) && (
        <div className="flex items-center justify-between px-6 pt-5 pb-0">
          {stepNumber !== undefined && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide uppercase">
              Step {stepNumber}{totalSteps ? ` of ${totalSteps}` : ""}
            </span>
          )}
          {estimatedHours !== undefined && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-semibold ml-auto">
              <Clock className="w-3 h-3" />
              {formatTime(estimatedHours)}
            </span>
          )}
        </div>
      )}

      {/* Main content */}
      <div className="px-6 pt-4 pb-0">
        <h3 className="text-xl font-display font-bold text-foreground leading-snug mb-2">
          {title}
        </h3>
        <p className="text-base text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>

      {/* Why it matters – collapsible */}
      {importance && (
        <div className="px-6 mt-3">
          <button
            onClick={() => setExpanded((p) => !p)}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-1"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            Why it matters
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 transition-transform duration-200",
                expanded && "rotate-180"
              )}
            />
          </button>
          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <p className="text-sm text-foreground/80 leading-relaxed pb-1 border-l-2 border-amber-300 pl-3">
                  {importance}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Mark as done button */}
      <div className="px-6 pb-5 pt-4">
        <motion.button
          onClick={handleComplete}
          disabled={completing}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.97 }}
          className={cn(
            "relative w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 overflow-hidden transition-all duration-300",
            completing
              ? "bg-green-500 text-white border-transparent"
              : "bg-primary/5 hover:bg-primary text-primary hover:text-primary-foreground border-2 border-primary/25 hover:border-transparent hover:shadow-lg hover:shadow-primary/20"
          )}
        >
          {/* Shimmer on hover */}
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

          <AnimatePresence mode="wait">
            {completing ? (
              <motion.span
                key="completing"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Done!
              </motion.span>
            ) : (
              <motion.span
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Mark as done
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.div>
  );
}
