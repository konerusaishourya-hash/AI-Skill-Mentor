import { Router, type IRouter } from "express";
import OpenAI from "openai";
import { GenerateRoadmapBody } from "@workspace/api-zod";

const router: IRouter = Router();

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

router.post("/roadmap/generate", async (req, res) => {
  try {
    const body = GenerateRoadmapBody.parse(req.body);
    const { skill } = body;

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [
        {
          role: "system",
          content: `You are a learning roadmap generator. When given a skill, generate a practical, step-by-step learning roadmap with exactly 8-10 tasks. Each task should be actionable and specific. Return a JSON array of tasks, each with fields: id (string, e.g. "task-1"), title (short action phrase), description (1-2 sentence explanation of what to do/learn). Return ONLY valid JSON with no markdown or extra text.`,
        },
        {
          role: "user",
          content: `Generate a learning roadmap for: ${skill}`,
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

    res.json({ skill, tasks });
  } catch (error) {
    console.error("Error generating roadmap:", error);
    res.status(500).json({ error: "Failed to generate roadmap" });
  }
});

export default router;
