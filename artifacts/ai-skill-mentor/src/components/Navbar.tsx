import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { BookOpen, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/ThemeContext";

export function Navbar() {
  const [location] = useLocation();
  const { theme, toggle } = useTheme();

  const links = [
    { label: "Home", href: "/" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Learn", href: "/learn" },
  ];

  const isLearnActive = location === "/learn" || location.startsWith("/learn/");

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 text-foreground hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-primary" />
          </div>
          <span className="font-display font-bold text-base tracking-tight">AI Skill Mentor</span>
        </Link>

        {/* Nav links + dark mode toggle */}
        <div className="flex items-center gap-1">
          <nav className="flex items-center gap-1">
            {links.map(({ label, href }) => {
              const isActive = href === "/learn" ? isLearnActive : location === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Divider */}
          <div className="w-px h-5 bg-border/60 mx-1.5" />

          {/* Theme toggle */}
          <motion.button
            onClick={toggle}
            whileTap={{ scale: 0.88 }}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-200"
            aria-label="Toggle dark mode"
          >
            <AnimatedIcon isDark={theme === "dark"} />
          </motion.button>
        </div>
      </div>
    </header>
  );
}

function AnimatedIcon({ isDark }: { isDark: boolean }) {
  return (
    <motion.div
      key={isDark ? "moon" : "sun"}
      initial={{ rotate: -30, opacity: 0, scale: 0.7 }}
      animate={{ rotate: 0, opacity: 1, scale: 1 }}
      exit={{ rotate: 30, opacity: 0, scale: 0.7 }}
      transition={{ duration: 0.2 }}
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </motion.div>
  );
}
