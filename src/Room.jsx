import { useState, useEffect, useRef } from "react";
import {
  doc,
  onSnapshot,
  updateDoc,
  collection,
  addDoc,
  query,
  orderBy,
  limitToLast,
} from "firebase/firestore";
import { db } from "./firebase.js";

export default function Room({ code, uid, profile, onLeave }) {
  const [room, setRoom] = useState(null);
  const [missing, setMissing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [now, setNow] = useState(Date.now());
  const [copied, setCopied] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "rooms", code),
      (snap) => {
        if (snap.exists()) {
          setRoom(snap.data());
          setMissing(false);
        } else {
          setMissing(true);
        }
      },
      () => setMissing(true)
    );
    return unsub;
  }, [code]);

  useEffect(() => {
    const q = query(collection(db, "rooms", code, "messages"), orderBy("at"), limitToLast(50));
    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [code]);

  useEffect(() => {
    function beat() {
      updateDoc(doc(db, "rooms", code), {
        ["members." + uid + ".seen"]: Date.now(),
        ["members." + uid + ".name"]: profile.name,
      }).catch(() => {});
    }
    beat();
    const a = setInterval(beat, 10000);
    const b = setInterval(() => setNow(Date.now()), 5000);
    return () => {
      clearInterval(a);
      clearInterval(b);
    };
  }, [code]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const stepNumber = room ? room.step || 0 : 0;

  useEffect(() => {
    window.speechSynthesis.cancel();
  }, [stepNumber]);

  useEffect(() => {
    return () => window.speechSynthesis.cancel();
  }, []);

  const btn = { padding: "10px 18px", fontSize: 16, marginRight: 8, marginBottom: 8, cursor: "pointer" };

  if (missing) {
    return (
      <div>
        <p>This room was not found. It may have been deleted.</p>
        <button style={btn} onClick={onLeave}>⬅ Back</button>
      </div>
    );
  }

  if (!room) return <p>Joining the room...</p>;

  const steps = room.steps || [];
  const isHost = room.hostId === uid;
  const current = Math.min(stepNumber, Math.max(steps.length - 1, 0));
  const s = steps[current];
  const members = Object.entries(room.members || {}).map(([id, m]) => ({
    id,
    name: m.name,
    online: now - (m.seen || 0) < 30000,
  }));

  function go(n) {
    if (!isHost || n < 0 || n >= steps.length) return;
    updateDoc(doc(db, "rooms", code), { step: n }).catch(() => {});
  }

  function readAloud() {
    if (!s) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(s.title + ". " + s.text);
    u.lang = "en-IN";
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  }

  async function send() {
    const t = text.trim();
    if (!t) return;
    setText("");
    try {
      await addDoc(collection(db, "rooms", code, "messages"), {
        uid,
        name: profile.name,
        text: t.slice(0, 300),
        at: Date.now(),
      });
    } catch (e) {}
  }

  function copyCode() {
    try {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {}
  }

  return (
    <div>
      <div className="card">
        <p style={{ margin: "0 0 4px", color: "#666" }}>Room code (share it with friends)</p>
        <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: 5, color: "#7c4dff" }}>{code}</div>
        <button style={{ ...btn, marginTop: 8 }} onClick={copyCode}>
          {copied ? "✅ Copied!" : "📋 Copy code"}
        </button>
        <p style={{ margin: 0 }}>
          <b>{room.topic}</b>
          {room.textbook ? " · " + room.textbook : ""}
        </p>
      </div>

      <div className="card">
        <b>👥 In this class ({members.length})</b>
        {members.map((m) => (
          <div key={m.id} style={{ marginTop: 6 }}>
            {m.online ? "🟢" : "⚪"} {m.name}
            {m.id === room.hostId ? " 👑" : ""}
            {m.id === uid ? " (you)" : ""}
          </div>
        ))}
      </div>

      {s && (
        <div style={{ border: "2px solid #7c4dff", borderRadius: 16, padding: 16, marginBottom: 14, background: "#fff" }}>
          <div style={{ background: "#e3dbff", borderRadius: 8, height: 8, marginBottom: 12 }}>
            <div
              style={{
                background: "#7c4dff",
                height: 8,
                borderRadius: 8,
                width: ((current + 1) / steps.length) * 100 + "%",
                transition: "width 0.5s",
              }}
            />
          </div>
          <p style={{ margin: 0, color: "#666" }}>
            Step {current + 1} of {steps.length}
          </p>
          <h2 style={{ margin: "6px 0" }}>{s.title}</h2>
          <p style={{ fontSize: 18, lineHeight: 1.7 }}>{s.text}</p>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, margin: "12px 0" }}>
            {(s.diagram || []).map((label, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ background: "#ede7ff", border: "2px solid #7c4dff", borderRadius: 10, padding: "8px 12px", fontWeight: 700 }}>
                  {label}
                </div>
                {i < s.diagram.length - 1 && <span style={{ fontSize: 22, color: "#7c4dff" }}>→</span>}
              </div>
            ))}
          </div>

          <button style={btn} onClick={readAloud}>🔊 Read aloud</button>
          {isHost ? (
            <span>
              <button style={btn} disabled={current === 0} onClick={() => go(current - 1)}>⬅ Back</button>
              <button style={btn} disabled={current >= steps.length - 1} onClick={() => go(current + 1)}>Next ➡</button>
            </span>
          ) : (
            <p style={{ color: "#666", margin: 0 }}>
              👑 {room.hostName} is leading the class. The page moves when they click Next.
            </p>
          )}
        </div>
      )}

      <div className="card">
        <b>💬 Class chat</b>
        <div
          ref={chatRef}
          style={{ height: 180, overflowY: "auto", background: "white", borderRadius: 10, padding: 8, margin: "8px 0", border: "1px solid #e3dbff" }}
        >
          {messages.length === 0 && <p style={{ color: "#888", margin: 0 }}>Say hi to your classmates! 👋</p>}
          {messages.map((m) => (
            <div key={m.id} style={{ marginBottom: 6, textAlign: m.uid === uid ? "right" : "left" }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "6px 10px",
                  borderRadius: 12,
                  background: m.uid === uid ? "#7c4dff" : "#f1edff",
                  color: m.uid === uid ? "white" : "#222",
                  maxWidth: "85%",
                  textAlign: "left",
                }}
              >
                {m.uid !== uid && <b>{m.name}: </b>}
                {m.text}
              </span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type a message"
            style={{ flex: 1, padding: 10, fontSize: 16, borderRadius: 10, border: "1px solid #ccc", minWidth: 0 }}
          />
          <button style={{ ...btn, margin: 0 }} onClick={send}>Send</button>
        </div>
      </div>

      <button style={btn} onClick={onLeave}>🚪 Leave the room</button>
    </div>
  );
}