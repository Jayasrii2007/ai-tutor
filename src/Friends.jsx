import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  limit,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "./firebase.js";

function today() {
  return new Date().toDateString();
}

function yesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toDateString();
}

function liveStreak(p) {
  return p.lastDay === today() || p.lastDay === yesterday() ? p.streak || 0 : 0;
}

const medals = ["🥇", "🥈", "🥉"];

export default function Friends({ uid, profile, me }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const mine = await getDoc(doc(db, "users", uid));
      const ids = mine.exists() ? mine.data().friends || [] : [];
      const docs = await Promise.all(ids.map((id) => getDoc(doc(db, "users", id))));
      setList(docs.filter((d) => d.exists()).map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      setMsg("Could not load your friends. Check your internet.");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addFriend() {
    const c = code.trim().toUpperCase();
    setMsg("");
    if (!c) return;
    if (c === profile.friendCode) {
      setMsg("That is your own code 😄");
      return;
    }
    setBusy(true);
    try {
      const snap = await getDocs(
        query(collection(db, "users"), where("friendCode", "==", c), limit(1))
      );
      if (snap.empty) {
        setMsg("No student found with that code. Check it and try again.");
      } else {
        const friend = snap.docs[0];
        if (list.some((f) => f.id === friend.id)) {
          setMsg("You are already friends 🙂");
        } else {
          await updateDoc(doc(db, "users", uid), { friends: arrayUnion(friend.id) });
          await updateDoc(doc(db, "users", friend.id), { friends: arrayUnion(uid) });
          setMsg("You and " + friend.data().name + " are now friends! 🎉");
          setCode("");
          await load();
        }
      }
    } catch (e) {
      setMsg("Something went wrong (" + (e.code || e.message) + ").");
    }
    setBusy(false);
  }

  function copyCode() {
    try {
      navigator.clipboard.writeText(profile.friendCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {}
  }

  const board = [
    { id: uid, name: me.name, college: profile.college, xp: me.xp, streak: me.streak, mine: true },
    ...list.map((f) => ({
      id: f.id,
      name: f.name,
      college: f.college,
      xp: f.xp || 0,
      streak: liveStreak(f),
    })),
  ].sort((a, b) => b.xp - a.xp);

  const btn = { padding: "10px 18px", fontSize: 16, marginRight: 8, marginBottom: 8, cursor: "pointer" };

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>👥 Friends</h2>

      <div className="card">
        <p style={{ margin: "0 0 6px" }}>Your friend code</p>
        <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: 4, color: "#7c4dff" }}>
          {profile.friendCode}
        </div>
        <button style={{ ...btn, marginTop: 8 }} onClick={copyCode}>
          {copied ? "✅ Copied!" : "📋 Copy code"}
        </button>
        <p style={{ margin: 0, color: "#666", fontSize: 14 }}>Share this code with your friends.</p>
      </div>

      <div className="card">
        <p style={{ margin: "0 0 8px" }}>
          <b>Add a friend</b>
        </p>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Type your friend's code"
          style={{ display: "block", width: "100%", padding: 12, fontSize: 16, boxSizing: "border-box", marginBottom: 10, borderRadius: 10, border: "1px solid #ccc", textTransform: "uppercase" }}
        />
        <button className="main-btn" onClick={addFriend} disabled={busy || !code.trim()}>
          {busy ? "Adding..." : "➕ Add friend"}
        </button>
        {msg && <p style={{ fontWeight: 700 }}>{msg}</p>}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: "12px 0" }}>🏆 Leaderboard</h3>
        <button style={btn} onClick={load}>🔄 Refresh</button>
      </div>

      {loading && <p>Loading...</p>}

      {board.map((p, i) => (
        <div
          key={p.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: 12,
            marginBottom: 8,
            borderRadius: 14,
            background: p.mine ? "#fff8d6" : "#f7f4ff",
            border: "1px solid " + (p.mine ? "#f3dd7a" : "#e3dbff"),
          }}
        >
          <div style={{ fontSize: 26, width: 36, textAlign: "center" }}>{medals[i] || i + 1}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800 }}>
              {p.name} {p.mine ? "(you)" : ""}
            </div>
            <div style={{ color: "#666", fontSize: 13 }}>
              {p.college} · Level {Math.floor(p.xp / 100) + 1}
            </div>
          </div>
          <div style={{ textAlign: "right", fontWeight: 700 }}>
            <div>⭐ {p.xp}</div>
            <div>🔥 {p.streak}</div>
          </div>
        </div>
      ))}

      {!loading && list.length === 0 && (
        <p style={{ color: "#666" }}>No friends yet. Add a friend with their code to start the race! 🏁</p>
      )}
    </div>
  );
}