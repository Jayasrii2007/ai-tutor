import { useState } from "react";

export default function DoubtBox({ textbook, topic, sceneText, onResume }) {
  const [doubt, setDoubt] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function ask() {
    if (!doubt.trim()) return;
    setAnswer("");
    setMsg("");
    setLoading(true);
    try {
      const url =
        "http://localhost:3001/doubt" +
        "?textbook=" + encodeURIComponent(textbook) +
        "&topic=" + encodeURIComponent(topic) +
        "&scene=" + encodeURIComponent(sceneText) +
        "&doubt=" + encodeURIComponent(doubt);
      const res = await fetch(url);
      const data = await res.json();
      if (data.answer) {
        setAnswer(data.answer);
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(data.answer);
        u.lang = "en-IN";
        u.rate = 0.95;
        window.speechSynthesis.speak(u);
      } else {
        setMsg(data.error || "Something went wrong");
      }
    } catch (e) {
      setMsg("Could not reach the server. Is it running?");
    }
    setLoading(false);
  }

  const btn = { padding: "10px 18px", fontSize: 16, marginRight: 8, marginBottom: 8, cursor: "pointer" };

  return (
    <div style={{ background: "#fff8e1", border: "1px solid #ffe08a", borderRadius: 12, padding: 16, marginBottom: 12 }}>
      <h3 style={{ marginTop: 0 }}>🙋 What is your doubt?</h3>
      <input
        value={doubt}
        onChange={(e) => setDoubt(e.target.value)}
        placeholder="Type your doubt here"
        style={{ display: "block", width: "100%", padding: 10, fontSize: 16, boxSizing: "border-box", marginBottom: 10 }}
      />
      <button style={btn} onClick={ask} disabled={loading || !doubt.trim()}>Ask</button>

      {loading && <p>🤔 Thinking about your doubt...</p>}
      {msg && <p>{msg}</p>}
      {answer && (
        <div style={{ background: "white", borderRadius: 10, padding: 12, marginBottom: 10 }}>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6 }}>💡 {answer}</p>
        </div>
      )}

      <button
        style={btn}
        onClick={() => {
          window.speechSynthesis.cancel();
          onResume();
        }}
      >
        ▶ Resume the video
      </button>
    </div>
  );
}