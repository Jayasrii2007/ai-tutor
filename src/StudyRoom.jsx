import { useState } from "react";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase.js";
import Room from "./Room.jsx";

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let c = "";
  for (let i = 0; i < 5; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}

export default function StudyRoom({ uid, profile }) {
  const [roomCode, setRoomCode] = useState(localStorage.getItem("aitutor-room") || "");
  const [textbook, setTextbook] = useState("");
  const [topic, setTopic] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  function leave() {
    localStorage.removeItem("aitutor-room");
    setRoomCode("");
    setMsg("");
  }

  async function createRoom() {
    if (!topic.trim()) return;
    setBusy(true);
    setMsg("");
    try {
      const url =
        "http://localhost:3001/lesson" +
        "?textbook=" + encodeURIComponent(textbook) +
        "&topic=" + encodeURIComponent(topic);
      const res = await fetch(url);
      const data = await res.json();
      if (!data.steps || !data.steps.length) {
        setMsg(data.error || "Something went wrong");
        setBusy(false);
        return;
      }
      const steps = data.steps.map((s) => ({
        title: s.title || "",
        text: s.text || "",
        diagram: Array.isArray(s.diagram) ? s.diagram : [],
      }));
      let rc = makeCode();
      for (let i = 0; i < 5; i++) {
        const snap = await getDoc(doc(db, "rooms", rc));
        if (!snap.exists()) break;
        rc = makeCode();
      }
      await setDoc(doc(db, "rooms", rc), {
        code: rc,
        hostId: uid,
        hostName: profile.name,
        textbook: textbook.trim(),
        topic: topic.trim(),
        steps,
        step: 0,
        members: { [uid]: { name: profile.name, seen: Date.now() } },
        createdAt: Date.now(),
      });
      localStorage.setItem("aitutor-room", rc);
      setRoomCode(rc);
    } catch (e) {
      setMsg("Could not create the room (" + (e.code || e.message) + ").");
    }
    setBusy(false);
  }

  async function joinRoom() {
    const c = joinCode.trim().toUpperCase();
    if (!c) return;
    setBusy(true);
    setMsg("");
    try {
      const ref = doc(db, "rooms", c);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        setMsg("No room with that code. Check it and try again.");
      } else {
        await updateDoc(ref, { ["members." + uid]: { name: profile.name, seen: Date.now() } });
        localStorage.setItem("aitutor-room", c);
        setRoomCode(c);
      }
    } catch (e) {
      setMsg("Could not join the room (" + (e.code || e.message) + ").");
    }
    setBusy(false);
  }

  if (roomCode) {
    return <Room code={roomCode} uid={uid} profile={profile} onLeave={leave} />;
  }

  const input = {
    display: "block",
    width: "100%",
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
    boxSizing: "border-box",
    borderRadius: 10,
    border: "1px solid #ccc",
  };

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>🏫 Study room</h2>
      <p className="sub">Learn the same lesson together with your friends, like a real class.</p>

      <div className="card">
        <p style={{ margin: "0 0 8px" }}><b>Start a class</b></p>
        <input style={input} value={textbook} onChange={(e) => setTextbook(e.target.value)} placeholder="Textbook name" />
        <input style={input} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic" />
        <button className="main-btn" onClick={createRoom} disabled={busy || !topic.trim()}>
          {busy ? "Please wait..." : "🏫 Create room"}
        </button>
        {busy && <p>Making your lesson... about 10 seconds.</p>}
      </div>

      <div className="card">
        <p style={{ margin: "0 0 8px" }}><b>Join a class</b></p>
        <input
          style={{ ...input, textTransform: "uppercase" }}
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          placeholder="Room code"
        />
        <button className="main-btn" onClick={joinRoom} disabled={busy || !joinCode.trim()}>
          🚪 Join room
        </button>
      </div>

      {msg && <p style={{ color: "#c92a2a", fontWeight: 700 }}>{msg}</p>}
    </div>
  );
}