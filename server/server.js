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
    const topic = req.query.topic || "photosynthesis";
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `Teach "${topic}" to a college student in a short, simple lesson of about 150 words. Use a friendly tone.`,
    });
    res.json({ lesson: response.text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => console.log("Server running on port 3001"));