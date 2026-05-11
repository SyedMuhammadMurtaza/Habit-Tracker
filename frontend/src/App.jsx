import { useState, useEffect, useCallback, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_BASE;
const USER_ID  = "default";

const getLast10Days = () => {
  const days = [];
  for (let i = 9; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push(d.toISOString().split("T")[0]); }
  return days;
};
const getDayLabel   = (dateStr) => new Date(dateStr).getDate();
const getMonthLabel = (dateStr) => new Date(dateStr).toLocaleDateString("en-US", { month: "short" });

const TAG_COLORS = { Urgent: { bg: "#ef4444", text: "#fff" }, Medium: { bg: "#22c55e", text: "#fff" }, Low: { bg: "#3b82f6", text: "#fff" } };

const INITIAL_MORNING  = ["Cold Shower", "Daily Journal", "Gym", "Yoga"];
const INITIAL_EVENING  = ["Read", "Study", "Wash Face"];
const INITIAL_NIGHT    = ["Meditate", "Plan Tomorrow", "Sleep by 11pm"];
const INITIAL_WORKOUT  = ["Warm Up", "Cardio", "Strength Training", "Cool Down", "Protein Intake"];
const INITIAL_SKINCARE = ["Cleanser", "Toner", "Moisturizer", "Sunscreen", "Eye Cream"];
const INITIAL_DIET     = ["Breakfast", "Lunch", "Dinner", "2L Water", "No Junk Food"];
const INITIAL_WORKOUT_PRI  = ["Train 5 days a week", "Track calories", "Sleep 8 hours"];
const INITIAL_SKINCARE_PRI = ["No touching face", "Change pillowcase weekly", "Stay hydrated"];
const INITIAL_DIET_PRI     = ["Eat whole foods", "No sugar after 6pm", "Meal prep Sunday"];

const buildHabitData = (habits) => {
  const days = getLast10Days(), data = {};
  days.forEach((day) => { data[day] = {}; habits.forEach((h) => { data[day][h] = Math.random() > 0.4; }); });
  const today = days[days.length - 1];
  habits.forEach((h) => (data[today][h] = false));
  return data;
};

const INITIAL_TODOS = [
  { id: 1, text: "Run 2.5km",              tag: "Medium", done: false },
  { id: 2, text: "Meet with Sarah",         tag: "Urgent", done: false },
  { id: 3, text: "Post on Instagram Today", tag: "Medium", done: false },
  { id: 4, text: "Start Building Website",  tag: "Medium", done: false },
  { id: 5, text: "Plan for new website",    tag: "Urgent", done: false },
];

// ── API ───────────────────────────────────────────────────────────────────────
const api = {
  load: async () => { const res = await fetch(`${API_BASE}/brain/${USER_ID}`); if (!res.ok) throw new Error("Failed"); return res.json(); },
  save: async (patch) => { const res = await fetch(`${API_BASE}/brain/${USER_ID}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) }); if (!res.ok) throw new Error("Failed"); return res.json(); },
};

// ── Styles ────────────────────────────────────────────────────────────────────
const iStyle      = { flex: 1, background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13 };
const eInputStyle = { flex: 1, background: "#1a1a1a", border: "1px solid #22c55e", borderRadius: 6, padding: "4px 8px", color: "#fff", fontSize: 13, outline: "none" };

// ── Primitives ────────────────────────────────────────────────────────────────
const AddBtn      = ({ onClick }) => <button onClick={onClick} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "#22c55e", color: "#000", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>+</button>;
const DelBtn      = ({ onClick }) => <button onClick={onClick} style={{ background: "none", border: "none", color: "#4b5563", cursor: "pointer", fontSize: 14, padding: "0 4px" }}>✕</button>;
const EditBtn     = ({ onClick, active }) => <button onClick={onClick} style={{ background: "none", border: "none", color: active ? "#22c55e" : "#4b5563", cursor: "pointer", fontSize: 13, padding: "0 4px" }}>✎</button>;
const SaveEditBtn = ({ onClick }) => <button onClick={onClick} style={{ background: "#22c55e", border: "none", borderRadius: 6, color: "#000", cursor: "pointer", fontSize: 11, padding: "3px 8px", fontWeight: 700, fontFamily: "'Space Mono',monospace" }}>OK</button>;
const Card        = ({ children, style }) => <div style={{ background: "#111", border: "1px solid #1f1f1f", borderRadius: 12, padding: 16, ...style }}>{children}</div>;
const ST          = ({ t }) => <div style={{ fontSize: 12, color: "#86efac", fontFamily: "'Space Mono',monospace", marginBottom: 10, letterSpacing: 1 }}>{t}</div>;

function SaveBadge({ status }) {
  const map = { saving: { color: "#f59e0b", label: "⟳ Saving..." }, saved: { color: "#22c55e", label: "✓ Saved" }, error: { color: "#ef4444", label: "✕ Error" }, idle: null };
  const s = map[status]; if (!s) return null;
  return <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 9999, background: "#111", border: `1px solid ${s.color}`, color: s.color, fontFamily: "'Space Mono',monospace", fontSize: 11, padding: "6px 14px", borderRadius: 99, boxShadow: `0 0 12px ${s.color}44` }}>{s.label}</div>;
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 20px #22c55e", animation: "pulse 1s infinite" }} />
      <div style={{ fontFamily: "'Space Mono',monospace", color: "#86efac", fontSize: 13, letterSpacing: 2 }}>LOADING BRAIN...</div>
      <style>{`@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(1.5)}}`}</style>
    </div>
  );
}

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  const h = String(time.getHours()).padStart(2, "0"), m = String(time.getMinutes()).padStart(2, "0");
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ fontSize: 11, color: "#86efac", fontFamily: "'Space Mono',monospace", letterSpacing: 2, opacity: 0.8 }}>1% Everyday. Focus.</div>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {[h, m].map((v, i) => (<div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>{i > 0 && <span style={{ color: "#86efac", fontSize: 20, fontFamily: "'Space Mono',monospace", opacity: 0.7 }}>:</span>}<div style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 6, padding: "6px 10px", fontFamily: "'Space Mono',monospace", fontSize: 22, color: "#fff", fontWeight: 700, minWidth: 44, textAlign: "center" }}>{v}</div></div>))}
      </div>
    </div>
  );
}

function ProgressBar({ label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <span style={{ fontSize: 11, color: "#9ca3af", width: 52, fontFamily: "'Space Mono',monospace" }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: "#2a2a2a", borderRadius: 99, overflow: "hidden" }}><div style={{ height: "100%", width: `${value}%`, background: "linear-gradient(90deg,#22c55e,#86efac)", borderRadius: 99, transition: "width 0.8s ease" }} /></div>
      <span style={{ fontSize: 11, color: "#86efac", fontFamily: "'Space Mono',monospace", width: 32, textAlign: "right" }}>{value}%</span>
    </div>
  );
}

function TagSelector({ current, onChange }) {
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {Object.keys(TAG_COLORS).map((tag) => (<button key={tag} onClick={() => onChange(tag)} style={{ padding: "3px 9px", borderRadius: 99, border: `1px solid ${current === tag ? TAG_COLORS[tag].bg : "#333"}`, background: current === tag ? TAG_COLORS[tag].bg : "transparent", color: current === tag ? TAG_COLORS[tag].text : "#6b7280", fontSize: 10, cursor: "pointer", fontWeight: 600 }}>{tag}</button>))}
    </div>
  );
}

function Pomodoro() {
  const MODES = { pomodoro: 25 * 60, short: 5 * 60, long: 15 * 60 };
  const [mode, setMode] = useState("pomodoro"), [seconds, setSeconds] = useState(MODES.pomodoro), [running, setRunning] = useState(false);
  useEffect(() => { setSeconds(MODES[mode]); setRunning(false); }, [mode]);
  useEffect(() => { if (!running) return; const t = setInterval(() => setSeconds((s) => s > 0 ? s - 1 : 0), 1000); return () => clearInterval(t); }, [running]);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0"), ss = String(seconds % 60).padStart(2, "0"), progress = 1 - seconds / MODES[mode];
  return (
    <div style={{ background: "#0f1a0f", border: "1px solid #1a3a1a", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, backgroundImage: "url('https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=400&q=80')", backgroundSize: "cover", backgroundPosition: "center", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.78)", borderRadius: 12 }} />
      <div style={{ position: "relative", zIndex: 1, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>{Object.keys(MODES).map((m) => (<button key={m} onClick={() => setMode(m)} style={{ padding: "4px 10px", borderRadius: 99, border: "1px solid #333", background: mode === m ? "#22c55e" : "rgba(255,255,255,0.05)", color: mode === m ? "#000" : "#9ca3af", fontSize: 11, cursor: "pointer", fontFamily: "'Space Mono',monospace", fontWeight: 600 }}>{m === "pomodoro" ? "Focus" : m === "short" ? "Short" : "Long"}</button>))}</div>
        <div style={{ position: "relative", width: 110, height: 110 }}>
          <svg width="110" height="110" style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}><circle cx="55" cy="55" r="48" fill="none" stroke="#1a3a1a" strokeWidth="4" /><circle cx="55" cy="55" r="48" fill="none" stroke="#22c55e" strokeWidth="4" strokeDasharray={`${2 * Math.PI * 48}`} strokeDashoffset={`${2 * Math.PI * 48 * (1 - progress)}`} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s linear" }} /></svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Mono',monospace", fontSize: 26, color: "#fff", fontWeight: 700 }}>{mm}:{ss}</div>
        </div>
        <button onClick={() => setRunning(!running)} style={{ padding: "8px 28px", borderRadius: 99, border: "none", background: running ? "#ef4444" : "#22c55e", color: "#000", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Space Mono',monospace" }}>{running ? "Pause" : "Start"}</button>
      </div>
    </div>
  );
}

function HabitDotGrid({ habitData, habit, days, onToggle }) {
  return (
    <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
      {days.map((day) => (<div key={day} onClick={() => onToggle(day, habit)} title={day} style={{ width: 12, height: 12, borderRadius: 3, background: habitData[day]?.[habit] ? "#3b82f6" : "#2a2a2a", border: habitData[day]?.[habit] ? "1px solid #60a5fa" : "1px solid #333", cursor: "pointer", transition: "all 0.15s" }} />))}
    </div>
  );
}

function HabitChart({ habitData, days, allHabits, accent = "#22c55e" }) {
  const values = days.map((day) => { const d = habitData[day] || {}; const done = allHabits.filter((h) => d[h]).length; return allHabits.length ? Math.round((done / allHabits.length) * 100) : 0; });
  const W = 500, H = 140, PAD = { top: 16, right: 16, bottom: 24, left: 36 };
  const iW = W - PAD.left - PAD.right, iH = H - PAD.top - PAD.bottom;
  const pts = values.map((v, i) => ({ x: PAD.left + (i / Math.max(values.length - 1, 1)) * iW, y: PAD.top + iH - (v / 100) * iH }));
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${pts[pts.length - 1].x} ${PAD.top + iH} L ${pts[0].x} ${PAD.top + iH} Z`;
  const gid = `cg${accent.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <div style={{ background: "#0d0d0d", border: "1px solid #1f1f1f", borderRadius: 10, padding: 12 }}>
      <div style={{ fontSize: 11, color: accent, fontFamily: "'Space Mono',monospace", marginBottom: 8, opacity: 0.8 }}>Tracker — Last 10 Days</div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
        <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={accent} stopOpacity="0.5" /><stop offset="100%" stopColor={accent} stopOpacity="0.02" /></linearGradient></defs>
        {[0, 25, 50, 75, 100].map((g) => { const y = PAD.top + iH - (g / 100) * iH; return (<g key={g}><line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#1f1f1f" strokeWidth="1" /><text x={PAD.left - 4} y={y + 4} textAnchor="end" fontSize="9" fill="#4b5563" fontFamily="Space Mono,monospace">{g}%</text></g>); })}
        <path d={areaD} fill={`url(#${gid})`} /><path d={pathD} fill="none" stroke={accent} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill={accent} stroke="#0d0d0d" strokeWidth="1.5" />)}
        {days.map((day, i) => <text key={i} x={pts[i].x} y={H - 4} textAnchor="middle" fontSize="9" fill="#4b5563" fontFamily="Space Mono,monospace">{getDayLabel(day)}</text>)}
      </svg>
    </div>
  );
}

function DailyBreakdown({ habitData, days, allHabits, today, accent = "#22c55e" }) {
  return (
    <Card>
      <ST t="Daily Breakdown" />
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
        {days.map((day) => {
          const done = allHabits.filter((h) => habitData[day]?.[h]).length;
          const pct  = allHabits.length ? Math.round((done / allHabits.length) * 100) : 0;
          const isToday = day === today;
          return (
            <div key={day} style={{ minWidth: 72, background: isToday ? `${accent}18` : "#1a1a1a", border: `1px solid ${isToday ? accent : "#2a2a2a"}`, borderRadius: 10, padding: "10px 8px", textAlign: "center", flexShrink: 0 }}>
              <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 4, fontFamily: "'Space Mono',monospace" }}>{getMonthLabel(day)} {getDayLabel(day)}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: pct >= 70 ? "#22c55e" : pct >= 40 ? "#f59e0b" : "#ef4444", fontFamily: "'Space Mono',monospace" }}>{pct}%</div>
              <div style={{ fontSize: 10, color: "#4b5563", marginTop: 4 }}>{done}/{allHabits.length}</div>
              {isToday && <div style={{ fontSize: 9, color: accent, marginTop: 4, fontWeight: 700 }}>TODAY</div>}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

const GROUP_ACCENT = { morning: "#f59e0b", evening: "#a78bfa", night: "#6366f1" };

function HabitSection({ label, emoji, habits, group, newVal, setNew, habitData, today, days, toggleHabit, addHabit, deleteHabit, editHabit, accent, compact = false }) {
  const ac = accent || GROUP_ACCENT[group] || "#22c55e";
  const [editingHabit, setEditingHabit] = useState(null);
  const [editVal, setEditVal] = useState("");
  const startEdit = (h) => { setEditingHabit(h); setEditVal(h); };
  const confirmEdit = (old) => { if (editVal.trim() && editVal.trim() !== old) editHabit(group, old, editVal.trim()); setEditingHabit(null); };
  return (
    <div style={{ marginBottom: compact ? 12 : 0 }}>
      {label && <div style={{ fontSize: 10, color: ac, fontFamily: "'Space Mono',monospace", letterSpacing: 1, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}><span>{emoji}</span>{label.toUpperCase()}</div>}
      {habits.map((habit) => {
        const done = habitData[today]?.[habit], isEditing = editingHabit === habit;
        return (
          <div key={habit} style={{ display: "flex", alignItems: "center", gap: compact ? 8 : 12, padding: compact ? "6px 0" : "10px 0", borderBottom: "1px solid #1a1a1a", flexWrap: "wrap" }}>
            <input type="checkbox" checked={!!done} onChange={() => toggleHabit(today, habit)} style={{ accentColor: ac, cursor: "pointer", width: compact ? 14 : 16, height: compact ? 14 : 16, flexShrink: 0 }} />
            {isEditing ? (<><input value={editVal} onChange={(e) => setEditVal(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") confirmEdit(habit); if (e.key === "Escape") setEditingHabit(null); }} style={{ ...eInputStyle, flex: 1, minWidth: 80 }} autoFocus /><SaveEditBtn onClick={() => confirmEdit(habit)} /></>) : (<><span style={{ fontSize: 14, flex: 1, color: done ? "#86efac" : "#d1d5db", fontWeight: done ? 600 : 400, minWidth: compact ? 80 : 120 }}>{habit}</span><HabitDotGrid habitData={habitData} habit={habit} days={days} onToggle={toggleHabit} /></>)}
            <EditBtn onClick={() => isEditing ? setEditingHabit(null) : startEdit(habit)} active={isEditing} />
            <DelBtn onClick={() => deleteHabit(group, habit)} />
          </div>
        );
      })}
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <input value={newVal} onChange={(e) => setNew(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { addHabit(group, newVal); setNew(""); } }} placeholder={`Add ${(label || "habit").toLowerCase()}...`} style={{ ...iStyle, fontSize: 11 }} />
        <AddBtn onClick={() => { addHabit(group, newVal); setNew(""); }} />
      </div>
    </div>
  );
}

function TodoRow({ t, onCheck, onDelete, onEdit, compact = false }) {
  const [editing, setEditing] = useState(false), [val, setVal] = useState(t.text);
  const confirm = () => { if (val.trim()) onEdit(t.id, val.trim()); setEditing(false); };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: compact ? 8 : 10, padding: compact ? "7px 0" : "10px 0", borderBottom: "1px solid #1a1a1a", flexWrap: "wrap" }}>
      <input type="checkbox" checked={t.done} onChange={() => onCheck(t.id)} style={{ accentColor: "#22c55e", cursor: "pointer", width: compact ? 15 : 16, height: compact ? 15 : 16, flexShrink: 0 }} />
      {editing ? (<><input value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") confirm(); if (e.key === "Escape") setEditing(false); }} style={{ ...eInputStyle, flex: 1, minWidth: 80 }} autoFocus /><SaveEditBtn onClick={confirm} /></>) : (<span style={{ flex: 1, fontSize: 14, color: t.done ? "#4b5563" : (compact ? "#d1d5db" : "#e5e7eb"), textDecoration: t.done ? "line-through" : "none", minWidth: compact ? 60 : 120 }}>{t.text}</span>)}
      {!editing && <TagSelector current={t.tag} onChange={(tag) => onEdit(t.id, t.text, tag)} />}
      <EditBtn onClick={() => { setEditing(!editing); setVal(t.text); }} active={editing} />
      <DelBtn onClick={() => onDelete(t.id)} />
    </div>
  );
}

function PriorityRow({ text, index, onDelete, onEdit, accent = "#22c55e" }) {
  const [editing, setEditing] = useState(false), [val, setVal] = useState(text);
  const confirm = () => { if (val.trim()) onEdit(index, val.trim()); setEditing(false); };
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
      <span style={{ color: accent, fontSize: 12, fontFamily: "'Space Mono',monospace", flexShrink: 0 }}>{index + 1}.</span>
      {editing ? (<><input value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") confirm(); if (e.key === "Escape") setEditing(false); }} style={{ ...eInputStyle, flex: 1 }} autoFocus /><SaveEditBtn onClick={confirm} /></>) : (<span style={{ flex: 1, fontSize: 14, color: "#d1d5db" }}>{text}</span>)}
      <EditBtn onClick={() => { setEditing(!editing); setVal(text); }} active={editing} />
      <DelBtn onClick={() => onDelete(index)} />
    </div>
  );
}

// ── Generic Tab uses refs so it never reads stale state ───────────────────────
function GenericTab({ tabKey, accent, label, emoji, days, today, docData, onSave }) {
  const habitsKey     = `${tabKey}Habits`;
  const habitDataKey  = `${tabKey}HabitData`;
  const prioritiesKey = `${tabKey}Priorities`;

  // use refs so handlers always read latest values
  const habitsRef     = useRef(docData[habitsKey]);
  const habitDataRef  = useRef(docData[habitDataKey]);
  const prioritiesRef = useRef(docData[prioritiesKey]);

  const [habits,     setHabits]     = useState(docData[habitsKey]);
  const [habitData,  setHabitData]  = useState(docData[habitDataKey]);
  const [priorities, setPriorities] = useState(docData[prioritiesKey]);
  const [newHabit,    setNewHabit]    = useState("");
  const [newPriority, setNewPriority] = useState("");

  // keep refs in sync
  useEffect(() => { habitsRef.current     = habits;     }, [habits]);
  useEffect(() => { habitDataRef.current  = habitData;  }, [habitData]);
  useEffect(() => { prioritiesRef.current = priorities; }, [priorities]);

  // sync if docData changes (initial load)
  useEffect(() => {
    setHabits(docData[habitsKey]);
    setHabitData(docData[habitDataKey]);
    setPriorities(docData[prioritiesKey]);
  }, [docData[habitsKey], docData[habitDataKey], docData[prioritiesKey]]);

  const saveHabits     = (next) => { setHabits(next);     onSave({ [habitsKey]: next }); };
  const saveHabitData  = (next) => { setHabitData(next);  onSave({ [habitDataKey]: next }); };
  const savePriorities = (next) => { setPriorities(next); onSave({ [prioritiesKey]: next }); };

  const toggleHabit = (day, habit) => {
    const next = { ...habitDataRef.current, [day]: { ...habitDataRef.current[day], [habit]: !habitDataRef.current[day]?.[habit] } };
    saveHabitData(next);
  };

  const addHabit = (group, name) => {
    if (!name.trim()) return;
    const n = name.trim();
    const nd = { ...habitDataRef.current };
    days.forEach((d) => { nd[d] = { ...nd[d], [n]: false }; });
    saveHabitData(nd);
    saveHabits([...habitsRef.current, n]);
  };

  const deleteHabit = (group, habit) => saveHabits(habitsRef.current.filter((x) => x !== habit));

  const editHabit = (group, oldName, newName) => {
    if (!newName.trim() || newName === oldName) return;
    const nd = {};
    days.forEach((d) => {
      nd[d] = { ...habitDataRef.current[d] };
      if (oldName in (nd[d] || {})) { nd[d][newName] = nd[d][oldName]; delete nd[d][oldName]; }
    });
    saveHabitData(nd);
    saveHabits(habitsRef.current.map((x) => x === oldName ? newName : x));
  };

  const addPriority    = () => { if (!newPriority.trim()) return; savePriorities([...prioritiesRef.current, newPriority.trim()]); setNewPriority(""); };
  const deletePriority = (i) => savePriorities(prioritiesRef.current.filter((_, j) => j !== i));
  const editPriority   = (i, val) => savePriorities(prioritiesRef.current.map((p, j) => j === i ? val : p));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 12 }}>
        <Card>
          <ST t={`${emoji} ${label} Tracker`} />
          <HabitSection label="" emoji={emoji} habits={habits} group={tabKey} newVal={newHabit} setNew={setNewHabit} habitData={habitData} today={today} days={days} toggleHabit={toggleHabit} addHabit={addHabit} deleteHabit={deleteHabit} editHabit={editHabit} accent={accent} />
        </Card>
        <Card>
          <ST t={`${emoji} Priorities`} />
          {priorities.map((p, i) => (<PriorityRow key={i} text={p} index={i} onDelete={deletePriority} onEdit={editPriority} accent={accent} />))}
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <input value={newPriority} onChange={(e) => setNewPriority(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addPriority(); }} placeholder="Add priority..." style={iStyle} />
            <AddBtn onClick={addPriority} />
          </div>
        </Card>
      </div>
      <HabitChart habitData={habitData} days={days} allHabits={habits} accent={accent} />
      <DailyBreakdown habitData={habitData} days={days} allHabits={habits} today={today} accent={accent} />
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function SecondBrain() {
  const [tab,        setTab]        = useState("dashboard");
  const [loading,    setLoading]    = useState(true);
  const [saveStatus, setSaveStatus] = useState("idle");

  // core state — also keep refs so handlers never read stale
  const [morningHabits, setMorningHabits] = useState(INITIAL_MORNING);
  const [eveningHabits, setEveningHabits] = useState(INITIAL_EVENING);
  const [nightHabits,   setNightHabits]   = useState(INITIAL_NIGHT);
  const [habitData,     setHabitData]     = useState({});
  const [todos,         setTodos]         = useState(INITIAL_TODOS);
  const [priorities,    setPriorities]    = useState(["Start on new business", "Post on social media", "Apply to new job"]);

  const morningRef   = useRef(INITIAL_MORNING);
  const eveningRef   = useRef(INITIAL_EVENING);
  const nightRef     = useRef(INITIAL_NIGHT);
  const habitDataRef = useRef({});
  const todosRef     = useRef(INITIAL_TODOS);
  const prioritiesRef= useRef(["Start on new business", "Post on social media", "Apply to new job"]);

  useEffect(() => { morningRef.current    = morningHabits; }, [morningHabits]);
  useEffect(() => { eveningRef.current    = eveningHabits; }, [eveningHabits]);
  useEffect(() => { nightRef.current      = nightHabits;   }, [nightHabits]);
  useEffect(() => { habitDataRef.current  = habitData;     }, [habitData]);
  useEffect(() => { todosRef.current      = todos;         }, [todos]);
  useEffect(() => { prioritiesRef.current = priorities;    }, [priorities]);

  // extra tabs data (single object — no stale closure issues because we always pass fresh docData)
  const [docData, setDocData] = useState({
    workoutHabits: INITIAL_WORKOUT, workoutHabitData: {}, workoutPriorities: INITIAL_WORKOUT_PRI,
    skincareHabits: INITIAL_SKINCARE, skincareHabitData: {}, skincarePriorities: INITIAL_SKINCARE_PRI,
    dietHabits: INITIAL_DIET, dietHabitData: {}, dietPriorities: INITIAL_DIET_PRI,
  });

  const [newTodo,         setNewTodo]         = useState("");
  const [newTodoTag,      setNewTodoTag]       = useState("Medium");
  const [newPriority,     setNewPriority]      = useState("");
  const [newMorningHabit, setNewMorningHabit]  = useState("");
  const [newEveningHabit, setNewEveningHabit]  = useState("");
  const [newNightHabit,   setNewNightHabit]    = useState("");

  const days  = getLast10Days();
  const today = days[days.length - 1];
  const allHabits = [...morningHabits, ...eveningHabits, ...nightHabits];

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    api.load().then((doc) => {
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
      setDocData({
        workoutHabits:      doc.workoutHabits      || INITIAL_WORKOUT,
        workoutHabitData:   doc.workoutHabitData   || buildHabitData(INITIAL_WORKOUT),
        workoutPriorities:  doc.workoutPriorities  || INITIAL_WORKOUT_PRI,
        skincareHabits:     doc.skincareHabits     || INITIAL_SKINCARE,
        skincareHabitData:  doc.skincareHabitData  || buildHabitData(INITIAL_SKINCARE),
        skincarePriorities: doc.skincarePriorities || INITIAL_SKINCARE_PRI,
        dietHabits:         doc.dietHabits         || INITIAL_DIET,
        dietHabitData:      doc.dietHabitData      || buildHabitData(INITIAL_DIET),
        dietPriorities:     doc.dietPriorities     || INITIAL_DIET_PRI,
      });
    }).catch(() => {
      setHabitData(buildHabitData([...INITIAL_MORNING, ...INITIAL_EVENING, ...INITIAL_NIGHT]));
      setDocData({
        workoutHabits: INITIAL_WORKOUT, workoutHabitData: buildHabitData(INITIAL_WORKOUT), workoutPriorities: INITIAL_WORKOUT_PRI,
        skincareHabits: INITIAL_SKINCARE, skincareHabitData: buildHabitData(INITIAL_SKINCARE), skincarePriorities: INITIAL_SKINCARE_PRI,
        dietHabits: INITIAL_DIET, dietHabitData: buildHabitData(INITIAL_DIET), dietPriorities: INITIAL_DIET_PRI,
      });
    }).finally(() => setLoading(false));
  }, []);

  // ── Debounced save ────────────────────────────────────────────────────────
  const timerRef = useRef(null);
  const debouncedSave = useCallback((patch) => {
    clearTimeout(timerRef.current);
    setSaveStatus("saving");
    timerRef.current = setTimeout(() => {
      api.save(patch)
        .then(() => { setSaveStatus("saved"); setTimeout(() => setSaveStatus("idle"), 2000); })
        .catch(() => { setSaveStatus("error"); setTimeout(() => setSaveStatus("idle"), 3000); });
    }, 800);
  }, []);

  // ── Core persisted setters (use refs so no stale closure) ─────────────────
  const saveMorning   = (next) => { setMorningHabits(next); debouncedSave({ morningHabits: next }); };
  const saveEvening   = (next) => { setEveningHabits(next); debouncedSave({ eveningHabits: next }); };
  const saveNight     = (next) => { setNightHabits(next);   debouncedSave({ nightHabits: next });   };
  const saveHabitData = (next) => { setHabitData(next);     debouncedSave({ habitData: next });     };
  const saveTodos     = (next) => { setTodos(next);         debouncedSave({ todos: next });         };
  const savePriorities= (next) => { setPriorities(next);    debouncedSave({ priorities: next });    };

  // extra tab save — also updates docData so GenericTab re-renders correctly
  const saveExtra = useCallback((patch) => {
    setDocData((prev) => ({ ...prev, ...patch }));
    debouncedSave(patch);
  }, [debouncedSave]);

  // ── Core habit actions (read from refs) ───────────────────────────────────
  const toggleHabit = (day, habit) => {
    const next = { ...habitDataRef.current, [day]: { ...habitDataRef.current[day], [habit]: !habitDataRef.current[day]?.[habit] } };
    saveHabitData(next);
  };

  const addHabit = (group, name) => {
    if (!name.trim()) return;
    const n = name.trim();
    const nd = { ...habitDataRef.current };
    days.forEach((d) => { nd[d] = { ...nd[d], [n]: false }; });
    saveHabitData(nd);
    if (group === "morning") saveMorning([...morningRef.current, n]);
    else if (group === "evening") saveEvening([...eveningRef.current, n]);
    else saveNight([...nightRef.current, n]);
  };

  const deleteHabit = (group, habit) => {
    if (group === "morning") saveMorning(morningRef.current.filter((x) => x !== habit));
    else if (group === "evening") saveEvening(eveningRef.current.filter((x) => x !== habit));
    else saveNight(nightRef.current.filter((x) => x !== habit));
  };

  const editHabit = (group, oldName, newName) => {
    if (!newName.trim() || newName === oldName) return;
    const nd = {};
    days.forEach((d) => {
      nd[d] = { ...habitDataRef.current[d] };
      if (oldName in (nd[d] || {})) { nd[d][newName] = nd[d][oldName]; delete nd[d][oldName]; }
    });
    saveHabitData(nd);
    const rename = (arr) => arr.map((x) => x === oldName ? newName : x);
    if (group === "morning") saveMorning(rename(morningRef.current));
    else if (group === "evening") saveEvening(rename(eveningRef.current));
    else saveNight(rename(nightRef.current));
  };

  const editTodo     = (id, text, tag) => { const next = todosRef.current.map((x) => x.id === id ? { ...x, text: text ?? x.text, tag: tag ?? x.tag } : x); saveTodos(next); };
  const editPriority = (i, val) => { const next = prioritiesRef.current.map((p, j) => j === i ? val : p); savePriorities(next); };

  const dayPct   = allHabits.length ? Math.round(allHabits.filter((h) => habitData[today]?.[h]).length / allHabits.length * 100) : 0;
  const weekPct  = Math.round(days.slice(-7).reduce((acc, d) => acc + (allHabits.length ? allHabits.filter((h) => habitData[d]?.[h]).length / allHabits.length : 0), 0) / 7 * 100);
  const monthPct = Math.round(days.reduce((acc, d) => acc + (allHabits.length ? allHabits.filter((h) => habitData[d]?.[h]).length / allHabits.length : 0), 0) / days.length * 100);

  const habitSections = [
    { label: "Morning", emoji: "🌅", group: "morning", habits: morningHabits, newVal: newMorningHabit, setNew: setNewMorningHabit },
    { label: "Evening", emoji: "🌆", group: "evening", habits: eveningHabits, newVal: newEveningHabit, setNew: setNewEveningHabit },
    { label: "Night",   emoji: "🌙", group: "night",   habits: nightHabits,   newVal: newNightHabit,   setNew: setNewNightHabit   },
  ];
  const sharedHabitProps = { habitData, today, days, toggleHabit, addHabit, deleteHabit, editHabit };

  const EXTRA_TABS = [
    { tabKey: "workout",  label: "Workout",   emoji: "💪", accent: "#ef4444" },
    { tabKey: "skincare", label: "Skin Care", emoji: "✨", accent: "#ec4899" },
    { tabKey: "diet",     label: "Diet",      emoji: "🥗", accent: "#f59e0b" },
  ];

  const NAV = [
    { id: "dashboard", icon: "⌂",  label: "Dashboard" },
    { id: "habits",    icon: "✓",  label: "Habits"    },
    { id: "todos",     icon: "☑",  label: "To-Do"     },
    { id: "chart",     icon: "◈",  label: "Progress"  },
    { id: "pomodoro",  icon: "⏱",  label: "Pomodoro"  },
    { id: "workout",   icon: "💪", label: "Workout"   },
    { id: "skincare",  icon: "✨", label: "Skin Care" },
    { id: "diet",      icon: "🥗", label: "Diet"      },
  ];

  const activeExtra = EXTRA_TABS.find((t) => t.tabKey === tab);

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
        @media(max-width:700px){.row1-grid,.row2-grid,.grid-2{grid-template-columns:1fr!important}.header-title{font-size:12px!important}.nav-scroll{gap:4px!important}}
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
        {NAV.map((n) => {
          const extra = EXTRA_TABS.find((e) => e.tabKey === n.id);
          const ac = extra ? extra.accent : "#22c55e";
          const active = tab === n.id;
          return (<button key={n.id} onClick={() => setTab(n.id)} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid", borderColor: active ? ac : "#1f1f1f", background: active ? `${ac}18` : "transparent", color: active ? ac : "#6b7280", fontSize: 12, cursor: "pointer", fontFamily: "'Space Mono',monospace", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}>{n.icon} {n.label}</button>);
        })}
      </div>

      <div style={{ flex: 1, padding: "16px 24px", width: "100%", paddingBottom: 32 }}>

        {/* ── EXTRA TABS ── */}
        {activeExtra && (
          <GenericTab key={activeExtra.tabKey} tabKey={activeExtra.tabKey} accent={activeExtra.accent} label={activeExtra.label} emoji={activeExtra.emoji} days={days} today={today} docData={docData} onSave={saveExtra} />
        )}

        {/* ── DASHBOARD ── */}
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
                {["Monthly", "2024 Weeks", "Habit Tracker", "Time Box"].map((item) => (<div key={item} onClick={() => item === "Habit Tracker" && setTab("habits")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #1a1a1a", cursor: "pointer", color: "#9ca3af", fontSize: 14 }}><span style={{ fontSize: 10, color: "#22c55e" }}>▶</span> {item}</div>))}
              </Card>
              <Card>
                <ST t="To-Do List" />
                <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
                  <input value={newTodo} onChange={(e) => setNewTodo(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && newTodo.trim()) { const next = [...todosRef.current, { id: Date.now(), text: newTodo.trim(), tag: newTodoTag, done: false }]; saveTodos(next); setNewTodo(""); } }} placeholder="Add new task..." style={{ ...iStyle, minWidth: 0, fontSize: 12 }} />
                  <TagSelector current={newTodoTag} onChange={setNewTodoTag} />
                  <AddBtn onClick={() => { if (newTodo.trim()) { const next = [...todosRef.current, { id: Date.now(), text: newTodo.trim(), tag: newTodoTag, done: false }]; saveTodos(next); setNewTodo(""); } }} />
                </div>
                {todos.map((t) => (<TodoRow key={t.id} t={t} compact onCheck={(id) => { const next = todosRef.current.map((x) => x.id === id ? { ...x, done: !x.done } : x); saveTodos(next); }} onDelete={(id) => { const next = todosRef.current.filter((x) => x.id !== id); saveTodos(next); }} onEdit={(id, text, tag) => editTodo(id, text, tag)} />))}
                {todos.length === 0 && <div style={{ color: "#4b5563", fontSize: 12, textAlign: "center", padding: 12 }}>No tasks yet!</div>}
              </Card>
              <Card>
                <ST t="Current Priorities" />
                {priorities.map((p, i) => (<PriorityRow key={i} text={p} index={i} onDelete={(idx) => { const next = prioritiesRef.current.filter((_, j) => j !== idx); savePriorities(next); }} onEdit={editPriority} />))}
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <input value={newPriority} onChange={(e) => setNewPriority(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && newPriority.trim()) { const next = [...prioritiesRef.current, newPriority.trim()]; savePriorities(next); setNewPriority(""); } }} placeholder="Add priority..." style={iStyle} />
                  <AddBtn onClick={() => { if (newPriority.trim()) { const next = [...prioritiesRef.current, newPriority.trim()]; savePriorities(next); setNewPriority(""); } }} />
                </div>
              </Card>
            </div>
            <div className="grid-2">
              <Card>
                <ST t="Habits — Today" />
                {habitSections.map(({ label, emoji, group, habits, newVal, setNew }) => (<HabitSection key={group} label={label} emoji={emoji} group={group} habits={habits} newVal={newVal} setNew={setNew} {...sharedHabitProps} compact />))}
              </Card>
              <Pomodoro />
            </div>
            <HabitChart habitData={habitData} days={days} allHabits={allHabits} />
            <DailyBreakdown habitData={habitData} days={days} allHabits={allHabits} today={today} />
          </div>
        )}

        {tab === "habits" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {habitSections.map(({ label, emoji, group, habits, newVal, setNew }) => (<Card key={group}><ST t={`${emoji} ${label} Habits`} /><HabitSection label={label} emoji={emoji} group={group} habits={habits} newVal={newVal} setNew={setNew} {...sharedHabitProps} /></Card>))}
            <HabitChart habitData={habitData} days={days} allHabits={allHabits} />
          </div>
        )}

        {tab === "todos" && (
          <Card>
            <ST t="To-Do List" />
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
              <input value={newTodo} onChange={(e) => setNewTodo(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && newTodo.trim()) { const next = [...todosRef.current, { id: Date.now(), text: newTodo.trim(), tag: newTodoTag, done: false }]; saveTodos(next); setNewTodo(""); } }} placeholder="Add new task... (press Enter)" style={{ ...iStyle, minWidth: 180 }} />
              <TagSelector current={newTodoTag} onChange={setNewTodoTag} />
              <AddBtn onClick={() => { if (newTodo.trim()) { const next = [...todosRef.current, { id: Date.now(), text: newTodo.trim(), tag: newTodoTag, done: false }]; saveTodos(next); setNewTodo(""); } }} />
            </div>
            {todos.map((t) => (<TodoRow key={t.id} t={t} onCheck={(id) => { const next = todosRef.current.map((x) => x.id === id ? { ...x, done: !x.done } : x); saveTodos(next); }} onDelete={(id) => { const next = todosRef.current.filter((x) => x.id !== id); saveTodos(next); }} onEdit={(id, text, tag) => editTodo(id, text, tag)} />))}
            {todos.length === 0 && <div style={{ color: "#4b5563", fontSize: 13, textAlign: "center", padding: 20 }}>No tasks yet. Add one above!</div>}
          </Card>
        )}

        {tab === "chart" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <HabitChart habitData={habitData} days={days} allHabits={allHabits} />
            <DailyBreakdown habitData={habitData} days={days} allHabits={allHabits} today={today} />
          </div>
        )}

        {tab === "pomodoro" && (
          <div style={{ maxWidth: 400, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
            <Pomodoro />
            <Card>
              <ST t="How It Works" />
              {[["🍅 Focus", "25 min deep work session"], ["☕ Short Break", "5 min rest"], ["🌿 Long Break", "15 min after 4 sessions"]].map(([t, d]) => (<div key={t} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid #1a1a1a" }}><span style={{ fontSize: 13, color: "#86efac", minWidth: 100 }}>{t}</span><span style={{ fontSize: 12, color: "#6b7280" }}>{d}</span></div>))}
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}