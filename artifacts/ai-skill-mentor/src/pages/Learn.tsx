import { useState, FormEvent, useEffect, useCallback, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Loader2, ArrowRight, BookOpen,
  RotateCcw, LayoutGrid, Lock, CheckCircle2,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useGenerateRoadmap } from "@workspace/api-client-react";
import { TaskCard } from "@/components/TaskCard";
import { CompletedTaskCard } from "@/components/CompletedTaskCard";
import { ProgressBar } from "@/components/ProgressBar";
import {
  loadSkillById, saveSkill, makeSkillId,
  LEVEL_LABELS, LEVEL_COLORS,
  type SkillEntry, type SkillLevel,
} from "@/lib/skillStorage";
import { cn } from "@/lib/utils";

type UserPlan = "free" | "pro";
const USER_PLAN: UserPlan = "free";
const MAX_ACTIVE_TASKS: Record<UserPlan, number> = { free: 1, pro: Infinity };
const activeTaskLimit = MAX_ACTIVE_TASKS[USER_PLAN];

const LEVELS: SkillLevel[] = ["beginner", "intermediate", "advanced"];

const LOADING_MESSAGES = [
  "Analyzing the best learning path…",
  "Tailoring tasks to your level…",
  "Structuring your roadmap…",
  "Adding time estimates…",
  "Almost ready!",
];

const SKILL_EXAMPLES = [
  "React Native",
  "Copywriting",
  "French",
  "Machine Learning",
  "Guitar",
  "UI Design",
  "Photography",
  "Python",
];

