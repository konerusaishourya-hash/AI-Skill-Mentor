import { useState, FormEvent, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, ArrowRight, BookOpen, RotateCcw, LayoutGrid } from "lucide-react";
import confetti from "canvas-confetti";
import { useGenerateRoadmap } from "@workspace/api-client-react";
import { TaskCard } from "@/components/TaskCard";
import { CompletedTaskCard } from "@/components/CompletedTaskCard";
import { ProgressBar } from "@/components/ProgressBar";
import {
  loadSkillById,
  saveSkill,
  makeSkillId,
  LEVEL_LABELS,
  LEVEL_COLORS,
  type SkillEntry,
  type SkillLevel,
} from "@/lib/skillStorage";
import { cn } from "@/lib/utils";

// ─── Plan config ─────────────────────────────────────────────────────────────
type UserPlan = "free" | "pro";
const USER_PLAN: UserPlan = "free";
const MAX_ACTIVE_TASKS: Record<UserPlan, number> = {
  free: 1,
  pro: Infinity,
};
const activeTaskLimit = MAX_ACTIVE_TASKS[USER_PLAN];
// ─────────────────────────────────────────────────────────────────────────────

const LEVELS: SkillLevel[] = ["beginner", "intermediate", "advanced"];

export default function Learn() {
  const params = useParams<{ id?: string }>();
  const [, navigate] = useLocation();

  const [skillInput, setSkillInput] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<SkillLevel>("beginner");
  const [entry, setEntry] = useState<SkillEntry | null>(null);

  // Load skill from URL param on mount / param change
  useEffect(() => {
    if (params.id) {
      const loaded = loadSkillById(params.id);
      if (loaded) {
        setEntry(loaded);
      }
    } else {
      setEntry(null);
    }
  }, [params.id]);

  // Persist entry whenever it changes
  useEffect(() => {
    if (entry) saveSkill(entry);
  }, [entry]);

  const { mutate: generateRoadmap, isPending, error } = useGenerateRoadmap({
    mutation: {
      onSuccess: (data) => {
        const newId = makeSkillId(data.skill, (data.level as SkillLevel) ?? selectedLevel);
        const newEntry: SkillEntry = {
          id: newId,
          skill: data.skill,
          level: (data.level as SkillLevel) ?? selectedLevel,
          allTasks: data.tasks,
          activeTaskIds: data.tasks.slice(0, activeTaskLimit).map((t) => t.id),
          completedTaskIds: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        saveSkill(newEntry);
        setEntry(newEntry);
        navigate(`/learn/${newId}`, { replace: true });
      },
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!skillInput.trim() || isPending) return;
    generateRoadmap({ data: { skill: skillInput, level: selectedLevel } });
  };

  const completeTask = useCallback((taskId: string) => {
    setEntry((prev) => {
      if (!prev) return prev;
      const newCompleted = [...prev.completedTaskIds, taskId];
      const newActive = prev.activeTaskIds.filter((id) => id !== taskId);
      const usedIds = new Set([...newActive, ...newCompleted]);
      const queued = prev.allTasks.filter((t) => !usedIds.has(t.id));
      const slotsAvailable = activeTaskLimit - newActive.length;
      const toUnlock = queued.slice(0, slotsAvailable).map((t) => t.id);
      return {
        ...prev,
        activeTaskIds: [...newActive, ...toUnlock],
        completedTaskIds: newCompleted,
      };
    });
  }, []);

  const handleReset = () => {
    setEntry(null);
    setSkillInput("");
    navigate("/learn", { replace: true });
  };

  // Confetti on full completion
  useEffect(() => {
    if (!entry) return;
    if (entry.allTasks.length > 0 && entry.completedTaskIds.length === entry.allTasks.length) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#2563EB", "#60A5FA", "#EFF6FF", "#1D4ED8"],
        disableForReducedMotion: true,
      });
    }
  }, [entry?.completedTaskIds.length, entry?.allTasks.length]);

  // Derived state
  const allTasks = entry?.allTasks ?? [];
  const activeTasks = allTasks.filter((t) => entry?.activeTaskIds.includes(t.id));
  const completedTasks = allTasks.filter((t) => entry?.completedTaskIds.includes(t.id));
  const queuedCount = allTasks.length - activeTasks.length - completedTasks.length;
  const progress = allTasks.length > 0 ? (completedTasks.length / allTasks.length) * 100 : 0;
  const isAllComplete = allTasks.length > 0 && completedTasks.length === allTasks.length;
  const currentTask = activeTasks[0] ?? null;
  const hasRoadmap = allTasks.length > 0;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center">
      <img
        src={`${import.meta.env.BASE_URL}images/hero-glow.png`}
        alt=""
        aria-hidden
        className="absolute top-0 left-0 w-full h-[600px] object-cover opacity-[0.35] mix-blend-multiply pointer-events-none"
      />

      <main className="relative z-10 w-full max-w-3xl mx-auto px-4 pt-28 pb-20 sm:px-6 lg:px-8 flex flex-col">
        <AnimatePresence mode="wait">

          {/* ── Generation form ── */}
          {!hasRoadmap && !isPending && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="flex flex-col items-center justify-center pt-8 sm:pt-16"
            >
              <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-6">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-display font-extrabold text-foreground mb-3 leading-tight text-center">
                What do you want to learn?
              </h1>
              <p className="text-lg text-muted-foreground mb-10 max-w-md text-center">
                Enter a skill and your experience level, and we'll build a tailored AI roadmap.
              </p>

              <form onSubmit={handleSubmit} className="w-full max-w-lg flex flex-col gap-5">
                {/* Skill input */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-primary/5 blur-xl rounded-full transition-opacity duration-500 opacity-0 group-hover:opacity-100" />
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    placeholder="e.g. React Native, Copywriting, French..."
                    className="relative w-full px-6 py-5 rounded-2xl bg-card border-2 border-border/50 text-lg shadow-lg shadow-black/5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all duration-300"
                    autoFocus
                  />
                </div>

                {/* Level selector */}
                <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
                  <p className="text-sm font-semibold text-foreground mb-3">Your current level</p>
                  <div className="grid grid-cols-3 gap-2">
                    {LEVELS.map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setSelectedLevel(level)}
                        className={cn(
                          "px-3 py-3 rounded-xl border-2 text-sm font-semibold transition-all duration-200 flex flex-col items-center gap-1",
                          selectedLevel === level
                            ? "border-primary bg-primary/5 text-primary shadow-sm"
                            : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                        )}
                      >
                        <span className="text-base">
                          {level === "beginner" ? "🌱" : level === "intermediate" ? "⚡" : "🔥"}
                        </span>
                        {LEVEL_LABELS[level]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!skillInput.trim()}
                  className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]"
                >
                  Generate Roadmap <ArrowRight className="w-5 h-5" />
                </button>

                {error && (
                  <p className="text-destructive text-sm font-medium text-center">
                    Failed to generate roadmap. Please try again.
                  </p>
                )}
              </form>
            </motion.div>
          )}

          {/* ── Loading ── */}
          {isPending && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex flex-col items-center justify-center pt-32 text-center"
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-xl bg-primary/20 animate-pulse" />
                <div className="w-20 h-20 bg-card rounded-2xl shadow-xl shadow-primary/10 border border-primary/20 flex items-center justify-center relative z-10">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              </div>
              <h2 className="mt-8 text-2xl font-display font-bold text-foreground">
                Crafting your roadmap...
              </h2>
              <p className="mt-2 text-muted-foreground">
                Building the best {selectedLevel} path for "{skillInput}"
              </p>
            </motion.div>
          )}

          {/* ── Roadmap view ── */}
          {hasRoadmap && !isPending && entry && (
            <motion.div
              key="roadmap"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full flex flex-col"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-sm font-semibold">
                      <Sparkles className="w-4 h-4" />
                      AI Generated
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${LEVEL_COLORS[entry.level]}`}>
                      {LEVEL_LABELS[entry.level]}
                    </span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-display font-extrabold text-foreground">
                    {entry.skill}
                  </h1>
                </div>
                <div className="flex gap-2 self-start">
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                  >
                    <LayoutGrid className="w-4 h-4" />
                    Dashboard
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    New Skill
                  </button>
                </div>
              </div>

              {/* Progress card */}
              <div className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 shadow-xl shadow-black/5 mb-8">
                <ProgressBar
                  progress={progress}
                  completed={completedTasks.length}
                  total={allTasks.length}
                />
                {isAllComplete && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 24 }}
                    className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-center font-medium"
                  >
                    🎉 Congratulations! You've completed your full {entry.level} roadmap for {entry.skill}.
                  </motion.div>
                )}
              </div>

              {/* Current Task */}
              {currentTask && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-display font-bold text-foreground">
                      Current Task
                    </h2>
                    {queuedCount > 0 && (
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                        {queuedCount} more step{queuedCount !== 1 ? "s" : ""} ahead
                      </span>
                    )}
                  </div>

                  <TaskCard
                    key={currentTask.id}
                    index={0}
                    title={currentTask.title}
                    description={currentTask.description}
                    importance={currentTask.importance}
                    estimatedHours={currentTask.estimatedHours}
                    checked={false}
                    onToggle={() => completeTask(currentTask.id)}
                  />

                  {queuedCount > 0 && (
                    <p className="mt-3 text-sm text-muted-foreground text-center">
                      Complete this task to unlock the next step.
                    </p>
                  )}
                </div>
              )}

              {/* Completed Tasks */}
              {completedTasks.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-lg font-display font-bold text-foreground">
                      Completed Tasks
                    </h2>
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                      {completedTasks.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {completedTasks.map((task, index) => (
                      <CompletedTaskCard key={task.id} title={task.title} index={index} />
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
