import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import handbook from "../dsa_100_array_string_grid_handbook.json";

// ============================================================
// STORAGE: window.storage (cross-device) → in-memory fallback
// ============================================================
const memoryStore = {};
const storage = {
  async get(key) {
    try {
      if (window.storage) {
        const r = await window.storage.get(key);
        return r ? JSON.parse(r.value) : null;
      }
    } catch (_) {}
    return memoryStore[key] ?? null;
  },
  async set(key, value) {
    try { if (window.storage) await window.storage.set(key, JSON.stringify(value)); } catch (_) {}
    memoryStore[key] = value;
  },
};

// ============================================================
// THEME TOKENS — every color in one place, swapped by mode
// ============================================================
const THEMES = {
  dark: {
    bgRoot:       "#050811",
    bgHeader:     "rgba(5,8,17,0.9)",
    bgSidebar:    "rgba(8,12,26,0.97)",
    bgCard:       "rgba(255,255,255,0.03)",
    bgCardHover:  "rgba(255,255,255,0.055)",
    bgInput:      "rgba(255,255,255,0.04)",
    bgTag:        "rgba(255,255,255,0.07)",
    bgTrigger:    "rgba(251,191,36,0.07)",
    bgSolvedCard: "rgba(52,211,153,0.07)",
    borderSubtle: "rgba(255,255,255,0.07)",
    borderMedium: "rgba(255,255,255,0.12)",
    borderInput:  "rgba(255,255,255,0.09)",
    borderFocus:  "rgba(56,189,248,0.5)",
    borderTrigger:"rgba(251,191,36,0.2)",
    borderSolved: "rgba(52,211,153,0.2)",
    textPrimary:  "#f1f5f9",
    textSecondary:"#cbd5e1",
    textMuted:    "#94a3b8",
    textFaint:    "#64748b",
    textXFaint:   "#334155",
    textStrong:   "#ffffff",
    textTrigger:  "#fde68a",
    gridLine:     "rgba(255,255,255,0.016)",
    mesh1:        "rgba(56,189,248,0.07)",
    mesh2:        "rgba(167,139,250,0.07)",
    mesh3:        "rgba(52,211,153,0.05)",
    shadowCard:   "0 4px 24px rgba(0,0,0,0.35)",
    scrollbar:    "rgba(255,255,255,0.09)",
    overlay:      "rgba(0,0,0,0.72)",
    barTrack:     "rgba(255,255,255,0.07)",
    statusTodo:   "#3b4a5c",
  },
  light: {
    bgRoot:       "#eef2f7",
    bgHeader:     "rgba(255,255,255,0.93)",
    bgSidebar:    "rgba(250,252,255,0.98)",
    bgCard:       "rgba(255,255,255,0.92)",
    bgCardHover:  "rgba(255,255,255,1)",
    bgInput:      "rgba(255,255,255,0.95)",
    bgTag:        "rgba(0,0,0,0.055)",
    bgTrigger:    "rgba(217,119,6,0.07)",
    bgSolvedCard: "rgba(5,150,105,0.07)",
    borderSubtle: "rgba(0,0,0,0.08)",
    borderMedium: "rgba(0,0,0,0.13)",
    borderInput:  "rgba(0,0,0,0.1)",
    borderFocus:  "rgba(2,132,199,0.5)",
    borderTrigger:"rgba(202,138,4,0.28)",
    borderSolved: "rgba(5,150,105,0.28)",
    textPrimary:  "#0f172a",
    textSecondary:"#1e293b",
    textMuted:    "#475569",
    textFaint:    "#64748b",
    textXFaint:   "#94a3b8",
    textStrong:   "#000000",
    textTrigger:  "#78350f",
    gridLine:     "rgba(0,0,0,0.035)",
    mesh1:        "rgba(14,165,233,0.08)",
    mesh2:        "rgba(139,92,246,0.07)",
    mesh3:        "rgba(16,185,129,0.06)",
    shadowCard:   "0 2px 14px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
    scrollbar:    "rgba(0,0,0,0.13)",
    overlay:      "rgba(0,0,0,0.45)",
    barTrack:     "rgba(0,0,0,0.07)",
    statusTodo:   "#cbd5e1",
  },
};

// Accent palette — slightly richer in light mode for contrast on white
const ACCENTS = {
  dark: {
    blue:"#38bdf8", violet:"#a78bfa", green:"#34d399",
    amber:"#fbbf24", pink:"#f472b6", orange:"#fb923c",
    indigo:"#818cf8", lime:"#4ade80", yellow:"#facc15",
    teal:"#2dd4bf", red:"#f87171", fuchsia:"#e879f9", slate:"#94a3b8",
  },
  light: {
    blue:"#0284c7", violet:"#7c3aed", green:"#059669",
    amber:"#d97706", pink:"#db2777", orange:"#ea580c",
    indigo:"#4338ca", lime:"#16a34a", yellow:"#ca8a04",
    teal:"#0d9488", red:"#dc2626", fuchsia:"#a21caf", slate:"#64748b",
  },
};

// ============================================================
// UTILITIES
// ============================================================
const inferTopic = (p) => {
  const t = `${p.title} ${p.problem_statement} ${p.pattern_explanation} ${p.trigger_phrase}`.toLowerCase();
  if (/grid|matrix|board|island|ocean|orange|room|gate|path|flood|pacific|atlantic|cell|submatrix|submatrices/.test(t)) return "Grid";
  if (/string|substring|anagram|palindrome|character|word|decode|calculator|prefix/.test(t)) return "String";
  return "Array";
};

const inferPatternFamily = (p) => {
  const t = `${p.title} ${p.pattern_explanation} ${p.trigger_phrase} ${p.detailed_solution}`.toLowerCase();
  if (/sliding window|window/.test(t)) return "Sliding Window";
  if (/prefix sum|difference array|remainder/.test(t)) return "Prefix / Difference";
  if (/hashmap|hash set|set\b|map\b/.test(t)) return "Hashing";
  if (/two pointers|slow-fast|pointers/.test(t)) return "Two Pointers";
  if (/monotonic stack|stack|deque/.test(t)) return "Stack / Deque";
  if (/heap|priority queue|top-k|top k/.test(t)) return "Heap / Priority Queue";
  if (/binary search/.test(t)) return "Binary Search";
  if (/greedy|interval|sweep/.test(t)) return "Greedy / Intervals";
  if (/dfs|bfs|flood fill|multi-source bfs|connected component/.test(t)) return "DFS / BFS";
  if (/dynamic programming|\bdp\b/.test(t)) return "Dynamic Programming";
  if (/backtracking/.test(t)) return "Backtracking";
  if (/simulation/.test(t)) return "Simulation";
  return "Core Pattern";
};

