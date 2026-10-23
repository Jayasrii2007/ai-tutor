import { useState, useMemo } from "react";

function shuffled(n) {
  let a = Array.from({ length: n }, (_, i) => i);
  for (let tries = 0; tries < 10; tries++) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    if (n < 2 || a.some((v, i) => v !== i)) break;
  }
  return a;
}

export default function Activity({ type, labels, emojis, onDone }) {
  const n = labels.length;
  const pool = useMemo(() => shuffled(n), []);
  const [chosen, setChosen] = useState([]);
  const [matched, setMatched] = useState([]);
  const [selected, setSelected] = useState(null);
  const [oops, setOops] = useState("");

  const finished = type === "order" ? chosen.length === n : matched.length === n;

  function tapOrder(i) {
    if (chosen.includes(i)) return;
    if (i === chosen.length) {
      setChosen([...chosen, i]);
      setOops("");
    } else {
      setOops("Not that one yet. Think about what came first. Try again!");
    }
  }

  function tapPicture(i) {
    if (matched.includes(i)) return;
    setSelected(i);
    setOops("");
  }

  function tapWord(j) {
    if (matched.includes(j)) return;
    if (selected === null) {
      setOops("Tap a picture first, then tap its word.");
      return;
    }
    if (j === selected) {
      setMatched([...matched, j]);
      setSelected(null);
      setOops("");
    } else {
      setOops("Not a match. Try again!");
    }
  }

  const box = { background: "#fff8e1", border: "2px solid #ffb300", borderRadius: 14, padding: 16, margin: "12px 0" };

  const card = (bg, border) => ({
    padding: "10px 14px",
    fontSize: 16,
    fontWeight: 700,
    borderRadius: 12,
    border: border || "2px solid #7c4dff",
    background: bg,
    cursor: "pointer",
    margin: "0 8px 8px 0",
  });

  return (
    <div style={box}>
      {type === "order" && (
        <div>
          <h3 style={{ marginTop: 0 }}>🧩 Put the steps in order</h3>
          <p>Tap the cards in the order they happened in the video.</p>
          <div style={{ minHeight: 56, marginBottom: 10 }}>
            <b>Your order: </b>
            {chosen.map((i, k) => (
              <span key={i} style={card("#d7f7d7", "2px solid #2f9e44")}>
                {k + 1}. {emojis[i] || ""} {labels[i]}
              </span>
            ))}
          </div>
          <div>
            {pool
              .filter((i) => !chosen.includes(i))
              .map((i) => (
                <button key={i} onClick={() => tapOrder(i)} style={card("#fff")}>
                  {emojis[i] || "✨"} {labels[i]}
                </button>
              ))}
          </div>
        </div>
      )}

      {type === "match" && (
        <div>
          <h3 style={{ marginTop: 0 }}>🎯 Match the picture to the word</h3>
          <p>Tap a picture, then tap the word that goes with it.</p>
          <div>
            {labels.map((_, i) => (
              <button
                key={i}
                disabled={matched.includes(i)}
                onClick={() => tapPicture(i)}
                style={{
                  ...card(
                    matched.includes(i) ? "#d7f7d7" : selected === i ? "#e3dbff" : "#fff",
                    selected === i ? "3px solid #7c4dff" : undefined
                  ),
                  fontSize: 30,
                }}
              >
                {emojis[i] || "✨"}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 8 }}>
            {pool.map((j) => (
              <button
                key={j}
                disabled={matched.includes(j)}
                onClick={() => tapWord(j)}
                style={card(matched.includes(j) ? "#d7f7d7" : "#fff")}
              >
                {labels[j]}
              </button>
            ))}
          </div>
        </div>
      )}

      {oops && !finished && <p style={{ color: "#c92a2a", fontWeight: 700 }}>{oops}</p>}

      {finished && (
        <div>
          <p style={{ fontSize: 48, margin: "8px 0" }}>🎉</p>
          <p style={{ fontSize: 17 }}>Great job! +3 XP</p>
          <button
            style={{ padding: "10px 18px", fontSize: 16, cursor: "pointer" }}
            onClick={() => onDone()}
          >
            ▶ Continue the video
          </button>
        </div>
      )}
    </div>
  );
}