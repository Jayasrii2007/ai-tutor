import { useState, useRef } from "react";

export default function App() {
  const [textbook, setTextbook] = useState("");
  const [author, setAuthor] = useState("");
  const [topic, setTopic] = useState("");
  const [steps, setSteps] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [playing, setPlaying] = useState(false);
  const speakId = useRef(0);

  function stopSpeaking() {
    speakId.current++;
    window.speechSynthesis.cancel();
    setPlaying(false);
  }

  function speak(index) {
    window.speechSynthesis.cancel();
    const myId = ++speakId.current;
    setCurrent(index);
    setPlaying(true);
    const u = new SpeechSynthesisUtterance(steps[index].title + ". " + steps[index].text);
    u.lang = "en-IN";
    u.onend = () => {
      if (myId !== speakId.current) return;
      if (index < steps.length - 1) {
        speak(index + 1);
      } else {
        setPlaying(false);
      }
    };
    window.speechSynthesis.speak(u);
  }

  async function teachMe() {
    stopSpeaking();
    setLoading(true);
    setSteps([]);
    setCurrent(0);
    setMessage("");
    try {
      const url =
        "http://localhost:3001/lesson" +
        "?textbook=" + encodeURIComponent(textbook) +
        "&author=" + encodeURIComponent(author) +
        "&topic=" + encodeURIComponent(topic);
      const res = await fetch(url);
      const data = await res.json();
      if (data.steps) {
        setSteps(data.steps);
      } else {
        setMessage(data.error || "Something went wrong");
      }
    } catch (e) {
      setMessage("Could not reach the server. Is it running?");
    }
    setLoading(false);
  }

  function goNext() {
    stopSpeaking();
    setCurrent(current + 1);
  }

  function goBack() {
    stopSpeaking();
    setCurrent(current - 1);
  }

  const box = { display: "block", width: "100%", padding: 10, marginBottom: 10, fontSize: 16, boxSizing: "border-box" };
  const btn = { padding: "10px 20px", fontSize: 16, marginRight: 10, marginBottom: 10, cursor: "pointer" };
  const step = steps[current];
  const youtubeUrl =
    "https://www.youtube.com/results?search_query=" + encodeURIComponent(topic + " " + textbook);

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: 16, textAlign: "left" }}>
      <h1>AI Tutor</h1>
      <input style={box} value={textbook} onChange={(e) => setTextbook(e.target.value)} placeholder="Textbook name" />
      <input style={box} value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author name" />
      <input style={box} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic" />
      <button onClick={teachMe} style={btn}>Teach me</button>

      {loading && <p>Thinking...</p>}
      {message && <p>{message}</p>}

      {step && (
        <div style={{ marginTop: 24, padding: 20, border: "1px solid #ccc", borderRadius: 12 }}>
          <div style={{ background: "#eee", borderRadius: 8, height: 8, marginBottom: 16 }}>
            <div style={{ background: "#7c4dff", height: 8, borderRadius: 8, width: ((current + 1) / steps.length) * 100 + "%" }} />
          </div>
          <p style={{ margin: 0, color: "#666" }}>Step {current + 1} of {steps.length}</p>
          <h2 style={{ marginTop: 8 }}>{step.title}</h2>
          <p style={{ fontSize: 18, lineHeight: 1.7 }}>{step.text}</p>

          <div>
            {playing ? (
              <button style={btn} onClick={stopSpeaking}>⏸ Pause</button>
            ) : (
              <button style={btn} onClick={() => speak(current)}>▶ Play lesson</button>
            )}
            <button style={btn} disabled={current === 0} onClick={goBack}>Back</button>
            {current < steps.length - 1 && (
              <button style={btn} onClick={goNext}>Next</button>
            )}
          </div>

          {current === steps.length - 1 && (
            <p style={{ marginTop: 8 }}>Lesson finished! 🎉 The quiz comes on Day 8.</p>
          )}

          <a href={youtubeUrl} target="_blank" rel="noreferrer">
            🎬 Watch a video on this topic
          </a>
        </div>
      )}
    </div>
  );
}