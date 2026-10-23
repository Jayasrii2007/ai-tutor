export default function Tutor({ speaking, mood }) {
  const sad = mood === "sad";
  const think = mood === "think";
  const eyebrow = { stroke: "#3b2a20", strokeWidth: 3, strokeLinecap: "round", fill: "none" };
  const animBox = { transformBox: "fill-box", transformOrigin: "center" };

  let label = "Teacher";
  if (sad) label = "Not quite!";
  else if (think) label = "Thinking...";
  else if (speaking) label = "Teaching...";

  return (
    <div style={{ textAlign: "center", flexShrink: 0 }}>
      <style>{`
        @keyframes talk { 0%, 100% { transform: scaleY(0.25); } 50% { transform: scaleY(1); } }
        @keyframes bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        @keyframes blink { 0%, 92%, 100% { transform: scaleY(1); } 96% { transform: scaleY(0.1); } }
      `}</style>

      <svg
        width="110"
        height="125"
        viewBox="0 0 120 135"
        style={{ animation: speaking ? "bob 0.8s infinite" : "none" }}
      >
        <rect x="22" y="92" width="76" height="43" rx="22" fill="#ffd43b" />
        <circle cx="60" cy="54" r="40" fill="#ffd9a8" />
        <path d="M20 52 Q22 8 60 8 Q98 8 100 52 Q86 26 60 26 Q34 26 20 52 Z" fill="#3b2a20" />

        <g style={{ ...animBox, animation: "blink 4s infinite" }}>
          <circle cx="45" cy="56" r="5" fill="#222" />
          <circle cx="75" cy="56" r="5" fill="#222" />
        </g>

        {sad ? (
          <g>
            <path d="M36 44 L54 49" style={eyebrow} />
            <path d="M84 44 L66 49" style={eyebrow} />
            <ellipse cx="40" cy="70" rx="3" ry="5" fill="#4dabf7" />
            <path d="M46 88 Q60 74 74 88" stroke="#7a2e2e" strokeWidth="4" strokeLinecap="round" fill="none" />
          </g>
        ) : (
          <g>
            <path d="M37 45 Q45 40 53 45" style={eyebrow} />
            <path d="M67 45 Q75 40 83 45" style={eyebrow} />
            <circle cx="34" cy="68" r="6" fill="#ff8787" opacity="0.5" />
            <circle cx="86" cy="68" r="6" fill="#ff8787" opacity="0.5" />
            {think ? (
              <g>
                <circle cx="60" cy="82" r="4" fill="#7a2e2e" />
                <text x="88" y="24" fontSize="22">💭</text>
              </g>
            ) : speaking ? (
              <ellipse
                cx="60"
                cy="80"
                rx="10"
                ry="8"
                fill="#7a2e2e"
                style={{ ...animBox, animation: "talk 0.35s infinite" }}
              />
            ) : (
              <path d="M46 76 Q60 90 74 76" stroke="#7a2e2e" strokeWidth="4" strokeLinecap="round" fill="none" />
            )}
          </g>
        )}
      </svg>

      <div style={{ fontSize: 12, opacity: 0.9 }}>{label}</div>
    </div>
  );
}