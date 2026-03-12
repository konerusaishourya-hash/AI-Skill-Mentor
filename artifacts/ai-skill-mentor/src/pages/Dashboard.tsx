import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { PlusCircle, BookOpen, Trash2, ChevronRight, LayoutGrid } from "lucide-react";
import {
  loadAllSkills, deleteSkill, getProgress,
  LEVEL_LABELS, LEVEL_COLORS, type SkillEntry,
} from "@/lib/skillStorage";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [skills, setSkills] = useState<Record<string, SkillEntry>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setSkills(loadAllSkills());
  }, []);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);
    setTimeout(() => {
      deleteSkill(id);
      setSkills(loadAllSkills());
      setDeletingId(null);
    }, 280);
  };

  const skillList = Object.values(skills).sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <img
        src={`${import.meta.env.BASE_URL}images/hero-glow.png`}
        alt="" aria-hidden
        className="fixed top-0 left-0 w-full h-[400px] object-cover opacity-[0.25] dark:opacity-[0.07] mix-blend-multiply dark:mix-blend-overlay pointer-events-none"
      />

      <main className="relative z-10 w-full max-w-4xl mx-auto px-4 pt-28 pb-20 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-3">
              <LayoutGrid className="w-4 h-4" />
              My Skills
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-extrabold text-foreground">
              Your Learning Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Track and continue your active learning roadmaps.
            </p>
          </div>
          <motion.button
            onClick={() => navigate("/learn")}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            className="inline-flex items-center gap-2 px-5 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-md shadow-primary/20 transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            New Skill
          </motion.button>
        </div>

        {/* Empty state */}
        <AnimatePresence>
          {skillList.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
                className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6"
              >
                <BookOpen className="w-8 h-8 text-primary" />
              </motion.div>
              <h2 className="text-xl font-display font-bold text-foreground mb-2">No skills yet</h2>
              <p className="text-muted-foreground mb-8 max-w-xs">
                Generate your first AI-powered learning roadmap to get started.
              </p>
              <motion.button
                onClick={() => navigate("/learn")}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-colors shadow-md shadow-primary/20"
              >
                <PlusCircle className="w-4 h-4" />
                Start Learning
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skill grid */}
        {skillList.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {skillList.map((entry, i) => {
              const progress = getProgress(entry);
              const isComplete = progress === 100;
              const isDeleting = deletingId === entry.id;

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{
                    opacity: isDeleting ? 0 : 1,
                    y: 0,
                    scale: isDeleting ? 0.93 : 1,
                  }}
                  transition={{ delay: i * 0.05, duration: isDeleting ? 0.25 : 0.35 }}
                  whileHover={{ y: -4, boxShadow: "0 12px 32px -8px rgba(0,0,0,0.12)" }}
                  onClick={() => navigate(`/learn/${entry.id}`)}
                  className="group relative bg-card border border-border/60 rounded-2xl p-5 shadow-sm hover:border-primary/30 transition-colors cursor-pointer"
                >
                  {/* Delete */}
                  <button
                    onClick={(e) => handleDelete(e, entry.id)}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all duration-150 z-10"
                    title="Remove skill"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Level badge */}
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold mb-3 ${LEVEL_COLORS[entry.level]}`}>
                    {LEVEL_LABELS[entry.level]}
                  </span>

                  {/* Skill name */}
                  <h3 className="font-display font-bold text-foreground text-lg leading-snug mb-4 pr-6">
                    {entry.skill}
                  </h3>

                  {/* Progress bar — animates on card hover */}
                  <div className="mb-2.5">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${isComplete ? "bg-green-500" : "bg-primary"}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ type: "spring", stiffness: 60, damping: 14, delay: i * 0.05 + 0.1 }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {entry.completedTaskIds.length} / {entry.allTasks.length} steps
                      {isComplete && (
                        <span className="ml-1.5 text-green-600 font-semibold">✓ Complete</span>
                      )}
                    </span>
                    <span className={`text-xs font-bold ${isComplete ? "text-green-600" : "text-primary"}`}>
                      {progress}%
                    </span>
                  </div>

                  {/* Arrow */}
                  <motion.div
                    initial={{ opacity: 0, x: -4 }}
                    whileHover={{ opacity: 1, x: 0 }}
                    className="absolute bottom-5 right-4"
                  >
                    <ChevronRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
