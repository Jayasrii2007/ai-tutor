import { useState } from "react";

export default function VideoQuiz({ quiz, onDone }) {
  const [picked, setPicked] = useState(null);
  const correct = picked === quiz.answer;

  return (
    <div style={{ background: "#fff", border: "2px solid #7c4dff", borderRadius: 14, padding: 16, margin: "12px 0" }}>
      <p style={{ margin: 0, color: "#7c4dff", fontWeight: 700 }}>⏸ Quick check</p>
      <h3 style={{ marginTop: 8 }}>{quiz.question}</h3>

      {quiz.options.map((opt, i) => {
        let bg = "#fff";
        if (picked !== null) {
          if (i === quiz.answer) bg = "#d7f7d7";
          else if (i === picked) bg = "#ffd9d9";
        }
        return (
          <button
            key={i}
            onClick={() => picked === null && setPicked(i)}
            style={{ display: "block", width: "100%", textAlign: "left", padding: 12, marginBottom: 8, fontSize: 16, background: bg, border: "1px solid #ccc", borderRadius: 8, cursor: "pointer" }}
          >
            {opt}
          </button>
        );
      })}

      {picked !== null && (
        <div>
          <p style={{ fontSize: 48, margin: "8px 0" }}>{correct ? "😄" : "😢"}</p>
          <p style={{ fontSize: 17 }}>
            {correct
              ? "Correct! Great job! +5 XP"
              : "That is okay! Let me teach the next part in a different way."}
          </p>
          <button
            style={{ padding: "10px 18px", fontSize: 16, cursor: "pointer" }}
            onClick={() => onDone(correct)}
          >
            {correct ? "▶ Continue the video" : "🔄 Show me another way"}
          </button>
        </div>
      )}
    </div>
  );
}