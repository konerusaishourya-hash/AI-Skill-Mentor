import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, Clock, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  title: string;
  description: string;
  importance?: string;
  estimatedHours?: number;
  checked: boolean;
  onToggle: () => void;
  index: number;
}

export function TaskCard({ title, description, importance, estimatedHours, checked, onToggle, index }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle();
  };

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((prev) => !prev);
  };

  const hasDetails = importance || estimatedHours !== undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className={cn(
        "group relative rounded-2xl border-2 transition-all duration-300 shadow-lg",
        checked
          ? "bg-primary/5 border-primary/30 shadow-primary/10"
          : "bg-card border-border/50 hover:border-primary/20 hover:shadow-xl shadow-black/5"
      )}
    >
      {/* Main row */}
      <div className="flex gap-5 items-start p-6">
        {/* Checkbox */}
        <button
          onClick={handleCheckboxClick}
          aria-label={checked ? "Mark incomplete" : "Mark complete"}
          className={cn(
            "mt-1 flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300",
            checked
              ? "bg-primary border-primary scale-110 shadow-md shadow-primary/20"
              : "border-muted-foreground/30 hover:border-primary/50 active:scale-95"
          )}
        >
          <Check
            strokeWidth={3}
            className={cn(
              "w-4 h-4 text-primary-foreground transition-all duration-300",
              checked ? "opacity-100 scale-100" : "opacity-0 scale-50"
            )}
          />
        </button>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              "text-xl font-display font-bold transition-colors duration-300",
              checked ? "text-primary/70 line-through decoration-primary/30" : "text-foreground"
            )}
          >
            {title}
          </h3>
          <p
            className={cn(
              "mt-1.5 text-base leading-relaxed transition-colors duration-300",
              checked ? "text-muted-foreground/70" : "text-muted-foreground"
            )}
          >
            {description}
          </p>
        </div>

        {/* Dropdown toggle */}
        {hasDetails && (
          <button
            onClick={handleDropdownClick}
            aria-label={expanded ? "Collapse details" : "Expand details"}
            className={cn(
              "mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200",
              "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <ChevronDown
              className={cn(
                "w-5 h-5 transition-transform duration-300",
                expanded && "rotate-180"
              )}
            />
          </button>
        )}
      </div>

      {/* Expandable details */}
      <AnimatePresence>
        {expanded && hasDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-0">
              <div className="border-t border-border/40 pt-4 space-y-3">
                {importance && (
                  <div className="flex gap-3 items-start">
                    <div className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Why it matters</p>
                      <p className="text-sm text-foreground leading-relaxed">{importance}</p>
                    </div>
                  </div>
                )}
                {estimatedHours !== undefined && (
                  <div className="flex gap-3 items-center">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Estimated time</p>
                      <p className="text-sm font-medium text-foreground">
                        {estimatedHours} {estimatedHours === 1 ? "hour" : "hours"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
