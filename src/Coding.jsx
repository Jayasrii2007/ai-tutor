import { useState } from "react";
import { challenges } from "./challenges.js";

function loadDone() {
  try {
    return JSON.parse(localStorage.getItem("aitutor-coding")) || [];
  } catch (e) {
    return [];
  }
}

export default function Coding({ addXP }) {
  const [done, setDone] = useState(loadDone());
  const [open, setOpen] = useState(null);
  const [picked, setPicked] = useState(null);
  const [wrongTries, setWrongTries] = useState(0);
  const [gained, setGained] = useState(0);

  const c = open === null ? null : challenges[open];

  function start(i) {
    setOpen(i);
    setPicked(null);
    setWrongTries(0);
    setGained(0);
  }

  function pick(i) {
    if (picked !== null) return;
    setPicked(i);
    if (i === c.answer) {
      if (!done.includes(c.id)) {
        const next = [...done, c.id];
        setDone(next);
        localStorage.setItem("aitutor-coding", JSON.stringify(next));
        const amount = wrongTries === 0 ? 10 : 5;
        setGained(amount);
        addXP(amount);
      }
    } else {
      setWrongTries(wrongTries + 1);
    }
  }

  function nextChallenge() {
    if (open < challenges.length - 1) start(open + 1);
    else setOpen(null);
  }

  const btn = { padding: "10px 18px", fontSize: 16, marginRight: 8, marginBottom: 8, cursor: "pointer" };

  if (c === null) {
    return (
      <div>
        <h2 style={{ marginTop: 0 }}>💻 Coding challenges</h2>
        <p className="sub">
          {done.length} of {challenges.length} completed. Earn XP for every one!
        </p>
        {challenges.map((ch, i) => (
          <div
            key={ch.id}
            onClick={() => start(i)}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 14,
              marginBottom: 10,
              borderRadius: 14,
              cursor: "pointer",
              background: done.includes(ch.id) ? "#e8f7ee" : "#f7f4ff",
              border: "1px solid " + (done.includes(ch.id) ? "#bfe8cf" : "#e3dbff"),
            }}
          >
            <b>
              {i + 1}. {ch.title}
            </b>
            <span style={{ fontSize: 22 }}>{done.includes(ch.id) ? "✅" : "▶"}</span>
          </div>
        ))}
      </div>
    );
  }

  const isCorrect = picked === c.answer;

  return (
    <div>
      <button style={btn} onClick={() => setOpen(null)}>⬅ All challenges</button>
      <p style={{ margin: 0, color: "#666" }}>
        Challenge {open + 1} of {challenges.length}
      </p>
      <h2 style={{ marginTop: 4 }}>{c.title}</h2>
      <p style={{ fontSize: 17 }}>{c.question}</p>

      <pre
        style={{
          background: "#1e1b3a",
          color: "#e9e4ff",
          padding: 14,
          borderRadius: 10,
          overflowX: "auto",
          fontSize: 15,
          lineHeight: 1.5,
        }}
      >
        {c.code}
      </pre>

      {c.options.map((opt, i) => {
        let bg = "#fff";
        if (picked !== null) {
          if (i === c.answer && isCorrect) bg = "#d7f7d7";
          else if (i === picked) bg = "#ffd9d9";
        }
        return (
          <button
            key={i}
            onClick={() => pick(i)}
            style={{ display: "block", width: "100%", textAlign: "left", padding: 12, marginBottom: 8, fontSize: 16, background: bg, border: "1px solid #ccc", borderRadius: 8, cursor: "pointer" }}
          >
            {opt}
          </button>
        );
      })}

      {picked !== null && isCorrect && (
        <div>
          <p style={{ fontSize: 48, margin: "8px 0" }}>😄</p>
          <p style={{ fontSize: 17 }}>
            Correct!{gained > 0 ? " +" + gained + " XP" : " You already earned XP for this one."}
          </p>
          <p style={{ background: "#f7f4ff", padding: 12, borderRadius: 10 }}>💡 {c.explain}</p>
          <button style={btn} onClick={nextChallenge}>
            {open < challenges.length - 1 ? "Next challenge ➡" : "Finish 🎉"}
          </button>
        </div>
      )}

      {picked !== null && !isCorrect && (
        <div>
          <p style={{ fontSize: 48, margin: "8px 0" }}>😢</p>
          <p style={{ fontSize: 17 }}>Not yet, and that is okay! Hint: {c.hint}</p>
          <button style={btn} onClick={() => setPicked(null)}>🔁 Try again</button>
        </div>
      )}
    </div>
  );
}