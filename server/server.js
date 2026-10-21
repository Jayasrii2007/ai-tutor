import "dotenv/config";
import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

const MODELS = ["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-2.5-flash"];

const app = express();
app.use(cors());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function askAI(prompt) {
  let lastError;
  for (const model of MODELS) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });
        return response.text;
      } catch (err) {
        lastError = err;
        console.log(model + " try " + attempt + " failed: " + err.message);
        const missing = err.message.includes("404") || err.message.includes("NOT_FOUND");
        if (missing) break;
        await new Promise((r) => setTimeout(r, 2000 * attempt));
      }
    }
  }
  throw lastError;
}

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.get("/lesson", async (req, res) => {
  try {
    const textbook = req.query.textbook || "a general textbook";
    const author = req.query.author || "an unknown author";
    const topic = req.query.topic || "photosynthesis";

    const prompt = `A college student is studying the textbook "${textbook}" by ${author}.
Teach the topic "${topic}" the way it would be covered in that textbook, but in your own words.
Split the lesson into exactly 5 short steps, like slides in a video:
1. Why this topic matters, 2. The main idea, 3. How it works, 4. A simple example, 5. Quick summary.
Each step has a short title and 2 or 3 simple sentences.
Use plain text only. No markdown symbols, no LaTeX, no dollar signs. Write formulas in plain words, like F = m x a.
Reply ONLY with JSON in exactly this shape:
{"steps":[{"title":"...","text":"..."}]}`;

    const raw = await askAI(prompt);
    const clean = raw.replace(/```json|```/g, "").trim();
    const data = JSON.parse(clean);
    res.json({ steps: data.steps });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Problem: " + err.message });
  }
});

app.listen(3001, () => console.log("Server running on port 3001"));