import Tutor from "./Tutor.jsx";

const palettes = [
  ["#1e3c72", "#2a5298"],
  ["#42275a", "#734b6d"],
  ["#134e5e", "#2f8f6b"],
  ["#c33764", "#1d2671"],
  ["#d9480f", "#e67700"],
  ["#0f2027", "#2c5364"],
];

const nodeColors = ["#ff8787", "#ffc078", "#8ce99a", "#74c0fc", "#e599f7", "#ffe066"];

export default function VideoStage({ scene, index, total, shown, progress, speaking, mood }) {
  const labels = scene.diagram || [];
  const emojis = scene.emojis || [];
  const p = palettes[index % palettes.length];

  return (
    <div>
      <div
        style={{
          background: "linear-gradient(135deg, " + p[0] + ", " + p[1] + ")",
          color: "white",
          borderRadius: 16,
          padding: 20,
          minHeight: 340,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Tutor speaking={speaking} mood={mood} />
          <div>
            <p style={{ margin: 0, opacity: 0.8 }}>
              Scene {index + 1} of {total}
            </p>
            <h2 style={{ margin: "4px 0 0" }}>{scene.title}</h2>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, minHeight: 110, marginTop: 12 }}>
          {labels.map((label, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                opacity: i < shown ? 1 : 0,
                transform: i < shown ? "scale(1)" : "scale(0.5)",
                transition: "all 0.6s",
              }}
            >
              <div
                style={{
                  background: nodeColors[i % nodeColors.length],
                  borderRadius: 14,
                  padding: "10px 14px",
                  fontWeight: 700,
                  textAlign: "center",
                  color: "#222",
                }}
              >
                <div style={{ fontSize: 34 }}>{emojis[i] || "✨"}</div>
                <div>{label}</div>
              </div>
              {i < labels.length - 1 && <span style={{ fontSize: 26 }}>➜</span>}
            </div>
          ))}
        </div>

        <p
          style={{
            marginTop: 16,
            fontSize: 17,
            lineHeight: 1.6,
            background: "rgba(0,0,0,0.25)",
            padding: 12,
            borderRadius: 10,
          }}
        >
          {scene.narration}
        </p>
      </div>

      <div style={{ background: "#e3dbff", borderRadius: 8, height: 8, margin: "12px 0" }}>
        <div
          style={{
            background: "#7c4dff",
            height: 8,
            borderRadius: 8,
            width: progress * 100 + "%",
            transition: "width 0.5s",
          }}
        />
      </div>
    </div>
  );
}