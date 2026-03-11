import { useState, FormEvent, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, ArrowRight, BookOpen, RotateCcw, Lock } from "lucide-react";
import confetti from "canvas-confetti";
import { useGenerateRoadmap, type RoadmapTask } from "@workspace/api-client-react";
import { TaskCard } from "@/components/TaskCard";
import { CompletedTaskCard } from "@/components/CompletedTaskCard";
import { ProgressBar } from "@/components/ProgressBar";

// ─── Plan config ────────────────────────────────────────────────────────────
// Change this per user plan. Free = 5, Pro = Infinity (or any number).
type UserPlan = "free" | "pro";
const USER_PLAN: UserPlan = "free";
const MAX_ACTIVE_TASKS: Record<UserPlan, number> = {
  free: 5,
  pro: Infinity,
};
const activeTaskLimit = MAX_ACTIVE_TASKS[USER_PLAN];
// ────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "ai-skill-mentor-v2";

interface MentorState {
  skill: string;
  allTasks: RoadmapTask[];
  activeTaskIds: string[];
  completedTaskIds: string[];
}

function loadState(): MentorState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MentorState;
  } catch {
    return null;
  }
}

function persistState(state: MentorState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

function clearPersistedState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

const EMPTY: MentorState = {
  skill: "",
  allTasks: [],
  activeTaskIds: [],
  completedTaskIds: [],
};

export default function Home() {
  const saved = loadState();

  const [skillInput, setSkillInput] = useState(saved?.skill ?? "");
  const [state, setState] = useState<MentorState>(saved ?? EMPTY);

  const { mutate: generateRoadmap, isPending, error } = useGenerateRoadmap({
    mutation: {
      onSuccess: (data) => {
        const newState: MentorState = {
          skill: data.skill,
          allTasks: data.tasks,
          activeTaskIds: data.tasks.slice(0, activeTaskLimit).map((t) => t.id),
          completedTaskIds: [],
        };
        setState(newState);
        persistState(newState);
      },
    },
  });

  // Persist whenever state changes
  useEffect(() => {
    if (state.allTasks.length > 0) {
      persistState(state);
    }
  }, [state]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!skillInput.trim() || isPending) return;
    generateRoadmap({ data: { skill: skillInput } });
  };

  const completeTask = useCallback((taskId: string) => {
    setState((prev) => {
      const newCompleted = [...prev.completedTaskIds, taskId];
      const newActive = prev.activeTaskIds.filter((id) => id !== taskId);

      // Unlock next queued task if slots are available
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
    setState(EMPTY);
    setSkillInput("");
    clearPersistedState();
  };

  // Confetti when every task is done
  useEffect(() => {
    const { allTasks, completedTaskIds } = state;
    if (allTasks.length > 0 && completedTaskIds.length === allTasks.length) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#2563EB", "#60A5FA", "#EFF6FF", "#1D4ED8"],
        disableForReducedMotion: true,
      });
    }
  }, [state.completedTaskIds.length, state.allTasks.length]);

  // Derived data
  const { skill: currentSkill, allTasks, activeTaskIds, completedTaskIds } = state;
  const activeTasks = allTasks.filter((t) => activeTaskIds.includes(t.id));
  const completedTasks = allTasks.filter((t) => completedTaskIds.includes(t.id));
  const queuedCount = allTasks.length - activeTasks.length - completedTasks.length;
  const progress = allTasks.length > 0 ? (completedTasks.length / allTasks.length) * 100 : 0;
  const isAllComplete = allTasks.length > 0 && completedTasks.length === allTasks.length;
  const hasRoadmap = allTasks.length > 0;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center">
      {/* Decorative Background Mesh */}
      <img
        src={`${import.meta.env.BASE_URL}images/hero-glow.png`}
        alt="Background glow"
        className="absolute top-0 left-0 w-full h-[600px] object-cover opacity-[0.35] mix-blend-multiply pointer-events-none"
      />

      <main className="relative z-10 w-full max-w-3xl mx-auto px-4 py-16 sm:px-6 lg:px-8 sm:py-24 flex flex-col">
        <AnimatePresence mode="wait">
          {!hasRoadmap && !isPending ? (
            /* ── Empty / landing state ── */
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col items-center justify-center pt-16 sm:pt-32 text-center"
            >
              <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-8">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-5xl md:text-6xl font-display font-extrabold text-foreground mb-6 leading-tight">
                Master any skill <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent-foreground">
                  with AI guidance.
                </span>
              </h1>
              <p className="text-xl text-muted-foreground mb-12 max-w-xl">
                Enter what you want to learn, and we'll generate a clear, actionable checklist to get you there.
              </p>

              <form onSubmit={handleSubmit} className="w-full max-w-lg relative group">
                <div className="absolute inset-0 bg-primary/5 blur-xl rounded-full transition-opacity duration-500 opacity-0 group-hover:opacity-100" />
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    placeholder="e.g. React Native, Copywriting, French..."
                    className="w-full pl-6 pr-32 py-5 rounded-2xl bg-card border-2 border-border/50 text-lg shadow-lg shadow-black/5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all duration-300"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!skillInput.trim()}
                    className="absolute right-3 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl flex items-center gap-2 shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95"
                  >
                    Generate <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                {error && (
                  <p className="absolute -bottom-8 left-0 text-destructive text-sm font-medium">
                    Failed to generate roadmap. Please try again.
                  </p>
                )}
              </form>
            </motion.div>
          ) : isPending ? (
            /* ── Loading state ── */
            <motion.div
              key="loading-state"
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
                Analyzing the best learning path for "{skillInput}"
              </p>
            </motion.div>
          ) : (
            /* ── Roadmap state ── */
            <motion.div
              key="roadmap-state"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full flex flex-col"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-sm font-semibold mb-4">
                    <Sparkles className="w-4 h-4" />
                    AI Generated
                  </div>
                  <h1 className="text-4xl md:text-5xl font-display font-extrabold text-foreground">
                    {currentSkill}
                  </h1>
                </div>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Start Over
                </button>
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
                    🎉 Congratulations! You've completed your full roadmap for {currentSkill}.
                  </motion.div>
                )}
              </div>

              {/* ── Active tasks ── */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-display font-bold text-foreground">
                    Active Tasks
                  </h2>
                  <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    {activeTasks.length} / {activeTaskLimit === Infinity ? "∞" : activeTaskLimit} slots used
                  </span>
                </div>

                <div className="space-y-4">
                  {activeTasks.map((task, index) => (
                    <TaskCard
                      key={task.id}
                      index={index}
                      title={task.title}
                      description={task.description}
                      importance={task.importance}
                      estimatedHours={task.estimatedHours}
                      checked={false}
                      onToggle={() => completeTask(task.id)}
                    />
                  ))}
                </div>

                {/* Queued tasks hint */}
                {queuedCount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 flex items-center gap-3 px-5 py-3.5 rounded-xl border border-dashed border-border/60 bg-muted/40 text-muted-foreground"
                  >
                    <Lock className="w-4 h-4 flex-shrink-0" />
                    <p className="text-sm">
                      <span className="font-semibold text-foreground">{queuedCount} more {queuedCount === 1 ? "task" : "tasks"}</span> will unlock as you complete active ones.
                    </p>
                  </motion.div>
                )}

                {/* Slot full nudge (when no queued tasks remain but slots full) */}
                {activeTasks.length >= activeTaskLimit && queuedCount === 0 && !isAllComplete && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 px-5 py-3.5 rounded-xl border border-dashed border-amber-300 bg-amber-50 text-amber-700 text-sm text-center"
                  >
                    Complete a task above to continue making progress.
                  </motion.div>
                )}
              </div>

              {/* ── Completed tasks ── */}
              {completedTasks.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
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
