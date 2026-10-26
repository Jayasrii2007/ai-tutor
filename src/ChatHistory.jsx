import { useState, useEffect } from "react";
import Chat from "./Chat.jsx";

function makeChat() {
  return {
    id: "c" + Date.now() + Math.floor(Math.random() * 1000),
    title: "New chat",
    messages: [],
    updated: Date.now(),
  };
}

function titleFrom(messages) {
  const first = messages.find((m) => m.role === "user");
  if (!first) return "";
  const t = first.text.trim().replace(/\s+/g, " ");
  return t.length > 32 ? t.slice(0, 32) + "..." : t;
}

function loadChats() {
  try {
    const saved = JSON.parse(localStorage.getItem("aitutor-chats"));
    if (Array.isArray(saved) && saved.length) return saved;
  } catch (e) {}
  try {
    const old = JSON.parse(localStorage.getItem("aitutor-chat"));
    if (Array.isArray(old) && old.length) {
      return [{ id: "old", title: titleFrom(old) || "Earlier chat", messages: old, updated: Date.now() }];
    }
  } catch (e) {}
  return [makeChat()];
}

export default function ChatHistory() {
  const [chats, setChats] = useState(loadChats());
  const [activeId, setActiveId] = useState(localStorage.getItem("aitutor-active") || "");
  const [showList, setShowList] = useState(false);

  const active = chats.find((c) => c.id === activeId) || chats[0];

  useEffect(() => {
    try {
      localStorage.setItem("aitutor-chats", JSON.stringify(chats.slice(0, 30)));
      localStorage.setItem("aitutor-active", active.id);
    } catch (e) {}
  }, [chats, active.id]);

  function update(id, messages) {
    setChats((prev) =>
      prev.map((c) => {
        if (c.id !== id || c.messages === messages) return c;
        return {
          ...c,
          messages: messages.slice(-30),
          title: c.renamed ? c.title : titleFrom(messages) || "New chat",
          updated: Date.now(),
        };
      })
    );
  }

  function startNew() {
    if (active.messages.length === 0) {
      setShowList(false);
      return;
    }
    const c = makeChat();
    setChats((prev) => [c, ...prev].slice(0, 30));
    setActiveId(c.id);
    setShowList(false);
  }

  function open(id) {
    setActiveId(id);
    setShowList(false);
  }

  function rename(c) {
    const name = window.prompt("Chat name", c.title);
    if (name && name.trim()) {
      setChats((prev) =>
        prev.map((x) => (x.id === c.id ? { ...x, title: name.trim().slice(0, 40), renamed: true } : x))
      );
    }
  }

  function remove(c) {
    if (!window.confirm("Delete this chat?")) return;
    const rest = chats.filter((x) => x.id !== c.id);
    if (rest.length === 0) {
      const n = makeChat();
      setChats([n]);
      setActiveId(n.id);
    } else {
      setChats(rest);
      if (c.id === active.id) setActiveId(rest[0].id);
    }
  }

  const sorted = [...chats].sort((a, b) => b.updated - a.updated);
  const btn = { padding: "8px 14px", fontSize: 14, cursor: "pointer", borderRadius: 10, border: "1px solid #ccc", background: "white" };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button style={btn} onClick={() => setShowList(!showList)}>
          {showList ? "✖ Close" : "☰ Chats (" + chats.length + ")"}
        </button>
        <button style={btn} onClick={startNew}>➕ New chat</button>
      </div>

      {showList && (
        <div>
          <h3 style={{ marginTop: 0 }}>Your chats</h3>
          {sorted.map((c) => (
            <div
              key={c.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: 12,
                marginBottom: 8,
                borderRadius: 14,
                background: c.id === active.id ? "#fff8d6" : "#f7f4ff",
                border: "1px solid " + (c.id === active.id ? "#f3dd7a" : "#e3dbff"),
              }}
            >
              <div style={{ flex: 1, cursor: "pointer", minWidth: 0 }} onClick={() => open(c.id)}>
                <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  💬 {c.title}
                </div>
                <div style={{ color: "#666", fontSize: 12 }}>
                  {c.messages.length} messages · {new Date(c.updated).toLocaleDateString()}
                </div>
              </div>
              <button style={btn} onClick={() => rename(c)} title="Rename">✏</button>
              <button style={btn} onClick={() => remove(c)} title="Delete">🗑</button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: showList ? "none" : "block" }}>
        <Chat key={active.id} initialMessages={active.messages} onChange={(m) => update(active.id, m)} />
      </div>
    </div>
  );
}