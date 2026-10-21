import { useState } from "react";

const outfits = [
  { id: "student", name: "Student", icon: "🧑‍🎓", color: "#ede7ff", need: 0 },
  { id: "cool", name: "Cool shades", icon: "😎", color: "#e0f4ff", need: 50 },
  { id: "wizard", name: "Wizard", icon: "🧙", color: "#f3e5ff", need: 100 },
  { id: "hero", name: "Superhero", icon: "🦸", color: "#ffe5e5", need: 200 },
  { id: "king", name: "Champion", icon: "👑", color: "#fff6cc", need: 400 },
];

const accessories = [
  { id: "none", name: "None", icon: "➖", need: 0 },
  { id: "music", name: "Headphones", icon: "🎧", need: 30 },
  { id: "star", name: "Star", icon: "⭐", need: 150 },
  { id: "fire", name: "Fire", icon: "🔥", need: 300 },
];

function loadChoice() {
  try {
    return JSON.parse(localStorage.getItem("aitutor-avatar")) || { outfit: "student", accessory: "none" };
  } catch (e) {
    return { outfit: "student", accessory: "none" };
  }
}

export default function Avatar({ xp }) {
  const [choice, setChoice] = useState(loadChoice());

  function save(next) {
    setChoice(next);
    localStorage.setItem("aitutor-avatar", JSON.stringify(next));
  }

  const outfit = outfits.find((o) => o.id === choice.outfit) || outfits[0];
  const accessory = accessories.find((a) => a.id === choice.accessory) || accessories[0];

  const itemStyle = (unlocked, selected, bg) => ({
    flex: "1 1 90px",
    textAlign: "center",
    padding: "10px 6px",
    borderRadius: 14,
    border: selected ? "3px solid #7c4dff" : "1px solid #ddd",
    background: unlocked ? bg : "#f1f1f1",
    color: unlocked ? "#222" : "#999",
    cursor: unlocked ? "pointer" : "not-allowed",
    fontSize: 13,
    fontWeight: 600,
  });

  return (
    <div style={{ textAlign: "center", marginBottom: 20 }}>
      <div
        style={{
          position: "relative",
          width: 140,
          height: 140,
          margin: "10px auto",
          borderRadius: "50%",
          background: outfit.color,
          border: "4px solid #7c4dff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 72,
        }}
      >
        {outfit.icon}
        {accessory.id !== "none" && (
          <span style={{ position: "absolute", top: -6, right: -6, fontSize: 36 }}>
            {accessory.icon}
          </span>
        )}
      </div>

      <h3 style={{ margin: "4px 0 16px" }}>Your avatar</h3>

      <p style={{ textAlign: "left", fontWeight: 700, margin: "8px 0" }}>Outfits</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {outfits.map((o) => {
          const unlocked = xp >= o.need;
          return (
            <div
              key={o.id}
              style={itemStyle(unlocked, choice.outfit === o.id, o.color)}
              onClick={() => unlocked && save({ ...choice, outfit: o.id })}
            >
              <div style={{ fontSize: 32 }}>{unlocked ? o.icon : "🔒"}</div>
              <div>{o.name}</div>
              <div style={{ fontWeight: 400 }}>
                {unlocked ? "Unlocked" : o.need - xp + " XP to go"}
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ textAlign: "left", fontWeight: 700, margin: "16px 0 8px" }}>Accessories</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {accessories.map((a) => {
          const unlocked = xp >= a.need;
          return (
            <div
              key={a.id}
              style={itemStyle(unlocked, choice.accessory === a.id, "#fff")}
              onClick={() => unlocked && save({ ...choice, accessory: a.id })}
            >
              <div style={{ fontSize: 28 }}>{unlocked ? a.icon : "🔒"}</div>
              <div>{a.name}</div>
              <div style={{ fontWeight: 400 }}>
                {unlocked ? "Unlocked" : a.need - xp + " XP to go"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}