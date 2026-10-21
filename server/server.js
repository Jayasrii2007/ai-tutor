import "dotenv/config";
import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

const MODEL = "gemini-3.8-flash";

const app = express();
app.use(cors());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
Write a short, simple, friendly lesson of about 150 words.
Use plain text only. Do not use markdown symbols like ** or #, and do not use LaTeX or dollar signs. Write formulas in plain words, like F = m x a.`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
    });
    res.json({ lesson: response.text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => console.log("Server running on port 3001"));