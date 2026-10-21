import "dotenv/config";
import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

const MODELS = ["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-2.5-flash"];

const app = express();
app.use(cors());
app.use(express.json());

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

function toJSON(raw) {
  return JSON.parse(raw.replace(/```json|```/g, "").trim());
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
Each step also has a "diagram": a list of 3 or 4 very short labels (maximum 4 words each) that show the idea as a flow from left to right.
Use plain text only. No markdown symbols, no LaTeX, no dollar signs. Write formulas in plain words, like F = m x a.
Reply ONLY with JSON in exactly this shape:
{"steps":[{"title":"...","text":"...","diagram":["...","...","..."]}]}`;

    const data = toJSON(await askAI(prompt));
    res.json({ steps: data.steps });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Problem: " + err.message });
  }
});

app.get("/quiz", async (req, res) => {
  try {
    const textbook = req.query.textbook || "a general textbook";
    const topic = req.query.topic || "photosynthesis";

    const prompt = `Make 3 multiple choice questions to test a college student on the topic "${topic}" from the textbook "${textbook}".
Each question has: "question", exactly 4 "options", "answer" (the number 0, 1, 2 or 3 of the correct option), and "hint".
The hint is one short, friendly, funny sentence that helps the student without giving the answer away. It must never scold or make the student feel bad.
Use plain text only. No markdown symbols, no LaTeX, no dollar signs.
Reply ONLY with JSON in exactly this shape:
{"questions":[{"question":"...","options":["...","...","...","..."],"answer":0,"hint":"..."}]}`;

    const data = toJSON(await askAI(prompt));
    res.json({ questions: data.questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Problem: " + err.message });
  }
});

app.post("/reteach", async (req, res) => {
  try {
    const { textbook, topic, question, options, picked, correct } = req.body;

    const prompt = `You are a friendly, patient tutor. A college student is studying "${topic}" from the textbook "${textbook}".
They were asked: "${question}"
The options were: ${JSON.stringify(options)}
They chose: "${picked}"
The correct answer is: "${correct}"

Step 1: Decide the most likely reason for the wrong answer. Pick exactly one of these four:
"concept gap" (the words or the idea were not understood),
"cannot visualize" (they could not picture it),
"too abstract" (they need a real-life example),
"careless slip" (they probably knew it but made a small mistake).

Step 2: Explain the idea again in a way that fits that reason:
concept gap = very simple words and short sentences,
cannot visualize = describe a clear picture step by step,
too abstract = use a real-life example from everyday student life,
careless slip = a quick, kind reminder of the key point.
Do NOT scold. Do NOT just tell them the answer. Help them understand so they can answer again.
Keep the explanation under 70 words. Keep the example under 40 words.
The "diagram" is a list of 3 or 4 very short labels (maximum 4 words each) that show the idea as a flow from left to right.
Use plain text only. No markdown symbols, no LaTeX, no dollar signs.

Reply ONLY with JSON in exactly this shape:
{"reason":"concept gap","explanation":"...","example":"...","diagram":["...","...","..."]}`;

    const data = toJSON(await askAI(prompt));
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Problem: " + err.message });
  }
});

app.listen(3001, () => console.log("Server running on port 3001"));