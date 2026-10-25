import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { GoogleGenAI } from "@google/genai";

const MODELS = ["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-2.5-flash"];

const app = express();
app.set("trust proxy", 1);

const allowed = process.env.ALLOWED_ORIGIN;
app.use(cors(allowed ? { origin: allowed.split(",") } : undefined));

app.use(
  rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests. Please wait a few minutes and try again." },
  })
);

app.use(express.json({ limit: "10mb" }));

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
        toJSON(response.text);
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
  let text = raw.replace(/```json|```/g, "").trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) text = text.slice(start, end + 1);
  text = text.replace(/,\s*([}\]])/g, "$1");
  return JSON.parse(text);
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

app.get("/video", async (req, res) => {
  try {
    const textbook = req.query.textbook || "a general textbook";
    const topic = req.query.topic || "photosynthesis";
    const style = req.query.style || "balanced";

    const styleRules = {
      balanced: "Use clear, friendly explanations.",
      simple: "Use very simple words and short sentences, like explaining to a beginner.",
      example: "Explain mainly through real-life examples from everyday student life.",
      visual: "Describe things as pictures and processes step by step, so the diagram does most of the teaching.",
    };

    const prompt = `Write the script of a short educational video (about 2 minutes) for a college student.
Topic: "${topic}" from the textbook "${textbook}", explained in your own words.
Teaching style: ${styleRules[style] || styleRules.balanced}
Make exactly 6 scenes. Each scene has:
- "title": a short title,
- "narration": what the teacher says out loud, 45 to 60 words, friendly and easy to follow,
- "diagram": a list of 3 or 4 very short labels (maximum 4 words each) that show the idea as a flow from left to right,
- "emojis": a list with the same length as "diagram", with one fitting emoji for each label,
- "quiz": null for scenes 1, 2, 4 and 6. For scenes 3 and 5 it is a question about what was just taught, in this shape: {"question":"...","options":["...","...","..."],"answer":0} where answer is the number 0, 1 or 2 of the correct option.
Use plain text only. No markdown symbols, no LaTeX, no dollar signs.
Reply ONLY with JSON in exactly this shape:
{"scenes":[{"title":"...","narration":"...","diagram":["...","...","..."],"emojis":["...","...","..."],"quiz":null}]}`;

    const data = toJSON(await askAI(prompt));
    res.json({ scenes: data.scenes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Problem: " + err.message });
  }
});

app.get("/doubt", async (req, res) => {
  try {
    const textbook = req.query.textbook || "a general textbook";
    const topic = req.query.topic || "photosynthesis";
    const scene = req.query.scene || "";
    const doubt = req.query.doubt || "";

    const prompt = `You are a friendly, patient tutor. A college student is watching a video about "${topic}" from the textbook "${textbook}".
The part they just heard was: "${scene}"
They paused the video and asked: "${doubt}"
Answer their doubt in under 80 words. Use one simple real-world example from everyday life. Be kind, never scold.
Use plain text only. No markdown symbols, no LaTeX, no dollar signs.
Reply ONLY with JSON in exactly this shape:
{"answer":"..."}`;

    const data = toJSON(await askAI(prompt));
    res.json({ answer: data.answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Problem: " + err.message });
  }
});

app.get("/boss", async (req, res) => {
  try {
    const textbook = req.query.textbook || "a general textbook";
    const topic = req.query.topic || "photosynthesis";

    const prompt = `Make a fun boss battle quiz for a college student about "${topic}" from the textbook "${textbook}".
Give the boss a funny name related to the topic, maximum 3 words (for example: Captain Inertia).
Make 8 short multiple choice questions, each with exactly 3 options.
Each question has: "question" (maximum 20 words), "options", "answer" (the number 0, 1 or 2 of the correct option), and "why" (one short, kind sentence that explains the right answer).
Every question must be clear, with exactly one correct answer.
Use plain text only. No markdown symbols, no LaTeX, no dollar signs.
Reply ONLY with JSON in exactly this shape:
{"boss":"...","questions":[{"question":"...","options":["...","...","..."],"answer":0,"why":"..."}]}`;

    const data = toJSON(await askAI(prompt));
    res.json({ boss: data.boss, questions: data.questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Problem: " + err.message });
  }
});

app.post("/page", async (req, res) => {
  try {
    const { image, mime, text, topic } = req.body;
    const okMime = ["image/jpeg", "image/png", "image/webp"];

    if (!image && !(text && text.trim())) {
      return res.status(400).json({ error: "Please add a photo or paste some text." });
    }
    if (image && !okMime.includes(mime)) {
      return res.status(400).json({ error: "Please use a JPG, PNG or WEBP photo." });
    }

    const pageText =
      text && text.trim() ? "Text typed by the student from the page: " + text.trim().slice(0, 6000) : "";
    const topicLine = topic && topic.trim() ? "The student says the topic is: " + topic.trim() + "." : "";

    const prompt = `A college student shared a page from their own textbook${image ? " as a photo" : ""}.
${pageText}
${topicLine}
Read the page carefully and teach what is ON THIS PAGE in your own words. Do not copy long sentences from the page.
If the page cannot be read or has no study content, reply ONLY with {"error":"I could not read a study page. Please send a clearer photo."}
Otherwise create:
- "topic": a short title for the page (maximum 6 words).
- "steps": exactly 5 short steps, like slides in a video: 1. Why this matters, 2. The main idea, 3. How it works, 4. A simple example, 5. Quick summary. Each step has "title", "text" (2 or 3 simple sentences) and "diagram" (3 or 4 very short labels, maximum 4 words each, showing the idea as a flow from left to right).
- "questions": exactly 3 multiple choice questions about this page. Each has "question", exactly 3 "options", "answer" (the number 0, 1 or 2 of the correct option), "hint" (one short, friendly, funny sentence that never scolds) and "why" (one short sentence explaining the right answer).
Use plain text only. No markdown symbols, no LaTeX, no dollar signs. Write formulas in plain words.
Reply ONLY with JSON in exactly this shape:
{"topic":"...","steps":[{"title":"...","text":"...","diagram":["...","...","..."]}],"questions":[{"question":"...","options":["...","...","..."],"answer":0,"hint":"...","why":"..."}]}`;

    const parts = [];
    if (image) parts.push({ inlineData: { mimeType: mime, data: image } });
    parts.push({ text: prompt });

    const data = toJSON(await askAI([{ role: "user", parts }]));
    if (data.error) return res.status(422).json({ error: data.error });
    if (!data.steps || !data.steps.length) {
      return res.status(422).json({ error: "I could not make a lesson from that page. Try a clearer photo." });
    }
    res.json({ topic: data.topic || topic || "Your page", steps: data.steps, questions: data.questions || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Problem: " + err.message });
  }
});

app.get("/poster", async (req, res) => {
  try {
    const topic = (req.query.topic || "").toString().slice(0, 100) || "photosynthesis";
    const textbook = (req.query.textbook || "").toString().slice(0, 100);

    const prompt = `Design the content of a colourful one-page study poster for a college student about "${topic}"${textbook ? ' from the textbook "' + textbook + '"' : ""}.
Fill every field. Keep all text short, simple and friendly. Use plain text only. No markdown symbols, no LaTeX, no dollar signs. Write formulas in plain words, like F = m x a.
Fields:
- "title": maximum 5 words.
- "tagline": maximum 10 words.
- "emoji": one emoji that fits the topic.
- "theme": one of "blue", "purple", "green", "orange", "pink".
- "formula": the most important formula or rule in plain text, maximum 8 words. Use an empty string if there is none.
- "formulaNote": maximum 12 words explaining the formula, or an empty string.
- "points": exactly 4 key points. Each has "emoji", "title" (maximum 4 words) and "text" (maximum 14 words).
- "diagram": 3 or 4 very short labels (maximum 4 words each) showing the idea as a flow from left to right.
- "example": one real-life example, maximum 25 words.
- "trick": one memory trick to remember it, maximum 18 words.
Reply ONLY with JSON in exactly this shape:
{"title":"...","tagline":"...","emoji":"...","theme":"blue","formula":"...","formulaNote":"...","points":[{"emoji":"...","title":"...","text":"..."}],"diagram":["...","...","..."],"example":"...","trick":"..."}`;

    const data = toJSON(await askAI(prompt));
    if (!data.title || !Array.isArray(data.points) || data.points.length === 0) {
      return res.status(422).json({ error: "I could not design that poster. Please try again." });
    }
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Problem: " + err.message });
  }
});

const CHAT_SYSTEM = `You are a friendly, patient AI tutor inside a study app for college students.
Answer the student's question clearly and simply. Give the short answer first, then one real-life example, then offer a follow-up like "Want a quick quiz on this?".
Keep answers under 200 words unless the student asks for more detail.
You may use simple formatting: **bold** for key words, lines starting with - for bullet points, lines starting with 1. 2. 3. for steps, and triple backticks for code. Do not use tables, # headings, LaTeX or dollar signs. Write maths in plain text, like x^2 or F = m x a.
Never scold the student. If you are not sure about something, say so honestly.
If a student seems very sad, stressed, or mentions hurting themselves, reply kindly and encourage them to talk to a trusted person or a local helpline.
Politely decline requests that are harmful or dishonest, and offer a helpful alternative.`;

function chatContents(messages) {
  const history = Array.isArray(messages) ? messages.slice(-12) : [];
  const contents = history
    .filter((m) => m && typeof m.text === "string" && m.text.trim())
    .map((m) => ({
      role: m.role === "ai" ? "model" : "user",
      parts: [{ text: m.text.slice(0, 2000) }],
    }));
  while (contents.length && contents[0].role === "model") contents.shift();
  return contents;
}

app.post("/chat-stream", async (req, res) => {
  const contents = chatContents(req.body.messages);
  if (!contents.length || contents[contents.length - 1].role !== "user") {
    return res.status(400).json({ error: "Please type a question." });
  }

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Accel-Buffering", "no");

  let sent = false;
  for (const model of MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const stream = await ai.models.generateContentStream({
          model,
          contents,
          config: { systemInstruction: CHAT_SYSTEM },
        });
        for await (const chunk of stream) {
          const t = chunk.text;
          if (t) {
            res.write(t);
            sent = true;
          }
        }
        return res.end();
      } catch (err) {
        console.log(model + " stream try " + attempt + " failed: " + err.message);
        if (sent) return res.end();
        const missing = err.message.includes("404") || err.message.includes("NOT_FOUND");
        if (missing) break;
        await new Promise((r) => setTimeout(r, 1500 * attempt));
      }
    }
  }

  res.type("json");
  res.status(503).json({ error: "The AI is busy right now. Please try again in a minute." });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log("Server running on port " + PORT));