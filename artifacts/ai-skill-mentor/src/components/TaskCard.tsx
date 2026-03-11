import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  title: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
  index: number;
}

export function TaskCard({ title, description, checked, onToggle, index }: TaskCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      onClick={onToggle}
      className={cn(
        "group relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-xl",
        checked
          ? "bg-primary/5 border-primary/30 shadow-md shadow-primary/10"
          : "bg-card border-border/50 hover:border-primary/20 shadow-lg shadow-black/5"
      )}
    >
      <div className="flex gap-5 items-start">
        <div
          className={cn(
            "mt-1 flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300",
            checked
              ? "bg-primary border-primary scale-110 shadow-md shadow-primary/20"
              : "border-muted-foreground/30 group-hover:border-primary/40 group-active:scale-95"
          )}
        >
          <Check
            strokeWidth={3}
            className={cn(
              "w-4 h-4 text-primary-foreground transition-all duration-300",
              checked ? "opacity-100 scale-100" : "opacity-0 scale-50"
            )}
          />
        </div>
        <div className="flex-1">
          <h3
            className={cn(
              "text-xl font-display font-bold transition-colors duration-300",
              checked ? "text-primary/70 line-through decoration-primary/30" : "text-foreground group-hover:text-primary"
            )}
          >
            {title}
          </h3>
          <p
            className={cn(
              "mt-2 text-base leading-relaxed transition-colors duration-300",
              checked ? "text-muted-foreground/70" : "text-muted-foreground"
            )}
          >
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
