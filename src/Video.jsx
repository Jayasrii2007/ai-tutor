import { useState, useRef, useEffect } from "react";
import VideoStage from "./VideoStage.jsx";
import VideoQuiz from "./VideoQuiz.jsx";
import DoubtBox from "./DoubtBox.jsx";

const styles = ["simple", "example", "visual"];
const styleNames = {
  simple: "in simpler words",
  example: "with real-life examples",
  visual: "with pictures first",
};

export default function Video({ textbook, topic, addXP }) {
  const [scenes, setScenes] = useState([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [shown, setShown] = useState(0);
  const [finished, setFinished] = useState(false);
  const [asking, setAsking] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [remaking, setRemaking] = useState(false);
  const [note, setNote] = useState("");
  const [mood, setMood] = useState("happy");
  const runId = useRef(0);
  const timers = useRef([]);
  const doneQuiz = useRef(new Set());
  const wrongCount = useRef(0);

  function clearTimers() {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  }

  function stop() {
    runId.current++;
    window.speechSynthesis.cancel();
    clearTimers();
    setPlaying(false);
  }

  useEffect(() => {
    return () => {
      runId.current++;
      window.speechSynthesis.cancel();
      timers.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  async function fetchScenes(style) {
    const url =
      "http://localhost:3001/video" +
      "?textbook=" + encodeURIComponent(textbook) +
      "&topic=" + encodeURIComponent(topic) +
      "&style=" + style;
    const res = await fetch(url);
    const data = await res.json();
    if (data.scenes && data.scenes.length) return data.scenes;
    throw new Error(data.error || "Something went wrong");
  }

  function play(i, list) {
    window.speechSynthesis.cancel();
    clearTimers();
    const myId = ++runId.current;
    const scene = list[i];
    const labels = scene.diagram || [];
    setIndex(i);
    setShown(0);
    setFinished(false);
    setPlaying(true);
    setAsking(false);
    setQuiz(null);

    labels.forEach((_, k) => {
      timers.current.push(setTimeout(() => setShown(k + 1), 1000 + k * 3000));
    });

    const u = new SpeechSynthesisUtterance(scene.title + ". " + scene.narration);
    u.lang = "en-IN";
    u.rate = 0.95;
    u.onend = () => {
      if (myId !== runId.current) return;
      setShown(labels.length);
      if (scene.quiz && !doneQuiz.current.has(i)) {
        setPlaying(false);
        setQuiz({ index: i, data: scene.quiz });
        return;
      }
      goOn(i, list);
    };
    window.speechSynthesis.speak(u);
  }

  function goOn(i, list) {
    if (i < list.length - 1) {
      play(i + 1, list);
    } else {
      setPlaying(false);
      setFinished(true);
    }
  }

  async function load() {
    stop();
    setLoading(true);
    setScenes([]);
    setMessage("");
    setFinished(false);
    setAsking(false);
    setQuiz(null);
    setNote("");
    doneQuiz.current = new Set();
    wrongCount.current = 0;
    try {
      const list = await fetchScenes("balanced");
      setScenes(list);
      setIndex(0);
      setShown(0);
    } catch (e) {
      setMessage(e.message === "Failed to fetch" ? "Could not reach the server. Is it running?" : e.message);
    }
    setLoading(false);
  }

  async function quizDone(correct) {
    const i = quiz.index;
    doneQuiz.current.add(i);
    setQuiz(null);
    if (correct) {
      if (addXP) addXP(5);
      setNote("");
      goOn(i, scenes);
      return;
    }
    wrongCount.current++;
    const style = styles[(wrongCount.current - 1) % styles.length];
    setRemaking(true);
    setMood("think");
    try {
      const fresh = await fetchScenes(style);
      const list = [...scenes.slice(0, i + 1), ...fresh.slice(i + 1)];
      setScenes(list);
      setNote("Now teaching " + styleNames[style] + " 💡");
      setMood("happy");
      setRemaking(false);
      goOn(i, list);
    } catch (e) {
      setRemaking(false);
      goOn(i, scenes);
    }
  }

  function openDoubt() {
    stop();
    setAsking(true);
  }

  const btn = { padding: "10px 18px", fontSize: 16, marginRight: 8, marginBottom: 8, cursor: "pointer" };
  const scene = scenes[index];

  return (
    <div style={{ marginTop: 16 }}>
      {scenes.length === 0 && (
        <div>
          <button style={btn} onClick={load} disabled={loading || !topic}>
            🎬 Make my video
          </button>
          {!topic && <p style={{ color: "#666" }}>Type a topic above first.</p>}
          {loading && <p>Making your video... this takes about 20 seconds.</p>}
          {message && <p>{message}</p>}
        </div>
      )}

      {scene && (
        <div>
          {note && (
            <p style={{ background: "#fff8e1", padding: 8, borderRadius: 8, fontWeight: 700 }}>{note}</p>
          )}

          <VideoStage
            scene={scene}
            index={index}
            total={scenes.length}
            shown={shown}
            progress={(index + (finished ? 1 : 0.5)) / scenes.length}
            speaking={playing}
            mood={mood}
          />

          <div>
            {playing ? (
              <button style={btn} onClick={stop}>⏸ Pause</button>
            ) : (
              <button style={btn} disabled={!!quiz || remaking} onClick={() => play(finished ? 0 : index, scenes)}>
                {finished ? "🔁 Watch again" : "▶ Play"}
              </button>
            )}
            <button style={btn} disabled={index === 0} onClick={() => play(index - 1, scenes)}>⏮ Previous</button>
            <button style={btn} disabled={index === scenes.length - 1} onClick={() => play(index + 1, scenes)}>⏭ Next</button>
            <button style={btn} onClick={openDoubt}>🙋 I have a doubt</button>
          </div>

          
          {quiz && <VideoQuiz key={quiz.index + "-" + wrongCount.current} quiz={quiz.data} onDone={quizDone} onAnswer={(c) => setMood(c ? "happy" : "sad")} />}
          {remaking && <p>🧠 Making the next part in a different way for you...</p>}

          {asking && (
            <DoubtBox
              textbook={textbook}
              topic={topic}
              sceneText={scene.narration}
              onResume={() => {
                setAsking(false);
                play(index, scenes);
              }}
            />
          )}

          {finished && <p style={{ fontSize: 18 }}>Video finished! 🎉</p>}
          <button style={btn} onClick={load}>🔄 Make a new video</button>
        </div>
      )}
    </div>
  );
}