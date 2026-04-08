import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import handbook from "../dsa_100_array_string_grid_handbook.json";

// ============================================================
// STORAGE: Uses window.storage (persistent cross-device) API
// Falls back to in-memory if unavailable
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
    try {
      if (window.storage) {
        await window.storage.set(key, JSON.stringify(value));
      }
    } catch (_) {}
    memoryStore[key] = value;
  },
};

// ============================================================
// UTILITIES
// ============================================================

const inferTopic = (problem) => {
  const text = `${problem.title} ${problem.problem_statement} ${problem.pattern_explanation} ${problem.trigger_phrase}`.toLowerCase();
  if (/grid|matrix|board|island|ocean|orange|room|gate|path|flood|pacific|atlantic|cell|submatrix|submatrices/.test(text)) return "Grid";
  if (/string|substring|anagram|palindrome|character|word|decode|calculator|prefix/.test(text)) return "String";
  return "Array";
};

const inferPatternFamily = (problem) => {
  const text = `${problem.title} ${problem.pattern_explanation} ${problem.trigger_phrase} ${problem.detailed_solution}`.toLowerCase();
  if (/sliding window|window/.test(text)) return "Sliding Window";
  if (/prefix sum|difference array|remainder/.test(text)) return "Prefix / Difference";
  if (/hashmap|hash set|hash set|set\b|map\b/.test(text)) return "Hashing";
  if (/two pointers|slow-fast|pointers/.test(text)) return "Two Pointers";
  if (/monotonic stack|stack|deque/.test(text)) return "Stack / Deque";
  if (/heap|priority queue|top-k|top k/.test(text)) return "Heap / Priority Queue";
  if (/binary search/.test(text)) return "Binary Search";
  if (/greedy|interval|sweep/.test(text)) return "Greedy / Intervals";
  if (/dfs|bfs|flood fill|multi-source bfs|connected component/.test(text)) return "DFS / BFS";
  if (/dynamic programming|\bdp\b/.test(text)) return "Dynamic Programming";
  if (/backtracking/.test(text)) return "Backtracking";
  if (/simulation/.test(text)) return "Simulation";
  return "Core Pattern";
};

const extractComplexity = (text) => {
  const timeMatch = text.match(/Time:\s*\*\*(.*?)\*\*/i);
  const spaceMatch = text.match(/Space:\s*\*\*(.*?)\*\*/i);
  return {
    time: timeMatch ? timeMatch[1] : "O(N)",
    space: spaceMatch ? spaceMatch[1] : "O(1)",
  };
};

const TOPIC_META = {
  Array: { color: "#38bdf8", glow: "rgba(56,189,248,0.3)", bg: "rgba(56,189,248,0.08)", emoji: "⬡" },
  String: { color: "#a78bfa", glow: "rgba(167,139,250,0.3)", bg: "rgba(167,139,250,0.08)", emoji: "⬡" },
  Grid: { color: "#34d399", glow: "rgba(52,211,153,0.3)", bg: "rgba(52,211,153,0.08)", emoji: "⬡" },
};

const FAMILY_COLORS = {
  "Sliding Window": "#f59e0b",
  "Prefix / Difference": "#818cf8",
  "Hashing": "#38bdf8",
  "Two Pointers": "#f472b6",
  "Stack / Deque": "#fb923c",
  "Heap / Priority Queue": "#c084fc",
  "Binary Search": "#4ade80",
  "Greedy / Intervals": "#facc15",
  "DFS / BFS": "#2dd4bf",
  "Dynamic Programming": "#f87171",
  "Backtracking": "#e879f9",
  "Simulation": "#94a3b8",
  "Core Pattern": "#64748b",
};

const THEME_TOKENS = {
  dark: {
    bg: "#050811",
    textMain: "rgba(203,213,225,0.9)",
    textHeading: "#f1f5f9",
    textMuted: "#94a3b8",
    textDim: "#475569",
    headerBg: "rgba(5,8,17,0.85)",
    sidebarBg: "rgba(8,12,24,0.95)",
    cardBg: "rgba(255,255,255,0.02)",
    cardHover: "rgba(255,255,255,0.05)",
    border: "rgba(255,255,255,0.06)",
    borderStrong: "rgba(255,255,255,0.1)",
    inputBg: "rgba(255,255,255,0.04)",
    overlay: "rgba(0,0,0,0.7)",
    meshOpacity1: 0.07,
    meshOpacity2: 0.07,
    meshOpacity3: 0.05,
    gridOpacity: 0.015,
    tagBg: "rgba(255,255,255,0.06)",
    subHeader: "#1e293b",
  },
  light: {
    bg: "#f8fafc",
    textMain: "#475569",
    textHeading: "#0f172a",
    textMuted: "#64748b",
    textDim: "#94a3b8",
    headerBg: "rgba(255,255,255,0.85)",
    sidebarBg: "#f1f5f9",
    cardBg: "rgba(255,255,255,0.7)",
    cardHover: "rgba(255,255,255,1)",
    border: "rgba(0,0,0,0.08)",
    borderStrong: "rgba(0,0,0,0.15)",
    inputBg: "rgba(0,0,0,0.03)",
    overlay: "rgba(0,0,0,0.3)",
    meshOpacity1: 0.04,
    meshOpacity2: 0.04,
    meshOpacity3: 0.03,
    gridOpacity: 0.04,
    tagBg: "rgba(0,0,0,0.05)",
    subHeader: "#e2e8f0",
  }
};

// ============================================================
// SUB-COMPONENTS
// ============================================================