const extractComplexity = (text) => {
  const tm = text.match(/Time:\s*\*\*(.*?)\*\*/i);
  const sm = text.match(/Space:\s*\*\*(.*?)\*\*/i);
  return { time: tm ? tm[1] : "O(N)", space: sm ? sm[1] : "O(1)" };
};

const getFamilyColor = (family, a) => ({
  "Sliding Window":       a.amber,
  "Prefix / Difference":  a.indigo,
  "Hashing":              a.blue,
  "Two Pointers":         a.pink,
  "Stack / Deque":        a.orange,
  "Heap / Priority Queue":a.fuchsia,
  "Binary Search":        a.lime,
  "Greedy / Intervals":   a.yellow,
  "DFS / BFS":            a.teal,
  "Dynamic Programming":  a.red,
  "Backtracking":         a.fuchsia,
  "Simulation":           a.slate,
  "Core Pattern":         a.slate,
}[family] || a.slate);

const getTopicMeta = (topic, a) => ({
  Array:  { color: a.blue,   glow: `${a.blue}60`   },
  String: { color: a.violet, glow: `${a.violet}60`  },
  Grid:   { color: a.green,  glow: `${a.green}60`   },
}[topic] || { color: a.blue, glow: `${a.blue}60` });

// ============================================================
// THEME CONTEXT
// ============================================================
const ThemeCtx = React.createContext({ mode: "dark", th: THEMES.dark, a: ACCENTS.dark });
const useTheme = () => React.useContext(ThemeCtx);

// ============================================================
// GLOBAL STYLES
// ============================================================
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Space+Mono:wght@400;700&family=Outfit:wght@700;800;900&display=swap');
    *, *::before, *::after { box-sizing:border-box; -webkit-tap-highlight-color:transparent; margin:0; padding:0; }

    @keyframes meshFloat1  { 0%,100%{transform:translate(0,0)scale(1)}   50%{transform:translate(3%,5%)scale(1.1)} }
    @keyframes meshFloat2  { 0%,100%{transform:translate(0,0)scale(1)}   50%{transform:translate(-3%,-3%)scale(1.08)} }
    @keyframes meshFloat3  { 0%,100%{transform:translate(0,0)scale(1)}   50%{transform:translate(4%,-4%)scale(1.05)} }
    @keyframes fadeSlideIn { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fadeIn      { from{opacity:0} to{opacity:1} }
    @keyframes spin        { to{transform:rotate(360deg)} }

    ::-webkit-scrollbar       { width:4px; height:4px; }
    ::-webkit-scrollbar-track { background:transparent; }
    ::-webkit-scrollbar-thumb { background:var(--scrollbar,rgba(128,128,128,0.2)); border-radius:4px; }

    .dsa-root { font-family:'Inter',system-ui,sans-serif; }
    .card-lift { transition:transform 0.18s, box-shadow 0.18s; }
    .card-lift:hover { transform:translateY(-1px); }
    .btn-base { cursor:pointer; border:none; background:none; font-family:inherit; }
    .btn-base:disabled { cursor:not-allowed; }
    .btn-hover { transition:all 0.14s; cursor:pointer; }
    .btn-hover:hover { filter:brightness(1.08); }
    .prob-item { transition:background 0.12s, border-color 0.1s; }
    .section-content { overflow:hidden; transition:max-height 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.25s; }
    .section-content.closed { max-height:0 !important; opacity:0; }
    .section-content.open   { opacity:1; }

    @media(max-width:768px) {
      .dsa-sidebar {
        position:fixed !important; left:0 !important; top:0 !important; bottom:0 !important;
        z-index:200 !important; transform:translateX(-100%);
        transition:transform 0.27s cubic-bezier(0.4,0,0.2,1) !important;
      }
      .dsa-sidebar.open { transform:translateX(0) !important; }
      .hide-mobile { display:none !important; }
      .show-mobile { display:flex !important; }
    }
    @media(min-width:769px) { .show-mobile { display:none !important; } }
  `}</style>
);

// ============================================================
// BACKGROUND MESH
// ============================================================
const BackgroundMesh = () => {
  const { th } = useTheme();
  return (
    <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:"-20%", left:"-10%", width:"55%", height:"55%",
        background:`radial-gradient(circle, ${th.mesh1} 0%, transparent 70%)`, animation:"meshFloat1 12s ease-in-out infinite" }} />
      <div style={{ position:"absolute", bottom:"-15%", right:"-10%", width:"50%", height:"50%",
        background:`radial-gradient(circle, ${th.mesh2} 0%, transparent 70%)`, animation:"meshFloat2 15s ease-in-out infinite" }} />
      <div style={{ position:"absolute", top:"40%", right:"20%", width:"30%", height:"30%",
        background:`radial-gradient(circle, ${th.mesh3} 0%, transparent 70%)`, animation:"meshFloat3 18s ease-in-out infinite" }} />
      <div style={{ position:"absolute", inset:0,
        backgroundImage:`linear-gradient(${th.gridLine} 1px,transparent 1px),linear-gradient(90deg,${th.gridLine} 1px,transparent 1px)`,
        backgroundSize:"48px 48px" }} />
    </div>
  );
};

// ============================================================
// CONFETTI
// ============================================================
const Confetti = ({ active, onDone }) => {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const particles = Array.from({ length: 90 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height * 0.5,
      r: Math.random() * 6 + 3,
      color: ["#38bdf8","#34d399","#a78bfa","#fbbf24","#f472b6","#fb923c"][Math.floor(Math.random()*6)],
      tiltAngle: 0, tiltInc: Math.random() * 0.07 + 0.05, tilt: 0, vy: Math.random() * 3 + 2,
    }));
    let frame, elapsed = 0;
    const run = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.tiltAngle += p.tiltInc; p.y += p.vy; p.tilt = Math.sin(p.tiltAngle) * 15;
        ctx.beginPath(); ctx.lineWidth = p.r; ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r/2, p.y); ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r/2);
        ctx.stroke();
      });
      if (++elapsed < 110) frame = requestAnimationFrame(run);
      else { ctx.clearRect(0,0,canvas.width,canvas.height); onDone?.(); }
    };
    frame = requestAnimationFrame(run);
    return () => cancelAnimationFrame(frame);
  }, [active]);
  return <canvas ref={canvasRef} style={{ position:"fixed", inset:0, zIndex:999, pointerEvents:"none" }} />;
};

// ============================================================
// ATOMS
// ============================================================
const RichText = ({ text }) => {
  const { th } = useTheme();
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <p style={{ fontSize:15, lineHeight:1.78, color:th.textSecondary, margin:0 }}>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**")
          ? <strong key={i} style={{ color:th.textPrimary, fontWeight:700 }}>{p.slice(2,-2)}</strong>
          : p
      )}
    </p>
  );
};

const Pill = ({ children, color }) => (
  <span style={{ display:"inline-flex", alignItems:"center", padding:"2px 10px", borderRadius:999,
    fontSize:11, fontWeight:700, letterSpacing:"0.04em",
    border:`1px solid ${color}38`, background:`${color}1a`, color }}>
    {children}
  </span>
);

const StatusDot = ({ status }) => {
  const { th } = useTheme();
  const cfg = {
    solved:   { c:"#34d399", g:"rgba(52,211,153,0.6)"  },
    attempted:{ c:"#fbbf24", g:"rgba(251,191,36,0.6)"   },
    todo:     { c:th.statusTodo, g:"transparent" },
  };
  const { c, g } = cfg[status] || cfg.todo;
  return <span style={{ display:"inline-block", width:8, height:8, borderRadius:"50%", background:c, boxShadow:`0 0 8px ${g}`, flexShrink:0 }} />;
};

const ComplexityChip = ({ label, value, color }) => {
  const { th } = useTheme();
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"8px 14px",
      background:th.bgCard, border:`1px solid ${th.borderSubtle}`, borderRadius:12, boxShadow:th.shadowCard }}>
      <span style={{ fontSize:10, color:th.textFaint, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:2 }}>{label}</span>
      <span style={{ fontSize:13, fontWeight:800, fontFamily:"Space Mono", color }}>{value}</span>
    </div>
  );
};

const CircleProgress = ({ pct, size=110, stroke=8, color, children }) => {
  const { th } = useTheme();
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={th.barTrack} strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${(pct/100)*circ} ${circ}`} strokeLinecap="round"
          style={{ transition:"stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)", filter:`drop-shadow(0 0 6px ${color})` }} />
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>{children}</div>
    </div>
  );
};

