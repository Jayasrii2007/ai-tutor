import { useState, useRef, useEffect } from "react";
import Tutor from "./Tutor.jsx";

const bossEmojis = ["👾", "🐲", "🧌", "👹", "🦖", "🤖", "🧟", "🐙"];

const hitLines = [
  "BAM! Right in the face! 💥",
  "KAPOW! The boss felt that! 👊",
  "Critical hit! 🎯",
  "The boss is crying! 😭",
  "Ouch! That hurt him! 🤕",
];

const missLines = [
  "The boss laughs at you! 😈",
  "Oops! You lost a heart 💔",
  "The boss dodged and giggled 🤭",
  "Shake it off, hero! 💪",
];

const MAX_HP = 5;
const MAX_HEARTS = 3;
const letters = ["A", "B", "C"];

function pickLine(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function beep(ok) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const notes = ok ? [523, 659, 784] : [220, 165];
    notes.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = f;
      o.type = ok ? "sine" : "sawtooth";
      g.gain.value = 0.08;
      o.connect(g);
      g.connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.12);
      o.stop(ctx.currentTime + i * 0.12 + 0.11);
    });
    setTimeout(() => ctx.close(), 800);
  } catch (e) {}
}

export default function Boss({ addXP }) {
  const [textbook, setTextbook] = useState("");
  const [topic, setTopic] = useState("");
  const [phase, setPhase] = useState("setup");
  const [message, setMessage] = useState("");
  const [questions, setQuestions] = useState([]);
  const [bossName, setBossName] = useState("");
  const [bossEmoji, setBossEmoji] = useState("👾");
  const [qIndex, setQIndex] = useState(0);
  const [hp, setHp] = useState(MAX_HP);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [hits, setHits] = useState(0);
  const [picked, setPicked] = useState(null);
  const [hit, setHit] = useState(null);
  const [line, setLine] = useState("");
  const [missed, setMissed] = useState([]);
  const [sound, setSound] = useState(true);
    const [talking, setTalking] = useState(false);

  useEffect(() => {
    return () => window.speechSynthesis.cancel();
  }, []);

  function say(text) {
    if (!sound) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, "");
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = "en-IN";
    u.rate = 0.95;
    u.onstart = () => setTalking(true);
    u.onend = () => setTalking(false);
    u.onerror = () => setTalking(false);
    window.speechSynthesis.speak(u);
  }
  const awarded = useRef(false);

  async function start() {
    if (!topic.trim()) return;
    setPhase("loading");
    setMessage("");
    try {
      const url =
        "http://localhost:3001/boss" +
        "?textbook=" + encodeURIComponent(textbook) +
        "&topic=" + encodeURIComponent(topic);
      const res = await fetch(url);
      const data = await res.json();
      if (data.questions && data.questions.length) {
        setQuestions(data.questions);
        setBossName(data.boss || "The Boss");
        setBossEmoji(bossEmojis[Math.floor(Math.random() * bossEmojis.length)]);
        setQIndex(0);
        setHp(MAX_HP);
        setHearts(MAX_HEARTS);
        setHits(0);
        setPicked(null);
        setHit(null);
        setLine("");
        setMissed([]);
        awarded.current = false;
        setPhase("play");
      } else {
        setMessage(data.error || "Something went wrong");
        setPhase("setup");
      }
    } catch (e) {
      setMessage("Could not reach the server. Is it running?");
      setPhase("setup");
    }
  }

  function finish(won, totalHits) {
    setPhase("over");
    if (!awarded.current) {
      awarded.current = true;
      addXP(won ? 25 : totalHits * 3);
    }
  }

    function answer(i) {
    if (picked !== null) return;
    const q = questions[qIndex];
    const ok = i === q.answer;
    const spoken = pickLine(ok ? hitLines : missLines);
    setPicked(i);
    if (sound) beep(ok);
    if (ok) {
      setHp(hp - 1);
      setHits(hits + 1);
      setHit("boss");
    } else {
      setHearts(hearts - 1);
      setHit("me");
      setMissed([...missed, q]);
    }
    setLine(spoken);
    setTimeout(() => say(spoken + " The answer is " + q.options[q.answer] + ". " + q.why), 500);
  }

  function next() {
    window.speechSynthesis.cancel();
    setTalking(false);
    const won = hp <= 0;
    const lost = hearts <= 0;
    if (won || lost || qIndex + 1 >= questions.length) {
      finish(won, hits);
      return;
    }
    setQIndex(qIndex + 1);
    setPicked(null);
    setHit(null);
    setLine("");
  }

  const box = { display: "block", width: "100%", padding: 10, marginBottom: 10, fontSize: 16, boxSizing: "border-box" };
  const btn = { padding: "10px 18px", fontSize: 16, marginRight: 8, marginBottom: 8, cursor: "pointer" };

  const styleTag = (
    <style>{`
      @keyframes idle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
      @keyframes bossHit { 0% { transform: translateX(0); filter: none; } 20% { transform: translateX(-14px) rotate(-8deg); filter: brightness(2) saturate(3); } 40% { transform: translateX(14px) rotate(8deg); } 60% { transform: translateX(-10px); } 80% { transform: translateX(10px); } 100% { transform: translateX(0); filter: none; } }
      @keyframes laugh { 0%, 100% { transform: scale(1); } 25% { transform: scale(1.25) rotate(-6deg); } 50% { transform: scale(1.25) rotate(6deg); } 75% { transform: scale(1.15) rotate(-4deg); } }
      @keyframes floatUp { 0% { opacity: 1; transform: translate(-50%, 0); } 100% { opacity: 0; transform: translate(-50%, -60px); } }
      @keyframes shakeHearts { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
    `}</style>
  );

  if (phase === "setup" || phase === "loading") {
    return (
      <div>
        {styleTag}
        <h2 style={{ marginTop: 0 }}>👾 Boss Battle</h2>
        <p className="sub">Answer questions to beat a funny boss. You have 3 hearts. Do not let him laugh at you! 😈</p>
        <input style={box} value={textbook} onChange={(e) => setTextbook(e.target.value)} placeholder="Textbook name" />
        <input style={box} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic" />
        <button style={btn} onClick={start} disabled={phase === "loading" || !topic.trim()}>
          ⚔ Meet the boss
        </button>
        {phase === "loading" && <p>The boss is getting ready... about 10 seconds.</p>}
        {message && <p>{message}</p>}
      </div>
    );
  }

  if (phase === "over") {
    const won = hp <= 0;
    return (
      <div style={{ textAlign: "center" }}>
        {styleTag}
        <Tutor speaking={talking} mood={hit === "boss" ? "happy" : "sad"} />
        <p style={{ fontSize: 60, margin: "4px 0" }}>{won ? "🏆" : "💔"}</p>
        <h2 style={{ margin: "4px 0" }}>
          {won ? "You defeated " + bossName + "!" : bossName + " wins this time!"}
        </h2>
        <p style={{ fontSize: 17 }}>
          Hits: 💥 {hits} · +{won ? 25 : hits * 3} XP
        </p>

        {missed.length > 0 && (
          <div style={{ textAlign: "left", background: "#fff8e1", border: "1px solid #ffe08a", borderRadius: 12, padding: 14, margin: "12px 0" }}>
            <b>Review these to beat the boss next time 💡</b>
            {missed.map((m, i) => (
              <p key={i} style={{ margin: "8px 0" }}>
                <b>{m.question}</b>
                <br />
                Answer: {m.options[m.answer]}. {m.why}
              </p>
            ))}
          </div>
        )}

        <button style={btn} onClick={start}>🔁 Fight again</button>
        <button style={btn} onClick={() => setPhase("setup")}>New topic</button>
      </div>
    );
  }

  const q = questions[qIndex];
  const ended = hp <= 0 || hearts <= 0 || qIndex + 1 >= questions.length;
  const bossAnim = hit === "boss" ? "bossHit 0.6s" : hit === "me" ? "laugh 0.7s" : "idle 2s infinite";

  return (
    <div>
      {styleTag}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 22 }}>
        <span style={{ animation: hit === "me" ? "shakeHearts 0.5s" : "none" }}>
          {"❤️".repeat(Math.max(hearts, 0))}
          {"🖤".repeat(MAX_HEARTS - Math.max(hearts, 0))}
        </span>
        <button
          onClick={() => setSound(!sound)}
          style={{ fontSize: 18, cursor: "pointer", background: "none", border: "1px solid #ccc", borderRadius: 8 }}
        >
          {sound ? "🔊" : "🔇"}
        </button>
      </div>

      <div style={{ textAlign: "center", position: "relative", margin: "8px 0" }}>
        <div style={{ fontSize: 90, display: "inline-block", animation: bossAnim }}>
          {hp <= 0 ? "😵" : bossEmoji}
        </div>
        {hit === "boss" && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              fontSize: 30,
              fontWeight: 800,
              color: "#e03131",
              animation: "floatUp 1s forwards",
            }}
          >
            💥 -1
          </div>
        )}
        <div style={{ fontWeight: 800, fontSize: 18 }}>{bossName}</div>
        <div style={{ background: "#ffe3e3", borderRadius: 8, height: 14, maxWidth: 260, margin: "6px auto" }}>
          <div
            style={{
              background: "#e03131",
              height: 14,
              borderRadius: 8,
              width: (Math.max(hp, 0) / MAX_HP) * 100 + "%",
              transition: "width 0.5s",
            }}
          />
        </div>
        <div style={{ fontSize: 13, color: "#666" }}>Boss HP {Math.max(hp, 0)} / {MAX_HP}</div>
      </div>

      <div style={{ background: "#f7f4ff", border: "2px solid #e3dbff", borderRadius: 14, padding: 16, fontSize: 18, fontWeight: 700, marginBottom: 10 }}>
        {q.question}
      </div>

      {q.options.map((opt, i) => {
        let bg = "#fff";
        if (picked !== null) {
          if (i === q.answer) bg = "#d7f7d7";
          else if (i === picked) bg = "#ffd9d9";
        }
        return (
          <button
            key={i}
            onClick={() => answer(i)}
            style={{ display: "block", width: "100%", textAlign: "left", padding: 12, marginBottom: 8, fontSize: 16, background: bg, border: "1px solid #ccc", borderRadius: 8, cursor: "pointer" }}
          >
            <b>{letters[i]}.</b> {opt}
          </button>
        );
      })}

      {picked !== null && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
          <Tutor speaking={hit === "boss"} mood={hit === "boss" ? "happy" : "sad"} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 19, fontWeight: 800, margin: "0 0 4px" }}>{line}</p>
            <p style={{ fontSize: 15, margin: "0 0 8px" }}>
              Answer: {q.options[q.answer]}. {q.why}
            </p>
            <button style={btn} onClick={next}>
              {ended ? "See the result 🏁" : "⚔ Next attack"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
