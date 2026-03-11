import { useState, FormEvent, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, ArrowRight, BookOpen, RotateCcw } from "lucide-react";
import confetti from "canvas-confetti";
import { useGenerateRoadmap, type RoadmapTask } from "@workspace/api-client-react";
import { TaskCard } from "@/components/TaskCard";
import { CompletedTaskCard } from "@/components/CompletedTaskCard";
import { ProgressBar } from "@/components/ProgressBar";

// ─── Plan config ─────────────────────────────────────────────────────────────
// Increase maxActiveTasks for subscribed users in the future.
type UserPlan = "free" | "pro";
const USER_PLAN: UserPlan = "free";
const MAX_ACTIVE_TASKS: Record<UserPlan, number> = {
  free: 1,   // Free users see one task at a time
  pro: Infinity,
};
const activeTaskLimit = MAX_ACTIVE_TASKS[USER_PLAN];
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "ai-skill-mentor-v3";

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

function persistState(s: MentorState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch { /* ignore */ }
}

function clearPersistedState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
}

const EMPTY: MentorState = {
  skill: "",
  allTasks: [],
  activeTaskIds: [],
  completedTaskIds: [],
};

export default function Learn() {
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

  useEffect(() => {
    if (state.allTasks.length > 0) persistState(state);
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

  const { skill: currentSkill, allTasks, activeTaskIds, completedTaskIds } = state;
  const activeTasks = allTasks.filter((t) => activeTaskIds.includes(t.id));
  const completedTasks = allTasks.filter((t) => completedTaskIds.includes(t.id));
  const queuedCount = allTasks.length - activeTasks.length - completedTasks.length;
  const progress = allTasks.length > 0 ? (completedTasks.length / allTasks.length) * 100 : 0;
  const isAllComplete = allTasks.length > 0 && completedTasks.length === allTasks.length;
  const currentTask = activeTasks[0] ?? null;

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

          {/* ── Empty state: generate form ── */}
          {allTasks.length === 0 && !isPending && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="flex flex-col items-center justify-center pt-12 sm:pt-20 text-center"
            >
              <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-8">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-display font-extrabold text-foreground mb-4 leading-tight">
                What do you want to learn?
              </h1>
              <p className="text-lg text-muted-foreground mb-10 max-w-md">
                Enter a skill and we'll build a step-by-step AI roadmap just for you.
              </p>

              <form onSubmit={handleSubmit} className="w-full max-w-lg relative group">
                <div className="absolute inset-0 bg-primary/5 blur-xl rounded-full transition-opacity duration-500 opacity-0 group-hover:opacity-100" />
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    placeholder="e.g. React Native, Copywriting, French..."
                    className="w-full pl-6 pr-36 py-5 rounded-2xl bg-card border-2 border-border/50 text-lg shadow-lg shadow-black/5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all duration-300"
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
          )}

          {/* ── Loading state ── */}
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
                Building the best path for "{skillInput}"
              </p>
            </motion.div>
          )}

          {/* ── Roadmap state ── */}
          {allTasks.length > 0 && !isPending && (
            <motion.div
              key="roadmap"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full flex flex-col"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-sm font-semibold mb-3">
                    <Sparkles className="w-4 h-4" />
                    AI Generated
                  </div>
                  <h1 className="text-3xl md:text-4xl font-display font-extrabold text-foreground">
                    {currentSkill}
                  </h1>
                </div>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors self-start sm:self-auto"
                >
                  <RotateCcw className="w-4 h-4" />
                  Start Over
                </button>
              </div>

              {/* Progress */}
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

              {/* ── Current Task ── */}
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

              {/* ── Completed Tasks ── */}
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