const ThemeToggle = ({ mode, onToggle }) => {
  const { th } = useTheme();
  return (
    <button onClick={onToggle} className="btn-hover" title={`Switch to ${mode==="dark"?"light":"dark"} mode`}
      style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px",
        background:th.bgCard, border:`1px solid ${th.borderSubtle}`, borderRadius:10,
        color:th.textMuted, fontSize:12, fontWeight:700, cursor:"pointer",
        boxShadow:th.shadowCard, userSelect:"none" }}>
      <span style={{ fontSize:15 }}>{mode==="dark" ? "☀️" : "🌙"}</span>
      <span>{mode==="dark" ? "Light" : "Dark"}</span>
    </button>
  );
};

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem("dsa_theme") || "dark"; } catch { return "dark"; }
  });
  const th = THEMES[mode];
  const a  = ACCENTS[mode];

  const toggleMode = useCallback(() => {
    setMode(m => {
      const next = m === "dark" ? "light" : "dark";
      try { localStorage.setItem("dsa_theme", next); } catch {}
      return next;
    });
  }, []);

  const [progress,    setProgress]    = useState({});
  const [search,      setSearch]      = useState("");
  const [filterTopic, setFilterTopic] = useState("All");
  const [filterStatus,setFilterStatus]= useState("All");
  const [filterFamily,setFilterFamily]= useState("All");
  const [selectedId,  setSelectedId]  = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab,   setActiveTab]   = useState("detail");
  const [confetti,    setConfetti]    = useState(false);
  const [syncStatus,  setSyncStatus]  = useState("idle");
  const [expanded, setExpanded] = useState({ problem:true, pattern:true, trigger:true, solution:true, remarks:true });
  const syncTimer = useRef(null);

  useEffect(() => {
    storage.get("dsa_progress_v2").then(data => { if (data) setProgress(data); });
  }, []);

  const saveProgress = useCallback(async (next) => {
    setSyncStatus("saving");
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      await storage.set("dsa_progress_v2", next);
      setSyncStatus("saved");
      setTimeout(() => setSyncStatus("idle"), 2000);
    }, 600);
  }, []);

  const updateStatus = useCallback((id, status) => {
    const wasSolved = progress[id]?.status === "solved";
    setProgress(prev => {
      const next = { ...prev, [id]: { ...(prev[id] || { remarks:"" }), status } };
      saveProgress(next); return next;
    });
    if (!wasSolved && status === "solved") setConfetti(true);
  }, [progress, saveProgress]);

  const updateRemarks = useCallback((id, remarks) => {
    setProgress(prev => {
      const next = { ...prev, [id]: { ...(prev[id] || { status:"todo" }), remarks } };
      saveProgress(next); return next;
    });
  }, [saveProgress]);

  const problems = useMemo(() =>
    handbook.problems.map(p => ({
      ...p, topic:inferTopic(p), family:inferPatternFamily(p),
      complexity:extractComplexity(p.detailed_solution),
      userState: progress[p.number] || { status:"todo", remarks:"" },
    })), [progress]);

  const stats = useMemo(() => {
    const total    = problems.length;
    const solved   = problems.filter(p => p.userState.status === "solved").length;
    const attempted= problems.filter(p => p.userState.status === "attempted").length;
    const byTopic  = { Array:{solved:0,total:0}, String:{solved:0,total:0}, Grid:{solved:0,total:0} };
    const byFamily = {};
    problems.forEach(p => {
      byTopic[p.topic].total++;
      if (p.userState.status === "solved") byTopic[p.topic].solved++;
      if (!byFamily[p.family]) byFamily[p.family] = { solved:0, total:0 };
      byFamily[p.family].total++;
      if (p.userState.status === "solved") byFamily[p.family].solved++;
    });
    return { total, solved, attempted, todo:total-solved-attempted, pct:Math.round((solved/total)*100), byTopic, byFamily };
  }, [problems]);

  const ALL_FAMILIES = ["All","Sliding Window","Prefix / Difference","Hashing","Two Pointers",
    "Stack / Deque","Heap / Priority Queue","Binary Search","Greedy / Intervals",
    "DFS / BFS","Dynamic Programming","Backtracking","Simulation","Core Pattern"];

  const filteredProblems = useMemo(() => {
    const q = search.toLowerCase();
    return problems.filter(p => {
      const ms = !q || p.title.toLowerCase().includes(q) || p.trigger_phrase.toLowerCase().includes(q) || p.family.toLowerCase().includes(q);
      const mt = filterTopic  === "All" || p.topic            === filterTopic;
      const mv = filterStatus === "All" || p.userState.status === filterStatus;
      const mf = filterFamily === "All" || p.family           === filterFamily;
      return ms && mt && mv && mf;
    });
  }, [problems, search, filterTopic, filterStatus, filterFamily]);

  const selectedProblem = problems.find(p => p.number === selectedId) || problems[0];

  const navigate = useCallback((dir) => {
    const idx  = filteredProblems.findIndex(p => p.number === selectedId);
    const next = filteredProblems[idx + dir];
    if (next) setSelectedId(next.number);
  }, [filteredProblems, selectedId]);

  const toggleExpanded = (k) => setExpanded(prev => ({ ...prev, [k]: !prev[k] }));

  const resetFilters = () => { setSearch(""); setFilterTopic("All"); setFilterStatus("All"); setFilterFamily("All"); };

  const syncColor = syncStatus === "saved" ? a.green : th.textFaint;

  return (
    <ThemeCtx.Provider value={{ mode, th, a }}>
      <GlobalStyles />
      <BackgroundMesh />
      <Confetti active={confetti} onDone={() => setConfetti(false)} />

      <div className="dsa-root" style={{
        position:"fixed", inset:0, display:"flex", flexDirection:"column",
        background:th.bgRoot, color:th.textPrimary,
        transition:"background 0.3s, color 0.3s"
      }}>

        {/* ── HEADER ── */}
        <header style={{
          flexShrink:0, zIndex:50,
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"0 16px", height:58,
          background:th.bgHeader, backdropFilter:"blur(20px)",
          borderBottom:`1px solid ${th.borderSubtle}`,
          boxShadow: mode==="light" ? "0 1px 0 rgba(0,0,0,0.07)" : "none",
        }}>
          {/* Left */}
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <button className="btn-base show-mobile" style={{ display:"none" }}
              onClick={() => setSidebarOpen(v => !v)}>
              <div style={{ background:th.bgCard, border:`1px solid ${th.borderSubtle}`, borderRadius:8,
                padding:"6px 8px", display:"flex", color:th.textMuted }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>
                </svg>
              </div>
            </button>

            <div style={{ width:34, height:34, borderRadius:10, flexShrink:0,
              background:"linear-gradient(135deg,#38bdf8,#6366f1)",
              display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow:"0 0 18px rgba(56,189,248,0.35)" }}>
              <span style={{ fontSize:16, fontWeight:900, color:"#fff", fontFamily:"Outfit" }}>D</span>
            </div>

            <div>
              <div style={{ fontFamily:"Outfit", fontWeight:900, fontSize:16, letterSpacing:"-0.03em", color:th.textPrimary }}>
                PatternAtlas <span style={{ color:a.blue }}>DSA</span>
              </div>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.14em", color:th.textFaint, textTransform:"uppercase" }}>
                100 Problems Handbook
              </div>
            </div>
          </div>

          {/* Right */}
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            {syncStatus !== "idle" && (
              <span style={{ fontSize:11, fontWeight:700, color:syncColor, display:"flex", alignItems:"center", gap:5 }}>
                {syncStatus === "saving" && (
                  <span style={{ width:10, height:10, border:`2px solid ${a.blue}`, borderTopColor:"transparent",
                    borderRadius:"50%", animation:"spin 0.6s linear infinite", display:"inline-block" }} />
                )}
                {syncStatus === "saving" ? "Syncing…" : "✓ Saved"}
              </span>
            )}

            {/* Stats bar — hide on mobile */}
            <div className="hide-mobile" style={{ display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:3 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:11, color:th.textFaint }}>Progress</span>
                  <span style={{ fontSize:13, fontWeight:800, color:a.blue, fontFamily:"Space Mono" }}>{stats.pct}%</span>
                </div>
                <div style={{ width:130, height:3, background:th.barTrack, borderRadius:99, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${stats.pct}%`,
                    background:`linear-gradient(90deg,${a.blue},${a.violet})`,
                    borderRadius:99, transition:"width 1s cubic-bezier(0.4,0,0.2,1)",
                    boxShadow:`0 0 8px ${a.blue}80` }} />
                </div>
              </div>
              <div style={{ display:"flex", gap:12 }}>
                {[{v:stats.solved,l:"Solved",c:a.green},{v:stats.attempted,l:"Tried",c:a.amber},{v:stats.todo,l:"Todo",c:th.textFaint}].map(s => (
                  <div key={s.l} style={{ textAlign:"center" }}>
                    <div style={{ fontSize:15, fontWeight:800, color:s.c, fontFamily:"Space Mono", lineHeight:1 }}>{s.v}</div>
                    <div style={{ fontSize:9, fontWeight:700, color:th.textXFaint, textTransform:"uppercase", letterSpacing:"0.1em", marginTop:2 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            <ThemeToggle mode={mode} onToggle={toggleMode} />

            <button className="btn-hover hide-mobile" onClick={() => setActiveTab(v => v==="stats"?"detail":"stats")}
              style={{ background:th.bgCard, border:`1px solid ${th.borderSubtle}`, borderRadius:10,
                padding:"6px 14px", color:th.textMuted, fontSize:11, fontWeight:700, cursor:"pointer",
                boxShadow:th.shadowCard }}>
              {activeTab === "stats" ? "← Study" : "📊 Stats"}
            </button>
          </div>
        </header>

        {/* ── BODY ── */}
        <div style={{ flex:1, display:"flex", overflow:"hidden", position:"relative", zIndex:1 }}>

          {/* Mobile overlay */}
          {sidebarOpen && (
            <div onClick={() => setSidebarOpen(false)}
              style={{ position:"fixed", inset:0, background:th.overlay, zIndex:199,
                display:"none" }} className="show-mobile" />
          )}

          {/* ── SIDEBAR ── */}
          <aside className={`dsa-sidebar ${sidebarOpen ? "open" : ""}`} style={{
            width:330, flexShrink:0, display:"flex", flexDirection:"column",
            background:th.bgSidebar, backdropFilter:"blur(24px)",
            borderRight:`1px solid ${th.borderSubtle}`,
          }}>
            {/* Filters */}
            <div style={{ padding:"12px 12px 8px", flexShrink:0, borderBottom:`1px solid ${th.borderSubtle}` }}>
              {/* Search */}
              <div style={{ position:"relative", marginBottom:10 }}>
                <svg style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)",
                  color:th.textFaint, pointerEvents:"none", flexShrink:0 }}
                  width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input type="text" placeholder="Search problems, patterns…" value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ width:"100%", background:th.bgInput, border:`1px solid ${th.borderInput}`,
                    borderRadius:10, padding:"8px 32px 8px 32px", fontSize:13, color:th.textPrimary,
                    fontFamily:"inherit", transition:"border-color 0.2s",
                    boxShadow: mode==="light" ? "0 1px 3px rgba(0,0,0,0.06)" : "none" }}
                  onFocus={e => e.target.style.borderColor = th.borderFocus}
                  onBlur={e  => e.target.style.borderColor = th.borderInput}
                />
                {search && (
                  <button onClick={() => setSearch("")} style={{ position:"absolute", right:10, top:"50%",
                    transform:"translateY(-50%)", background:"none", border:"none",
                    color:th.textFaint, cursor:"pointer", fontSize:13 }}>✕</button>
                )}
              </div>

              {/* Topic filter */}
              <div style={{ display:"flex", gap:4, marginBottom:8 }}>
                {["All","Array","String","Grid"].map(tp => {
                  const col = { Array:a.blue, String:a.violet, Grid:a.green }[tp] || a.blue;
                  const active = filterTopic === tp;
                  return (
                    <button key={tp} className="btn-hover" onClick={() => setFilterTopic(tp)} style={{
                      flex:1, padding:"5px 4px", borderRadius:8, fontSize:11, fontWeight:700, cursor:"pointer",
                      border: active ? `1px solid ${col}40` : `1px solid ${th.borderSubtle}`,
                      background: active ? `${col}1a` : th.bgTag,
                      color: active ? col : th.textFaint,
                    }}>{tp}</button>
                  );
                })}
              </div>

              {/* Status + Family */}
              <div style={{ display:"flex", gap:6, marginBottom:6 }}>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  style={{ flex:1, background:th.bgInput, border:`1px solid ${th.borderInput}`,
                    borderRadius:8, padding:"6px 8px", fontSize:11, color:th.textMuted,
                    cursor:"pointer", fontFamily:"inherit" }}>
                  {["All","todo","attempted","solved"].map((o,i) => (
                    <option key={o} value={o}>{["All Status","To Do","Attempted","Solved"][i]}</option>
                  ))}
                </select>
                <select value={filterFamily} onChange={e => setFilterFamily(e.target.value)}
                  style={{ flex:1, background:th.bgInput, border:`1px solid ${th.borderInput}`,
                    borderRadius:8, padding:"6px 8px", fontSize:11, color:th.textMuted,
                    cursor:"pointer", fontFamily:"inherit" }}>
                  {ALL_FAMILIES.map(f => (
                    <option key={f} value={f}>{f === "All" ? "All Patterns" : f}</option>
                  ))}
                </select>
              </div>

              <div style={{ fontSize:11, color:th.textXFaint, fontWeight:600 }}>
                {filteredProblems.length} of {problems.length} problems
                {(search || filterTopic!=="All" || filterStatus!=="All" || filterFamily!=="All") && (
                  <button onClick={resetFilters} style={{ marginLeft:8, color:a.blue,
                    background:"none", border:"none", cursor:"pointer", fontSize:11, fontWeight:700 }}>Reset</button>
                )}
              </div>
            </div>

            {/* Problem list */}
            <div style={{ flex:1, overflowY:"auto", padding:"6px 8px 80px" }}>
              {filteredProblems.map((p, idx) => {
                const isSelected = selectedId === p.number;
                const tc = { Array:a.blue, String:a.violet, Grid:a.green }[p.topic] || a.blue;
                const fc = getFamilyColor(p.family, a);
                return (
                  <button key={p.number} className="prob-item btn-base" onClick={() => { setSelectedId(p.number); setSidebarOpen(false); }}
                    style={{ width:"100%", textAlign:"left", padding:"10px 12px", borderRadius:12, marginBottom:3,
                      background: isSelected ? `${tc}14` : "transparent",
                      border: isSelected ? `1px solid ${tc}30` : `1px solid transparent`,
                      position:"relative", display:"block",
                      animation:`fadeIn 0.18s ${Math.min(idx*0.012,0.3)}s both` }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                        <span style={{ fontSize:10, fontWeight:700, color:th.textXFaint, fontFamily:"Space Mono" }}>
                          #{String(p.number).padStart(3,"0")}
                        </span>
                        <StatusDot status={p.userState.status} />
                      </div>
                      <span style={{ fontSize:10, fontWeight:700, color:tc, background:`${tc}18`, borderRadius:999, padding:"1px 7px" }}>
                        {p.topic}
                      </span>
                    </div>
                    <div style={{ fontSize:13, fontWeight:600, lineHeight:1.3, marginBottom:3,
                      color: isSelected ? th.textPrimary : th.textMuted }}>
                      {p.title}
                    </div>
                    <div style={{ fontSize:10, fontWeight:600, color:fc, opacity:0.85 }}>{p.family}</div>
                    {isSelected && (
                      <div style={{ position:"absolute", left:0, top:"18%", bottom:"18%", width:3,
                        background:tc, borderRadius:"0 3px 3px 0", boxShadow:`0 0 10px ${tc}90` }} />
                    )}
                  </button>
                );
              })}
              {filteredProblems.length === 0 && (
                <div style={{ textAlign:"center", padding:"48px 16px" }}>
                  <div style={{ fontSize:32, marginBottom:10 }}>🔍</div>
                  <div style={{ color:th.textFaint, fontSize:14, marginBottom:8 }}>No problems found</div>
                  <button onClick={resetFilters} style={{ color:a.blue, background:"none", border:"none", cursor:"pointer", fontSize:13, fontWeight:700 }}>
                    Reset filters
                  </button>
                </div>
              )}
            </div>
          </aside>

          {/* ── MAIN CONTENT ── */}
          <main style={{ flex:1, overflowY:"auto", position:"relative" }}>
            {activeTab === "stats"
              ? <StatsPanel stats={stats} problems={problems} />
              : <DetailPanel
                  problem={selectedProblem}
                  filteredProblems={filteredProblems}
                  expanded={expanded}
                  toggleExpanded={toggleExpanded}
                  updateStatus={updateStatus}
                  updateRemarks={updateRemarks}
                  navigate={navigate}
                />
            }
          </main>
        </div>

        {/* ── MOBILE BOTTOM NAV ── */}
        <div className="show-mobile" style={{
          display:"none", position:"fixed", bottom:0, left:0, right:0, zIndex:100,
          background:th.bgHeader, backdropFilter:"blur(20px)",
          borderTop:`1px solid ${th.borderSubtle}`, padding:"8px 12px 14px", gap:8,
        }}>
          {[
            { label:"☰ List",   tab:null,     act:() => setSidebarOpen(true) },
            { label:"📖 Study", tab:"detail", act:() => { setActiveTab("detail"); setSidebarOpen(false); } },
            { label:"📊 Stats", tab:"stats",  act:() => { setActiveTab("stats");  setSidebarOpen(false); } },
          ].map(btn => {
            const isActive = btn.tab && activeTab === btn.tab;
            return (
              <button key={btn.label} onClick={btn.act} style={{
                flex:1, padding:"9px 4px", borderRadius:12, fontSize:12, fontWeight:700, cursor:"pointer",
                background: isActive ? `${a.blue}18` : th.bgCard,
                border: isActive ? `1px solid ${a.blue}35` : `1px solid ${th.borderSubtle}`,
                color: isActive ? a.blue : th.textMuted, fontFamily:"inherit",
              }}>{btn.label}</button>
            );
          })}
        </div>
      </div>
    </ThemeCtx.Provider>
  );
}

// ============================================================
// DETAIL PANEL
// ============================================================
function DetailPanel({ problem, filteredProblems, expanded, toggleExpanded, updateStatus, updateRemarks, navigate }) {
  const { mode, th, a } = useTheme();
  const topicMeta   = getTopicMeta(problem.topic, a);
  const familyColor = getFamilyColor(problem.family, a);
  const idx    = filteredProblems.findIndex(p => p.number === problem.number);
  const hasPrev = idx > 0;
  const hasNext = idx < filteredProblems.length - 1;

  const statuses = [
    { id:"todo",      label:"To Do",     color:th.textFaint, activeBg:th.bgTag,          activeBorder:th.borderSubtle },
    { id:"attempted", label:"Attempted", color:a.amber,      activeBg:`${a.amber}1c`,    activeBorder:`${a.amber}50` },
    { id:"solved",    label:"Solved ✓",  color:a.green,      activeBg:`${a.green}1c`,    activeBorder:`${a.green}50` },
  ];

  const NavBtn = ({ dir, label, enabled }) => (
    <button onClick={() => navigate(dir)} disabled={!enabled} className="btn-hover"
      style={{ flex:1, padding:"12px", borderRadius:14, fontSize:13, fontWeight:700, cursor:enabled?"pointer":"not-allowed",
        background: enabled&&dir>0 ? `${a.blue}14` : th.bgCard,
        border: enabled&&dir>0 ? `1px solid ${a.blue}30` : `1px solid ${th.borderSubtle}`,
        color: enabled ? (dir>0 ? a.blue : th.textMuted) : th.textXFaint,
        boxShadow:th.shadowCard, fontFamily:"inherit" }}>{label}</button>
  );

  const SectionCard = ({ id, icon, title, accent, children }) => {
    const isOpen = expanded[id];
    const iconBgs = { problem:`${a.blue}1c`, pattern:`${a.violet}1c`, trigger:`${a.amber}1c`, solution:`${a.green}1c`, remarks:`${th.textFaint}20` };
    return (
      <div style={{ background:th.bgCard, border:`1px solid ${th.borderSubtle}`, borderRadius:20,
        overflow:"hidden", boxShadow:th.shadowCard, animation:"fadeSlideIn 0.32s ease both" }}>
        <button className="btn-base" onClick={() => toggleExpanded(id)}
          style={{ width:"100%", display:"flex", alignItems:"center", gap:12,
            padding:"15px 20px", textAlign:"left", cursor:"pointer" }}>
          <div style={{ width:36, height:36, borderRadius:10, flexShrink:0, background:iconBgs[id]||th.bgTag,
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:17 }}>{icon}</div>
          <span style={{ flex:1, fontSize:15, fontWeight:700, color:th.textPrimary }}>{title}</span>
          <span style={{ color:th.textFaint, fontSize:14, display:"inline-block",
            transition:"transform 0.2s", transform:isOpen?"rotate(0)":"rotate(-90deg)" }}>▾</span>
        </button>
        <div className={`section-content ${isOpen?"open":"closed"}`} style={{ maxHeight:isOpen?2000:0 }}>
          <div style={{ padding:"0 20px 20px" }}>
            {accent && <div style={{ height:1, background:`linear-gradient(90deg,${accent}55,transparent)`, marginBottom:16 }} />}
            {children}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth:860, margin:"0 auto", padding:"24px 18px 130px" }}>
      {/* Breadcrumb + nav */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, fontWeight:700,
          textTransform:"uppercase", letterSpacing:"0.1em", color:th.textXFaint }}>
          <span>Handbook</span>
          <span style={{ color:th.borderSubtle }}>/</span>
          <span style={{ color:topicMeta.color }}>{problem.topic}</span>
          <span style={{ color:th.borderSubtle }}>/</span>
          <span style={{ color:familyColor, maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{problem.family}</span>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          <NavBtn dir={-1} label="← Prev" enabled={hasPrev} />
          <NavBtn dir={1}  label="Next →" enabled={hasNext} />
        </div>
      </div>

      {/* Hero */}
      <div style={{
        background: mode==="light"
          ? `linear-gradient(135deg,${topicMeta.color}0d,rgba(99,102,241,0.04))`
          : `linear-gradient(135deg,${topicMeta.color}0e,rgba(99,102,241,0.06))`,
        border:`1px solid ${topicMeta.color}2c`, borderRadius:24, padding:"22px 26px", marginBottom:14,
        boxShadow:`0 4px 32px ${topicMeta.color}14, ${th.shadowCard}`,
        animation:"fadeSlideIn 0.3s ease both"
      }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:20, flexWrap:"wrap" }}>
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
              <span style={{ fontFamily:"Space Mono", fontSize:12, fontWeight:700, color:topicMeta.color,
                background:`${topicMeta.color}1c`, borderRadius:8, padding:"2px 10px" }}>
                #{String(problem.number).padStart(3,"0")}
              </span>
              <StatusDot status={problem.userState.status} />
              <span style={{ fontSize:11, fontWeight:700, color:th.textFaint, textTransform:"capitalize" }}>
                {problem.userState.status}
              </span>
            </div>
            <h2 style={{ fontFamily:"Outfit", fontSize:"clamp(22px,4vw,32px)", fontWeight:900,
              color:th.textPrimary, letterSpacing:"-0.03em", margin:"0 0 14px", lineHeight:1.15 }}>
              {problem.title}
            </h2>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              <Pill color={topicMeta.color}>{problem.topic}</Pill>
              <Pill color={familyColor}>{problem.family}</Pill>
            </div>
          </div>
          <div style={{ display:"flex", gap:8, flexShrink:0 }}>
            <ComplexityChip label="Time"  value={problem.complexity.time}  color={a.blue}   />
            <ComplexityChip label="Space" value={problem.complexity.space} color={a.violet} />
          </div>
        </div>

        {/* Status toggle */}
        <div style={{ marginTop:18, paddingTop:14, borderTop:`1px solid ${th.borderSubtle}`,
          display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          <span style={{ fontSize:12, color:th.textFaint, fontWeight:700, marginRight:4 }}>Mark as:</span>
          {statuses.map(s => {
            const active = problem.userState.status === s.id;
            return (
              <button key={s.id} className="btn-hover" onClick={() => updateStatus(problem.number, s.id)}
                style={{ padding:"7px 18px", borderRadius:10, fontSize:12, fontWeight:700, cursor:"pointer",
                  fontFamily:"inherit",
                  background: active ? s.activeBg : th.bgCard,
                  border: active ? `1px solid ${s.activeBorder}` : `1px solid ${th.borderSubtle}`,
                  color: active ? s.color : th.textFaint,
                  boxShadow: active ? `0 0 12px ${s.color}28` : "none" }}>
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sections */}
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        <SectionCard id="problem"  icon="🎯" title="Problem Statement" accent={a.blue}>
          <RichText text={problem.problem_statement} />
        </SectionCard>

        <SectionCard id="pattern"  icon="💡" title="The Pattern"        accent={a.violet}>
          <RichText text={problem.pattern_explanation} />
        </SectionCard>

        <SectionCard id="trigger"  icon="⚡" title="Pattern Trigger"    accent={a.amber}>
          <div style={{ background:th.bgTrigger, border:`1px solid ${th.borderTrigger}`,
            borderLeft:`3px solid ${a.amber}`, borderRadius:12, padding:"14px 18px" }}>
            <p style={{ fontStyle:"italic", color:th.textTrigger, lineHeight:1.72, fontSize:14, margin:0 }}>
              "{problem.trigger_phrase}"
            </p>
          </div>
        </SectionCard>

        <SectionCard id="solution" icon="✅" title="Strategy & Solution" accent={a.green}>
          <RichText text={problem.detailed_solution} />
        </SectionCard>

        <SectionCard id="remarks"  icon="📝" title="My Notes">
          <textarea
            value={problem.userState.remarks || ""}
            onChange={e => updateRemarks(problem.number, e.target.value)}
            placeholder="Add your own notes, edge cases, hints, or mnemonics here…"
            style={{ width:"100%", minHeight:130, padding:"12px 14px",
              background:th.bgInput, border:`1px solid ${th.borderInput}`,
              borderRadius:12, fontSize:13, color:th.textPrimary, resize:"vertical",
              fontFamily:"inherit", lineHeight:1.65, transition:"border-color 0.2s" }}
            onFocus={e => e.target.style.borderColor = th.borderFocus}
            onBlur={e  => e.target.style.borderColor = th.borderInput}
          />
          <div style={{ fontSize:10, color:th.textXFaint, marginTop:6, fontWeight:600 }}>
            Auto-saved · cross-device storage
          </div>
        </SectionCard>
      </div>

      {/* Bottom nav */}
      <div style={{ display:"flex", gap:10, marginTop:28 }}>
        <NavBtn dir={-1} label="← Previous Problem" enabled={hasPrev} />
        <NavBtn dir={1}  label="Next Problem →"      enabled={hasNext} />
      </div>
    </div>
  );
}

// ============================================================
// STATS PANEL
// ============================================================
function StatsPanel({ stats, problems }) {
  const { th, a } = useTheme();
  const topicColors = { Array:a.blue, String:a.violet, Grid:a.green };
  const solvedProblems = problems.filter(p => p.userState.status === "solved");

  const Card = ({ children, style={} }) => (
    <div className="card-lift" style={{ background:th.bgCard, border:`1px solid ${th.borderSubtle}`,
      borderRadius:18, boxShadow:th.shadowCard, ...style }}>
      {children}
    </div>
  );

  return (
    <div style={{ maxWidth:860, margin:"0 auto", padding:"24px 18px 130px" }}>
      <h2 style={{ fontFamily:"Outfit", fontSize:28, fontWeight:900, color:th.textPrimary,
        marginBottom:4, letterSpacing:"-0.03em" }}>Progress Dashboard</h2>
      <p style={{ color:th.textFaint, fontSize:14, marginBottom:24 }}>
        Your DSA mastery across all {stats.total} problems
      </p>

      {/* 4 stat cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))", gap:12, marginBottom:14 }}>
        {[
          { label:"Solved",    val:stats.solved,    color:a.green,       icon:"✓", bar:true },
          { label:"Attempted", val:stats.attempted, color:a.amber,       icon:"◐", bar:true },
          { label:"Remaining", val:stats.todo,      color:th.textFaint,  icon:"○", bar:true },
          { label:"Done",      val:`${stats.pct}%`, color:a.blue,        icon:"◎", bar:false },
        ].map(c => (
          <Card key={c.label} style={{ padding:"18px 14px", textAlign:"center" }}>
            <div style={{ fontSize:20, marginBottom:6 }}>{c.icon}</div>
            <div style={{ fontFamily:"Space Mono", fontSize:26, fontWeight:700, color:c.color, lineHeight:1 }}>{c.val}</div>
            {c.bar && (
              <div style={{ height:3, background:th.barTrack, borderRadius:99, margin:"10px 0 5px", overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${(Number(c.val)/stats.total)*100}%`, background:c.color, borderRadius:99, transition:"width 1s" }} />
              </div>
            )}
            <div style={{ fontSize:11, color:th.textXFaint, fontWeight:700, textTransform:"uppercase",
              letterSpacing:"0.08em", marginTop:c.bar?0:10 }}>{c.label}</div>
          </Card>
        ))}
      </div>

      {/* Ring + motivational */}
      <Card style={{ padding:"26px 28px", marginBottom:14, display:"flex", alignItems:"center", gap:28, flexWrap:"wrap" }}>
        <CircleProgress pct={stats.pct} size={110} stroke={8} color={a.blue}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontFamily:"Space Mono", fontSize:20, fontWeight:700, color:a.blue }}>{stats.pct}%</div>
            <div style={{ fontSize:9, color:th.textFaint, fontWeight:700 }}>DONE</div>
          </div>
        </CircleProgress>
        <div style={{ flex:1, minWidth:180 }}>
          <div style={{ fontFamily:"Outfit", fontSize:19, fontWeight:800, color:th.textPrimary, marginBottom:6 }}>
            {stats.pct>=80?"🔥 Almost there!":stats.pct>=50?"⚡ Great momentum!":stats.pct>=20?"🚀 Keep going!":"🌱 Just getting started"}
          </div>
          <p style={{ color:th.textFaint, fontSize:14, lineHeight:1.65, margin:"0 0 14px" }}>
            Solved <strong style={{ color:a.green }}>{stats.solved}</strong> problems,
            attempted <strong style={{ color:a.amber }}>{stats.attempted}</strong> more.
            {stats.todo>0 ? ` ${stats.todo} still waiting.` : " All done! 🎉"}
          </p>
          <div style={{ height:8, background:th.barTrack, borderRadius:99, overflow:"hidden", display:"flex" }}>
            <div style={{ width:`${(stats.solved/stats.total)*100}%`, background:a.green, transition:"width 1s" }} />
            <div style={{ width:`${(stats.attempted/stats.total)*100}%`, background:a.amber, transition:"width 1s" }} />
          </div>
          <div style={{ display:"flex", gap:14, marginTop:7, fontSize:11 }}>
            <span style={{ color:a.green }}>■ Solved</span>
            <span style={{ color:a.amber }}>■ Attempted</span>
            <span style={{ color:th.textXFaint }}>■ Todo</span>
          </div>
        </div>
      </Card>

      {/* By Topic */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:12, marginBottom:14 }}>
        {Object.entries(stats.byTopic).map(([topic, data]) => {
          const col = topicColors[topic] || a.blue;
          const pct = Math.round((data.solved/data.total)*100);
          return (
            <Card key={topic} style={{ padding:"16px 20px", border:`1px solid ${col}28` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <span style={{ fontWeight:700, color:col, fontSize:14 }}>{topic}</span>
                <span style={{ fontFamily:"Space Mono", fontSize:12, color:th.textFaint }}>{data.solved}/{data.total}</span>
              </div>
              <div style={{ height:6, background:th.barTrack, borderRadius:99, overflow:"hidden", marginBottom:7 }}>
                <div style={{ height:"100%", width:`${pct}%`, background:col, borderRadius:99,
                  transition:"width 1s", boxShadow:`0 0 8px ${col}60` }} />
              </div>
              <div style={{ fontSize:12, fontWeight:700, color:col }}>{pct}% complete</div>
            </Card>
          );
        })}
      </div>

      {/* By Pattern */}
      <Card style={{ padding:"22px 24px", marginBottom:14 }}>
        <h3 style={{ fontFamily:"Outfit", fontSize:17, fontWeight:800, color:th.textPrimary, marginBottom:16 }}>
          Progress by Pattern
        </h3>
        <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
          {Object.entries(stats.byFamily).sort((x,y) => y[1].solved - x[1].solved).map(([family, data]) => {
            const pct = Math.round((data.solved/data.total)*100);
            const col = getFamilyColor(family, a);
            return (
              <div key={family} style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:155, fontSize:11, fontWeight:600, color:th.textFaint, textAlign:"right", flexShrink:0 }}>{family}</div>
                <div style={{ flex:1, height:5, background:th.barTrack, borderRadius:99, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${pct}%`, background:col, borderRadius:99, transition:"width 1s" }} />
                </div>
                <div style={{ width:46, fontSize:10, fontWeight:700, color:col, fontFamily:"Space Mono", flexShrink:0, textAlign:"right" }}>
                  {data.solved}/{data.total}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Solved problems */}
      {solvedProblems.length > 0 && (
        <Card style={{ padding:"22px 24px" }}>
          <h3 style={{ fontFamily:"Outfit", fontSize:17, fontWeight:800, color:th.textPrimary, marginBottom:14 }}>
            ✅ Solved Problems ({solvedProblems.length})
          </h3>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:10 }}>
            {solvedProblems.map(p => {
              const col = topicColors[p.topic] || a.blue;
              return (
                <div key={p.number} style={{ background:th.bgSolvedCard, border:`1px solid ${th.borderSolved}`,
                  borderRadius:12, padding:"11px 14px" }}>
                  <div style={{ fontSize:10, fontWeight:700, color:a.green, fontFamily:"Space Mono", marginBottom:4 }}>
                    #{String(p.number).padStart(3,"0")}
                  </div>
                  <div style={{ fontSize:13, fontWeight:600, color:th.textPrimary, lineHeight:1.3 }}>{p.title}</div>
                  <div style={{ fontSize:10, color:col, marginTop:4 }}>{p.topic}</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}