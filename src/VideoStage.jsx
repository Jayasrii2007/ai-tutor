export default function VideoStage({ scene, index, total, shown, progress }) {
  const labels = scene.diagram || [];
  return (
    <div>
      <div style={{ background: "#1e1b3a", color: "white", borderRadius: 16, padding: 20, minHeight: 300 }}>
        <p style={{ margin: 0, opacity: 0.7 }}>
          Scene {index + 1} of {total}
        </p>
        <h2 style={{ margin: "6px 0 16px" }}>{scene.title}</h2>

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, minHeight: 70 }}>
          {labels.map((label, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                opacity: i < shown ? 1 : 0,
                transform: i < shown ? "scale(1)" : "scale(0.6)",
                transition: "all 0.6s",
              }}
            >
              <div style={{ background: "#7c4dff", borderRadius: 10, padding: "10px 14px", fontWeight: 700 }}>
                {label}
              </div>
              {i < labels.length - 1 && <span style={{ fontSize: 24 }}>→</span>}
            </div>
          ))}
        </div>

        <p style={{ marginTop: 20, fontSize: 17, lineHeight: 1.6, background: "rgba(255,255,255,0.1)", padding: 12, borderRadius: 10 }}>
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