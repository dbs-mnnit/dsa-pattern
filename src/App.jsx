import React, {
  useEffect, useMemo, useState, useRef, useCallback, createContext, useContext,
} from "react";
import handbook from "../dsa_100_array_string_grid_handbook.json";

/* ═══════════════════════════════════════════════════════════════
   STORAGE  —  window.storage → localStorage → memory
═══════════════════════════════════════════════════════════════ */
const mem = {};
const store = {
  async get(k) {
    try { if (window.storage) { const r = await window.storage.get(k); return r ? JSON.parse(r.value) : null; } } catch (_) {}
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (_) {}
    return mem[k] ?? null;
  },
  async set(k, v) {
    try { if (window.storage) await window.storage.set(k, JSON.stringify(v)); } catch (_) {}
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {}
    mem[k] = v;
  },
};

/* ═══════════════════════════════════════════════════════════════
   DESIGN TOKENS  —  cinematic dark, neon accents
═══════════════════════════════════════════════════════════════ */
const D = {
  bg0:  "#03050e",
  bg1:  "#060a18",
  bg2:  "#0a1020",
  bg3:  "#0f1628",
  bg4:  "#141d32",
  bg5:  "#1a2540",
  glass:"rgba(255,255,255,0.04)",
  b0:   "rgba(255,255,255,0.04)",
  b1:   "rgba(255,255,255,0.08)",
  b2:   "rgba(255,255,255,0.14)",
  b3:   "rgba(255,255,255,0.22)",
  t0:   "#f4f8ff",
  t1:   "#d8e4f8",
  t2:   "#8fa8cc",
  t3:   "#4a6080",
  t4:   "#263348",
  cyan:   "#00d4ff",
  green:  "#00e5a0",
  amber:  "#ffb800",
  violet: "#b794f4",
  pink:   "#ff6eb4",
  red:    "#ff4d6d",
  blue:   "#4d9fff",
  lime:   "#7fff00",
  teal:   "#00ffd5",
  orange: "#ff8c42",
  indigo: "#7b6cf6",
  rose:   "#ff5e78",
};

/* ═══════════════════════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════════════════════ */
const inferTopic = (p) => {
  const s = `${p.title} ${p.problem_statement} ${p.pattern_explanation} ${p.trigger_phrase}`.toLowerCase();
  if (/grid|matrix|board|island|ocean|gate|path|flood|pacific|atlantic|cell|submatrix/.test(s)) return "Grid";
  if (/string|substring|anagram|palindrome|character|word|decode|calculator/.test(s)) return "String";
  return "Array";
};

const inferFamily = (p) => {
  const s = `${p.title} ${p.pattern_explanation} ${p.trigger_phrase} ${p.detailed_solution}`.toLowerCase();
  if (/sliding window|window/.test(s))              return "Sliding Window";
  if (/prefix sum|difference array|remainder/.test(s)) return "Prefix/Diff";
  if (/hashmap|hash set|\bset\b|\bmap\b/.test(s))   return "Hashing";
  if (/two pointers|slow-fast/.test(s))             return "Two Pointers";
  if (/monotonic stack|stack|deque/.test(s))        return "Stack/Deque";
  if (/heap|priority queue|top-k/.test(s))          return "Heap/PQ";
  if (/binary search/.test(s))                      return "Binary Search";
  if (/greedy|interval|sweep/.test(s))              return "Greedy";
  if (/dfs|bfs|flood fill|connected component/.test(s)) return "DFS/BFS";
  if (/dynamic programming|\bdp\b/.test(s))         return "DP";
  if (/backtracking/.test(s))                       return "Backtracking";
  if (/simulation/.test(s))                         return "Simulation";
  return "Core";
};

const extractComplexity = (t) => {
  const tm = t.match(/Time:\s*\*\*(.*?)\*\*/i);
  const sm = t.match(/Space:\s*\*\*(.*?)\*\*/i);
  return { time: tm?.[1] ?? "O(n)", space: sm?.[1] ?? "O(1)" };
};

const TOPIC_META = {
  Array:  { color: D.cyan,   emoji: "🔢", glyph: "[ ]" },
  String: { color: D.violet, emoji: "🔡", glyph: '" "' },
  Grid:   { color: D.green,  emoji: "🗺",  glyph: "⊞" },
};

const FAM_COL = {
  "Sliding Window": D.amber,  "Prefix/Diff": D.indigo,
  "Hashing":        D.cyan,   "Two Pointers": D.pink,
  "Stack/Deque":    D.orange, "Heap/PQ":     D.violet,
  "Binary Search":  D.lime,   "Greedy":      D.teal,
  "DFS/BFS":        D.green,  "DP":          D.red,
  "Backtracking":   D.rose,   "Simulation":  D.blue,
  "Core":           D.t3,
};
const famCol = (f) => FAM_COL[f] ?? D.t3;

