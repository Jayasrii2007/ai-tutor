import { useState, useEffect, useRef } from "react";
import { API } from "./config.js";

const starters = [
  "Explain Newton's second law with a real-life example",
  "How do I study for exams without stress?",
  "What is the difference between RAM and ROM?",
  "Explain binary search step by step",
];

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem("aitutor-chat"));
    return Array.isArray(saved) ? saved : [];
  } catch (e) {
    return [];
  }
}

function Inline({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**") && p.length > 4) return <b key={i}>{p.slice(2, -2)}</b>;
        if (p.startsWith("`") && p.endsWith("`") && p.length > 2) {
          return (
            <code key={i} style={{ background: "#f1edff", padding: "1px 5px", borderRadius: 5, fontSize: "0.92em" }}>
              {p.slice(1, -1)}
            </code>
          );
        }
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    try {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {}
  }
  return (
    <div style={{ background: "#1e1b3a", color: "#e9e4ff", borderRadius: 10, padding: 10, margin: "8px 0" }}>
      <div style={{ textAlign: "right" }}>
        <button
          onClick={copy}
          style={{ fontSize: 12, padding: "2px 8px", borderRadius: 6, border: "none", cursor: "pointer" }}
        >
          {copied ? "✅ Copied" : "📋 Copy code"}
        </button>
      </div>
      <pre style={{ margin: 0, overflowX: "auto", fontSize: 14, lineHeight: 1.5 }}>{code}</pre>
    </div>
  );
}

function Rich({ text }) {
  const chunks = text.split("```");
  return (
    <div>
      {chunks.map((chunk, ci) => {
        if (ci % 2 === 1) {
          const lines = chunk.split("\n");
          const first = lines[0].trim();
          const code = /^[\w+#-]*$/.test(first) ? lines.slice(1).join("\n") : chunk;
          return <CodeBlock key={ci} code={code.replace(/\n$/, "")} />;
        }
        return (
          <div key={ci}>
            {chunk.split("\n").map((line, li) => {
              if (!line.trim()) return <div key={li} style={{ height: 6 }} />;
              if (/^\s*[-*]\s+/.test(line)) {
                return (
                  <div key={li} style={{ paddingLeft: 14, textIndent: -14 }}>
                    • <Inline text={line.replace(/^\s*[-*]\s+/, "")} />
                  </div>
                );
              }
              if (/^\s*\d+\.\s+/.test(line)) {
                return (
                  <div key={li} style={{ paddingLeft: 18, textIndent: -18 }}>
                    <Inline text={line.trim()} />
                  </div>
                );
              }
              return (
                <div key={li}>
                  <Inline text={line} />
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export default function Chat() {
  const [messages, setMessages] = useState(load());
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState(-1);
  const [copiedIndex, setCopiedIndex] = useState(-1);
  const boxRef = useRef(null);
  const recRef = useRef(null);
  const speakId = useRef(0);
  const abortRef = useRef(null);
  const canListen = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    try {
      localStorage.setItem("aitutor-chat", JSON.stringify(messages.slice(-30)));
    } catch (e) {}
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (recRef.current) recRef.current.abort();
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  async function ask(history) {
    setBusy(true);
    const controller = new AbortController();
    abortRef.current = controller;
    setMessages([...history, { role: "ai", text: "" }]);
    let got = "";
    try {
      const res = await fetch(API + "/chat-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.filter((m) => !m.failed).slice(-12) }),
        signal: controller.signal,
      });
      if (!res.ok) {
        let err = "The AI is busy right now. Please try again in a minute.";
        try {
          const d = await res.json();
          if (d.error) err = d.error;
        } catch (e) {}
        setMessages([...history, { role: "ai", text: err, failed: true }]);
      } else {
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          got += dec.decode(value, { stream: true });
          setMessages([...history, { role: "ai", text: got }]);
        }
        if (!got.trim()) {
          setMessages([...history, { role: "ai", text: "I could not answer that. Please try again.", failed: true }]);
        }
      }
    } catch (e) {
      if (e.name === "AbortError") {
        setMessages(got.trim() ? [...history, { role: "ai", text: got }] : history);
      } else {
        setMessages([
          ...history,
          got.trim()
            ? { role: "ai", text: got }
            : { role: "ai", text: "Could not reach the server. Is it running?", failed: true },
        ]);
      }
    }
    setBusy(false);
    abortRef.current = null;
  }

  function send(q) {
    const question = (q === undefined ? text : q).trim();
    if (!question || busy) return;
    setText("");
    ask([...messages, { role: "user", text: question }]);
  }

  function regenerate() {
    if (busy) return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== "ai") return;
    const base = messages.slice(0, -1);
    if (!base.length || base[base.length - 1].role !== "user") return;
    ask(base);
  }

  function stop() {
    if (abortRef.current) abortRef.current.abort();
  }

  function copy(i, t) {
    try {
      navigator.clipboard.writeText(t);
      setCopiedIndex(i);
      setTimeout(() => setCopiedIndex(-1), 1500);
    } catch (e) {}
  }

  function speak(i, t) {
    if (speakingIndex === i) {
      speakId.current++;
      window.speechSynthesis.cancel();
      setSpeakingIndex(-1);
      return;
    }
    window.speechSynthesis.cancel();
    const id = ++speakId.current;
    const clean = t.replace(/```[\s\S]*?```/g, " code block. ").replace(/[*#`]/g, "");
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = "en-IN";
    u.rate = 0.95;
    u.onend = () => {
      if (id === speakId.current) setSpeakingIndex(-1);
    };
    u.onerror = () => {
      if (id === speakId.current) setSpeakingIndex(-1);
    };
    setSpeakingIndex(i);
    window.speechSynthesis.speak(u);
  }

  function listen() {
    if (!canListen || listening) return;
    window.speechSynthesis.cancel();
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new Rec();
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => setListening(true);
    rec.onresult = (e) => setText(e.results[0][0].transcript);
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    rec.start();
  }

  function clearChat() {
    if (busy) stop();
    speakId.current++;
    window.speechSynthesis.cancel();
    setSpeakingIndex(-1);
    setMessages([]);
  }

  const btn = { padding: "8px 14px", fontSize: 14, cursor: "pointer", borderRadius: 10, border: "1px solid #ccc", background: "white" };
  const small = { ...btn, padding: "4px 10px", fontSize: 13, marginRight: 6 };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>💬 Ask AI</h2>
        {messages.length > 0 && (
          <button style={btn} onClick={clearChat}>🗑 Clear chat</button>
        )}
      </div>
      <p className="sub">Ask me anything about your studies. I explain in simple words, with real-life examples.</p>

      <div
        ref={boxRef}
        style={{ height: "52vh", minHeight: 280, overflowY: "auto", background: "#faf8ff", border: "1px solid #e3dbff", borderRadius: 14, padding: 12, marginBottom: 10 }}
      >
        {messages.length === 0 && (
          <div>
            <p style={{ color: "#666", marginTop: 0 }}>Try one of these:</p>
            {starters.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                style={{ display: "block", width: "100%", textAlign: "left", padding: 12, marginBottom: 8, fontSize: 15, background: "white", border: "1px solid #d9ccff", borderRadius: 12, cursor: "pointer" }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => {
          const last = i === messages.length - 1;
          const streaming = busy && last && m.role === "ai";
          return (
            <div key={i} style={{ marginBottom: 12, textAlign: m.role === "user" ? "right" : "left" }}>
              <div
                style={{
                  display: "inline-block",
                  maxWidth: "92%",
                  padding: "10px 14px",
                  borderRadius: 16,
                  textAlign: "left",
                  lineHeight: 1.55,
                  fontSize: 16,
                  whiteSpace: m.role === "user" ? "pre-wrap" : "normal",
                  background: m.role === "user" ? "#7c4dff" : m.failed ? "#ffecec" : "white",
                  color: m.role === "user" ? "white" : "#222",
                  border: m.role === "user" ? "none" : "1px solid #e3dbff",
                }}
              >
                {m.role === "user" || m.failed ? (
                  m.text
                ) : streaming && !m.text ? (
                  "🤔 Thinking..."
                ) : (
                  <Rich text={m.text + (streaming ? " ▍" : "")} />
                )}
              </div>
              {m.role === "ai" && !m.failed && !streaming && m.text && (
                <div style={{ marginTop: 4 }}>
                  <button style={small} onClick={() => speak(i, m.text)}>
                    {speakingIndex === i ? "⏹ Stop" : "🔊 Read"}
                  </button>
                  <button style={small} onClick={() => copy(i, m.text)}>
                    {copiedIndex === i ? "✅ Copied" : "📋 Copy"}
                  </button>
                  {last && !busy && (
                    <button style={small} onClick={regenerate}>🔄 Regenerate</button>
                  )}
                </div>
              )}
              {m.role === "ai" && m.failed && last && !busy && (
                <div style={{ marginTop: 4 }}>
                  <button style={small} onClick={regenerate}>🔄 Try again</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {canListen && (
          <button
            onClick={listen}
            style={{ ...btn, fontSize: 20, background: listening ? "#ff6b6b" : "white" }}
            title="Ask by voice"
          >
            {listening ? "🔴" : "🎤"}
          </button>
        )}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={listening ? "Listening... speak now" : "Type your question"}
          style={{ flex: 1, minWidth: 0, padding: 12, fontSize: 16, borderRadius: 12, border: "1px solid #ccc" }}
        />
        {busy ? (
          <button className="main-btn" onClick={stop}>⏹ Stop</button>
        ) : (
          <button className="main-btn" onClick={() => send()} disabled={!text.trim()}>
            Send
          </button>
        )}
      </div>

      <p style={{ color: "#888", fontSize: 12, marginTop: 8 }}>
        AI can make mistakes. Please check important facts with your teacher or textbook.
      </p>
    </div>
  );
}