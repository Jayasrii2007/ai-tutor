import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase.js";

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let c = "";
  for (let i = 0; i < 6; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}

export default function Complete({ uid, onProfile, onLogout, notice }) {
  const [name, setName] = useState("");
  const [college, setCollege] = useState("");
  const [goal, setGoal] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function save() {
    setMsg("");
    if (!name.trim() || !college.trim() || !goal.trim()) {
      setMsg("Please fill in your name, college and goal.");
      return;
    }
    setBusy(true);
    const profile = {
      name: name.trim(),
      college: college.trim(),
      goal: goal.trim(),
      friendCode: makeCode(),
      xp: 0,
      streak: 0,
      lastDay: "",
      concepts: 0,
      friends: [],
      createdAt: Date.now(),
    };
    try {
      await setDoc(doc(db, "users", uid), profile);
      onProfile(profile);
    } catch (e) {
      setMsg(
        "Could not save your details (" +
          (e.code || e.message) +
          "). Check that the Firestore database is created and in test mode."
      );
    }
    setBusy(false);
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
    <div className="phone">
      <div className="topbar">
        <div className="logo">🎓 AI Tutor</div>
      </div>

      <div className="content">
        <h2 className="hello">Almost done! 🎉</h2>
        <p className="sub">Tell us about you to finish your account.</p>

        <input style={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        <input style={input} value={college} onChange={(e) => setCollege(e.target.value)} placeholder="College or school" />
        <input style={input} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Your goal (for example: become a software developer)" />

        <button className="main-btn" onClick={save} disabled={busy} style={{ width: "100%" }}>
          {busy ? "Saving..." : "Save my details"}
        </button>

        {msg && <p style={{ color: "#c92a2a", fontWeight: 700 }}>{msg}</p>}
        {notice && <p style={{ color: "#c92a2a", fontWeight: 700 }}>{notice}</p>}

        <p style={{ marginTop: 16 }}>
          <button onClick={onLogout} style={{ background: "none", border: "none", color: "#7c4dff", cursor: "pointer", fontSize: 15 }}>
            Log out
          </button>
        </p>
      </div>
    </div>
  );
}