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
          content: `You are a learning roadmap generator. When given a skill and the user's experience level, generate a practical, step-by-step learning roadmap with exactly 8-10 tasks tailored to that level. Each task must be actionable and specific to the given level. Return a JSON array of tasks, each with these fields: id (string, e.g. "task-1"), title (short action phrase), description (1-2 sentence explanation of what to do/learn), importance (exactly 30-40 words explaining why this step matters in the learning journey), estimatedHours (a realistic number like 2, 4, 8, 16 — how many hours this step typically takes). Return ONLY valid JSON with no markdown or extra text.`,
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
