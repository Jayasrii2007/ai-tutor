import { useState, useRef, useEffect } from "react";

export default function Video({ textbook, topic }) {
  const [scenes, setScenes] = useState([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [shown, setShown] = useState(0);
  const [finished, setFinished] = useState(false);
  const runId = useRef(0);
  const timers = useRef([]);

  const [asking, setAsking] = useState(false);
  const [doubt, setDoubt] = useState("");
  const [answer, setAnswer] = useState("");
  const [answerLoading, setAnswerLoading] = useState(false);
  const [answerMsg, setAnswerMsg] = useState("");

  function clearTimers() {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  }

  function stop() {
    runId.current++;
    window.speechSynthesis.cancel();
    clearTimers();
    setPlaying(false);
  }

  useEffect(() => {
    return () => {
      runId.current++;
      window.speechSynthesis.cancel();
      timers.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  function play(i, list) {
    window.speechSynthesis.cancel();
    clearTimers();
    const myId = ++runId.current;
    const scene = list[i];
    const labels = scene.diagram || [];
    setIndex(i);
    setShown(0);
    setFinished(false);
    setPlaying(true);
    setAsking(false);

    labels.forEach((_, k) => {
      timers.current.push(setTimeout(() => setShown(k + 1), 1000 + k * 3000));
    });

    const u = new SpeechSynthesisUtterance(scene.title + ". " + scene.narration);
    u.lang = "en-IN";
    u.rate = 0.95;
    u.onend = () => {
      if (myId !== runId.current) return;
      setShown(labels.length);
      if (i < list.length - 1) {
        play(i + 1, list);
      } else {
        setPlaying(false);
        setFinished(true);
      }
    };
    window.speechSynthesis.speak(u);
  }

  async function load() {
    stop();
    setLoading(true);
    setScenes([]);
    setMessage("");
    setFinished(false);
    setAsking(false);
    setAnswer("");
    try {
      const url =
        "http://localhost:3001/video" +
        "?textbook=" + encodeURIComponent(textbook) +
        "&topic=" + encodeURIComponent(topic);
      const res = await fetch(url);
      const data = await res.json();
      if (data.scenes && data.scenes.length) {
        setScenes(data.scenes);
        setIndex(0);
        setShown(0);
      } else {
        setMessage(data.error || "Something went wrong");
      }
    } catch (e) {
      setMessage("Could not reach the server. Is it running?");
    }
    setLoading(false);
  }

  function openDoubt() {
    stop();
    setAsking(true);
    setDoubt("");
    setAnswer("");
    setAnswerMsg("");
  }

  async function askDoubt() {
    if (!doubt.trim()) return;
    setAnswer("");
    setAnswerMsg("");
    setAnswerLoading(true);
    try {
      const url =
        "http://localhost:3001/doubt" +
        "?textbook=" + encodeURIComponent(textbook) +
        "&topic=" + encodeURIComponent(topic) +
        "&scene=" + encodeURIComponent(scenes[index].narration) +
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
        setAnswerMsg(data.error || "Something went wrong");
      }
    } catch (e) {
      setAnswerMsg("Could not reach the server. Is it running?");
    }
    setAnswerLoading(false);
  }

  function resume() {
    window.speechSynthesis.cancel();
    setAsking(false);
    play(index, scenes);
  }

  const btn = { padding: "10px 18px", fontSize: 16, marginRight: 8, marginBottom: 8, cursor: "pointer" };
  const scene = scenes[index];
  const labels = scene ? scene.diagram || [] : [];

  return (
    <div style={{ marginTop: 16 }}>
      {scenes.length === 0 && (
        <div>
          <button style={btn} onClick={load} disabled={loading || !topic}>
            🎬 Make my video
          </button>
          {!topic && <p style={{ color: "#666" }}>Type a topic above first.</p>}
          {loading && <p>Making your video... this takes about 20 seconds.</p>}
          {message && <p>{message}</p>}
        </div>
      )}

      {scene && (
        <div>
          <div style={{ background: "#1e1b3a", color: "white", borderRadius: 16, padding: 20, minHeight: 300 }}>
            <p style={{ margin: 0, opacity: 0.7 }}>
              Scene {index + 1} of {scenes.length}
            </p>
            <h2 style={{ margin: "6px 0 16px" }}>{scene.title}</h2>

            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, minHeight: 70 }}>
              {labels.map((label, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    opacity: i < shown ? 1 : 0,
                    transform: i < shown ? "scale(1)" : "scale(0.6)",
                    transition: "all 0.6s",
                  }}
                >
                  <div style={{ background: "#7c4dff", borderRadius: 10, padding: "10px 14px", fontWeight: 700 }}>
                    {label}
                  </div>
                  {i < labels.length - 1 && <span style={{ fontSize: 24 }}>→</span>}
                </div>
              ))}
            </div>

            <p style={{ marginTop: 20, fontSize: 17, lineHeight: 1.6, background: "rgba(255,255,255,0.1)", padding: 12, borderRadius: 10 }}>
              {scene.narration}
            </p>
          </div>

          <div style={{ background: "#e3dbff", borderRadius: 8, height: 8, margin: "12px 0" }}>
            <div
              style={{
                background: "#7c4dff",
                height: 8,
                borderRadius: 8,
                width: ((index + (finished ? 1 : 0.5)) / scenes.length) * 100 + "%",
                transition: "width 0.5s",
              }}
            />
          </div>

          <div>
            {playing ? (
              <button style={btn} onClick={stop}>⏸ Pause</button>
            ) : (
              <button style={btn} onClick={() => play(finished ? 0 : index, scenes)}>
                {finished ? "🔁 Watch again" : "▶ Play"}
              </button>
            )}
            <button style={btn} disabled={index === 0} onClick={() => play(index - 1, scenes)}>⏮ Previous</button>
            <button style={btn} disabled={index === scenes.length - 1} onClick={() => play(index + 1, scenes)}>⏭ Next</button>
            <button style={btn} onClick={openDoubt}>🙋 I have a doubt</button>
          </div>

          {asking && (
            <div style={{ background: "#fff8e1", border: "1px solid #ffe08a", borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <h3 style={{ marginTop: 0 }}>🙋 What is your doubt?</h3>
              <input
                value={doubt}
                onChange={(e) => setDoubt(e.target.value)}
                placeholder="Type your doubt here"
                style={{ display: "block", width: "100%", padding: 10, fontSize: 16, boxSizing: "border-box", marginBottom: 10 }}
              />
              <button style={btn} onClick={askDoubt} disabled={answerLoading || !doubt.trim()}>
                Ask
              </button>

              {answerLoading && <p>🤔 Thinking about your doubt...</p>}
              {answerMsg && <p>{answerMsg}</p>}
              {answer && (
                <div style={{ background: "white", borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6 }}>💡 {answer}</p>
                </div>
              )}

              <button style={btn} onClick={resume}>▶ Resume the video</button>
            </div>
          )}

          {finished && <p style={{ fontSize: 18 }}>Video finished! 🎉</p>}
          <button style={btn} onClick={load}>🔄 Make a new video</button>
        </div>
      )}
    </div>
  );
}