const RichText = ({ text, tokens, className = "" }) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <p className={`leading-relaxed ${className}`} style={{ fontSize: "15px", color: tokens.textMain }}>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**")
          ? <strong key={i} style={{ color: tokens.textHeading, fontWeight: 700 }}>{part.slice(2, -2)}</strong>
          : part
      )}
    </p>
  );
};

const Pill = ({ children, color = "#38bdf8" }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
    border: `1px solid ${color}30`, background: `${color}12`, color,
    letterSpacing: "0.04em"
  }}>{children}</span>
);

const StatusDot = ({ status }) => {
  const cfg = {
    solved: { color: "#34d399", shadow: "rgba(52,211,153,0.6)" },
    attempted: { color: "#fbbf24", shadow: "rgba(251,191,36,0.6)" },
    todo: { color: "#475569", shadow: "transparent" },
  };
  const c = cfg[status] || cfg.todo;
  return (
    <span style={{
      display: "inline-block", width: 8, height: 8, borderRadius: "50%",
      background: c.color, boxShadow: `0 0 8px ${c.shadow}`, flexShrink: 0
    }} />
  );
};

const ComplexityChip = ({ label, value, color, tokens }) => (
  <div style={{
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "8px 16px", background: tokens.tagBg,
    border: `1px solid ${tokens.border}`, borderRadius: 12
  }}>
    <span style={{ fontSize: 10, color: tokens.textDim, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>{label}</span>
    <span style={{ fontSize: 13, fontWeight: 800, fontFamily: "monospace", color }}>{value}</span>
  </div>
);

// Animated background mesh
const BackgroundMesh = ({ tokens }) => (
  <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
    <div style={{
      position: "absolute", top: "-20%", left: "-10%", width: "55%", height: "55%",
      background: `radial-gradient(circle, rgba(56,189,248,${tokens.meshOpacity1}) 0%, transparent 70%)`,
      animation: "meshFloat1 12s ease-in-out infinite"
    }} />
    <div style={{
      position: "absolute", bottom: "-15%", right: "-10%", width: "50%", height: "50%",
      background: `radial-gradient(circle, rgba(167,139,250,${tokens.meshOpacity2}) 0%, transparent 70%)`,
      animation: "meshFloat2 15s ease-in-out infinite"
    }} />
    <div style={{
      position: "absolute", top: "40%", right: "20%", width: "30%", height: "30%",
      background: `radial-gradient(circle, rgba(52,211,153,${tokens.meshOpacity3}) 0%, transparent 70%)`,
      animation: "meshFloat3 18s ease-in-out infinite"
    }} />
    {/* Grid pattern */}
    <div style={{
      position: "absolute", inset: 0,
      backgroundImage: `linear-gradient(${tokens.border}40 1px, transparent 1px), linear-gradient(90deg, ${tokens.border}40 1px, transparent 1px)`,
      backgroundSize: "48px 48px", opacity: tokens.gridOpacity
    }} />
  </div>
);

// Confetti burst on solve
const Confetti = ({ active, onDone }) => {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.4,
      r: Math.random() * 6 + 3,
      d: Math.random() * 80,
      color: ["#38bdf8","#34d399","#a78bfa","#fbbf24","#f472b6"][Math.floor(Math.random()*5)],
      tilt: Math.random() * 10 - 10,
      tiltAngleIncrement: Math.random() * 0.07 + 0.05,
      tiltAngle: 0,
      vy: Math.random() * 3 + 2
    }));
    let frame;
    let elapsed = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.tiltAngle += p.tiltAngleIncrement;
        p.y += p.vy;
        p.tilt = Math.sin(p.tiltAngle) * 15;
        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();
      });
      elapsed++;
      if (elapsed < 100) frame = requestAnimationFrame(animate);
      else { ctx.clearRect(0, 0, canvas.width, canvas.height); onDone?.(); }
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [active]);
  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 999, pointerEvents: "none" }} />;
};

// Circular progress ring
const CircleProgress = ({ pct, size = 80, stroke = 6, color = "#38bdf8", tokens, children }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={tokens.tagBg} strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)", filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {children}
      </div>
    </div>
  );
};

// ============================================================
// MAIN APP
// ============================================================

