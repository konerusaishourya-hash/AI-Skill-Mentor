import type { RoadmapTask } from "@workspace/api-client-react";

export type SkillLevel = "beginner" | "intermediate" | "advanced";

export interface SkillEntry {
  id: string;
  skill: string;
  level: SkillLevel;
  allTasks: RoadmapTask[];
  activeTaskIds: string[];
  completedTaskIds: string[];
  createdAt: number;
  updatedAt: number;
}

const SKILLS_KEY = "asm-skills-v1";

export function loadAllSkills(): Record<string, SkillEntry> {
  try {
    const raw = localStorage.getItem(SKILLS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, SkillEntry>;
  } catch {
    return {};
  }
}

export function saveSkill(entry: SkillEntry): void {
  const all = loadAllSkills();
  all[entry.id] = { ...entry, updatedAt: Date.now() };
  try {
    localStorage.setItem(SKILLS_KEY, JSON.stringify(all));
  } catch { /* ignore */ }
}

export function deleteSkill(id: string): void {
  const all = loadAllSkills();
  delete all[id];
  try {
    localStorage.setItem(SKILLS_KEY, JSON.stringify(all));
  } catch { /* ignore */ }
}

export function loadSkillById(id: string): SkillEntry | null {
  const all = loadAllSkills();
  return all[id] ?? null;
}

export function makeSkillId(skill: string, level: SkillLevel): string {
  const slug = skill.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  return `${slug}-${level}-${Date.now()}`;
}

export function getProgress(entry: SkillEntry): number {
  if (entry.allTasks.length === 0) return 0;
  return Math.round((entry.completedTaskIds.length / entry.allTasks.length) * 100);
}

export const LEVEL_LABELS: Record<SkillLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const LEVEL_COLORS: Record<SkillLevel, string> = {
  beginner: "bg-emerald-100 text-emerald-700",
  intermediate: "bg-amber-100 text-amber-700",
  advanced: "bg-rose-100 text-rose-700",
};
