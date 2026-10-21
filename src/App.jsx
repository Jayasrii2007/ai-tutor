import { useState } from "react";

export default function App() {
  const [textbook, setTextbook] = useState("");
  const [author, setAuthor] = useState("");
  const [topic, setTopic] = useState("");
  const [lesson, setLesson] = useState("");
  const [loading, setLoading] = useState(false);

  async function teachMe() {
    setLoading(true);
    setLesson("");
    try {
      const url =
        "http://localhost:3001/lesson" +
        "?textbook=" + encodeURIComponent(textbook) +
        "&author=" + encodeURIComponent(author) +
        "&topic=" + encodeURIComponent(topic);
      const res = await fetch(url);
      const data = await res.json();
      setLesson(data.lesson || "Error: " + data.error);
    } catch (e) {
      setLesson("Could not reach the server. Is it running?");
    }
    setLoading(false);
  }

  const box = { display: "block", width: "100%", padding: 10, marginBottom: 10, fontSize: 16, boxSizing: "border-box" };

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: 16, textAlign: "left" }}>
      <h1>AI Tutor</h1>
      <input style={box} value={textbook} onChange={(e) => setTextbook(e.target.value)} placeholder="Textbook name" />
      <input style={box} value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author name" />
      <input style={box} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic" />
      <button onClick={teachMe} style={{ padding: "10px 20px", fontSize: 16 }}>
        Teach me
      </button>
      {loading && <p>Thinking...</p>}
      <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{lesson}</p>
    </div>
  );
}