/* ═══════════════════════════════════════════════════════════════
   GLOBAL CSS
═══════════════════════════════════════════════════════════════ */
const G = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Fira+Code:wght@400;500;600;700&family=Raleway:wght@300;400;500;600;700;800;900&display=swap');

    *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; -webkit-tap-highlight-color:transparent; }

    :root {
      --f-disp: 'Outfit', system-ui, sans-serif;
      --f-body: 'Raleway', system-ui, sans-serif;
      --f-mono: 'Fira Code', 'Consolas', monospace;
    }

    @keyframes auroraA { 0%,100%{transform:translate(0,0)scale(1)rotate(0deg)} 33%{transform:translate(6%,8%)scale(1.14)rotate(3deg)} 66%{transform:translate(-4%,4%)scale(.92)rotate(-2deg)} }
    @keyframes auroraB { 0%,100%{transform:translate(0,0)scale(1)rotate(0deg)} 40%{transform:translate(-8%,-6%)scale(1.1)rotate(-4deg)} 80%{transform:translate(5%,-3%)scale(.95)rotate(2deg)} }
    @keyframes auroraC { 0%,100%{transform:translate(0,0)scale(1)} 50%{transform:translate(4%,-7%)scale(1.08)} }
    @keyframes auroraD { 0%,100%{transform:translate(0,0)scale(1)} 50%{transform:translate(-3%,5%)scale(1.05)} }
    @keyframes up      { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
    @keyframes left    { from{opacity:0;transform:translateX(-16px)} to{opacity:1;transform:translateX(0)} }
    @keyframes fadein  { from{opacity:0} to{opacity:1} }
    @keyframes scalein { from{opacity:0;transform:scale(.88)} to{opacity:1;transform:scale(1)} }
    @keyframes spin    { to{transform:rotate(360deg)} }
    @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
    @keyframes blinkDot{ 0%,100%{opacity:1} 50%{opacity:.3} }
    @keyframes cardIn  { from{opacity:0;transform:translateY(18px)scale(.97)} to{opacity:1;transform:none} }
    @keyframes barIn   { from{transform:scaleX(0);transform-origin:left} to{transform:scaleX(1)} }
    @keyframes glow    { 0%,100%{opacity:.8} 50%{opacity:1} }

    ::-webkit-scrollbar      { width:3px; height:3px; }
    ::-webkit-scrollbar-track{ background:transparent; }
    ::-webkit-scrollbar-thumb{ background:rgba(255,255,255,.1); border-radius:4px; }
    ::-webkit-scrollbar-thumb:hover{ background:rgba(255,255,255,.2); }

    .root{ font-family:var(--f-body); font-size:15px; line-height:1.65; -webkit-font-smoothing:antialiased; }
    .disp{ font-family:var(--f-disp); }
    .mono{ font-family:var(--f-mono); }
    .body{ font-family:var(--f-body); }

    .btn{cursor:pointer;border:none;background:none;font-family:var(--f-body);transition:all .18s cubic-bezier(.4,0,.2,1);}
    .btn:hover{filter:brightness(1.12);}
    .btn:active{transform:scale(.96);}
    .btn:disabled{cursor:not-allowed;opacity:.35;pointer-events:none;}

    .lift{transition:transform .2s cubic-bezier(.4,0,.2,1),box-shadow .2s,border-color .2s;}
    .lift:hover{transform:translateY(-3px);}

    .prob-row{transition:background .13s,border-color .12s,transform .13s;cursor:pointer;width:100%;}
    .prob-row:hover{transform:translateX(3px);}
    .prob-row.on{transform:none !important;}

    .body-collapse{overflow:hidden;transition:max-height .38s cubic-bezier(.4,0,.2,1),opacity .28s;}
    .body-collapse.open{opacity:1;}
    .body-collapse.closed{max-height:0 !important;opacity:0;}

    input,textarea,select{font-family:var(--f-body);outline:none;color-scheme:dark;}
    input::placeholder,textarea::placeholder{opacity:.4;}

    .a0{animation:cardIn .38s cubic-bezier(.4,0,.2,1) .00s both;}
    .a1{animation:cardIn .38s cubic-bezier(.4,0,.2,1) .06s both;}
    .a2{animation:cardIn .38s cubic-bezier(.4,0,.2,1) .12s both;}
    .a3{animation:cardIn .38s cubic-bezier(.4,0,.2,1) .18s both;}
    .a4{animation:cardIn .38s cubic-bezier(.4,0,.2,1) .24s both;}
    .a5{animation:cardIn .38s cubic-bezier(.4,0,.2,1) .30s both;}

    @media(max-width:820px){
      .sidebar{position:fixed !important;left:0 !important;top:0 !important;bottom:0 !important;
        z-index:400 !important;transform:translateX(-100%);
        transition:transform .28s cubic-bezier(.4,0,.2,1) !important;}
      .sidebar.open{transform:translateX(0) !important;}
      .hide-sm{display:none !important;}
      .show-sm{display:flex !important;}
    }
    @media(min-width:821px){.show-sm{display:none !important;}}
  `}</style>
);

/* ═══════════════════════════════════════════════════════════════
   AURORA BACKGROUND
═══════════════════════════════════════════════════════════════ */
const Aurora = () => (
  <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",overflow:"hidden"}}>
    {[
      {c:"rgba(0,212,255,.08)",  w:"70%",h:"70%",top:"-30%",left:"-20%",     an:"auroraA 20s ease-in-out infinite"},
      {c:"rgba(183,148,244,.07)",w:"65%",h:"65%",bottom:"-25%",right:"-20%", an:"auroraB 26s ease-in-out infinite"},
      {c:"rgba(0,229,160,.05)",  w:"50%",h:"50%",top:"30%",right:"-10%",     an:"auroraC 19s ease-in-out infinite"},
      {c:"rgba(255,184,0,.04)",  w:"42%",h:"42%",bottom:"10%",left:"10%",    an:"auroraD 28s ease-in-out infinite reverse"},
    ].map((b,i)=>(
      <div key={i} style={{position:"absolute",borderRadius:"50%",filter:"blur(90px)",
        background:`radial-gradient(circle,${b.c} 0%,transparent 70%)`,
        width:b.w,height:b.h,top:b.top,bottom:b.bottom,left:b.left,right:b.right,animation:b.an}}/>
    ))}
    <div style={{position:"absolute",inset:0,
      backgroundImage:`linear-gradient(rgba(255,255,255,.021) 1px,transparent 1px),
                       linear-gradient(90deg,rgba(255,255,255,.021) 1px,transparent 1px)`,
      backgroundSize:"50px 50px"}}/>
    <div style={{position:"absolute",inset:0,
      background:"radial-gradient(ellipse 80% 80% at 50% 50%,transparent 40%,rgba(3,5,14,.65) 100%)"}}/>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   CONFETTI
═══════════════════════════════════════════════════════════════ */
const Confetti = ({active, onDone}) => {
  const ref = useRef(null);
  useEffect(()=>{
    if(!active) return;
    const cv=ref.current; if(!cv) return;
    const ctx=cv.getContext("2d");
    cv.width=window.innerWidth; cv.height=window.innerHeight;
    const cols=[D.cyan,D.green,D.violet,D.amber,D.pink,D.teal,"#fff",D.orange];
    const pts=Array.from({length:150},()=>({
      x:Math.random()*cv.width, y:Math.random()*cv.height*.35-20,
      r:Math.random()*7+3, c:cols[~~(Math.random()*cols.length)],
      vy:Math.random()*5+3, vx:(Math.random()-.5)*3,
      rot:Math.random()*Math.PI*2, rv:(Math.random()-.5)*.15,
      sq:Math.random()>.5,
    }));
    let f=0,id;
    const draw=()=>{
      ctx.clearRect(0,0,cv.width,cv.height);
      pts.forEach(p=>{
        p.y+=p.vy; p.x+=p.vx; p.rot+=p.rv;
        ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot);
        ctx.globalAlpha=Math.max(0,1-f/130); ctx.fillStyle=p.c;
        if(p.sq) ctx.fillRect(-p.r/2,-p.r/4,p.r*2,p.r*.7);
        else { ctx.beginPath(); ctx.arc(0,0,p.r/2,0,Math.PI*2); ctx.fill(); }
        ctx.restore();
      });
      if(++f<150) id=requestAnimationFrame(draw);
      else { ctx.clearRect(0,0,cv.width,cv.height); onDone?.(); }
    };
    id=requestAnimationFrame(draw);
    return ()=>cancelAnimationFrame(id);
  },[active]);
  return <canvas ref={ref} style={{position:"fixed",inset:0,zIndex:9999,pointerEvents:"none"}}/>;
};

/* ═══════════════════════════════════════════════════════════════
   ATOMS
═══════════════════════════════════════════════════════════════ */
const Md = ({text,size=15,lh=1.85,color=D.t2}) => {
  if(!text) return null;
  return (
    <p style={{fontSize:size,lineHeight:lh,color,margin:0,fontFamily:"var(--f-body)",fontWeight:400}}>
      {text.split(/(\*\*[^*]+\*\*)/g).map((p,i)=>
        p.startsWith("**")&&p.endsWith("**")
          ? <strong key={i} style={{color:D.t0,fontWeight:700}}>{p.slice(2,-2)}</strong>
          : p
      )}
    </p>
  );
};

const StatusBubble = ({status}) => {
  const m={
    solved:   {label:"Solved",   c:D.green, bg:"rgba(0,229,160,.12)"},
    attempted:{label:"Attempted",c:D.amber, bg:"rgba(255,184,0,.12)"},
    todo:     {label:"To Do",    c:D.t3,    bg:"rgba(255,255,255,.05)"},
  };
  const {label,c,bg}=m[status]||m.todo;
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 11px",
      borderRadius:999,fontSize:11,fontWeight:700,fontFamily:"var(--f-body)",
      letterSpacing:"0.07em",textTransform:"uppercase",background:bg,color:c,
      border:`1px solid ${c}30`}}>
      <span style={{width:5,height:5,borderRadius:"50%",background:c,
        boxShadow:`0 0 6px ${c}`,animation:"blinkDot 2s ease-in-out infinite"}}/>
      {label}
    </span>
  );
};

const Chip = ({label,color,size=11}) => (
  <span style={{display:"inline-flex",alignItems:"center",padding:"3px 10px",borderRadius:6,
    fontSize:size,fontWeight:600,fontFamily:"var(--f-body)",
    background:`${color}16`,color,border:`1px solid ${color}28`,letterSpacing:"0.04em"}}>
    {label}
  </span>
);

const CxTag = ({label,val,color}) => (
  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,
    padding:"10px 18px",borderRadius:12,
    background:`${color}0e`,border:`1px solid ${color}25`,
    boxShadow:`inset 0 1px 0 ${color}12`}}>
    <span style={{fontSize:10,color:D.t3,fontWeight:700,textTransform:"uppercase",
      letterSpacing:"0.11em",fontFamily:"var(--f-body)"}}>{label}</span>
    <span className="mono" style={{fontSize:14,fontWeight:700,color}}>{val}</span>
  </div>
);

const Ring = ({pct,size=120,stroke=8,color,children}) => {
  const r=(size-stroke)/2, C=2*Math.PI*r;
  return (
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={C} strokeDashoffset={C-(pct/100)*C} strokeLinecap="round"
          style={{transition:"stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1)",filter:`drop-shadow(0 0 10px ${color}90)`}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
        {children}
      </div>
    </div>
  );
};

const Bar = ({pct,color,h=4,glow=true,delay="0s"}) => (
  <div style={{height:h,background:"rgba(255,255,255,.06)",borderRadius:999,overflow:"hidden"}}>
    <div style={{height:"100%",width:`${pct}%`,borderRadius:999,background:color,
      boxShadow:glow?`0 0 14px ${color}65`:"none",
      transition:`width 1.2s cubic-bezier(.4,0,.2,1) ${delay}`}}/>
  </div>
);

const HeatMap = ({sessions}) => {
  const days = useMemo(()=>{
    const out=[]; const now=new Date(); now.setHours(0,0,0,0);
    for(let i=83;i>=0;i--){
      const d=new Date(now); d.setDate(d.getDate()-i);
      const k=d.toISOString().slice(0,10);
      out.push({k,n:sessions[k]||0});
    }
    return out;
  },[sessions]);
  const max=Math.max(...days.map(d=>d.n),1);
  const getC=(n)=>{
    if(!n) return "rgba(255,255,255,.05)";
    const i=n/max;
    if(i<.33) return `${D.cyan}40`;
    if(i<.67) return `${D.cyan}80`;
    return D.cyan;
  };
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(12,1fr)",gap:3}}>
        {days.map(d=>(
          <div key={d.k} title={`${d.k}: ${d.n} solved`}
            style={{aspectRatio:"1",borderRadius:3,background:getC(d.n),
              boxShadow:d.n?`0 0 8px ${D.cyan}35`:"none",
              transition:"transform .15s,box-shadow .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.6)";
              e.currentTarget.style.boxShadow=`0 0 14px ${D.cyan}90`;}}
            onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";
              e.currentTarget.style.boxShadow=d.n?`0 0 8px ${D.cyan}35`:"none";}}/>
        ))}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:7,
        fontSize:11,color:D.t3,fontFamily:"var(--f-body)"}}>
        <span>12 weeks ago</span><span>Today</span>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SECTION ACCORDION
═══════════════════════════════════════════════════════════════ */
const Section = ({icon,title,color,isOpen,onToggle,children}) => (
  <div style={{background:D.bg3,borderRadius:18,overflow:"hidden",
    border:`1px solid ${isOpen?color+"2a":D.b1}`,
    boxShadow:isOpen?`0 6px 36px rgba(0,0,0,.45),0 0 0 1px ${color}0e`:`0 2px 10px rgba(0,0,0,.3)`,
    transition:"border-color .25s,box-shadow .25s"}}>
    <button className="btn" onClick={onToggle} style={{width:"100%",display:"flex",
      alignItems:"center",gap:14,padding:"18px 22px",textAlign:"left"}}>
      <div style={{width:40,height:40,borderRadius:12,flexShrink:0,display:"flex",
        alignItems:"center",justifyContent:"center",fontSize:19,
        background:`${color}12`,border:`1px solid ${color}22`,
        boxShadow:isOpen?`0 0 16px ${color}25`:"none",
        transition:"box-shadow .25s"}}>
        {icon}
      </div>
      <span className="disp" style={{flex:1,fontSize:16,fontWeight:700,color:D.t0,
        letterSpacing:"-.015em"}}>{title}</span>
      {isOpen&&<div style={{width:6,height:6,borderRadius:"50%",background:color,
        boxShadow:`0 0 10px ${color}`,animation:"glow 1.8s ease-in-out infinite"}}/>}
      <span style={{color:D.t3,fontSize:14,transition:"transform .25s",
        transform:isOpen?"rotate(0)":"rotate(-90deg)"}}>▾</span>
    </button>
    <div className={`body-collapse ${isOpen?"open":"closed"}`} style={{maxHeight:isOpen?4000:0}}>
      <div style={{padding:"2px 22px 24px"}}>
        <div style={{height:1,background:`linear-gradient(90deg,${color}45,transparent)`,marginBottom:20}}/>
        {children}
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   DETAIL VIEW
═══════════════════════════════════════════════════════════════ */
function DetailView({problem, allProblems, onNav, onStatus, onRemarks}) {
  const [open,setOpen]=useState({problem:true,pattern:true,trigger:true,solution:false,notes:false});
  const tMeta=TOPIC_META[problem.topic]||TOPIC_META.Array;
  const fColor=famCol(problem.family);
  const {time,space}=problem.complexity;
  const idx=allProblems.findIndex(p=>p.number===problem.number);
  const hasPrev=idx>0, hasNext=idx<allProblems.length-1;
  const tog=(k)=>setOpen(s=>({...s,[k]:!s[k]}));

  const NavBtn=({dir,label,en})=>(
    <button className="btn" disabled={!en} onClick={()=>onNav(dir)}
      style={{flex:1,padding:"11px 16px",borderRadius:11,fontSize:13,fontWeight:700,
        fontFamily:"var(--f-body)",
        background:en&&dir>0?`${D.cyan}11`:D.bg3,
        border:`1px solid ${en&&dir>0?D.cyan+"32":D.b1}`,
        color:en?dir>0?D.cyan:D.t1:D.t4}}>
      {label}
    </button>
  );

  const statuses=[
    {id:"todo",      label:"To Do",     c:D.t3,   abg:`rgba(255,255,255,.05)`, ab:D.b2},
    {id:"attempted", label:"Attempted", c:D.amber, abg:`${D.amber}14`,         ab:`${D.amber}45`},
    {id:"solved",    label:"Solved ✓",  c:D.green, abg:`${D.green}14`,         ab:`${D.green}45`},
  ];

  return (
    <div style={{maxWidth:820,margin:"0 auto",padding:"28px 24px 150px"}}>
      {/* Breadcrumb + nav */}
      <div className="a0" style={{display:"flex",alignItems:"center",
        justifyContent:"space-between",marginBottom:22,flexWrap:"wrap",gap:12}}>
        <div style={{display:"flex",alignItems:"center",gap:7,
          fontSize:12,fontWeight:600,color:D.t3,fontFamily:"var(--f-body)",
          textTransform:"uppercase",letterSpacing:".08em"}}>
          <span>Handbook</span>
          <span style={{color:D.b2,margin:"0 2px"}}>/</span>
          <span style={{color:tMeta.color}}>{problem.topic}</span>
          <span style={{color:D.b2,margin:"0 2px"}}>/</span>
          <span style={{color:fColor,maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
            {problem.family}
          </span>
        </div>
        <div style={{display:"flex",gap:8}}>
          <NavBtn dir={-1} label="← Prev" en={hasPrev}/>
          <NavBtn dir={1}  label="Next →" en={hasNext}/>
        </div>
      </div>

      {/* HERO */}
      <div className="a1" style={{
        background:`linear-gradient(140deg,${tMeta.color}0d,${fColor}09,transparent)`,
        border:`1px solid ${tMeta.color}26`,borderRadius:24,
        padding:"28px 32px",marginBottom:14,position:"relative",overflow:"hidden",
        boxShadow:`0 8px 56px ${tMeta.color}16, 0 0 0 1px ${D.b0}`,
      }}>
        {/* Top accent */}
        <div style={{position:"absolute",top:0,left:0,right:0,height:3,
          background:`linear-gradient(90deg,${tMeta.color},${fColor})`}}/>
        {/* Subtle bg glyph */}
        <div style={{position:"absolute",right:-10,top:-10,
          fontSize:120,color:`${tMeta.color}06`,pointerEvents:"none",
          fontFamily:"var(--f-mono)",lineHeight:1,userSelect:"none"}}>
          {tMeta.glyph}
        </div>

        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:20,flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:220}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,flexWrap:"wrap"}}>
              <span className="mono" style={{fontSize:12,fontWeight:600,color:tMeta.color,
                background:`${tMeta.color}18`,borderRadius:8,padding:"3px 10px",
                border:`1px solid ${tMeta.color}28`}}>
                #{String(problem.number).padStart(3,"0")}
              </span>
              <StatusBubble status={problem.userState.status}/>
            </div>
            <h1 className="disp" style={{fontSize:"clamp(22px,4vw,34px)",fontWeight:900,
              color:D.t0,letterSpacing:"-.025em",lineHeight:1.1,marginBottom:16}}>
              {problem.title}
            </h1>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              <Chip label={`${tMeta.emoji} ${problem.topic}`} color={tMeta.color} size={12}/>
              <Chip label={problem.family} color={fColor} size={12}/>
            </div>
          </div>
          <div style={{display:"flex",gap:10,flexShrink:0,flexWrap:"wrap"}}>
            <CxTag label="Time"  val={time}  color={D.cyan}/>
            <CxTag label="Space" val={space} color={D.violet}/>
          </div>
        </div>

        {/* Status row */}
        <div style={{marginTop:24,paddingTop:18,borderTop:`1px solid ${D.b1}`,
          display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <span style={{fontSize:12,color:D.t3,fontWeight:600,
            fontFamily:"var(--f-body)",marginRight:4}}>Mark as:</span>
          {statuses.map(s=>{
            const on=problem.userState.status===s.id;
            return (
              <button key={s.id} className="btn" onClick={()=>onStatus(problem.number,s.id)}
                style={{padding:"9px 20px",borderRadius:10,fontSize:12,fontWeight:700,
                  fontFamily:"var(--f-body)",
                  background:on?s.abg:D.bg4,border:`1px solid ${on?s.ab:D.b1}`,
                  color:on?s.c:D.t3,
                  boxShadow:on?`0 0 18px ${s.c}30`:"none",
                  transform:on?"scale(1.05)":"none"}}>
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTIONS */}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {[
          {id:"problem",  icon:"🎯", title:"Problem Statement",      color:D.cyan,   body:<Md text={problem.problem_statement}/>},
          {id:"pattern",  icon:"💡", title:"The Pattern",             color:D.violet, body:<Md text={problem.pattern_explanation}/>},
          {id:"trigger",  icon:"⚡", title:"Pattern Trigger",         color:D.amber,  body:(
            <div style={{background:`${D.amber}09`,border:`1px solid ${D.amber}22`,
              borderLeft:`3px solid ${D.amber}`,borderRadius:12,padding:"18px 22px"}}>
              <p style={{fontStyle:"italic",color:D.t1,lineHeight:1.85,fontSize:16,margin:0,
                fontFamily:"var(--f-body)"}}>"{problem.trigger_phrase}"</p>
            </div>
          )},
          {id:"solution", icon:"✅", title:"Strategy & Solution",     color:D.green,  body:<Md text={problem.detailed_solution}/>},
          {id:"notes",    icon:"📝", title:"My Notes & Mnemonics",    color:D.t3,     body:(
            <div>
              <textarea value={problem.userState.remarks||""}
                onChange={e=>onRemarks(problem.number,e.target.value)}
                placeholder="Write your notes, edge cases, mnemonics, code…"
                style={{width:"100%",minHeight:140,padding:"16px",resize:"vertical",display:"block",
                  background:"rgba(255,255,255,.04)",border:`1px solid ${D.b1}`,borderRadius:12,
                  fontSize:14,color:D.t1,lineHeight:1.75,fontFamily:"var(--f-body)",
                  transition:"border-color .2s,box-shadow .2s"}}
                onFocus={e=>{e.target.style.borderColor=`${D.cyan}55`;
                  e.target.style.boxShadow=`0 0 0 3px ${D.cyan}12`;}}
                onBlur={e=>{e.target.style.borderColor=D.b1;e.target.style.boxShadow="none";}}
              />
              <p style={{fontSize:11,color:D.t4,marginTop:8,fontFamily:"var(--f-body)"}}>
                Auto-saved · persisted across sessions
              </p>
            </div>
          )},
        ].map(({id,icon,title,color,body},i)=>(
          <div key={id} className={`a${Math.min(i+1,5)}`}>
            <Section icon={icon} title={title} color={color}
              isOpen={!!open[id]} onToggle={()=>tog(id)}>{body}</Section>
          </div>
        ))}
      </div>

      <div style={{display:"flex",gap:10,marginTop:22}}>
        <NavBtn dir={-1} label="← Previous Problem" en={hasPrev}/>
        <NavBtn dir={1}  label="Next Problem →"      en={hasNext}/>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FLASHCARD
═══════════════════════════════════════════════════════════════ */
function FlashCard({problem, total, idx, onRate}) {
  const [flipped,setFlipped]=useState(false);
  const [exitDir,setExitDir]=useState(null);
  const tMeta=TOPIC_META[problem.topic]||TOPIC_META.Array;
  const fColor=famCol(problem.family);
  const pct=Math.round(((idx+1)/total)*100);

  const rate=(val)=>{
    setExitDir(val==="got"?"right":"left");
    setTimeout(()=>{ setExitDir(null); setFlipped(false); onRate(val); },320);
  };

  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",
      justifyContent:"center",minHeight:"100%",padding:"28px 20px",gap:22}}>
      {/* Progress */}
      <div style={{width:"100%",maxWidth:640}}>
        <div style={{display:"flex",justifyContent:"space-between",
          fontSize:12,color:D.t3,marginBottom:8,fontFamily:"var(--f-body)"}}>
          <span>Card {idx+1} / {total}</span>
          <span style={{color:D.cyan,fontWeight:700}}>{pct}%</span>
        </div>
        <Bar pct={pct} color={D.cyan} h={3}/>
      </div>

      {/* Card */}
      <div onClick={()=>!flipped&&setFlipped(true)} style={{
        width:"100%",maxWidth:640,borderRadius:22,
        background:D.bg3,
        border:`1px solid ${flipped?D.green+"40":D.b2}`,
        padding:"36px 40px",cursor:flipped?"default":"pointer",
        boxShadow:`0 24px 80px rgba(0,0,0,.65), 0 0 0 1px ${flipped?D.green+"18":D.b0}`,
        position:"relative",overflow:"hidden",
        transform:exitDir==="right"?"translateX(90px) rotate(4deg)":exitDir==="left"?"translateX(-90px) rotate(-4deg)":"none",
        opacity:exitDir?0:1,
        transition:"border-color .3s,box-shadow .3s,transform .3s,opacity .28s",
        animation:"scalein .32s cubic-bezier(.4,0,.2,1) both",
      }}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:3,
          background:`linear-gradient(90deg,${tMeta.color},${fColor})`}}/>

        <div style={{display:"flex",justifyContent:"space-between",
          alignItems:"flex-start",marginBottom:26}}>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <Chip label={`${tMeta.emoji} ${problem.topic}`} color={tMeta.color}/>
            <Chip label={problem.family} color={fColor}/>
          </div>
          <span className="mono" style={{fontSize:12,color:D.t4}}>
            #{String(problem.number).padStart(3,"0")}
          </span>
        </div>

        {!flipped ? (
          <div>
            <h2 className="disp" style={{fontSize:28,fontWeight:900,color:D.t0,
              letterSpacing:"-.02em",lineHeight:1.15,marginBottom:20}}>
              {problem.title}
            </h2>
            <Md text={problem.problem_statement} size={15}/>
            <div style={{marginTop:32,display:"flex",alignItems:"center",gap:8,
              color:D.t3,fontSize:13,fontFamily:"var(--f-body)"}}>
              <span style={{fontSize:20}}>👆</span>
              <span>Tap to reveal the pattern</span>
            </div>
          </div>
        ):(
          <div style={{animation:"up .26s ease both"}}>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:11,fontWeight:700,color:D.green,textTransform:"uppercase",
                letterSpacing:".12em",marginBottom:10,fontFamily:"var(--f-body)"}}>💡 The Pattern</div>
              <Md text={problem.pattern_explanation} size={15}/>
            </div>
            <div style={{background:`${D.amber}09`,border:`1px solid ${D.amber}22`,
              borderLeft:`3px solid ${D.amber}`,borderRadius:12,padding:"16px 20px",marginTop:16}}>
              <div style={{fontSize:11,fontWeight:700,color:D.amber,textTransform:"uppercase",
                letterSpacing:".12em",marginBottom:8,fontFamily:"var(--f-body)"}}>⚡ Trigger</div>
              <p style={{fontStyle:"italic",color:D.t1,fontSize:15,lineHeight:1.8,margin:0,
                fontFamily:"var(--f-body)"}}>"{problem.trigger_phrase}"</p>
            </div>
            <div style={{display:"flex",gap:8,marginTop:16,flexWrap:"wrap"}}>
              <CxTag label="Time"  val={problem.complexity.time}  color={D.cyan}/>
              <CxTag label="Space" val={problem.complexity.space} color={D.violet}/>
            </div>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div style={{display:"flex",gap:10,width:"100%",maxWidth:640}}>
        {!flipped?(
          <button className="btn" onClick={()=>setFlipped(true)} style={{
            flex:1,padding:"14px",borderRadius:14,fontSize:14,fontWeight:700,
            fontFamily:"var(--f-body)",
            background:`linear-gradient(135deg,${D.cyan}18,${D.violet}14)`,
            border:`1px solid ${D.cyan}32`,color:D.cyan}}>
            Reveal Pattern →
          </button>
        ):(
          <>
            {[
              {label:"😅  Miss",    val:"miss",  c:D.red,   bg:`${D.red}14`},
              {label:"🤔  Shaky",   val:"shaky", c:D.amber, bg:`${D.amber}14`},
              {label:"✅  Got it!", val:"got",   c:D.green, bg:`${D.green}14`},
            ].map(a=>(
              <button key={a.val} className="btn" onClick={()=>rate(a.val)} style={{
                flex:1,padding:"14px",borderRadius:14,fontSize:13,fontWeight:700,
                fontFamily:"var(--f-body)",
                background:a.bg,border:`1px solid ${a.c}32`,color:a.c}}>
                {a.label}
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STATS VIEW
═══════════════════════════════════════════════════════════════ */
function StatsView({stats, problems, sessions}) {
  const topColors={Array:D.cyan,String:D.violet,Grid:D.green};
  const solved=problems.filter(p=>p.userState.status==="solved");
  const totalDays=Object.values(sessions).filter(Boolean).length;

  const streak=useMemo(()=>{
    let s=0; const now=new Date(); now.setHours(0,0,0,0);
    for(let i=0;i<365;i++){
      const d=new Date(now); d.setDate(d.getDate()-i);
      if((sessions[d.toISOString().slice(0,10)]||0)>0) s++;
      else break;
    }
    return s;
  },[sessions]);

  const Card=({children,glow,cls="",style={}})=>(
    <div className={`lift ${cls}`} style={{background:D.bg3,borderRadius:20,
      border:`1px solid ${glow?glow+"20":D.b1}`,
      boxShadow:`0 4px 24px rgba(0,0,0,.4)${glow?`,0 0 32px ${glow}0e`:""}`,
      position:"relative",overflow:"hidden",...style}}>
      {children}
    </div>
  );

  return (
    <div style={{maxWidth:900,margin:"0 auto",padding:"28px 24px 150px"}}>
      <div className="a0" style={{marginBottom:30}}>
        <h2 className="disp" style={{fontSize:38,fontWeight:900,color:D.t0,
          letterSpacing:"-.035em",marginBottom:6}}>
          Progress Dashboard
        </h2>
        <p style={{fontSize:15,color:D.t3,fontFamily:"var(--f-body)"}}>
          Your DSA mastery across all {stats.total} problems
        </p>
      </div>

      {/* Ring + counters */}
      <div className="a1" style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:14,marginBottom:14}}>
        <Card glow={D.cyan} style={{padding:"28px 22px",display:"flex",flexDirection:"column",
          alignItems:"center",justifyContent:"center",gap:16,minWidth:190}}>
          <Ring pct={stats.pct} size={132} stroke={9} color={D.cyan}>
            <div style={{textAlign:"center"}}>
              <div className="mono" style={{fontSize:26,fontWeight:700,color:D.cyan,lineHeight:1}}>{stats.pct}%</div>
              <div style={{fontSize:9,color:D.t3,fontWeight:700,letterSpacing:".1em",
                fontFamily:"var(--f-body)",textTransform:"uppercase"}}>complete</div>
            </div>
          </Ring>
          <div className="disp" style={{fontSize:15,fontWeight:800,color:D.t0,textAlign:"center"}}>
            {stats.pct>=90?"🏆 Champion!":stats.pct>=70?"🔥 On fire!":stats.pct>=40?"⚡ Building!":"🌱 Starting!"}
          </div>
        </Card>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
          {[
            {label:"Solved",     val:stats.solved,    c:D.green,  ico:"✓",  sub:`of ${stats.total}`},
            {label:"Attempted",  val:stats.attempted, c:D.amber,  ico:"◑",  sub:"in progress"},
            {label:"Day Streak", val:streak,          c:D.pink,   ico:"🔥", sub:"consecutive days"},
            {label:"Study Days", val:totalDays,       c:D.violet, ico:"📅", sub:"total active"},
          ].map(c=>(
            <Card key={c.label} glow={c.c} style={{padding:"20px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                <div>
                  <div className="mono" style={{fontSize:32,fontWeight:700,color:c.c,lineHeight:1}}>{c.val}</div>
                  <div style={{fontSize:11,color:D.t3,marginTop:4,fontFamily:"var(--f-body)"}}>{c.sub}</div>
                </div>
                <span style={{fontSize:22,opacity:.75}}>{c.ico}</span>
              </div>
              <Bar pct={Math.min((Number(c.val)/Math.max(stats.total,1))*100,100)} color={c.c}/>
              <div style={{fontSize:10,color:D.t4,fontWeight:700,textTransform:"uppercase",
                letterSpacing:".1em",marginTop:10,fontFamily:"var(--f-body)"}}>{c.label}</div>
            </Card>
          ))}
        </div>
      </div>

      {/* Multi bar */}
      <Card cls="a2" style={{padding:"24px 26px",marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:10}}>
          <h3 className="disp" style={{fontSize:18,fontWeight:800,color:D.t0,letterSpacing:"-.02em"}}>
            Completion Breakdown
          </h3>
          <div style={{display:"flex",gap:14,fontSize:12,fontFamily:"var(--f-body)"}}>
            {[{c:D.green,l:"Solved"},{c:D.amber,l:"Attempted"},{c:D.t4,l:"Todo"}].map(x=>(
              <span key={x.l} style={{color:x.c,display:"flex",alignItems:"center",gap:5}}>
                <span style={{width:8,height:8,borderRadius:2,background:x.c,display:"inline-block"}}/>
                {x.l}
              </span>
            ))}
          </div>
        </div>
        <div style={{height:16,background:"rgba(255,255,255,.06)",borderRadius:999,overflow:"hidden",display:"flex"}}>
          <div style={{width:`${(stats.solved/stats.total)*100}%`,background:D.green,
            boxShadow:`0 0 14px ${D.green}60`,transition:"width 1.2s"}}/>
          <div style={{width:`${(stats.attempted/stats.total)*100}%`,background:D.amber,
            boxShadow:`0 0 14px ${D.amber}60`,transition:"width 1.2s .1s"}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:10,
          fontSize:12,color:D.t2,fontFamily:"var(--f-body)"}}>
          <span>{stats.solved} solved ({Math.round((stats.solved/stats.total)*100)}%)</span>
          <span>{stats.attempted} attempted</span>
          <span>{stats.todo} remaining</span>
        </div>
      </Card>

      {/* Heatmap */}
      <Card cls="a2" style={{padding:"24px 26px",marginBottom:14}}>
        <h3 className="disp" style={{fontSize:18,fontWeight:800,color:D.t0,
          letterSpacing:"-.02em",marginBottom:20}}>📅 Study Activity (84 days)</h3>
        <HeatMap sessions={sessions}/>
      </Card>

      {/* By topic */}
      <div className="a3" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",
        gap:10,marginBottom:14}}>
        {Object.entries(stats.byTopic).map(([topic,data])=>{
          const col=topColors[topic]||D.cyan;
          const pct=Math.round((data.solved/data.total)*100);
          const meta=TOPIC_META[topic]||TOPIC_META.Array;
          return (
            <Card key={topic} glow={col} style={{padding:"20px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:22}}>{meta.emoji}</span>
                  <span className="disp" style={{fontWeight:800,color:col,fontSize:16}}>{topic}</span>
                </div>
                <span className="mono" style={{fontSize:12,color:D.t3}}>{data.solved}/{data.total}</span>
              </div>
              <Bar pct={pct} color={col} h={5}/>
              <div className="mono" style={{fontSize:12,fontWeight:700,color:col,marginTop:10}}>
                {pct}% complete
              </div>
            </Card>
          );
        })}
      </div>

      {/* By pattern */}
      <Card cls="a4" style={{padding:"24px 26px",marginBottom:14}}>
        <h3 className="disp" style={{fontSize:18,fontWeight:800,color:D.t0,
          letterSpacing:"-.02em",marginBottom:22}}>Progress by Pattern</h3>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {Object.entries(stats.byFamily).sort((a,b)=>b[1].solved-a[1].solved).map(([fam,data])=>{
            const pct=Math.round((data.solved/data.total)*100);
            const col=famCol(fam);
            return (
              <div key={fam} style={{display:"grid",gridTemplateColumns:"155px 1fr 52px",
                alignItems:"center",gap:14}}>
                <div style={{fontSize:12,fontWeight:600,color:D.t2,textAlign:"right",
                  fontFamily:"var(--f-body)"}}>{fam}</div>
                <Bar pct={pct} color={col} h={5}/>
                <div className="mono" style={{fontSize:11,fontWeight:700,color:col,textAlign:"right"}}>
                  {data.solved}/{data.total}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Solved problems */}
      {solved.length>0&&(
        <Card cls="a5" style={{padding:"24px 26px"}}>
          <h3 className="disp" style={{fontSize:18,fontWeight:800,color:D.t0,
            letterSpacing:"-.02em",marginBottom:18}}>✅ Solved Problems ({solved.length})</h3>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(162px,1fr))",gap:8}}>
            {solved.map(p=>{
              const col=topColors[p.topic]||D.cyan;
              return (
                <div key={p.number} style={{background:`${D.green}09`,
                  border:`1px solid ${D.green}20`,borderRadius:12,padding:"12px 14px",
                  transition:"transform .15s,box-shadow .15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";
                    e.currentTarget.style.boxShadow=`0 8px 24px ${D.green}20`;}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="none";
                    e.currentTarget.style.boxShadow="none";}}>
                  <div className="mono" style={{fontSize:10,fontWeight:700,color:D.green,marginBottom:5}}>
                    #{String(p.number).padStart(3,"0")}
                  </div>
                  <div style={{fontSize:13,fontWeight:600,color:D.t1,lineHeight:1.3,
                    fontFamily:"var(--f-body)"}}>{p.title}</div>
                  <div style={{fontSize:11,color:col,marginTop:5,fontFamily:"var(--f-body)"}}>{p.topic}</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════════════════════════════ */
function Sidebar({problems, stats, selectedId, setSelectedId, setSidebarOpen}) {
  const [q,setQ]=useState("");
  const [topic,setTopic]=useState("All");
  const [status,setStatus]=useState("All");
  const [family,setFamily]=useState("All");

  const FAMS=["All","Sliding Window","Prefix/Diff","Hashing","Two Pointers",
    "Stack/Deque","Heap/PQ","Binary Search","Greedy","DFS/BFS","DP","Backtracking","Simulation","Core"];

  const filtered=useMemo(()=>{
    const ql=q.toLowerCase();
    return problems.filter(p=>{
      const ms=!ql||p.title.toLowerCase().includes(ql)||
        p.family.toLowerCase().includes(ql)||p.trigger_phrase.toLowerCase().includes(ql);
      return ms&&(topic==="All"||p.topic===topic)&&
        (status==="All"||p.userState.status===status)&&
        (family==="All"||p.family===family);
    });
  },[problems,q,topic,status,family]);

  const hasF=q||topic!=="All"||status!=="All"||family!=="All";
  const reset=()=>{setQ("");setTopic("All");setStatus("All");setFamily("All");};

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
      {/* Mini stats */}
      <div style={{padding:"14px 12px 0",flexShrink:0}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:12}}>
          {[{v:stats.solved,l:"Solved",c:D.green},{v:stats.attempted,l:"Tried",c:D.amber},{v:stats.todo,l:"Todo",c:D.t3}].map(s=>(
            <div key={s.l} style={{background:D.bg4,border:`1px solid ${D.b1}`,
              borderRadius:10,padding:"8px 6px",textAlign:"center"}}>
              <div className="mono" style={{fontSize:22,fontWeight:700,color:s.c,lineHeight:1}}>{s.v}</div>
              <div style={{fontSize:10,color:D.t4,fontWeight:700,textTransform:"uppercase",
                letterSpacing:".08em",marginTop:3,fontFamily:"var(--f-body)"}}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{marginBottom:14}}>
          <Bar pct={stats.pct} color={D.cyan} h={4}/>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:5,
            fontSize:11,color:D.t3,fontFamily:"var(--f-body)"}}>
            <span>Overall</span>
            <span className="mono" style={{color:D.cyan,fontWeight:700}}>{stats.pct}%</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{padding:"0 12px 10px",flexShrink:0,borderBottom:`1px solid ${D.b0}`}}>
        {/* Search */}
        <div style={{position:"relative",marginBottom:8}}>
          <svg style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",
            color:D.t3,pointerEvents:"none"}}
            width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" placeholder="Search…" value={q}
            onChange={e=>setQ(e.target.value)}
            style={{width:"100%",background:D.bg4,border:`1px solid ${D.b1}`,borderRadius:10,
              padding:"9px 32px 9px 32px",fontSize:13,color:D.t0,
              transition:"border-color .2s,box-shadow .2s"}}
            onFocus={e=>{e.target.style.borderColor=`${D.cyan}55`;
              e.target.style.boxShadow=`0 0 0 3px ${D.cyan}10`;}}
            onBlur={e=>{e.target.style.borderColor=D.b1;e.target.style.boxShadow="none";}}
          />
          {q&&<button className="btn" onClick={()=>setQ("")}
            style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",
              color:D.t3,fontSize:14}}>✕</button>}
        </div>

        {/* Topic */}
        <div style={{display:"flex",gap:4,marginBottom:7}}>
          {["All","Array","String","Grid"].map(tp=>{
            const col={Array:D.cyan,String:D.violet,Grid:D.green}[tp]||D.cyan;
            const on=topic===tp;
            return (
              <button key={tp} className="btn" onClick={()=>setTopic(tp)}
                style={{flex:1,padding:"6px 4px",borderRadius:8,fontSize:11,fontWeight:700,
                  fontFamily:"var(--f-body)",
                  border:on?`1px solid ${col}40`:`1px solid ${D.b1}`,
                  background:on?`${col}16`:D.bg4,color:on?col:D.t3}}>
                {tp}
              </button>
            );
          })}
        </div>

        {/* Selects */}
        <div style={{display:"flex",gap:6,marginBottom:8}}>
          {[
            {v:status,set:setStatus,opts:[["All","All Status"],["todo","To Do"],["attempted","Tried"],["solved","Solved"]]},
            {v:family,set:setFamily,opts:FAMS.map(f=>[f,f==="All"?"All Patterns":f])},
          ].map((s,i)=>(
            <select key={i} value={s.v} onChange={e=>s.set(e.target.value)}
              style={{flex:1,background:D.bg4,border:`1px solid ${D.b1}`,borderRadius:8,
                padding:"7px 8px",fontSize:11,color:D.t2,cursor:"pointer",
                fontFamily:"var(--f-body)"}}>
              {s.opts.map(([v,l])=><option key={v} value={v} style={{background:D.bg2}}>{l}</option>)}
            </select>
          ))}
        </div>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:11,color:D.t3,fontFamily:"var(--f-body)"}}>
            {filtered.length} / {problems.length} problems
          </span>
          {hasF&&<button className="btn" onClick={reset}
            style={{color:D.cyan,fontSize:11,fontWeight:700,fontFamily:"var(--f-body)"}}>
            Reset
          </button>}
        </div>
      </div>

      {/* List */}
      <div style={{flex:1,overflowY:"auto",padding:"6px 8px 80px"}}>
        {filtered.length===0?(
          <div style={{textAlign:"center",padding:"52px 16px"}}>
            <div style={{fontSize:40,marginBottom:12}}>🔍</div>
            <div style={{fontSize:14,color:D.t3,marginBottom:10,fontFamily:"var(--f-body)"}}>
              No problems found
            </div>
            <button className="btn" onClick={reset}
              style={{color:D.cyan,fontWeight:700,fontSize:13,fontFamily:"var(--f-body)"}}>
              Clear filters
            </button>
          </div>
        ):filtered.map((p,i)=>{
          const sel=selectedId===p.number;
          const tc={Array:D.cyan,String:D.violet,Grid:D.green}[p.topic]||D.cyan;
          const fc2=famCol(p.family);
          const dotC=p.userState.status==="solved"?D.green:p.userState.status==="attempted"?D.amber:D.t4;
          return (
            <button key={p.number} className={`btn prob-row ${sel?"on":""}`}
              onClick={()=>{setSelectedId(p.number);setSidebarOpen(false);}}
              style={{textAlign:"left",padding:"11px 12px",borderRadius:12,marginBottom:3,
                background:sel?`${tc}0f`:"transparent",
                border:sel?`1px solid ${tc}25`:`1px solid transparent`,
                position:"relative",display:"block",
                animation:`fadein .14s ${Math.min(i*.008,.2)}s both`}}>
              <div style={{display:"flex",alignItems:"center",
                justifyContent:"space-between",marginBottom:4}}>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <span className="mono" style={{fontSize:10,fontWeight:600,color:D.t4}}>
                    #{String(p.number).padStart(3,"0")}
                  </span>
                  <span style={{width:6,height:6,borderRadius:"50%",display:"inline-block",
                    background:dotC,flexShrink:0,
                    boxShadow:p.userState.status!=="todo"?`0 0 6px ${dotC}80`:"none"}}/>
                </div>
                <span style={{fontSize:10,fontWeight:700,color:tc,background:`${tc}14`,
                  borderRadius:5,padding:"1px 7px",fontFamily:"var(--f-body)"}}>{p.topic}</span>
              </div>
              <div style={{fontSize:13,fontWeight:600,lineHeight:1.3,marginBottom:3,
                color:sel?D.t0:D.t2,fontFamily:"var(--f-body)"}}>{p.title}</div>
              <div style={{fontSize:11,fontWeight:500,color:fc2,opacity:.8,
                fontFamily:"var(--f-body)"}}>{p.family}</div>
              {sel&&<div style={{position:"absolute",left:0,top:"15%",bottom:"15%",width:3,
                background:tc,borderRadius:"0 3px 3px 0",boxShadow:`0 0 12px ${tc}`}}/>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════════════════ */
export default function App() {
  const [view,setView]=useState("study");
  const [selId,setSelId]=useState(1);
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const [progress,setProgress]=useState({});
  const [sessions,setSessions]=useState({});
  const [syncStatus,setSyncStatus]=useState("idle");
  const [confetti,setConfetti]=useState(false);
  const [flashQ,setFlashQ]=useState([]);
  const [flashIdx,setFlashIdx]=useState(0);
  const [flashScore,setFlashScore]=useState({got:0,shaky:0,miss:0});
  const syncT=useRef(null);

  useEffect(()=>{
    (async()=>{
      const [prog,sess]=await Promise.all([
        store.get("dsa-v5-progress"),
        store.get("dsa-v5-sessions"),
      ]);
      if(prog) setProgress(prog);
      if(sess) setSessions(sess);
    })();
  },[]);

  const saveProgress=useCallback((next)=>{
    clearTimeout(syncT.current);
    setSyncStatus("saving");
    syncT.current=setTimeout(async()=>{
      await store.set("dsa-v5-progress",next);
      setSyncStatus("saved");
      setTimeout(()=>setSyncStatus("idle"),2000);
    },700);
  },[]);

  const updateStatus=useCallback((id,status)=>{
    const wasSolved=progress[id]?.status==="solved";
    setProgress(prev=>{
      const next={...prev,[id]:{...(prev[id]||{remarks:""}),status}};
      saveProgress(next); return next;
    });
    if(!wasSolved&&status==="solved"){
      setConfetti(true);
      const today=new Date().toISOString().slice(0,10);
      setSessions(prev=>{
        const next={...prev,[today]:(prev[today]||0)+1};
        store.set("dsa-v5-sessions",next); return next;
      });
    }
  },[progress,saveProgress]);

  const updateRemarks=useCallback((id,remarks)=>{
    setProgress(prev=>{
      const next={...prev,[id]:{...(prev[id]||{status:"todo"}),remarks}};
      saveProgress(next); return next;
    });
  },[saveProgress]);

  const problems=useMemo(()=>handbook.problems.map(p=>({
    ...p,
    topic:inferTopic(p),
    family:inferFamily(p),
    complexity:extractComplexity(p.detailed_solution),
    userState:progress[p.number]||{status:"todo",remarks:""},
  })),[progress]);

  const stats=useMemo(()=>{
    const total=problems.length;
    const solved=problems.filter(p=>p.userState.status==="solved").length;
    const attempted=problems.filter(p=>p.userState.status==="attempted").length;
    const byTopic={Array:{solved:0,total:0},String:{solved:0,total:0},Grid:{solved:0,total:0}};
    const byFamily={};
    problems.forEach(p=>{
      byTopic[p.topic].total++;
      if(p.userState.status==="solved") byTopic[p.topic].solved++;
      if(!byFamily[p.family]) byFamily[p.family]={solved:0,total:0};
      byFamily[p.family].total++;
      if(p.userState.status==="solved") byFamily[p.family].solved++;
    });
    return{total,solved,attempted,todo:total-solved-attempted,
      pct:Math.round((solved/total)*100),byTopic,byFamily};
  },[problems]);

  const selProblem=problems.find(p=>p.number===selId)||problems[0];

  const navigate=useCallback((dir)=>{
    const idx=problems.findIndex(p=>p.number===selId);
    const next=problems[idx+dir];
    if(next) setSelId(next.number);
  },[problems,selId]);

  const startFlash=useCallback((filter="unsolved")=>{
    let pool=filter==="unsolved"
      ?problems.filter(p=>p.userState.status!=="solved")
      :[...problems];
    if(!pool.length) pool=[...problems];
    for(let i=pool.length-1;i>0;i--){
      const j=~~(Math.random()*(i+1));
      [pool[i],pool[j]]=[pool[j],pool[i]];
    }
    setFlashQ(pool); setFlashIdx(0);
    setFlashScore({got:0,shaky:0,miss:0});
    setView("flash");
  },[problems]);

  const handleRate=useCallback((val)=>{
    const prob=flashQ[flashIdx];
    if(prob){
      const sm={got:"solved",shaky:"attempted",miss:"todo"};
      updateStatus(prob.number,sm[val]);
      setFlashScore(s=>({...s,[val]:s[val]+1}));
    }
    if(flashIdx<flashQ.length-1) setFlashIdx(i=>i+1);
  },[flashQ,flashIdx,updateStatus]);

  const views=[{id:"study",label:"Study",icon:"📖"},{id:"stats",label:"Dashboard",icon:"📊"},{id:"flash",label:"Flashcards",icon:"⚡"}];

  return (
    <div className="root" style={{position:"fixed",inset:0,display:"flex",
      flexDirection:"column",background:D.bg1,color:D.t0}}>
      <G/>
      <Aurora/>
      <Confetti active={confetti} onDone={()=>setConfetti(false)}/>

      {/* ── HEADER ── */}
      <header style={{flexShrink:0,zIndex:50,display:"flex",alignItems:"center",
        justifyContent:"space-between",padding:"0 20px",height:64,
        background:"rgba(6,10,24,.94)",backdropFilter:"blur(32px)",
        borderBottom:`1px solid ${D.b1}`}}>

        <div style={{display:"flex",alignItems:"center",gap:14}}>
          {/* Mobile hamburger */}
          <button className="btn show-sm" style={{display:"none"}}
            onClick={()=>setSidebarOpen(v=>!v)}>
            <div style={{background:D.bg3,border:`1px solid ${D.b1}`,borderRadius:9,
              padding:"8px 10px",display:"flex",color:D.t2}}>
              <svg width="17" height="17" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" strokeWidth="2">
                {sidebarOpen
                  ?<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                  :<><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></>
                }
              </svg>
            </div>
          </button>

          {/* Logo */}
          <div style={{display:"flex",alignItems:"center",gap:11}}>
            <div style={{width:40,height:40,borderRadius:13,flexShrink:0,
              background:"linear-gradient(135deg,#00d4ff,#7b6cf6,#b794f4)",
              display:"flex",alignItems:"center",justifyContent:"center",
              boxShadow:"0 0 26px rgba(0,212,255,.5)"}}>
              <span className="disp" style={{fontSize:20,fontWeight:900,color:"#fff"}}>D</span>
            </div>
            <div>
              <div className="disp" style={{fontWeight:900,fontSize:18,
                letterSpacing:"-.03em",color:D.t0,lineHeight:1}}>
                PatternAtlas <span style={{color:D.cyan}}>DSA</span>
              </div>
              <div className="mono" style={{fontSize:9,color:D.t4,
                textTransform:"uppercase",letterSpacing:".14em",marginTop:2}}>
                100 Problems Handbook
              </div>
            </div>
          </div>

          {/* Nav tabs */}
          <div className="hide-sm" style={{display:"flex",alignItems:"center",gap:3,
            background:D.bg3,border:`1px solid ${D.b1}`,borderRadius:13,
            padding:4,marginLeft:8}}>
            {views.map(v=>{
              const on=view===v.id;
              return (
                <button key={v.id} className="btn" onClick={()=>setView(v.id)} style={{
                  padding:"7px 16px",borderRadius:10,fontSize:13,fontWeight:700,
                  fontFamily:"var(--f-body)",
                  background:on?`linear-gradient(135deg,${D.cyan}1e,${D.violet}18)`:"transparent",
                  color:on?D.cyan:D.t3,
                  border:on?`1px solid ${D.cyan}28`:"1px solid transparent",
                  boxShadow:on?`0 0 18px ${D.cyan}18`:"none"}}>
                  {v.icon} {v.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right */}
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          {syncStatus!=="idle"&&(
            <span className="mono" style={{fontSize:11,fontWeight:700,
              color:syncStatus==="saved"?D.green:D.t3,
              display:"flex",alignItems:"center",gap:5}}>
              {syncStatus==="saving"&&
                <span style={{width:9,height:9,border:`2px solid ${D.cyan}`,
                  borderTopColor:"transparent",borderRadius:"50%",
                  animation:"spin .65s linear infinite",display:"inline-block"}}/>
              }
              {syncStatus==="saving"?"Syncing…":"✓ Saved"}
            </span>
          )}
          <div className="hide-sm" style={{display:"flex",flexDirection:"column",
            alignItems:"flex-end",gap:4}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:11,color:D.t3,fontFamily:"var(--f-body)"}}>Progress</span>
              <span className="mono" style={{fontSize:14,fontWeight:700,color:D.cyan}}>
                {stats.pct}%
              </span>
            </div>
            <div style={{width:120,height:3,background:"rgba(255,255,255,.07)",
              borderRadius:99,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${stats.pct}%`,
                background:`linear-gradient(90deg,${D.cyan},${D.violet})`,
                borderRadius:99,transition:"width 1s",
                boxShadow:`0 0 10px ${D.cyan}80`}}/>
            </div>
          </div>
          <button className="btn hide-sm" onClick={()=>startFlash("unsolved")} style={{
            background:`${D.amber}12`,border:`1px solid ${D.amber}30`,
            borderRadius:10,padding:"8px 16px",color:D.amber,
            fontSize:12,fontWeight:700,fontFamily:"var(--f-body)",
            display:"flex",alignItems:"center",gap:6}}>
            ⚡ Flash Drill
          </button>
        </div>
      </header>

      {/* ── BODY ── */}
      <div style={{flex:1,display:"flex",overflow:"hidden",position:"relative",zIndex:1}}>

        {/* Mobile overlay */}
        {sidebarOpen&&(
          <div className="show-sm" onClick={()=>setSidebarOpen(false)}
            style={{display:"none",position:"fixed",inset:0,
              background:"rgba(0,0,0,.78)",zIndex:399}}/>
        )}

        {/* Sidebar */}
        {view!=="flash"&&(
          <aside className={`sidebar ${sidebarOpen?"open":""}`}
            style={{width:308,flexShrink:0,display:"flex",flexDirection:"column",
              background:"rgba(6,10,24,.97)",backdropFilter:"blur(36px)",
              borderRight:`1px solid ${D.b0}`,zIndex:400}}>
            <Sidebar problems={problems} stats={stats}
              selectedId={selId} setSelectedId={setSelId}
              setSidebarOpen={setSidebarOpen}/>
          </aside>
        )}

        {/* Main */}
        <main style={{flex:1,overflowY:"auto",position:"relative"}}>
          {view==="study"&&(
            <DetailView key={selId} problem={selProblem} allProblems={problems}
              onNav={navigate} onStatus={updateStatus} onRemarks={updateRemarks}/>
          )}

          {view==="stats"&&(
            <StatsView stats={stats} problems={problems} sessions={sessions}/>
          )}

          {view==="flash"&&(
            <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
              {/* Flash header */}
              <div style={{padding:"14px 24px",borderBottom:`1px solid ${D.b1}`,
                display:"flex",alignItems:"center",justifyContent:"space-between",
                flexWrap:"wrap",gap:10,flexShrink:0,
                background:"rgba(6,10,24,.88)",backdropFilter:"blur(20px)"}}>
                <div>
                  <div className="disp" style={{fontSize:20,fontWeight:800,color:D.t0,
                    letterSpacing:"-.02em"}}>⚡ Flashcard Drill</div>
                  <div style={{fontSize:12,color:D.t3,marginTop:2,fontFamily:"var(--f-body)"}}>
                    {flashQ.length} cards · {flashScore.got} got · {flashScore.shaky} shaky · {flashScore.miss} missed
                  </div>
                </div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {[
                    {l:"🔀 All Cards",    fn:()=>startFlash("all"),     c:D.t2,  bc:D.b2, bg:D.bg3},
                    {l:"🎯 Unsolved",     fn:()=>startFlash("unsolved"), c:D.amber,bc:`${D.amber}30`,bg:`${D.amber}12`},
                    {l:"← Back to Study",fn:()=>setView("study"),       c:D.t2,  bc:D.b2, bg:D.bg3},
                  ].map(a=>(
                    <button key={a.l} className="btn" onClick={a.fn}
                      style={{background:a.bg,border:`1px solid ${a.bc}`,borderRadius:10,
                        padding:"8px 14px",color:a.c,fontSize:12,fontWeight:700,
                        fontFamily:"var(--f-body)"}}>
                      {a.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Flash body */}
              <div style={{flex:1,overflowY:"auto"}}>
                {flashQ[flashIdx]?(
                  <FlashCard problem={flashQ[flashIdx]} total={flashQ.length}
                    idx={flashIdx} onRate={handleRate}/>
                ):(
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",
                    justifyContent:"center",height:"100%",gap:20,padding:"40px"}}>
                    <div style={{fontSize:80,animation:"float 3s ease-in-out infinite"}}>🎉</div>
                    <div className="disp" style={{fontSize:30,fontWeight:900,color:D.t0,
                      textAlign:"center",letterSpacing:"-.03em"}}>Deck Complete!</div>
                    <div style={{fontSize:16,color:D.t2,textAlign:"center",
                      fontFamily:"var(--f-body)"}}>
                      <span style={{color:D.green}}>{flashScore.got} got</span>{" · "}
                      <span style={{color:D.amber}}>{flashScore.shaky} shaky</span>{" · "}
                      <span style={{color:D.red}}>{flashScore.miss} missed</span>
                    </div>
                    <div style={{display:"flex",gap:10,marginTop:8}}>
                      <button className="btn" onClick={()=>startFlash("all")}
                        style={{padding:"13px 28px",borderRadius:14,fontSize:14,fontWeight:700,
                          fontFamily:"var(--f-body)",
                          background:`${D.cyan}14`,border:`1px solid ${D.cyan}32`,color:D.cyan}}>
                        Restart Deck
                      </button>
                      <button className="btn" onClick={()=>setView("study")}
                        style={{padding:"13px 28px",borderRadius:14,fontSize:14,fontWeight:700,
                          fontFamily:"var(--f-body)",
                          background:D.bg3,border:`1px solid ${D.b2}`,color:D.t2}}>
                        Back to Study
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="show-sm" style={{display:"none",position:"fixed",bottom:0,
        left:0,right:0,zIndex:200,
        background:"rgba(6,10,24,.97)",backdropFilter:"blur(32px)",
        borderTop:`1px solid ${D.b1}`,padding:"8px 12px 22px",gap:4}}>
        {[
          {id:"study",  label:"Study",    icon:"📖"},
          {id:"stats",  label:"Stats",    icon:"📊"},
          {id:"flash",  label:"Flash",    icon:"⚡"},
          {id:"__list", label:"Problems", icon:"☰"},
        ].map(v=>{
          const isL=v.id==="__list";
          const on=isL?(sidebarOpen&&view==="study"):view===v.id;
          return (
            <button key={v.id} className="btn" onClick={()=>{
              if(isL){setView("study");setSidebarOpen(o=>!o);}
              else{setView(v.id);setSidebarOpen(false);}
            }} style={{flex:1,padding:"9px 4px",borderRadius:12,fontSize:11,fontWeight:700,
              fontFamily:"var(--f-body)",
              background:on?`${D.cyan}14`:"transparent",
              color:on?D.cyan:D.t3,
              border:on?`1px solid ${D.cyan}25`:"1px solid transparent",
              flexDirection:"column",display:"flex",alignItems:"center",gap:3}}>
              <span style={{fontSize:16}}>{v.icon}</span>
              {v.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}