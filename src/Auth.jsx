import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase.js";

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let c = "";
  for (let i = 0; i < 6; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}

function friendly(code) {
  if (code === "auth/email-already-in-use") return "This email already has an account. Try logging in.";
  if (code === "auth/invalid-email") return "That email does not look right.";
  if (code === "auth/weak-password") return "Password must be at least 6 characters.";
  if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
    return "Email or password is wrong.";
  }
  if (code === "auth/network-request-failed") return "No internet. Please check your connection.";
  if (code === "auth/operation-not-allowed") return "Email login is not turned on in Firebase yet.";
  return "Something went wrong (" + code + "). Try again.";
}

export default function Auth({ onProfile, notice }) {
  const [mode, setMode] = useState("signup");
  const [name, setName] = useState("");
  const [college, setCollege] = useState("");
  const [goal, setGoal] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit() {
    setMsg("");
    if (!email.trim() || !password) {
      setMsg("Please enter your email and password.");
      return;
    }
    if (mode === "signup" && (!name.trim() || !college.trim() || !goal.trim())) {
      setMsg("Please fill in your name, college and goal.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {

        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
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
          await setDoc(doc(db, "users", cred.user.uid), profile);
          onProfile(profile);
        } catch (e) {
          setMsg(
            "Your account was created, but saving your details failed. Check that the Firestore database is created. (" +
              (e.code || e.message) +
              ")"
          );
        }
      }
    } catch (e) {
      setMsg(friendly(e.code || ""));
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

  const tab = (active) => ({
    flex: 1,
    padding: 10,
    fontSize: 15,
    fontWeight: 700,
    borderRadius: 12,
    cursor: "pointer",
    border: "2px solid #7c4dff",
    background: active ? "#7c4dff" : "white",
    color: active ? "white" : "#7c4dff",
  });

  return (
    <div className="phone">
      <div className="topbar">
        <div className="logo">🎓 AI Tutor</div>
      </div>

      <div className="content">
        <h2 className="hello">{mode === "signup" ? "Create your account" : "Welcome back 👋"}</h2>
        <p className="sub">
          {mode === "signup"
            ? "Learn with an AI teacher who changes the way it teaches, just for you."
            : "Log in to continue your learning and your streak."}
        </p>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button style={tab(mode === "signup")} onClick={() => setMode("signup")}>Sign up</button>
          <button style={tab(mode === "login")} onClick={() => setMode("login")}>Log in</button>
        </div>

        {mode === "signup" && (
          <div>
            <input style={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            <input style={input} value={college} onChange={(e) => setCollege(e.target.value)} placeholder="College or school" />
            <input style={input} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Your goal (for example: become a software developer)" />
          </div>
        )}

        <input style={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input style={input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (at least 6 characters)" />

        <button className="main-btn" onClick={submit} disabled={busy} style={{ width: "100%" }}>
          {busy ? "Please wait..." : mode === "signup" ? "Create my account" : "Log in"}
        </button>

        {msg && <p style={{ color: "#c92a2a", fontWeight: 700 }}>{msg}</p>}
        {notice && <p style={{ color: "#c92a2a", fontWeight: 700 }}>{notice}</p>}

        {mode === "signup" && (
          <p style={{ color: "#666", fontSize: 13 }}>
            We use your details only for your profile and to let friends find you. Never share your password with anyone.
          </p>
        )}
      </div>
    </div>
  );
}