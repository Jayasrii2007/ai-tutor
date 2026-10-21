import { useState } from "react";
import Learn from "./Learn.jsx";

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

export default function App() {
  const [tab, setTab] = useState("home");
  const [data, setData] = useState(load());

  function addXP(amount) {
    setData((old) => {
      let streak = old.streak;
      if (old.lastDay !== today()) {
        streak = old.lastDay === yesterday() ? old.streak + 1 : 1;
      }
      const next = { xp: old.xp + amount, streak, lastDay: today() };
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
  ];

  const tabs = [
    { id: "home", icon: "🏠", label: "Home" },
    { id: "learn", icon: "📖", label: "Learn" },
    { id: "games", icon: "🎮", label: "Games" },
    { id: "friends", icon: "👥", label: "Friends" },
    { id: "profile", icon: "👤", label: "Profile" },
  ];

  return (
    <div className="phone">
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
            <h2 className="hello">Hi there 👋</h2>
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
          <Learn addXP={addXP} />
        </div>

        {tab === "games" && (
          <div className="soon">
            <div className="big">🎮</div>
            <h2>Games and coding challenges</h2>
            <p>Coming soon. Learn concepts by playing and earn XP.</p>
          </div>
        )}

        {tab === "friends" && (
          <div className="soon">
            <div className="big">👥</div>
            <h2>Study with friends</h2>
            <p>Coming soon. Add friends and study together.</p>
          </div>
        )}

        {tab === "profile" && (
          <div>
            <div className="soon">
              <div className="big">👤</div>
              <h2>Your profile</h2>
              <p>Login and learning history are coming soon.</p>
            </div>
            <div className="card">
              <p>Level: <b>{level}</b></p>
              <p>Total XP: <b>{data.xp}</b></p>
              <p>Streak: <b>{streak} days</b></p>
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