export default function Learn() {
  const params = useParams<{ id?: string }>();
  const [, navigate] = useLocation();

  const [skillInput, setSkillInput] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<SkillLevel>("beginner");
  const [entry, setEntry] = useState<SkillEntry | null>(null);

  // Cycling placeholder
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [inputFocused, setInputFocused] = useState(false);
  useEffect(() => {
    if (inputFocused) return;
    const t = setInterval(() => setPlaceholderIdx((i) => (i + 1) % SKILL_EXAMPLES.length), 2200);
    return () => clearInterval(t);
  }, [inputFocused]);

  // Cycling loading message
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  // Toast
  const [toast, setToast] = useState<{ msg: string; id: number } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, id: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  };

  useEffect(() => {
    if (params.id) {
      const loaded = loadSkillById(params.id);
      if (loaded) setEntry(loaded);
    } else {
      setEntry(null);
    }
  }, [params.id]);

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

  // Cycle loading messages while pending
  useEffect(() => {
    if (!isPending) { setLoadingMsgIdx(0); return; }
    const t = setInterval(() => setLoadingMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length), 1800);
    return () => clearInterval(t);
  }, [isPending]);

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
      const toUnlock = queued.slice(0, activeTaskLimit - newActive.length).map((t) => t.id);
      return { ...prev, activeTaskIds: [...newActive, ...toUnlock], completedTaskIds: newCompleted };
    });
    showToast("Step complete! Next task unlocked 🎯");
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
      confetti({ particleCount: 180, spread: 90, origin: { y: 0.6 }, colors: ["#2563EB", "#60A5FA", "#EFF6FF", "#1D4ED8"], disableForReducedMotion: true });
    }
  }, [entry?.completedTaskIds.length, entry?.allTasks.length]);

  const allTasks = entry?.allTasks ?? [];
  const activeTasks = allTasks.filter((t) => entry?.activeTaskIds.includes(t.id));
  const completedTasks = allTasks.filter((t) => entry?.completedTaskIds.includes(t.id));
  const queuedCount = allTasks.length - activeTasks.length - completedTasks.length;
  const nextQueuedTask = allTasks.find(
    (t) => !entry?.activeTaskIds.includes(t.id) && !entry?.completedTaskIds.includes(t.id)
  ) ?? null;
  const progress = allTasks.length > 0 ? (completedTasks.length / allTasks.length) * 100 : 0;
  const isAllComplete = allTasks.length > 0 && completedTasks.length === allTasks.length;
  const currentTask = activeTasks[0] ?? null;
  const currentStepNumber = completedTasks.length + 1;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center">
      <img
        src={`${import.meta.env.BASE_URL}images/hero-glow.png`}
        alt="" aria-hidden
        className="absolute top-0 left-0 w-full h-[600px] object-cover opacity-[0.35] mix-blend-multiply pointer-events-none"
      />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 bg-foreground text-background rounded-2xl shadow-2xl font-semibold text-sm whitespace-nowrap"
          >
            <CheckCircle2 className="w-4.5 h-4.5 text-green-400 flex-shrink-0" />
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 w-full max-w-3xl mx-auto px-4 pt-28 pb-20 sm:px-6 lg:px-8 flex flex-col">
        <AnimatePresence mode="wait">

          {/* ── Generation form ── */}
          {!entry && !isPending && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="flex flex-col items-center justify-center pt-8 sm:pt-16"
            >
              <motion.div
                animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
                transition={{ duration: 1.2, delay: 0.5 }}
                className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-6"
              >
                <BookOpen className="w-8 h-8 text-primary" />
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-display font-extrabold text-foreground mb-3 leading-tight text-center">
                What do you want to learn?
              </h1>
              <p className="text-lg text-muted-foreground mb-10 max-w-md text-center">
                Enter a skill and your experience level — we'll build a tailored AI roadmap.
              </p>

              <form onSubmit={handleSubmit} className="w-full max-w-lg flex flex-col gap-5">
                {/* Skill input */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-primary/5 blur-2xl rounded-full transition-opacity duration-500 opacity-0 group-hover:opacity-100" />
                  <AnimatePresence mode="wait">
                    <motion.input
                      key={placeholderIdx}
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onFocus={() => setInputFocused(true)}
                      onBlur={() => setInputFocused(false)}
                      placeholder={`e.g. ${SKILL_EXAMPLES[placeholderIdx]}…`}
                      className="relative w-full px-6 py-5 rounded-2xl bg-card border-2 border-border/50 text-lg shadow-lg shadow-black/5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-4 focus:ring-primary/10 transition-all duration-300"
                      autoFocus
                    />
                  </AnimatePresence>
                </div>

                {/* Level selector */}
                <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
                  <p className="text-sm font-semibold text-foreground mb-3">Your current level</p>
                  <div className="grid grid-cols-3 gap-2">
                    {LEVELS.map((level) => (
                      <motion.button
                        key={level}
                        type="button"
                        onClick={() => setSelectedLevel(level)}
                        whileTap={{ scale: 0.95 }}
                        className={cn(
                          "px-3 py-3.5 rounded-xl border-2 text-sm font-semibold transition-all duration-200 flex flex-col items-center gap-1.5",
                          selectedLevel === level
                            ? "border-primary bg-primary/5 text-primary shadow-sm"
                            : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground hover:bg-muted/30"
                        )}
                      >
                        <span className="text-xl">
                          {level === "beginner" ? "🌱" : level === "intermediate" ? "⚡" : "🔥"}
                        </span>
                        <span>{LEVEL_LABELS[level]}</span>
                        {selectedLevel === level && (
                          <motion.div
                            layoutId="level-indicator"
                            className="w-1 h-1 rounded-full bg-primary"
                          />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={!skillInput.trim()}
                  whileHover={{ scale: skillInput.trim() ? 1.01 : 1 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Generate Roadmap <ArrowRight className="w-5 h-5" />
                </motion.button>

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
              <div className="relative mb-8">
                <div className="absolute inset-0 rounded-full blur-2xl bg-primary/30 animate-pulse" />
                <div className="w-24 h-24 bg-card rounded-3xl shadow-2xl shadow-primary/10 border border-primary/20 flex items-center justify-center relative z-10">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-3">
                Building your roadmap…
              </h2>
              <AnimatePresence mode="wait">
                <motion.p
                  key={loadingMsgIdx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="text-muted-foreground text-base"
                >
                  {LOADING_MESSAGES[loadingMsgIdx]}
                </motion.p>
              </AnimatePresence>

              {/* Dot indicators */}
              <div className="flex gap-1.5 mt-6">
                {LOADING_MESSAGES.map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: i === loadingMsgIdx ? 1 : 0.6, opacity: i === loadingMsgIdx ? 1 : 0.3 }}
                    transition={{ duration: 0.2 }}
                    className="w-2 h-2 rounded-full bg-primary"
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Roadmap view ── */}
          {entry && !isPending && (
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
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent text-accent-foreground text-sm font-semibold">
                      <Sparkles className="w-3.5 h-3.5" />
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
                <div className="flex gap-2 self-start flex-shrink-0">
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

              {/* Progress */}
              <div className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 shadow-xl shadow-black/5 mb-8">
                <ProgressBar progress={progress} completed={completedTasks.length} total={allTasks.length} />
                {isAllComplete && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 24 }}
                    className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-center font-medium"
                  >
                    🎉 Congratulations! You've completed your full {entry.level} roadmap for <strong>{entry.skill}</strong>.
                  </motion.div>
                )}
              </div>

              {/* Current Task */}
              {currentTask && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-display font-bold text-foreground">Current Task</h2>
                    {queuedCount > 0 && (
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                        {queuedCount} more step{queuedCount !== 1 ? "s" : ""} ahead
                      </span>
                    )}
                  </div>

                  <AnimatePresence mode="wait">
                    <TaskCard
                      key={currentTask.id}
                      index={0}
                      title={currentTask.title}
                      description={currentTask.description}
                      importance={currentTask.importance}
                      estimatedHours={currentTask.estimatedHours}
                      checked={false}
                      onToggle={() => completeTask(currentTask.id)}
                      stepNumber={currentStepNumber}
                      totalSteps={allTasks.length}
                    />
                  </AnimatePresence>

                  {/* Up next preview */}
                  {nextQueuedTask && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="relative mt-3 rounded-2xl border-2 border-dashed border-border/40 bg-muted/20 px-5 py-4 overflow-hidden"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/25 flex items-center justify-center flex-shrink-0">
                          <Lock className="w-3.5 h-3.5 text-muted-foreground/50" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
                            Up next — Step {currentStepNumber + 1}
                          </p>
                          <p className="text-sm font-semibold text-foreground/50 truncate">
                            {nextQueuedTask.title}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Completed Tasks */}
              {completedTasks.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-lg font-display font-bold text-foreground">Completed Tasks</h2>
                    <motion.span
                      key={completedTasks.length}
                      initial={{ scale: 1.4 }}
                      animate={{ scale: 1 }}
                      className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold"
                    >
                      {completedTasks.length}
                    </motion.span>
                  </div>
                  <div className="space-y-2">
                    {completedTasks.map((task, index) => (
                      <CompletedTaskCard
                        key={task.id}
                        title={task.title}
                        index={index}
                        stepNumber={index + 1}
                      />
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
