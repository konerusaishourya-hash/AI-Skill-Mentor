import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Python Programming",
  "JavaScript",
  "Web Development",
  "Mobile App Development",
  "Machine Learning",
  "Data Science",
  "UI / UX Design",
  "Graphic Design",
  "Video Editing",
  "Animation",
  "3D Modeling",
  "Photography",
  "Drawing & Illustration",
  "Public Speaking",
  "Copywriting",
  "Digital Marketing",
  "Guitar",
  "Piano",
  "Chess",
  "French",
  "Spanish",
  "Fitness Training",
  "Cooking",
  "React",
  "TypeScript",
];

const CYCLING_EXAMPLES = [
  "React Native", "Copywriting", "French", "Machine Learning",
  "Guitar", "UI Design", "Photography", "Python",
];

interface SkillAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
}

export function SkillAutocomplete({ value, onChange, autoFocus }: SkillAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cycle placeholder when not focused and empty
  useEffect(() => {
    if (focused || value) return;
    const t = setInterval(
      () => setPlaceholderIdx((i) => (i + 1) % CYCLING_EXAMPLES.length),
      2200
    );
    return () => clearInterval(t);
  }, [focused, value]);

  // Filter suggestions: if typing → filter; if focused & empty → show top picks
  const filtered = value.trim()
    ? SUGGESTIONS.filter((s) =>
        s.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 7)
    : SUGGESTIONS.slice(0, 6);

  const showDropdown = open && filtered.length > 0;

  const select = (s: string) => {
    onChange(s);
    setOpen(false);
    setHighlighted(-1);
    inputRef.current?.blur();
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && highlighted >= 0) {
      e.preventDefault();
      select(filtered[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setHighlighted(-1);
    }
  };

  // Highlight match in suggestion text
  const highlight = (text: string, query: string) => {
    if (!query.trim()) return <span>{text}</span>;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return <span>{text}</span>;
    return (
      <>
        {text.slice(0, idx)}
        <span className="font-bold text-primary">{text.slice(idx, idx + query.length)}</span>
        {text.slice(idx + query.length)}
      </>
    );
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHighlighted(-1);
        }}
        onFocus={() => {
          setFocused(true);
          setOpen(true);
        }}
        onBlur={() => setFocused(false)}
        onKeyDown={handleKeyDown}
        placeholder={`e.g. ${CYCLING_EXAMPLES[placeholderIdx]}…`}
        autoFocus={autoFocus}
        className="w-full px-6 py-5 rounded-2xl bg-card border-2 border-border/50 text-lg shadow-lg shadow-black/5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-4 focus:ring-primary/10 transition-all duration-300"
      />

      <AnimatePresence>
        {showDropdown && (
          <motion.ul
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border/60 rounded-2xl shadow-2xl shadow-black/15 overflow-hidden z-50 py-1.5"
          >
            {!value.trim() && (
              <li className="px-4 pb-1 pt-0.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Popular skills
                </span>
              </li>
            )}
            {filtered.map((s, i) => (
              <li
                key={s}
                onMouseDown={(e) => { e.preventDefault(); select(s); }}
                onMouseEnter={() => setHighlighted(i)}
                className={cn(
                  "px-4 py-2.5 text-sm cursor-pointer transition-colors duration-100 rounded-lg mx-1.5",
                  i === highlighted
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-foreground hover:bg-muted"
                )}
              >
                {highlight(s, value)}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