export default function App() {
  const [progress, setProgress] = useState({});
  const [theme, setTheme] = useState("dark");
  const [storageReady, setStorageReady] = useState(false);
  const [search, setSearch] = useState("");
  const [filterTopic, setFilterTopic] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterFamily, setFilterFamily] = useState("All");
  const [selectedId, setSelectedId] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("detail"); // detail | stats
  const [showConfetti, setShowConfetti] = useState(false);
  const [syncStatus, setSyncStatus] = useState("idle"); // idle | saving | saved
  const [expandedSections, setExpandedSections] = useState({ problem: true, pattern: true, trigger: true, solution: true, remarks: true });
  const listRef = useRef(null);
  const syncTimer = useRef(null);

  const tokens = THEME_TOKENS[theme];

  // Load state from storage
  useEffect(() => {
    Promise.all([
      storage.get("dsa_progress_v2"),
      storage.get("dsa_theme_v2")
    ]).then(([progressData, themeData]) => {
      if (progressData) setProgress(progressData);
      if (themeData) setTheme(themeData);
      setStorageReady(true);
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === "dark" ? "light" : "dark";
      storage.set("dsa_theme_v2", next);
      return next;
    });
  }, []);

  // Save progress to storage with debounce
  const saveProgress = useCallback(async (newProgress) => {
    setSyncStatus("saving");
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      await storage.set("dsa_progress_v2", newProgress);
      setSyncStatus("saved");
      setTimeout(() => setSyncStatus("idle"), 2000);
    }, 600);
  }, []);

  const updateStatus = useCallback((id, status) => {
    const wasNotSolved = (progress[id]?.status || "todo") !== "solved";
    const becomingSolved = status === "solved";
    setProgress(prev => {
      const next = { ...prev, [id]: { ...(prev[id] || { remarks: "" }), status } };
      saveProgress(next);
      return next;
    });
    if (wasNotSolved && becomingSolved) {
      setShowConfetti(true);
    }
  }, [progress, saveProgress]);

  const updateRemarks = useCallback((id, remarks) => {
    setProgress(prev => {
      const next = { ...prev, [id]: { ...(prev[id] || { status: "todo" }), remarks } };
      saveProgress(next);
      return next;
    });
  }, [saveProgress]);

  const problems = useMemo(() => {
    return handbook.problems.map((p) => ({
      ...p,
      topic: inferTopic(p),
      family: inferPatternFamily(p),
      complexity: extractComplexity(p.detailed_solution),
      userState: progress[p.number] || { status: "todo", remarks: "" }
    }));
  }, [progress]);

  const stats = useMemo(() => {
    const total = problems.length;
    const solved = problems.filter(p => p.userState.status === "solved").length;
    const attempted = problems.filter(p => p.userState.status === "attempted").length;
    const byTopic = { Array: { solved: 0, total: 0 }, String: { solved: 0, total: 0 }, Grid: { solved: 0, total: 0 } };
    const byFamily = {};
    problems.forEach(p => {
      byTopic[p.topic].total++;
      if (p.userState.status === "solved") byTopic[p.topic].solved++;
      if (!byFamily[p.family]) byFamily[p.family] = { solved: 0, total: 0 };
      byFamily[p.family].total++;
      if (p.userState.status === "solved") byFamily[p.family].solved++;
    });
    return { total, solved, attempted, todo: total - solved - attempted, pct: Math.round((solved / total) * 100), byTopic, byFamily };
  }, [problems]);

  const allFamilies = useMemo(() => ["All", ...Object.keys(FAMILY_COLORS)], []);

  const filteredProblems = useMemo(() => {
    const q = search.toLowerCase();
    return problems.filter(p => {
      const matchesSearch = !q || p.title.toLowerCase().includes(q) || p.trigger_phrase.toLowerCase().includes(q) || p.family.toLowerCase().includes(q);
      const matchesTopic = filterTopic === "All" || p.topic === filterTopic;
      const matchesStatus = filterStatus === "All" || p.userState.status === filterStatus;
      const matchesFamily = filterFamily === "All" || p.family === filterFamily;
      return matchesSearch && matchesTopic && matchesStatus && matchesFamily;
    });
  }, [problems, search, filterTopic, filterStatus, filterFamily]);

  const selectedProblem = problems.find(p => p.number === selectedId) || problems[0];

  const navigateProblem = useCallback((dir) => {
    const idx = filteredProblems.findIndex(p => p.number === selectedId);
    const next = filteredProblems[idx + dir];
    if (next) setSelectedId(next.number);
  }, [filteredProblems, selectedId]);

  const toggleSection = (key) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  const topicMeta = TOPIC_META[selectedProblem.topic] || TOPIC_META.Array;
  const familyColor = FAMILY_COLORS[selectedProblem.family] || "#64748b";

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={{
      position: "fixed", inset: 0, display: "flex", flexDirection: "column",
      background: tokens.bg, color: tokens.textMain, fontFamily: "'Inter', system-ui, sans-serif",
      overflow: "hidden", transition: "background 0.3s, color 0.3s"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Space+Mono:wght@400;700&family=Outfit:wght@700;800;900&display=swap');
        
        @keyframes meshFloat1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(3%,5%) scale(1.1)} }
        @keyframes meshFloat2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-3%,-3%) scale(1.08)} }
        @keyframes meshFloat3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(4%,-4%) scale(1.05)} }
        @keyframes fadeSlideIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)"}; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
        
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        
        .card-hover { transition: all 0.2s; }
        .card-hover:hover { background: rgba(255,255,255,0.05) !important; transform: translateY(-1px); }
        
        .problem-item { transition: all 0.15s; }
        .problem-item:hover { background: rgba(255,255,255,0.04) !important; }
        
        .btn-status { transition: all 0.15s; cursor: pointer; }
        .btn-status:hover { filter: brightness(1.2); }
        
        .sidebar-overlay { display:none; }
        
        @media(max-width:768px) {
          .desktop-sidebar { 
            position: fixed !important; left: 0 !important; top: 0 !important; bottom: 0 !important;
            z-index: 200 !important; transform: translateX(-100%); transition: transform 0.3s cubic-bezier(0.4,0,0.2,1) !important;
          }
          .desktop-sidebar.open { transform: translateX(0) !important; }
          .sidebar-overlay { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 199; }
          .main-header-title { font-size: 15px !important; }
        }
        
        .section-content { overflow: hidden; transition: max-height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.3s; }
        .section-content.collapsed { max-height: 0 !important; opacity: 0; }
        .section-content.expanded { opacity: 1; }
        
        textarea:focus { outline: none; }
        input:focus { outline: none; }
        select:focus { outline: none; }
      `}</style>

      <BackgroundMesh tokens={tokens} />
      <Confetti active={showConfetti} onDone={() => setShowConfetti(false)} />

      {/* ── HEADER ── */}
      <header style={{
        flexShrink: 0, position: "relative", zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px", height: 60,
        background: tokens.headerBg, backdropFilter: "blur(24px)",
        borderBottom: `1px solid ${tokens.border}`
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Hamburger for mobile */}
          <button onClick={() => setSidebarOpen(v => !v)} style={{
            display: "none", background: "rgba(255,255,255,0.06)", border: "none",
            borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: "#94a3b8",
            "@media(max-width:768px)": { display: "flex" }
          }} className="mobile-menu-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>
            </svg>
          </button>
          <div style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            background: "linear-gradient(135deg, #38bdf8, #6366f1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 20px rgba(56,189,248,0.3)"
          }}>
            <span style={{ fontSize: 16, fontWeight: 900, color: "#fff", fontFamily: "Outfit" }}>D</span>
          </div>
          <div>
            <div className="main-header-title" style={{ fontFamily: "Outfit", fontWeight: 900, fontSize: 17, letterSpacing: "-0.03em", color: tokens.textHeading }}>
              PatternAtlas <span style={{ color: "#38bdf8" }}>DSA</span>
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: tokens.textDim, textTransform: "uppercase" }}>100 Problems Handbook</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* Theme Toggle */}
          <button onClick={toggleTheme} style={{
            background: tokens.tagBg, border: `1px solid ${tokens.border}`,
            borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: theme === "dark" ? "#fbbf24" : "#6366f1", transition: "all 0.2s"
          }} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
            {theme === "dark" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
          </button>

          {/* Sync indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: syncStatus === "saved" ? "#34d399" : tokens.textDim }}>
            {syncStatus === "saving" && <div style={{ width: 10, height: 10, border: "2px solid #38bdf8", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />}
            {syncStatus === "saved" && <span>✓</span>}
            {syncStatus === "saving" ? "Syncing..." : syncStatus === "saved" ? "Saved" : ""}
          </div>

          {/* Stats bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: "#64748b" }}>Progress</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#38bdf8", fontFamily: "Space Mono" }}>{stats.pct}%</span>
              </div>
              <div style={{ width: 140, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 99,
                  width: `${stats.pct}%`,
                  background: "linear-gradient(90deg, #38bdf8, #6366f1)",
                  transition: "width 1s cubic-bezier(0.4,0,0.2,1)",
                  boxShadow: "0 0 8px rgba(56,189,248,0.5)"
                }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {[
                { val: stats.solved, label: "Solved", color: "#34d399" },
                { val: stats.attempted, label: "Tried", color: "#fbbf24" },
                { val: stats.todo, label: "Todo", color: "#475569" },
              ].map(s => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: s.color, fontFamily: "Space Mono", lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats tab toggle (mobile) */}
          <button onClick={() => setActiveTab(t => t === "stats" ? "detail" : "stats")} style={{
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: "#94a3b8",
            fontSize: 11, fontWeight: 700
          }}>
            {activeTab === "stats" ? "← Back" : "Stats"}
          </button>
        </div>
      </header>

      {/* Mobile hamburger styles via js */}
      <style>{`@media(max-width:768px){.mobile-menu-btn{display:flex!important;}}`}</style>

      {/* ── BODY ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative", zIndex: 1 }}>

        {/* Mobile overlay */}
        {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

        {/* ── SIDEBAR ── */}
        <aside className={`desktop-sidebar ${sidebarOpen ? "open" : ""}`} style={{
          width: 340, flexShrink: 0, display: "flex", flexDirection: "column",
          background: tokens.sidebarBg, backdropFilter: "blur(24px)",
          borderRight: `1px solid ${tokens.border}`
        }}>
          {/* Sidebar header / filters */}
          <div style={{ padding: "14px 14px 10px", flexShrink: 0 }}>
            {/* Search */}
            <div style={{ position: "relative", marginBottom: 10 }}>
              <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#475569" }} width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input type="text" placeholder="Search problems, patterns..."
                value={search} onChange={e => setSearch(e.target.value)}
                style={{
                  width: "100%", background: tokens.inputBg, border: `1px solid ${tokens.border}`,
                  borderRadius: 10, padding: "9px 12px 9px 34px", fontSize: 13, color: tokens.textMain,
                  transition: "all 0.2s"
                }}
                onFocus={e => e.target.style.borderColor = "rgba(56,189,248,0.4)"}
                onBlur={e => e.target.style.borderColor = tokens.border}
              />
              {search && (
                <button onClick={() => setSearch("")} style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 14
                }}>✕</button>
              )}
            </div>

            {/* Topic filters */}
            <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
              {["All", "Array", "String", "Grid"].map(t => {
                const active = filterTopic === t;
                const meta = TOPIC_META[t];
                return (
                  <button key={t} onClick={() => setFilterTopic(t)} className="btn-status" style={{
                    flex: 1, padding: "6px 4px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                    border: active ? `1px solid ${meta?.color || "#38bdf8"}40` : `1px solid ${tokens.border}`,
                    background: active ? (meta ? `${meta.color}15` : tokens.tagBg) : tokens.tagBg,
                    color: active ? (meta?.color || "#38bdf8") : tokens.textMuted,
                    cursor: "pointer"
                  }}>{t}</button>
                );
              })}
            </div>

            {/* Status + Family filters */}
            <div style={{ display: "flex", gap: 6 }}>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{
                flex: 1, background: tokens.inputBg, border: `1px solid ${tokens.border}`,
                borderRadius: 8, padding: "6px 10px", fontSize: 11, color: tokens.textMuted, cursor: "pointer"
              }}>
                <option value="All">All Status</option>
                <option value="todo">To Do</option>
                <option value="attempted">Attempted</option>
                <option value="solved">Solved</option>
              </select>
              <select value={filterFamily} onChange={e => setFilterFamily(e.target.value)} style={{
                flex: 1, background: tokens.inputBg, border: `1px solid ${tokens.border}`,
                borderRadius: 8, padding: "6px 10px", fontSize: 11, color: tokens.textMuted, cursor: "pointer"
              }}>
                {allFamilies.map(f => <option key={f} value={f} style={{ background: tokens.bg, color: tokens.textMain }}>{f === "All" ? "All Patterns" : f}</option>)}
              </select>
            </div>

            {/* Count */}
            <div style={{ marginTop: 8, fontSize: 11, color: tokens.textDim, fontWeight: 600 }}>
              {filteredProblems.length} of {problems.length} problems
              {(search || filterTopic !== "All" || filterStatus !== "All" || filterFamily !== "All") && (
                <button onClick={() => { setSearch(""); setFilterTopic("All"); setFilterStatus("All"); setFilterFamily("All"); }}
                  style={{ marginLeft: 8, color: "#38bdf8", background: "none", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Problem List */}
          <div ref={listRef} style={{ flex: 1, overflowY: "auto", padding: "4px 10px 16px" }}>
            {filteredProblems.map((p, idx) => {
              const isSelected = selectedId === p.number;
              const meta = TOPIC_META[p.topic] || TOPIC_META.Array;
              const fc = FAMILY_COLORS[p.family] || "#64748b";
              return (
                <button key={p.number} className="problem-item" onClick={() => { setSelectedId(p.number); setSidebarOpen(false); }} style={{
                  width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 12, marginBottom: 3,
                  background: isSelected ? `${meta.color}12` : "rgba(255,255,255,0)",
                  border: isSelected ? `1px solid ${meta.color}30` : "1px solid transparent",
                  cursor: "pointer", position: "relative", display: "block",
                  animation: `fadeIn 0.2s ${Math.min(idx * 0.015, 0.4)}s both`
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#334155", fontFamily: "Space Mono" }}>
                        #{String(p.number).padStart(3, "0")}
                      </span>
                      <StatusDot status={p.userState.status} />
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: meta.color,
                      background: `${meta.color}15`, borderRadius: 999, padding: "1px 7px"
                    }}>{p.topic}</span>
                  </div>
                  <div style={{
                    fontSize: 13, fontWeight: 600, color: isSelected ? tokens.textHeading : tokens.textMuted,
                    lineHeight: 1.3, marginBottom: 4
                  }}>{p.title}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: fc, opacity: 0.8 }}>{p.family}</div>
                  {isSelected && <div style={{
                    position: "absolute", left: 0, top: "20%", bottom: "20%", width: 3,
                    background: meta.color, borderRadius: "0 3px 3px 0",
                    boxShadow: `0 0 10px ${meta.glow}`
                  }} />}
                </button>
              );
            })}
            {filteredProblems.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 16px" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
                <div style={{ color: "#475569", fontSize: 14, marginBottom: 8 }}>No problems found</div>
                <button onClick={() => { setSearch(""); setFilterTopic("All"); setFilterStatus("All"); setFilterFamily("All"); }}
                  style={{ color: "#38bdf8", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                  Reset all filters
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main style={{ flex: 1, overflowY: "auto", position: "relative" }}>
          {activeTab === "stats" ? (
            <StatsPanel stats={stats} problems={problems} tokens={tokens} />
          ) : (
            <DetailPanel
              problem={selectedProblem}
              filteredProblems={filteredProblems}
              topicMeta={topicMeta}
              familyColor={familyColor}
              expandedSections={expandedSections}
              toggleSection={toggleSection}
              updateStatus={updateStatus}
              updateRemarks={updateRemarks}
              navigateProblem={navigateProblem}
              tokens={tokens}
            />
          )}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <div style={{
        display: "none", position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
        background: tokens.headerBg, backdropFilter: "blur(20px)",
        borderTop: `1px solid ${tokens.border}`,
        padding: "8px 20px 12px", gap: 8
      }} className="mobile-bottom-nav">
        <style>{`@media(max-width:768px){.mobile-bottom-nav{display:flex!important;}}`}</style>
        <button onClick={() => setSidebarOpen(true)} style={{
          flex: 1, padding: "10px", background: tokens.tagBg, border: "none",
          borderRadius: 12, color: tokens.textMuted, cursor: "pointer", fontSize: 12, fontWeight: 700
        }}>☰ Problems</button>
        <button onClick={() => setActiveTab("detail")} style={{
          flex: 1, padding: "10px",
          background: activeTab === "detail" ? "rgba(56,189,248,0.15)" : tokens.tagBg,
          border: activeTab === "detail" ? "1px solid rgba(56,189,248,0.3)" : "none",
          borderRadius: 12, color: activeTab === "detail" ? "#38bdf8" : tokens.textMuted, cursor: "pointer", fontSize: 12, fontWeight: 700
        }}>📖 Study</button>
        <button onClick={() => setActiveTab("stats")} style={{
          flex: 1, padding: "10px",
          background: activeTab === "stats" ? "rgba(56,189,248,0.15)" : tokens.tagBg,
          border: activeTab === "stats" ? "1px solid rgba(56,189,248,0.3)" : "none",
          borderRadius: 12, color: activeTab === "stats" ? "#38bdf8" : tokens.textMuted, cursor: "pointer", fontSize: 12, fontWeight: 700
        }}>📊 Stats</button>
      </div>
    </div>
  );
}

// ============================================================
// DETAIL PANEL
// ============================================================

function DetailPanel({ problem, filteredProblems, topicMeta, familyColor, expandedSections, toggleSection, updateStatus, updateRemarks, navigateProblem, tokens }) {
  const idx = filteredProblems.findIndex(p => p.number === problem.number);
  const hasPrev = idx > 0;
  const hasNext = idx < filteredProblems.length - 1;

  const statusConfig = [
    { id: "todo", label: "To Do", color: "#64748b", bg: "rgba(100,116,139,0.15)" },
    { id: "attempted", label: "Attempted", color: "#fbbf24", bg: "rgba(251,191,36,0.15)" },
    { id: "solved", label: "Solved ✓", color: "#34d399", bg: "rgba(52,211,153,0.15)" },
  ];

  const SectionCard = ({ id, icon, title, iconBg, iconColor, accent, children }) => {
    const isOpen = expandedSections[id];
    return (
      <div style={{
        background: tokens.cardBg, border: `1px solid ${tokens.border}`,
        borderRadius: 20, overflow: "hidden",
        animation: "fadeSlideIn 0.4s ease both"
      }}>
        <button onClick={() => toggleSection(id)} style={{
          width: "100%", display: "flex", alignItems: "center", gap: 12,
          padding: "18px 22px", background: "none", border: "none", cursor: "pointer", textAlign: "left"
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: iconBg, display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <span style={{ color: iconColor, fontSize: 16 }}>{icon}</span>
          </div>
          <span style={{ flex: 1, fontSize: 15, fontWeight: 700, color: tokens.textHeading }}>{title}</span>
          <span style={{ color: tokens.textDim, fontSize: 14, transition: "transform 0.2s", transform: isOpen ? "rotate(0)" : "rotate(-90deg)" }}>▾</span>
        </button>
        <div className={`section-content ${isOpen ? "expanded" : "collapsed"}`} style={{ maxHeight: isOpen ? 2000 : 0 }}>
          <div style={{ padding: "0 22px 22px" }}>
            {accent && <div style={{ height: 1, background: `linear-gradient(90deg, ${accent}40, transparent)`, marginBottom: 18 }} />}
            {children}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 20px 120px" }}>
      {/* Navigation */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: tokens.textDim, marginBottom: 24, justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>Handbook</span>
          <span style={{ color: tokens.borderStrong }}>/</span>
          <span style={{ color: topicMeta.color }}>{problem.topic}</span>
          <span style={{ color: tokens.borderStrong }}>/</span>
          <span style={{ color: familyColor }}>{problem.family}</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => navigateProblem(-1)} disabled={!hasPrev} style={{
            background: tokens.tagBg, border: `1px solid ${tokens.border}`,
            borderRadius: 8, padding: "6px 14px", color: hasPrev ? tokens.textMuted : tokens.textDim,
            cursor: hasPrev ? "pointer" : "not-allowed", fontSize: 13, fontWeight: 700,
            transition: "all 0.15s"
          }}>← Prev</button>
          <button onClick={() => navigateProblem(1)} disabled={!hasNext} style={{
            background: tokens.tagBg, border: `1px solid ${tokens.border}`,
            borderRadius: 8, padding: "6px 14px", color: hasNext ? tokens.textMuted : tokens.textDim,
            cursor: hasNext ? "pointer" : "not-allowed", fontSize: 13, fontWeight: 700,
            transition: "all 0.15s"
          }}>Next →</button>
        </div>
      </div>

      {/* Hero Section */}
      <div style={{
        background: `linear-gradient(135deg, ${topicMeta.color}08, rgba(99,102,241,0.05))`,
        border: `1px solid ${topicMeta.color}20`,
        borderRadius: 24, padding: "28px 32px", marginBottom: 20,
        animation: "fadeSlideIn 0.3s ease both"
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{
                fontFamily: "Space Mono", fontSize: 13, fontWeight: 700, color: topicMeta.color,
                background: `${topicMeta.color}15`, borderRadius: 8, padding: "3px 10px"
              }}>#{String(problem.number).padStart(3, "0")}</span>
              <StatusDot status={problem.userState.status} />
              <span style={{ fontSize: 11, fontWeight: 700, color: tokens.textDim, textTransform: "capitalize" }}>{problem.userState.status}</span>
            </div>
            <h2 style={{
              fontFamily: "Outfit", fontSize: "clamp(22px, 4vw, 34px)", fontWeight: 900,
              color: tokens.textHeading, letterSpacing: "-0.03em", margin: 0, marginBottom: 14,
              lineHeight: 1.15
            }}>{problem.title}</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <Pill color={topicMeta.color}>{problem.topic}</Pill>
              <Pill color={familyColor}>{problem.family}</Pill>
            </div>
          </div>

          {/* Complexity chips */}
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <ComplexityChip label="Time" value={problem.complexity.time} color="#38bdf8" tokens={tokens} />
            <ComplexityChip label="Space" value={problem.complexity.space} color="#a78bfa" tokens={tokens} />
          </div>
        </div>

        {/* Status toggle */}
        <div style={{
          marginTop: 22, paddingTop: 18, borderTop: `1px solid ${tokens.border}`,
          display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap"
        }}>
          <span style={{ fontSize: 12, color: tokens.textDim, fontWeight: 700, marginRight: 4 }}>Mark as:</span>
          {statusConfig.map(s => {
            const isActive = problem.userState.status === s.id;
            return (
              <button key={s.id} className="btn-status" onClick={() => updateStatus(problem.number, s.id)} style={{
                padding: "7px 18px", borderRadius: 10, fontSize: 12, fontWeight: 700,
                background: isActive ? s.bg : tokens.tagBg,
                border: isActive ? `1px solid ${s.color}50` : `1px solid ${tokens.border}`,
                color: isActive ? s.color : tokens.textDim, cursor: "pointer"
              }}>{s.label}</button>
            );
          })}
        </div>
      </div>

      {/* Content Sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <SectionCard id="problem" icon="🎯" title="Problem Statement" iconBg="rgba(56,189,248,0.12)" iconColor="#38bdf8" accent="#38bdf8">
          <RichText text={problem.problem_statement} tokens={tokens} />
        </SectionCard>

        <SectionCard id="pattern" icon="💡" title="The Pattern" iconBg="rgba(167,139,250,0.12)" iconColor="#a78bfa" accent="#a78bfa">
          <RichText text={problem.pattern_explanation} tokens={tokens} />
        </SectionCard>

        <SectionCard id="trigger" icon="⚡" title="Pattern Trigger" iconBg="rgba(251,191,36,0.12)" iconColor="#fbbf24" accent="#fbbf24">
          <div style={{
            background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.15)",
            borderRadius: 12, padding: "16px 20px",
            borderLeft: "3px solid #fbbf24"
          }}>
            <p style={{ fontStyle: "italic", color: "#fde68a", lineHeight: 1.7, fontSize: 14, margin: 0 }}>
              "{problem.trigger_phrase}"
            </p>
          </div>
        </SectionCard>

        <SectionCard id="solution" icon="✅" title="Strategy & Solution" iconBg="rgba(52,211,153,0.12)" iconColor="#34d399" accent="#34d399">
          <RichText text={problem.detailed_solution} tokens={tokens} />
        </SectionCard>

        <SectionCard id="remarks" icon="📝" title="My Notes" iconBg="rgba(100,116,139,0.12)" iconColor="#94a3b8">
          <textarea
            value={problem.userState.remarks || ""}
            onChange={e => updateRemarks(problem.number, e.target.value)}
            placeholder="Add your own notes, edge cases, code hints, or mnemonics here..."
            style={{
              width: "100%", minHeight: 140, padding: "14px 16px",
              background: tokens.inputBg, border: `1px solid ${tokens.border}`,
              borderRadius: 12, fontSize: 13, color: tokens.textMain, resize: "vertical",
              fontFamily: "inherit", lineHeight: 1.6,
              transition: "border-color 0.2s"
            }}
            onFocus={e => e.target.style.borderColor = "rgba(56,189,248,0.3)"}
            onBlur={e => e.target.style.borderColor = tokens.border}
          />
          <div style={{ fontSize: 10, color: tokens.textDim, marginTop: 8, fontWeight: 600 }}>
            Auto-saved to cross-device storage
          </div>
        </SectionCard>
      </div>

      {/* Bottom navigation */}
      <div style={{
        display: "flex", justifyContent: "space-between", marginTop: 32, gap: 12
      }}>
        <button onClick={() => navigateProblem(-1)} disabled={!hasPrev} style={{
          flex: 1, padding: "14px", background: hasPrev ? tokens.tagBg : "transparent",
          border: `1px solid ${tokens.border}`, borderRadius: 14,
          color: hasPrev ? tokens.textMuted : tokens.textDim, cursor: hasPrev ? "pointer" : "not-allowed",
          fontSize: 13, fontWeight: 700, transition: "all 0.2s"
        }}>← Previous Problem</button>
        <button onClick={() => navigateProblem(1)} disabled={!hasNext} style={{
          flex: 1, padding: "14px", background: hasNext ? "rgba(56,189,248,0.08)" : "transparent",
          border: hasNext ? "1px solid rgba(56,189,248,0.2)" : `1px solid ${tokens.border}`,
          borderRadius: 14, color: hasNext ? "#38bdf8" : tokens.textDim,
          cursor: hasNext ? "pointer" : "not-allowed", fontSize: 13, fontWeight: 700,
          transition: "all 0.2s"
        }}>Next Problem →</button>
      </div>
    </div>
  );
}

// ============================================================
// STATS PANEL
// ============================================================

function StatsPanel({ stats, problems, tokens }) {
  const recentlySolved = problems
    .filter(p => p.userState.status === "solved")
    .slice(0, 6);

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 20px 120px" }}>
      <h2 style={{ fontFamily: "Outfit", fontSize: 28, fontWeight: 900, color: tokens.textHeading, marginBottom: 6, letterSpacing: "-0.03em" }}>
        Progress Dashboard
      </h2>
      <p style={{ color: tokens.textMuted, fontSize: 14, marginBottom: 28 }}>
        Track your DSA mastery across all 100 problems
      </p>

      {/* Overview cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Solved", val: stats.solved, color: "#34d399", icon: "✓", total: stats.total },
          { label: "Attempted", val: stats.attempted, color: "#fbbf24", icon: "◐", total: stats.total },
          { label: "Remaining", val: stats.todo, color: "#64748b", icon: "○", total: stats.total },
          { label: "Completion", val: `${stats.pct}%`, color: "#38bdf8", icon: "◎", total: null },
        ].map(c => (
          <div key={c.label} className="card-hover" style={{
            background: tokens.cardBg, border: `1px solid ${tokens.border}`,
            borderRadius: 18, padding: "20px 18px", textAlign: "center"
          }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{c.icon}</div>
            <div style={{ fontFamily: "Space Mono", fontSize: 28, fontWeight: 700, color: c.color, lineHeight: 1 }}>{c.val}</div>
            {c.total && <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 99, margin: "10px 0 6px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(c.val / c.total) * 100}%`, background: c.color, borderRadius: 99, transition: "width 1s" }} />
            </div>}
            <div style={{ fontSize: 11, color: tokens.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: c.total ? 0 : 10 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Big ring */}
      <div style={{
        background: tokens.cardBg, border: `1px solid ${tokens.border}`,
        borderRadius: 24, padding: "32px", marginBottom: 20,
        display: "flex", alignItems: "center", gap: 32, flexWrap: "wrap"
      }}>
        <CircleProgress pct={stats.pct} size={120} stroke={8} color="#38bdf8" tokens={tokens}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "Space Mono", fontSize: 22, fontWeight: 700, color: "#38bdf8" }}>{stats.pct}%</div>
            <div style={{ fontSize: 9, color: tokens.textDim, fontWeight: 700 }}>DONE</div>
          </div>
        </CircleProgress>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontFamily: "Outfit", fontSize: 20, fontWeight: 800, color: tokens.textHeading, marginBottom: 8 }}>
            {stats.pct >= 80 ? "🔥 Almost there!" : stats.pct >= 50 ? "⚡ Great momentum!" : stats.pct >= 20 ? "🚀 Keep going!" : "🌱 Just getting started"}
          </div>
          <p style={{ color: tokens.textMuted, fontSize: 14, lineHeight: 1.6 }}>
            You've solved <strong style={{ color: "#34d399" }}>{stats.solved}</strong> problems and attempted <strong style={{ color: "#fbbf24" }}>{stats.attempted}</strong> more. 
            {stats.todo > 0 ? ` ${stats.todo} problems still waiting.` : " All problems done! 🎉"}
          </p>
          {/* Mini bar */}
          <div style={{ height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 99, marginTop: 16, overflow: "hidden", display: "flex" }}>
            <div style={{ height: "100%", width: `${(stats.solved/stats.total)*100}%`, background: "#34d399", transition: "width 1s" }} />
            <div style={{ height: "100%", width: `${(stats.attempted/stats.total)*100}%`, background: "#fbbf24", transition: "width 1s" }} />
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 11 }}>
            <span style={{ color: "#34d399" }}>■ Solved</span>
            <span style={{ color: "#fbbf24" }}>■ Attempted</span>
            <span style={{ color: "#334155" }}>■ Todo</span>
          </div>
        </div>
      </div>

      {/* By Topic */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 20 }}>
        {Object.entries(stats.byTopic).map(([topic, data]) => {
          const meta = TOPIC_META[topic];
          const pct = Math.round((data.solved / data.total) * 100);
          return (
            <div key={topic} className="card-hover" style={{
              background: tokens.cardBg, border: `1px solid ${meta.color}20`,
              borderRadius: 18, padding: "20px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontWeight: 700, color: meta.color, fontSize: 14 }}>{topic}</span>
                <span style={{ fontFamily: "Space Mono", fontSize: 13, color: "#64748b" }}>{data.solved}/{data.total}</span>
              </div>
              <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 99, overflow: "hidden", marginBottom: 8 }}>
                <div style={{ height: "100%", width: `${pct}%`, background: meta.color, borderRadius: 99, transition: "width 1s", boxShadow: `0 0 8px ${meta.glow}` }} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: meta.color }}>{pct}% complete</div>
            </div>
          );
        })}
      </div>

      {/* By Pattern Family */}
      <div style={{
        background: tokens.cardBg, border: `1px solid ${tokens.border}`,
        borderRadius: 24, padding: "24px", marginBottom: 20
      }}>
        <h3 style={{ fontFamily: "Outfit", fontSize: 18, fontWeight: 800, color: tokens.textHeading, marginBottom: 18 }}>Progress by Pattern</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Object.entries(stats.byFamily).sort((a, b) => b[1].solved - a[1].solved).map(([family, data]) => {
            const pct = Math.round((data.solved / data.total) * 100);
            const color = FAMILY_COLORS[family] || "#64748b";
            return (
              <div key={family} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 140, fontSize: 12, fontWeight: 600, color: "#64748b", textAlign: "right", flexShrink: 0 }}>{family}</div>
                <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.04)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 1s" }} />
                </div>
                <div style={{ width: 50, fontSize: 11, fontWeight: 700, color, fontFamily: "Space Mono", flexShrink: 0, textAlign: "right" }}>
                  {data.solved}/{data.total}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recently solved */}
      {recentlySolved.length > 0 && (
        <div style={{
          background: tokens.cardBg, border: `1px solid ${tokens.border}`,
          borderRadius: 24, padding: "24px"
        }}>
          <h3 style={{ fontFamily: "Outfit", fontSize: 18, fontWeight: 800, color: tokens.textHeading, marginBottom: 16 }}>✅ Solved Problems</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
            {recentlySolved.map(p => {
              const meta = TOPIC_META[p.topic] || TOPIC_META.Array;
              return (
                <div key={p.number} style={{
                  background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.15)",
                  borderRadius: 12, padding: "12px 14px"
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#34d399", fontFamily: "Space Mono", marginBottom: 4 }}>
                    #{String(p.number).padStart(3,"0")}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: tokens.textHeading, lineHeight: 1.3 }}>{p.title}</div>
                  <div style={{ fontSize: 10, color: meta.color, marginTop: 4 }}>{p.topic}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}