import { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase.js";
import Learn from "./Learn.jsx";
import Avatar from "./Avatar.jsx";
import Coding from "./Coding.jsx";
import Boss from "./Boss.jsx";
import Friends from "./Friends.jsx";
import StudyRoom from "./StudyRoom.jsx";
function today() {
  return new Date().toDateString();
}

function yesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toDateString();
}

function load() {
  try {
    return JSON.parse(localStorage.getItem("aitutor")) || { xp: 0, streak: 0, lastDay: "" };
  } catch (e) {
    return { xp: 0, streak: 0, lastDay: "" };
  }
}

export default function App({ profile, uid, onLogout }) {
  const [tab, setTab] = useState("home");
  const [data, setData] = useState(
    profile
      ? { xp: profile.xp || 0, streak: profile.streak || 0, lastDay: profile.lastDay || "", concepts: profile.concepts || 0 }
      : load()
  );
  const [gameTab, setGameTab] = useState("boss");
  const [friendsTab, setFriendsTab] = useState("list");
    const [focus, setFocus] = useState(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!focus) return;
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [focus]);

  function startFocus() {
    const ok = window.confirm(
      "For the best focus, turn on Do Not Disturb on your device so nothing interrupts you. Start focus mode?"
    );
    if (!ok) return;
    setTab("learn");
    setFocus(Date.now());
    try {
      document.documentElement.requestFullscreen();
    } catch (e) {}
  }

  function endFocus() {
    const mins = Math.floor((Date.now() - focus) / 60000);
    setFocus(null);
    try {
      if (document.fullscreenElement) document.exitFullscreen();
    } catch (e) {}
    if (mins >= 1) {
      const gain = Math.min(mins, 30);
      addXP(gain);
      window.alert("Great focus! " + mins + " minutes. +" + gain + " XP 🎯");
    }
  }
  useEffect(() => {
    if (!uid) return;
    updateDoc(doc(db, "users", uid), {
      xp: data.xp,
      streak: data.streak,
      lastDay: data.lastDay,
      concepts: data.concepts || 0,
    }).catch(() => {});
  }, [data.xp, data.streak, data.lastDay, data.concepts]);
  function addXP(amount) {
    setData((old) => {
      let streak = old.streak;
      if (old.lastDay !== today()) {
        streak = old.lastDay === yesterday() ? old.streak + 1 : 1;
      }
            const next = { ...old, xp: old.xp + amount, streak, lastDay: today() };
      localStorage.setItem("aitutor", JSON.stringify(next));
      return next;
    });
  }
  function masterConcept() {
    setData((old) => {
      const next = { ...old, concepts: (old.concepts || 0) + 1 };
      localStorage.setItem("aitutor", JSON.stringify(next));
      return next;
    });
  }
  const level = Math.floor(data.xp / 100) + 1;
  const intoLevel = data.xp % 100;
  const streak = data.lastDay === today() || data.lastDay === yesterday() ? data.streak : 0;

  const badges = [
    { icon: "🌱", name: "First steps", got: data.xp >= 10 },
    { icon: "📚", name: "Level 2", got: level >= 2 },
    { icon: "🔥", name: "3 day streak", got: streak >= 3 },
    { icon: "🧠", name: "Concept Master", got: (data.concepts || 0) >= 1 },
  ];

  const tabs = [
    { id: "home", icon: "🏠", label: "Home" },
    { id: "learn", icon: "📖", label: "Learn" },
    { id: "games", icon: "🎮", label: "Games" },
    { id: "friends", icon: "👥", label: "Friends" },
    { id: "profile", icon: "👤", label: "Profile" },
  ];

  return (
        <div className={"phone" + (focus ? " focus" : "")}>
                {focus && (
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            background: "#1e1b3a",
            color: "white",
            padding: "10px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>
            🎯 Focus mode · ⏱{" "}
            {String(Math.floor((Date.now() - focus) / 60000)).padStart(2, "0")}:
            {String(Math.floor((Date.now() - focus) / 1000) % 60).padStart(2, "0")}
          </span>
          <button
            onClick={endFocus}
            style={{ padding: "6px 14px", fontSize: 15, borderRadius: 16, border: "none", cursor: "pointer" }}
          >
            Exit
          </button>
        </div>
      )}
      <div className="topbar">
        <div className="logo">🎓 AI Tutor</div>
        <div className="pills">
          <span className="pill fire">🔥 {streak}</span>
          <span className="pill xp">⭐ {data.xp} XP</span>
        </div>
      </div>

      <div className="content">
        {tab === "home" && (
          <div>
            <h2 className="hello">Hi {profile ? profile.name : "there"} 👋</h2>
            <p className="sub">Ready to learn something new today?</p>

            <div className="card level">
              <div className="row">
                <b>Level {level}</b>
                <span>{intoLevel} / 100 XP</span>
              </div>
              <div className="bar"><div className="fill" style={{ width: intoLevel + "%" }} /></div>
            </div>

            <div className="card streak">
              <div className="big">🔥 {streak} day streak</div>
              <p className="sub">Learn something every day to keep it growing.</p>
            </div>

            <div className="card mission">
              <b>🎯 Today's mission</b>
              <p>Learn one topic and finish the quiz.</p>
              <button className="main-btn" onClick={() => setTab("learn")}>Start learning</button>
                            <button className="main-btn" style={{ marginLeft: 8, background: "#1e1b3a" }} onClick={startFocus}>
                🎯 Focus mode
              </button>
            </div>

            <h3>Your badges</h3>
            <div className="badges">
              {badges.map((b) => (
                <div key={b.name} className={"badge " + (b.got ? "on" : "off")}>
                  <div className="badge-icon">{b.got ? b.icon : "🔒"}</div>
                  <div>{b.name}</div>
                </div>
              ))}
            </div>
          </div>
       )}

        <div style={{ display: tab === "learn" ? "block" : "none" }}>
          <Learn addXP={addXP} onMaster={masterConcept} />
        </div>

                        {tab === "games" && (
          <div>
            <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
              {[
                { id: "boss", label: "👾 Boss" },
                
                { id: "coding", label: "💻 Coding" },
              ].map((g) => (
                <button
                  key={g.id}
                  onClick={() => setGameTab(g.id)}
                  style={{ flex: 1, padding: 10, fontSize: 14, fontWeight: 700, borderRadius: 12, cursor: "pointer", border: "2px solid #7c4dff", background: gameTab === g.id ? "#7c4dff" : "white", color: gameTab === g.id ? "white" : "#7c4dff" }}
                >
                  {g.label}
                </button>
              ))}
            </div>
            {gameTab === "boss" && <Boss addXP={addXP} />}
            
            {gameTab === "coding" && <Coding addXP={addXP} />}
          </div>
        )}
        
                {tab === "friends" && profile && (
          <div>
            <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
              {[
                { id: "list", label: "👥 Friends" },
                { id: "room", label: "🏫 Study room" },
              ].map((g) => (
                <button
                  key={g.id}
                  onClick={() => setFriendsTab(g.id)}
                  style={{ flex: 1, padding: 10, fontSize: 14, fontWeight: 700, borderRadius: 12, cursor: "pointer", border: "2px solid #7c4dff", background: friendsTab === g.id ? "#7c4dff" : "white", color: friendsTab === g.id ? "white" : "#7c4dff" }}
                >
                  {g.label}
                </button>
              ))}
            </div>
            {friendsTab === "list" && (
              <Friends uid={uid} profile={profile} me={{ name: profile.name, xp: data.xp, streak }} />
            )}
            {friendsTab === "room" && <StudyRoom uid={uid} profile={profile} />}
          </div>
        )}
        {tab === "profile" && (
          <div>
                        {profile && (
              <div className="card">
                <p style={{ margin: "0 0 6px", fontSize: 20 }}><b>{profile.name}</b></p>
                <p style={{ margin: "0 0 6px" }}>🎓 {profile.college}</p>
                <p style={{ margin: "0 0 6px" }}>🎯 Goal: {profile.goal}</p>
                <p style={{ margin: "0 0 10px" }}>🔑 Your friend code: <b>{profile.friendCode}</b></p>
                <button className="main-btn" onClick={onLogout}>Log out</button>
              </div>
            )}
                        <Avatar xp={data.xp} />
            <div className="soon">
              <div className="big">👤</div>
              <h2>Your profile</h2>
              <p>Login and learning history are coming soon.</p>
            </div>
            <div className="card">
              <p>Level: <b>{level}</b></p>
              <p>Total XP: <b>{data.xp}</b></p>
              <p>Concepts mastered: <b>{data.concepts || 0}</b> 🧠</p>
            </div>
          </div>
        )}
      </div>

      <div className="nav">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={"nav-btn " + (tab === t.id ? "active" : "")}
            onClick={() => setTab(t.id)}
          >
            <span className="nav-icon">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}