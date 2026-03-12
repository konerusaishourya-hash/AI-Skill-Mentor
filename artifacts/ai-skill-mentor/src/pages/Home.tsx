import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Sparkles, Brain, Target } from "lucide-react";

const steps = [
  {
    icon: Brain,
    title: "Tell us what you want to learn",
    description: "Enter any skill — programming, writing, design, a language — and our AI builds a tailored roadmap.",
  },
  {
    icon: Target,
    title: "Work through tasks one at a time",
    description: "Each step is focused and actionable. Complete one task and the next unlocks automatically.",
  },
  {
    icon: CheckCircle2,
    title: "Track your progress",
    description: "See your progress bar grow and completed tasks stack up. Your progress is saved automatically.",
  },
];

export default function Home() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background mesh */}
      <img
        src={`${import.meta.env.BASE_URL}images/hero-glow.png`}
        alt=""
        aria-hidden
        className="fixed top-0 left-0 w-full h-[600px] object-cover opacity-[0.35] mix-blend-multiply pointer-events-none"
      />
      <main className="relative z-10 flex-1 flex flex-col">
        {/* ── Hero ── */}
        <section className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-32 pb-24 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-8">
              <Sparkles className="w-4 h-4" />
              AI-Powered Learning
            </div>

            <h1 className="text-5xl md:text-7xl font-display font-extrabold text-foreground mb-6 leading-[1.1] tracking-tight">
              Master any skill,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent-foreground">
                one step at a time.
              </span>
            </h1>

            <p className="text-xl text-muted-foreground mb-12 max-w-xl mx-auto leading-relaxed">
              Tell us what you want to learn. We'll generate a step-by-step roadmap and guide you through it — one focused task at a time.
            </p>

            <motion.button
              onClick={() => navigate("/learn")}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-3 px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-semibold rounded-2xl shadow-lg shadow-primary/25 transition-colors duration-200"
            >
              Start Learning
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </section>

        {/* ── How it works ── */}
        <section className="px-4 pb-24 max-w-3xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
          >
            <h2 className="text-2xl font-display font-bold text-foreground text-center mb-10">How do I use it?</h2>

            <div className="grid gap-5 sm:grid-cols-3">
              {steps.map(({ icon: Icon, title, description }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 + i * 0.1, duration: 0.4 }}
                  className="relative bg-card border border-border/50 rounded-2xl p-6 shadow-sm"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-display font-bold text-foreground mb-2 text-base">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>

                  {/* Step number */}
                  <span className="absolute top-4 right-5 text-4xl font-extrabold text-muted/30 select-none">
                    {i + 1}
                  </span>
                </motion.div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <button
                onClick={() => navigate("/learn")}
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold text-sm transition-colors"
              >
                Get started now <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
