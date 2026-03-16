import { Router, type IRouter } from "express";
import OpenAI from "openai";
import { GenerateRoadmapBody } from "@workspace/api-zod";

const router: IRouter = Router();

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

const LEVEL_CONTEXT: Record<string, string> = {
  beginner:
    "The user is a complete beginner with no prior experience. Focus on foundational setup, core concepts, and simple first projects. Keep tasks approachable and confidence-building.",
  intermediate:
    "The user already knows the basics and wants to go deeper. Focus on building real small projects, exploring deeper concepts, and applying skills in practical scenarios.",
  advanced:
    "The user is experienced and wants to reach professional mastery. Focus on complex projects, performance optimization, advanced patterns, and production-level challenges.",
};

router.post("/roadmap/generate", async (req, res) => {
  try {
    const body = GenerateRoadmapBody.parse(req.body);
    const { skill, level } = body;
    const levelContext = LEVEL_CONTEXT[level] ?? LEVEL_CONTEXT.beginner;

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [
        {
          role: "system",
          content: `You are a learning roadmap generator. When given a skill and experience level, generate a practical step-by-step learning roadmap. The number of steps must reflect the real complexity of the skill at that level — do NOT always generate the same count:

STEP COUNT GUIDELINES (pick the right count based on actual skill complexity):
- Beginner + simple skill (e.g. installing a tool, basic hobby): 5–7 steps
- Beginner + medium skill (e.g. learning a language, basic programming): 7–10 steps
- Intermediate + medium skill: 8–12 steps
- Intermediate + complex skill (e.g. machine learning, music theory): 10–15 steps
- Advanced + complex skill: 12–20 steps

TIME ESTIMATE GUIDELINES (estimatedHours must match the actual effort for each task, not a fixed number):
- Quick/setup tasks (watching a tutorial, installing tools, reading docs): 0.5–2 hours
- Practice tasks (following along with exercises, small examples): 2–5 hours
- Build tasks (creating a small project, implementing a feature): 5–12 hours
- Large tasks (building a full project, mastering a complex concept): 10–20 hours
Use decimal values like 0.5, 1.5, 3 where appropriate. Never assign 8+ hours to a simple tutorial step.

OUTPUT FORMAT: Return a JSON array of task objects. Each object must have exactly these fields:
- id: string (e.g. "task-1", "task-2", ...)
- title: short action phrase describing what to do
- description: 1–2 sentences explaining what the learner does in this step
- importance: exactly 30–40 words explaining why this step matters in the overall learning journey
- estimatedHours: a number matching the effort guidelines above

Return ONLY valid JSON. No markdown, no code fences, no extra text.`,
        },
        {
          role: "user",
          content: `Generate a ${level} level learning roadmap for: ${skill}\n\nLevel context: ${levelContext}`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content ?? "[]";

    let tasks: Array<{ id: string; title: string; description: string }> = [];
    try {
      tasks = JSON.parse(content);
    } catch {
      tasks = [];
    }

    res.json({ skill, level, tasks });
  } catch (error) {
    console.error("Error generating roadmap:", error);
    res.status(500).json({ error: "Failed to generate roadmap" });
  }
});

export default router;
