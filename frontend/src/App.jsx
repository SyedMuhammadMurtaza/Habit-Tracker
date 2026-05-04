import { useState, useEffect, useCallback, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_BASE;
const USER_ID  = "default";

const getLast10Days = () => {
  const days = [];
  for (let i = 9; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
};

const getDayLabel   = (dateStr) => new Date(dateStr).getDate();
const getMonthLabel = (dateStr) => new Date(dateStr).toLocaleDateString("en-US", { month: "short" });

const TAG_COLORS = {
  Urgent: { bg: "#ef4444", text: "#fff" },
  Medium: { bg: "#22c55e", text: "#fff" },
  Low:    { bg: "#3b82f6", text: "#fff" },
};

const INITIAL_MORNING = ["Cold Shower", "Daily Journal", "Gym", "Yoga"];
const INITIAL_EVENING = ["Read", "Study", "Wash Face"];
const INITIAL_NIGHT   = ["Meditate", "Plan Tomorrow", "Sleep by 11pm"];

const buildInitialHabitData = (m, e, n) => {
  const allHabits = [...m, ...e, ...n];
  const days = getLast10Days();
  const data = {};
  days.forEach((day) => {
    data[day] = {};
    allHabits.forEach((h) => { data[day][h] = Math.random() > 0.35; });
  });
  const today = days[days.length - 1];
  allHabits.forEach((h) => (data[today][h] = false));
  return data;
};

const INITIAL_TODOS = [
  { id: 1, text: "Run 2.5km",              tag: "Medium", done: false },
  { id: 2, text: "Meet with Sarah",         tag: "Urgent", done: false },
  { id: 3, text: "Post on Instagram Today", tag: "Medium", done: false },
  { id: 4, text: "Start Building Website",  tag: "Medium", done: false },
  { id: 5, text: "Plan for new website",    tag: "Urgent", done: false },
];

const api = {
  load: async () => {
    const res = await fetch(`${API_BASE}/brain/${USER_ID}`);
    if (!res.ok) throw new Error("Failed to load");
    return res.json();
  },
  save: async (patch) => {
    const res = await fetch(`${API_BASE}/brain/${USER_ID}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(patch),
    });
    if (!res.ok) throw new Error("Failed to save");
    return res.json();
  },
};

const iStyle = { flex: 1, background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13 };

function AddBtn({ onClick }) {
  return <button onClick={onClick} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "#22c55e", color: "#000", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>+</button>;
}
function DelBtn({ onClick }) {
  return <button onClick={onClick} style={{ background: "none", border: "none", color: "#4b5563", cursor: "pointer", fontSize: 14, padding: "0 4px", lineHeight: 1 }}>✕</button>;
}
function Card({ children, style }) {
  return <div style={{ background: "#111", border: "1px solid #1f1f1f", borderRadius: 12, padding: 16, ...style }}>{children}</div>;
}
function ST({ t }) {
  return <div style={{ fontSize: 12, color: "#86efac", fontFamily: "'Space Mono',monospace", marginBottom: 10, letterSpacing: 1 }}>{t}</div>;
}

function SaveBadge({ status }) {
  const map = { saving: { color: "#f59e0b", label: "⟳ Saving..." }, saved: { color: "#22c55e", label: "✓ Saved" }, error: { color: "#ef4444", label: "✕ Error" }, idle: null };
  const s = map[status];
  if (!s) return null;
  return <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 9999, background: "#111", border: `1px solid ${s.color}`, color: s.color, fontFamily: "'Space Mono',monospace", fontSize: 11, padding: "6px 14px", borderRadius: 99, boxShadow: `0 0 12px ${s.color}44` }}>{s.label}</div>;
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 20px #22c55e", animation: "pulse 1s infinite" }} />
      <div style={{ fontFamily: "'Space Mono',monospace", color: "#86efac", fontSize: 13, letterSpacing: 2 }}>LOADING BRAIN...</div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.5)} }`}</style>
    </div>
  );
}

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  const h = String(time.getHours()).padStart(2, "0");
  const m = String(time.getMinutes()).padStart(2, "0");
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ fontSize: 11, color: "#86efac", fontFamily: "'Space Mono',monospace", letterSpacing: 2, opacity: 0.8 }}>1% Everyday. Focus.</div>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {[h, m].map((v, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {i > 0 && <span style={{ color: "#86efac", fontSize: 20, fontFamily: "'Space Mono',monospace", opacity: 0.7 }}>:</span>}
            <div style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 6, padding: "6px 10px", fontFamily: "'Space Mono',monospace", fontSize: 22, color: "#fff", fontWeight: 700, minWidth: 44, textAlign: "center" }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressBar({ label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <span style={{ fontSize: 11, color: "#9ca3af", width: 52, fontFamily: "'Space Mono',monospace" }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: "#2a2a2a", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value}%`, background: "linear-gradient(90deg,#22c55e,#86efac)", borderRadius: 99, transition: "width 0.8s ease" }} />
      </div>
      <span style={{ fontSize: 11, color: "#86efac", fontFamily: "'Space Mono',monospace", width: 32, textAlign: "right" }}>{value}%</span>
    </div>
  );
}

function TagSelector({ current, onChange }) {
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {Object.keys(TAG_COLORS).map((tag) => (
        <button key={tag} onClick={() => onChange(tag)} style={{ padding: "3px 9px", borderRadius: 99, border: `1px solid ${current === tag ? TAG_COLORS[tag].bg : "#333"}`, background: current === tag ? TAG_COLORS[tag].bg : "transparent", color: current === tag ? TAG_COLORS[tag].text : "#6b7280", fontSize: 10, cursor: "pointer", fontWeight: 600 }}>{tag}</button>
      ))}
    </div>
  );
}

function Pomodoro() {
  const MODES = { pomodoro: 25 * 60, short: 5 * 60, long: 15 * 60 };
  const [mode, setMode] = useState("pomodoro");
  const [seconds, setSeconds] = useState(MODES.pomodoro);
  const [running, setRunning] = useState(false);
  useEffect(() => { setSeconds(MODES[mode]); setRunning(false); }, [mode]);
  useEffect(() => { if (!running) return; const t = setInterval(() => setSeconds((s) => s > 0 ? s - 1 : 0), 1000); return () => clearInterval(t); }, [running]);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const progress = 1 - seconds / MODES[mode];
  return (
    <div style={{ background: "#0f1a0f", border: "1px solid #1a3a1a", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, backgroundImage: "url('https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=400&q=80')", backgroundSize: "cover", backgroundPosition: "center", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.78)", borderRadius: 12 }} />
      <div style={{ position: "relative", zIndex: 1, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
          {Object.keys(MODES).map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{ padding: "4px 10px", borderRadius: 99, border: "1px solid #333", background: mode === m ? "#22c55e" : "rgba(255,255,255,0.05)", color: mode === m ? "#000" : "#9ca3af", fontSize: 11, cursor: "pointer", fontFamily: "'Space Mono',monospace", fontWeight: 600 }}>
              {m === "pomodoro" ? "Focus" : m === "short" ? "Short" : "Long"}
            </button>
          ))}
        </div>
        <div style={{ position: "relative", width: 110, height: 110 }}>
          <svg width="110" height="110" style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}>
            <circle cx="55" cy="55" r="48" fill="none" stroke="#1a3a1a" strokeWidth="4" />
            <circle cx="55" cy="55" r="48" fill="none" stroke="#22c55e" strokeWidth="4" strokeDasharray={`${2 * Math.PI * 48}`} strokeDashoffset={`${2 * Math.PI * 48 * (1 - progress)}`} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s linear" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Mono',monospace", fontSize: 26, color: "#fff", fontWeight: 700 }}>{mm}:{ss}</div>
        </div>
        <button onClick={() => setRunning(!running)} style={{ padding: "8px 28px", borderRadius: 99, border: "none", background: running ? "#ef4444" : "#22c55e", color: "#000", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Space Mono',monospace" }}>
          {running ? "Pause" : "Start"}
        </button>
      </div>
    </div>
  );
}

function HabitDotGrid({ habitData, habit, days, onToggle }) {
  return (
    <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
      {days.map((day) => (
        <div key={day} onClick={() => onToggle(day, habit)} title={day} style={{ width: 12, height: 12, borderRadius: 3, background: habitData[day]?.[habit] ? "#3b82f6" : "#2a2a2a", border: habitData[day]?.[habit] ? "1px solid #60a5fa" : "1px solid #333", cursor: "pointer", transition: "all 0.15s" }} />
      ))}
    </div>
  );
}

function HabitChart({ habitData, days, allHabits }) {
  const values = days.map((day) => { const d = habitData[day] || {}; const done = allHabits.filter((h) => d[h]).length; return allHabits.length ? Math.round((done / allHabits.length) * 100) : 0; });
  const W = 500, H = 140, PAD = { top: 16, right: 16, bottom: 24, left: 36 };
  const iW = W - PAD.left - PAD.right, iH = H - PAD.top - PAD.bottom;
  const pts = values.map((v, i) => ({ x: PAD.left + (i / Math.max(values.length - 1, 1)) * iW, y: PAD.top + iH - (v / 100) * iH }));
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${pts[pts.length - 1].x} ${PAD.top + iH} L ${pts[0].x} ${PAD.top + iH} Z`;
  return (
    <div style={{ background: "#0d0d0d", border: "1px solid #1f1f1f", borderRadius: 10, padding: 12 }}>
      <div style={{ fontSize: 11, color: "#86efac", fontFamily: "'Space Mono',monospace", marginBottom: 8, opacity: 0.8 }}>HabitTracker — Last 10 Days</div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
        <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22c55e" stopOpacity="0.5" /><stop offset="100%" stopColor="#22c55e" stopOpacity="0.02" /></linearGradient></defs>
        {[0, 25, 50, 75, 100].map((g) => { const y = PAD.top + iH - (g / 100) * iH; return (<g key={g}><line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#1f1f1f" strokeWidth="1" /><text x={PAD.left - 4} y={y + 4} textAnchor="end" fontSize="9" fill="#4b5563" fontFamily="Space Mono,monospace">{g}%</text></g>); })}
        <path d={areaD} fill="url(#cg)" />
        <path d={pathD} fill="none" stroke="#22c55e" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill="#22c55e" stroke="#0d0d0d" strokeWidth="1.5" />)}
        {days.map((day, i) => <text key={i} x={pts[i].x} y={H - 4} textAnchor="middle" fontSize="9" fill="#4b5563" fontFamily="Space Mono,monospace">{getDayLabel(day)}</text>)}
      </svg>
    </div>
  );
}

// accent colors per group
const GROUP_ACCENT = { morning: "#f59e0b", evening: "#a78bfa", night: "#6366f1" };

function HabitSection({ label, emoji, habits, group, newVal, setNew, habitData, today, days, toggleHabit, addHabit, deleteHabit, compact = false }) {
  const accent = GROUP_ACCENT[group] || "#22c55e";
  return (
    <div style={{ marginBottom: compact ? 12 : 0 }}>
      <div style={{ fontSize: 10, color: accent, fontFamily: "'Space Mono',monospace", letterSpacing: 1, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
        <span>{emoji}</span>{label.toUpperCase()}
      </div>
      {habits.map((habit) => {
        const done = habitData[today]?.[habit];
        return (
          <div key={habit} style={{ display: "flex", alignItems: "center", gap: compact ? 8 : 12, padding: compact ? "6px 0" : "10px 0", borderBottom: "1px solid #1a1a1a", flexWrap: "wrap" }}>
            <input type="checkbox" checked={!!done} onChange={() => toggleHabit(today, habit)} style={{ accentColor: accent, cursor: "pointer", width: compact ? 14 : 16, height: compact ? 14 : 16 }} />
            <span style={{ fontSize: compact ? 12 : 13, flex: 1, color: done ? "#86efac" : "#d1d5db", fontWeight: done ? 600 : 400, minWidth: compact ? 80 : 120 }}>{habit}</span>
            <HabitDotGrid habitData={habitData} habit={habit} days={days} onToggle={toggleHabit} />
            <DelBtn onClick={() => deleteHabit(group, habit)} />
          </div>
        );
      })}
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <input value={newVal} onChange={(e) => setNew(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { addHabit(group, newVal); setNew(""); } }} placeholder={`Add ${label.toLowerCase()} habit...`} style={{ ...iStyle, fontSize: 11 }} />
        <AddBtn onClick={() => { addHabit(group, newVal); setNew(""); }} />
      </div>
    </div>
  );
}

export default function SecondBrain() {
  const [tab, setTab]               = useState("dashboard");
  const [loading, setLoading]       = useState(true);
  const [saveStatus, setSaveStatus] = useState("idle");

  const [morningHabits, setMorningHabits] = useState(INITIAL_MORNING);
  const [eveningHabits, setEveningHabits] = useState(INITIAL_EVENING);
  const [nightHabits,   setNightHabits]   = useState(INITIAL_NIGHT);
  const [habitData, setHabitData]         = useState({});

  const [todos,      setTodos]      = useState(INITIAL_TODOS);
  const [priorities, setPriorities] = useState(["Start on new business", "Post on social media", "Apply to new job"]);
  const [newTodo,         setNewTodo]        = useState("");
  const [newTodoTag,      setNewTodoTag]     = useState("Medium");
  const [newPriority,     setNewPriority]    = useState("");
  const [newMorningHabit, setNewMorningHabit] = useState("");
  const [newEveningHabit, setNewEveningHabit] = useState("");
  const [newNightHabit,   setNewNightHabit]   = useState("");

  const days      = getLast10Days();
  const today     = days[days.length - 1];
  const allHabits = [...morningHabits, ...eveningHabits, ...nightHabits];

  useEffect(() => {
    api.load()
      .then((doc) => {
        const m = doc.morningHabits || INITIAL_MORNING;
        const e = doc.eveningHabits || INITIAL_EVENING;
        const n = doc.nightHabits   || INITIAL_NIGHT;
        setMorningHabits(m); setEveningHabits(e); setNightHabits(n);
        setTodos(doc.todos?.length ? doc.todos : INITIAL_TODOS);
        setPriorities(doc.priorities?.length ? doc.priorities : ["Start on new business", "Post on social media", "Apply to new job"]);
        const saved = doc.habitData || {};
        const allH  = [...m, ...e, ...n];
        const merged = { ...saved };
        days.forEach((day) => { if (!merged[day]) merged[day] = {}; allH.forEach((h) => { if (merged[day][h] === undefined) merged[day][h] = false; }); });
        setHabitData(merged);
      })
      .catch(() => { setHabitData(buildInitialHabitData(INITIAL_MORNING, INITIAL_EVENING, INITIAL_NIGHT)); })
      .finally(() => setLoading(false));
  }, []);

  const debouncedSave = useCallback((() => {
    let timer;
    return (patch) => {
      clearTimeout(timer);
      setSaveStatus("saving");
      timer = setTimeout(() => {
        api.save(patch)
          .then(() => { setSaveStatus("saved"); setTimeout(() => setSaveStatus("idle"), 2000); })
          .catch(() => { setSaveStatus("error"); setTimeout(() => setSaveStatus("idle"), 3000); });
      }, 800);
    };
  })(), []);

  const setAndSaveMorningHabits = (val) => { const next = typeof val === "function" ? val(morningHabits) : val; setMorningHabits(next); debouncedSave({ morningHabits: next }); };
  const setAndSaveEveningHabits = (val) => { const next = typeof val === "function" ? val(eveningHabits) : val; setEveningHabits(next); debouncedSave({ eveningHabits: next }); };
  const setAndSaveNightHabits   = (val) => { const next = typeof val === "function" ? val(nightHabits)   : val; setNightHabits(next);   debouncedSave({ nightHabits: next }); };
  const setAndSaveTodos         = (val) => { const next = typeof val === "function" ? val(todos)          : val; setTodos(next);         debouncedSave({ todos: next }); };
  const setAndSavePriorities    = (val) => { const next = typeof val === "function" ? val(priorities)     : val; setPriorities(next);    debouncedSave({ priorities: next }); };
  const setAndSaveHabitData     = (val) => { const next = typeof val === "function" ? val(habitData)      : val; setHabitData(next);     debouncedSave({ habitData: next }); };

  const toggleHabit = useCallback((day, habit) => {
    setAndSaveHabitData((prev) => ({ ...prev, [day]: { ...prev[day], [habit]: !prev[day]?.[habit] } }));
  }, [habitData]);

  const addHabit = (group, name) => {
    if (!name.trim()) return;
    const n = name.trim();
    const newHabitData = { ...habitData };
    days.forEach((d) => { newHabitData[d] = { ...newHabitData[d], [n]: false }; });
    setAndSaveHabitData(newHabitData);
    if (group === "morning") setAndSaveMorningHabits((h) => [...h, n]);
    else if (group === "evening") setAndSaveEveningHabits((h) => [...h, n]);
    else setAndSaveNightHabits((h) => [...h, n]);
  };

  const deleteHabit = (group, habit) => {
    if (group === "morning") setAndSaveMorningHabits((h) => h.filter((x) => x !== habit));
    else if (group === "evening") setAndSaveEveningHabits((h) => h.filter((x) => x !== habit));
    else setAndSaveNightHabits((h) => h.filter((x) => x !== habit));
  };

  const dayPct   = allHabits.length ? Math.round(allHabits.filter((h) => habitData[today]?.[h]).length / allHabits.length * 100) : 0;
  const weekPct  = Math.round(days.slice(-7).reduce((acc, d) => acc + (allHabits.length ? allHabits.filter((h) => habitData[d]?.[h]).length / allHabits.length : 0), 0) / 7 * 100);
  const monthPct = Math.round(days.reduce((acc, d) => acc + (allHabits.length ? allHabits.filter((h) => habitData[d]?.[h]).length / allHabits.length : 0), 0) / days.length * 100);

  const habitSections = [
    { label: "Morning", group: "morning", habits: morningHabits, newVal: newMorningHabit, setNew: setNewMorningHabit },
    { label: "Evening", group: "evening", habits: eveningHabits, newVal: newEveningHabit, setNew: setNewEveningHabit },
    { label: "Night",   group: "night",   habits: nightHabits,   newVal: newNightHabit,   setNew: setNewNightHabit   },
  ];

  const NAV = [
    { id: "dashboard", icon: "⌂", label: "Dashboard" },
    { id: "habits",    icon: "✓", label: "Habits"    },
    { id: "todos",     icon: "☑", label: "To-Do"     },
    { id: "chart",     icon: "◈", label: "Progress"  },
    { id: "pomodoro",  icon: "⏱", label: "Pomodoro"  },
  ];

  if (loading) return <LoadingScreen />;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#e5e7eb", fontFamily: "'DM Sans',sans-serif", display: "flex", flexDirection: "column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#0a0a0a}::-webkit-scrollbar-thumb{background:#222;border-radius:99px}
        button:hover{opacity:0.85} input{outline:none}
        .grid-2{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
        .row2-grid{display:grid;grid-template-columns:1fr 2fr 1fr;gap:12px}
        .row1-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
        @media(max-width:700px){.row1-grid,.row2-grid,.grid-2{grid-template-columns:1fr!important}.header-title{font-size:14px!important}.nav-scroll{gap:4px!important}}
        @media(max-width:900px) and (min-width:701px){.row1-grid,.row2-grid{grid-template-columns:repeat(2,1fr)!important}}
      `}</style>

      <SaveBadge status={saveStatus} />

      <div style={{ padding: "14px 20px", borderBottom: "1px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0d0d0d", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e" }} />
          <span className="header-title" style={{ fontFamily: "'Space Mono',monospace", fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: 1 }}>Simple Second Brain</span>
        </div>
        <div style={{ fontSize: 11, color: "#4b5563", fontFamily: "'Space Mono',monospace" }}>{new Date().toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" })}</div>
      </div>

      <div className="nav-scroll" style={{ display: "flex", gap: 4, padding: "10px 16px", borderBottom: "1px solid #1a1a1a", background: "#0d0d0d", overflowX: "auto" }}>
        {NAV.map((n) => (
          <button key={n.id} onClick={() => setTab(n.id)} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid", borderColor: tab === n.id ? "#22c55e" : "#1f1f1f", background: tab === n.id ? "rgba(34,197,94,0.1)" : "transparent", color: tab === n.id ? "#86efac" : "#6b7280", fontSize: 12, cursor: "pointer", fontFamily: "'Space Mono',monospace", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}>
            {n.icon} {n.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, padding: "16px 24px", width: "100%", paddingBottom: 32 }}>

        {tab === "dashboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="row1-grid">
              <Card><ST t="Progress" /><ProgressBar label="Month" value={monthPct} /><ProgressBar label="Week" value={weekPct} /><ProgressBar label="Day" value={dayPct} /><ProgressBar label="Quarter" value={Math.round((monthPct + weekPct) / 2)} /></Card>
              <Card style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><LiveClock /></Card>
              <Card><ST t="Weather" /><div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 28 }}>⛅</span><div><div style={{ fontSize: 20, fontWeight: 600, fontFamily: "'Space Mono',monospace" }}>— °C</div><div style={{ fontSize: 11, color: "#6b7280" }}>Enable location</div></div></div></Card>
            </div>

            <div className="row2-grid">
              <Card>
                <ST t="Directory" />
                {["Monthly", "2024 Weeks", "Habit Tracker", "Time Box"].map((item) => (
                  <div key={item} onClick={() => item === "Habit Tracker" && setTab("habits")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #1a1a1a", cursor: "pointer", color: "#9ca3af", fontSize: 13 }}>
                    <span style={{ fontSize: 10, color: "#22c55e" }}>▶</span> {item}
                  </div>
                ))}
              </Card>
              <Card>
                <ST t="To-Do List" />
                <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
                  <input value={newTodo} onChange={(e) => setNewTodo(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && newTodo.trim()) { setAndSaveTodos((p) => [...p, { id: Date.now(), text: newTodo.trim(), tag: newTodoTag, done: false }]); setNewTodo(""); } }} placeholder="Add new task..." style={{ ...iStyle, minWidth: 0, fontSize: 12 }} />
                  <TagSelector current={newTodoTag} onChange={setNewTodoTag} />
                  <AddBtn onClick={() => { if (newTodo.trim()) { setAndSaveTodos((p) => [...p, { id: Date.now(), text: newTodo.trim(), tag: newTodoTag, done: false }]); setNewTodo(""); } }} />
                </div>
                {todos.map((t) => (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: "1px solid #1a1a1a", flexWrap: "wrap" }}>
                    <input type="checkbox" checked={t.done} onChange={() => setAndSaveTodos((p) => p.map((x) => x.id === t.id ? { ...x, done: !x.done } : x))} style={{ accentColor: "#22c55e", cursor: "pointer", width: 15, height: 15, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 12, color: t.done ? "#4b5563" : "#d1d5db", textDecoration: t.done ? "line-through" : "none", minWidth: 60 }}>{t.text}</span>
                    <TagSelector current={t.tag} onChange={(tag) => setAndSaveTodos((p) => p.map((x) => x.id === t.id ? { ...x, tag } : x))} />
                    <DelBtn onClick={() => setAndSaveTodos((p) => p.filter((x) => x.id !== t.id))} />
                  </div>
                ))}
                {todos.length === 0 && <div style={{ color: "#4b5563", fontSize: 12, textAlign: "center", padding: 12 }}>No tasks yet!</div>}
              </Card>
              <Card>
                <ST t="Current Priorities" />
                {priorities.map((p, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}>
                    <span style={{ color: "#22c55e", fontSize: 12, fontFamily: "'Space Mono',monospace", marginTop: 1 }}>{i + 1}.</span>
                    <span style={{ flex: 1, fontSize: 13, color: "#d1d5db" }}>{p}</span>
                    <DelBtn onClick={() => setAndSavePriorities((prev) => prev.filter((_, j) => j !== i))} />
                  </div>
                ))}
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <input value={newPriority} onChange={(e) => setNewPriority(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && newPriority.trim()) { setAndSavePriorities((prev) => [...prev, newPriority.trim()]); setNewPriority(""); } }} placeholder="Add priority..." style={iStyle} />
                  <AddBtn onClick={() => { if (newPriority.trim()) { setAndSavePriorities((prev) => [...prev, newPriority.trim()]); setNewPriority(""); } }} />
                </div>
              </Card>
            </div>

            <div className="grid-2">
              <Card>
                <ST t="Habits — Today" />
                {habitSections.map(({ label, emoji, group, habits, newVal, setNew }) => (
                  <HabitSection key={group} label={label} emoji={emoji} group={group} habits={habits} newVal={newVal} setNew={setNew} habitData={habitData} today={today} days={days} toggleHabit={toggleHabit} addHabit={addHabit} deleteHabit={deleteHabit} compact />
                ))}
              </Card>
              <Pomodoro />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <HabitChart habitData={habitData} days={days} allHabits={allHabits} />
              <Card>
                <ST t="Daily Breakdown" />
                <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
                  {days.map((day) => {
                    const done = allHabits.filter((h) => habitData[day]?.[h]).length;
                    const pct  = allHabits.length ? Math.round((done / allHabits.length) * 100) : 0;
                    const isToday = day === today;
                    return (
                      <div key={day} style={{ minWidth: 72, background: isToday ? "rgba(34,197,94,0.1)" : "#1a1a1a", border: `1px solid ${isToday ? "#22c55e" : "#2a2a2a"}`, borderRadius: 10, padding: "10px 8px", textAlign: "center", flexShrink: 0 }}>
                        <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 4, fontFamily: "'Space Mono',monospace" }}>{getMonthLabel(day)} {getDayLabel(day)}</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: pct >= 70 ? "#22c55e" : pct >= 40 ? "#f59e0b" : "#ef4444", fontFamily: "'Space Mono',monospace" }}>{pct}%</div>
                        <div style={{ fontSize: 10, color: "#4b5563", marginTop: 4 }}>{done}/{allHabits.length}</div>
                        {isToday && <div style={{ fontSize: 9, color: "#22c55e", marginTop: 4, fontWeight: 700 }}>TODAY</div>}
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </div>
        )}

        {tab === "habits" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {habitSections.map(({ label, emoji, group, habits, newVal, setNew }) => (
              <Card key={group}>
                <ST t={`${emoji} ${label} Habits`} />
                <HabitSection label={label} emoji={emoji} group={group} habits={habits} newVal={newVal} setNew={setNew} habitData={habitData} today={today} days={days} toggleHabit={toggleHabit} addHabit={addHabit} deleteHabit={deleteHabit} />
              </Card>
            ))}
            <HabitChart habitData={habitData} days={days} allHabits={allHabits} />
          </div>
        )}

        {tab === "todos" && (
          <Card>
            <ST t="To-Do List" />
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
              <input value={newTodo} onChange={(e) => setNewTodo(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && newTodo.trim()) { setAndSaveTodos((p) => [...p, { id: Date.now(), text: newTodo.trim(), tag: newTodoTag, done: false }]); setNewTodo(""); } }} placeholder="Add new task... (press Enter)" style={{ ...iStyle, minWidth: 180 }} />
              <TagSelector current={newTodoTag} onChange={setNewTodoTag} />
              <AddBtn onClick={() => { if (newTodo.trim()) { setAndSaveTodos((p) => [...p, { id: Date.now(), text: newTodo.trim(), tag: newTodoTag, done: false }]); setNewTodo(""); } }} />
            </div>
            {todos.map((t) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #1a1a1a", flexWrap: "wrap" }}>
                <input type="checkbox" checked={t.done} onChange={() => setAndSaveTodos((p) => p.map((x) => x.id === t.id ? { ...x, done: !x.done } : x))} style={{ accentColor: "#22c55e", cursor: "pointer", width: 16, height: 16 }} />
                <span style={{ flex: 1, fontSize: 13, color: t.done ? "#4b5563" : "#e5e7eb", textDecoration: t.done ? "line-through" : "none", minWidth: 120 }}>{t.text}</span>
                <TagSelector current={t.tag} onChange={(tag) => setAndSaveTodos((p) => p.map((x) => x.id === t.id ? { ...x, tag } : x))} />
                <DelBtn onClick={() => setAndSaveTodos((p) => p.filter((x) => x.id !== t.id))} />
              </div>
            ))}
            {todos.length === 0 && <div style={{ color: "#4b5563", fontSize: 13, textAlign: "center", padding: 20 }}>No tasks yet. Add one above!</div>}
          </Card>
        )}

        {tab === "chart" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <HabitChart habitData={habitData} days={days} allHabits={allHabits} />
            <Card>
              <ST t="Daily Breakdown" />
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
                {days.map((day) => {
                  const done = allHabits.filter((h) => habitData[day]?.[h]).length;
                  const pct  = allHabits.length ? Math.round((done / allHabits.length) * 100) : 0;
                  const isToday = day === today;
                  return (
                    <div key={day} style={{ minWidth: 72, background: isToday ? "rgba(34,197,94,0.1)" : "#1a1a1a", border: `1px solid ${isToday ? "#22c55e" : "#2a2a2a"}`, borderRadius: 10, padding: "10px 8px", textAlign: "center", flexShrink: 0 }}>
                      <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 4, fontFamily: "'Space Mono',monospace" }}>{getMonthLabel(day)} {getDayLabel(day)}</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: pct >= 70 ? "#22c55e" : pct >= 40 ? "#f59e0b" : "#ef4444", fontFamily: "'Space Mono',monospace" }}>{pct}%</div>
                      <div style={{ fontSize: 10, color: "#4b5563", marginTop: 4 }}>{done}/{allHabits.length}</div>
                      {isToday && <div style={{ fontSize: 9, color: "#22c55e", marginTop: 4, fontWeight: 700 }}>TODAY</div>}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {tab === "pomodoro" && (
          <div style={{ maxWidth: 400, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
            <Pomodoro />
            <Card>
              <ST t="How It Works" />
              {[["🍅 Focus", "25 min deep work session"], ["☕ Short Break", "5 min rest"], ["🌿 Long Break", "15 min after 4 sessions"]].map(([t, d]) => (
                <div key={t} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid #1a1a1a" }}>
                  <span style={{ fontSize: 13, color: "#86efac", minWidth: 100 }}>{t}</span>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>{d}</span>
                </div>
              ))}
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}