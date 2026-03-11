import { useState, FormEvent, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, ArrowRight, BookOpen, RotateCcw } from "lucide-react";
import confetti from "canvas-confetti";
import { useGenerateRoadmap, type RoadmapTask } from "@workspace/api-client-react";
import { TaskCard } from "@/components/TaskCard";
import { ProgressBar } from "@/components/ProgressBar";

const STORAGE_KEY = "ai-skill-mentor-state";

interface SavedState {
  skill: string;
  tasks: RoadmapTask[];
  completedIds: string[];
}

function loadSavedState(): SavedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedState;
  } catch {
    return null;
  }
}

function saveState(skill: string, tasks: RoadmapTask[], completedIds: Set<string>) {
  try {
    const state: SavedState = {
      skill,
      tasks,
      completedIds: Array.from(completedIds),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

function clearState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

export default function Home() {
  const saved = loadSavedState();

  const [skillInput, setSkillInput] = useState(saved?.skill ?? "");
  const [currentSkill, setCurrentSkill] = useState(saved?.skill ?? "");
  const [tasks, setTasks] = useState<RoadmapTask[]>(saved?.tasks ?? []);
  const [completedIds, setCompletedIds] = useState<Set<string>>(
    new Set(saved?.completedIds ?? [])
  );

  const { mutate: generateRoadmap, isPending, error } = useGenerateRoadmap({
    mutation: {
      onSuccess: (data) => {
        setTasks(data.tasks);
        setCurrentSkill(data.skill);
        setCompletedIds(new Set());
      },
    },
  });

  // Persist to localStorage whenever state changes
  useEffect(() => {
    if (tasks.length > 0) {
      saveState(currentSkill, tasks, completedIds);
    }
  }, [tasks, currentSkill, completedIds]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!skillInput.trim() || isPending) return;
    generateRoadmap({ data: { skill: skillInput } });
  };

  const toggleTask = (id: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleReset = () => {
    setTasks([]);
    setCurrentSkill("");
    setSkillInput("");
    setCompletedIds(new Set());
    clearState();
  };

  // Trigger confetti when all tasks are completed
  useEffect(() => {
    if (tasks.length > 0 && completedIds.size === tasks.length) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#2563EB", "#60A5FA", "#EFF6FF", "#1D4ED8"],
        disableForReducedMotion: true,
      });
    }
  }, [completedIds.size, tasks.length]);

  const progress = tasks.length > 0 ? (completedIds.size / tasks.length) * 100 : 0;
  const isComplete = tasks.length > 0 && completedIds.size === tasks.length;

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
          {tasks.length === 0 && !isPending ? (
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
            <motion.div
              key="roadmap-state"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full flex flex-col"
            >
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
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

              <div className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 shadow-xl shadow-black/5 mb-8">
                <ProgressBar progress={progress} completed={completedIds.size} total={tasks.length} />

                {isComplete && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 24 }}
                    className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-center font-medium"
                  >
                    🎉 Congratulations! You've completed your roadmap for {currentSkill}.
                  </motion.div>
                )}
              </div>

              <div className="space-y-4">
                {tasks.map((task, index) => (
                  <TaskCard
                    key={task.id}
                    index={index}
                    title={task.title}
                    description={task.description}
                    importance={task.importance}
                    estimatedHours={task.estimatedHours}
                    checked={completedIds.has(task.id)}
                    onToggle={() => toggleTask(task.id)}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
