import { useState, useRef } from "react";
import Video from "./Video.jsx";
function Diagram({ labels }) {
  if (!labels || labels.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, margin: "16px 0" }}>
      {labels.map((label, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ background: "#ede7ff", border: "2px solid #7c4dff", borderRadius: 10, padding: "10px 14px", fontWeight: 600 }}>
            {label}
          </div>
          {i < labels.length - 1 && <span style={{ fontSize: 24, color: "#7c4dff" }}>→</span>}
        </div>
      ))}
    </div>
  );
}

const reasonText = {
  "concept gap": "I think the words were a bit tricky, so here it is in simpler words.",
  "cannot visualize": "I think a picture will help, so look at this diagram.",
  "too abstract": "Let me show it with a real-life example.",
  "careless slip": "This looks like a small slip. Here is a quick reminder.",
};

export default function Learn({ addXP, onMaster }) {
  const [textbook, setTextbook] = useState("");
  const [author, setAuthor] = useState("");
  const [topic, setTopic] = useState("");
  const [steps, setSteps] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [playing, setPlaying] = useState(false);
  const speakId = useRef(0);

  const [questions, setQuestions] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizMessage, setQuizMessage] = useState("");
  const [quizDone, setQuizDone] = useState(false);

  const [attempt, setAttempt] = useState(0);
  const [reteach, setReteach] = useState(null);
  const [reteachLoading, setReteachLoading] = useState(false);
  const [reteachMsg, setReteachMsg] = useState("");

  function stopSpeaking() {
    speakId.current++;
    window.speechSynthesis.cancel();
    setPlaying(false);
  }

  function speak(index) {
    window.speechSynthesis.cancel();
    const myId = ++speakId.current;
    setCurrent(index);
    setPlaying(true);
    const u = new SpeechSynthesisUtterance(steps[index].title + ". " + steps[index].text);
    u.lang = "en-IN";
    u.onend = () => {
      if (myId !== speakId.current) return;
      if (index < steps.length - 1) {
        speak(index + 1);
      } else {
        setPlaying(false);
      }
    };
    window.speechSynthesis.speak(u);
  }

  function clearAnswerState() {
    setPicked(null);
    setAttempt(0);
    setReteach(null);
    setReteachMsg("");
    setReteachLoading(false);
  }

  function resetQuiz() {
    setQuestions([]);
    setQIndex(0);
    setScore(0);
    setQuizDone(false);
    setQuizMessage("");
    clearAnswerState();
  }

  async function teachMe() {
    stopSpeaking();
    resetQuiz();
    setLoading(true);
    setSteps([]);
    setCurrent(0);
    setMessage("");
    try {
      const url =
        "http://localhost:3001/lesson" +
        "?textbook=" + encodeURIComponent(textbook) +
        "&author=" + encodeURIComponent(author) +
        "&topic=" + encodeURIComponent(topic);
      const res = await fetch(url);
      const data = await res.json();
      if (data.steps) {
        setSteps(data.steps);
      } else {
        setMessage(data.error || "Something went wrong");
      }
    } catch (e) {
      setMessage("Could not reach the server. Is it running?");
    }
    setLoading(false);
  }

  async function startQuiz() {
    stopSpeaking();
    resetQuiz();
    setQuizLoading(true);
    try {
      const url =
        "http://localhost:3001/quiz" +
        "?textbook=" + encodeURIComponent(textbook) +
        "&topic=" + encodeURIComponent(topic);
      const res = await fetch(url);
      const data = await res.json();
      if (data.questions) {
        setQuestions(data.questions);
      } else {
        setQuizMessage(data.error || "Something went wrong");
      }
    } catch (e) {
      setQuizMessage("Could not reach the server. Is it running?");
    }
    setQuizLoading(false);
  }

  async function askWhy(i) {
    setReteach(null);
    setReteachMsg("");
    setReteachLoading(true);
    const q = questions[qIndex];
    try {
      const res = await fetch("http://localhost:3001/reteach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          textbook,
          topic,
          question: q.question,
          options: q.options,
          picked: q.options[i],
          correct: q.options[q.answer],
        }),
      });
      const data = await res.json();
      if (data.explanation) {
        setReteach(data);
      } else {
        setReteachMsg(data.error || "Something went wrong");
      }
    } catch (e) {
      setReteachMsg("Could not reach the server. Is it running?");
    }
    setReteachLoading(false);
  }

  function pick(i) {
    if (picked !== null) return;
    setPicked(i);
    const right = i === questions[qIndex].answer;
    if (right) {
      if (attempt === 0) setScore(score + 1);
      addXP(attempt === 0 ? 10 : 5);
      if (attempt >= 1) onMaster();
    } else if (attempt === 0) {
      askWhy(i);
    }
  }

  function tryAgain() {
    setPicked(null);
    setAttempt(1);
    setReteach(null);
    setReteachMsg("");
  }

  function reviewLesson() {
    setCurrent(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function nextQuestion() {
    clearAnswerState();
    if (qIndex < questions.length - 1) {
      setQIndex(qIndex + 1);
    } else {
      setQuizDone(true);
    }
  }

  function goNext() {
    stopSpeaking();
    setCurrent(current + 1);
  }

  function goBack() {
    stopSpeaking();
    setCurrent(current - 1);
  }

  const box = { display: "block", width: "100%", padding: 10, marginBottom: 10, fontSize: 16, boxSizing: "border-box" };
  const btn = { padding: "10px 20px", fontSize: 16, marginRight: 10, marginBottom: 10, cursor: "pointer" };
  const card = { marginTop: 24, padding: 20, border: "1px solid #ccc", borderRadius: 12 };
  const step = steps[current];
  const q = questions[qIndex];
  const youtubeUrl =
    "https://www.youtube.com/results?search_query=" + encodeURIComponent(topic + " " + textbook);

  const isCorrect = q && picked === q.answer;
  const showAnswer = q && picked !== null && (isCorrect || attempt >= 1);

  return (
    <div>
      <h1>Learn</h1>
      <input style={box} value={textbook} onChange={(e) => setTextbook(e.target.value)} placeholder="Textbook name" />
      <input style={box} value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author name" />
      <input style={box} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic" />
      <button onClick={teachMe} style={btn}>Teach me</button>
             <Video textbook={textbook} topic={topic} addXP={addXP} />

      {loading && <p>Thinking...</p>}
      {message && <p>{message}</p>}

      {step && (
        <div style={card}>
          <div style={{ background: "#eee", borderRadius: 8, height: 8, marginBottom: 16 }}>
            <div style={{ background: "#7c4dff", height: 8, borderRadius: 8, width: ((current + 1) / steps.length) * 100 + "%" }} />
          </div>
          <p style={{ margin: 0, color: "#666" }}>Step {current + 1} of {steps.length}</p>
          <h2 style={{ marginTop: 8 }}>{step.title}</h2>
          <p style={{ fontSize: 18, lineHeight: 1.7 }}>{step.text}</p>

          <Diagram labels={step.diagram} />

          <div>
            {playing ? (
              <button style={btn} onClick={stopSpeaking}>⏸ Pause</button>
            ) : (
              <button style={btn} onClick={() => speak(current)}>▶ Play lesson</button>
            )}
            <button style={btn} disabled={current === 0} onClick={goBack}>Back</button>
            {current < steps.length - 1 && (
              <button style={btn} onClick={goNext}>Next</button>
            )}
            {current === steps.length - 1 && (
              <button style={btn} onClick={startQuiz}>📝 Start quiz</button>
            )}
          </div>

          <a href={youtubeUrl} target="_blank" rel="noreferrer">
            🎬 Watch a video on this topic
          </a>
        </div>
      )}

      {quizLoading && <p>Making your quiz...</p>}
      {quizMessage && <p>{quizMessage}</p>}

      {q && !quizDone && (
        <div style={card}>
          <p style={{ margin: 0, color: "#666" }}>Question {qIndex + 1} of {questions.length}</p>
          <h2 style={{ marginTop: 8 }}>{q.question}</h2>
          {q.options.map((opt, i) => {
            let bg = "#fff";
            if (picked !== null) {
              if (i === picked) bg = isCorrect ? "#d7f7d7" : "#ffd9d9";
              else if (showAnswer && i === q.answer) bg = "#d7f7d7";
            }
            return (
              <button
                key={i}
                onClick={() => pick(i)}
                style={{ display: "block", width: "100%", textAlign: "left", padding: 12, marginBottom: 8, fontSize: 16, background: bg, border: "1px solid #ccc", borderRadius: 8, cursor: "pointer" }}
              >
                {opt}
              </button>
            );
          })}

          {picked !== null && isCorrect && (
            <div>
              <p style={{ fontSize: 48, margin: "8px 0" }}>😄</p>
              <p style={{ fontSize: 18 }}>
                Correct! Great job! +{attempt === 0 ? 10 : 5} XP
              </p>
              <button style={btn} onClick={nextQuestion}>
                {qIndex < questions.length - 1 ? "Next question" : "See my result"}
              </button>
            </div>
          )}

          {picked !== null && !isCorrect && attempt === 0 && (
            <div>
              <p style={{ fontSize: 48, margin: "8px 0" }}>😢</p>
              <p style={{ fontSize: 18 }}>
                Oops, not this time, and that is okay! Hint: {q.hint}
              </p>

              {reteachLoading && <p>🤔 Finding out what confused you...</p>}
              {reteachMsg && <p>{reteachMsg}</p>}

              {reteach && (
                <div style={{ background: "#fff8e1", border: "1px solid #ffe08a", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                  <h3 style={{ marginTop: 0 }}>Let me explain it a different way 💡</h3>
                  <p style={{ color: "#666" }}>
                    {reasonText[reteach.reason] || "Here is another way to look at it."}
                  </p>
                  <Diagram labels={reteach.diagram} />
                  <p style={{ fontSize: 17, lineHeight: 1.6 }}>{reteach.explanation}</p>
                  {reteach.example && (
                    <p style={{ fontSize: 17, lineHeight: 1.6 }}>
                      <b>Example:</b> {reteach.example}
                    </p>
                  )}
                </div>
              )}

              <button style={btn} disabled={reteachLoading} onClick={tryAgain}>
                🔁 Try this question again
              </button>
              <button style={btn} onClick={reviewLesson}>📖 Review the lesson</button>
            </div>
          )}

          {picked !== null && !isCorrect && attempt >= 1 && (
            <div>
              <p style={{ fontSize: 48, margin: "8px 0" }}>😢</p>
              <p style={{ fontSize: 18 }}>
                Not yet, but you are learning! The right answer is in green.
              </p>
              <button style={btn} onClick={nextQuestion}>
                {qIndex < questions.length - 1 ? "Next question" : "See my result"}
              </button>
            </div>
          )}
        </div>
      )}

      {quizDone && (
        <div style={card}>
          <p style={{ fontSize: 48, margin: 0 }}>{score >= 2 ? "🏆" : "💪"}</p>
          <h2>You got {score} out of {questions.length} on the first try</h2>
          <button style={btn} onClick={startQuiz}>Try a new quiz</button>
        </div>
      )}
    </div>
  );
}