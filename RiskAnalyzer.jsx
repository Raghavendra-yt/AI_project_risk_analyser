import { useState, useEffect, useRef } from "react";

// ─── Utility helpers ──────────────────────────────────────────────────────────
const formatDate = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const daysUntil = (d) => Math.ceil((new Date(d) - new Date()) / 86400000);
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const riskLevel = (score) => score <= 30 ? "Low" : score <= 70 ? "Medium" : "High";
const riskColor = (score) => score <= 30 ? "#22C55E" : score <= 70 ? "#EAB308" : "#EF4444";
const riskBg = (score) => score <= 30 ? "rgba(34,197,94,0.12)" : score <= 70 ? "rgba(234,179,8,0.12)" : "rgba(239,68,68,0.12)";

// ─── Risk Engine ──────────────────────────────────────────────────────────────
function analyzeRisks(form) {
  let score = 0;
  const risks = [];
  const actions = [];
  const breakdown = { Schedule: 0, Budget: 0, Materials: 0, Labor: 0, Site: 0 };

  const progress = Number(form.progress) || 0;
  const days = daysUntil(form.completionDate);
  const daysLate = Number(form.daysBehind) || 0;
  const planned = Number(form.plannedBudget) || 1;
  const spent = Number(form.currentSpending) || 0;
  const workersNeeded = Number(form.workersRequired) || 1;
  const workersAvail = Number(form.workersAvailable) || 0;

  // Schedule risk
  if (progress < 50 && days <= 30) {
    score += 25; breakdown.Schedule += 25;
    risks.push({ cat: "Schedule", msg: "Project is critically behind — less than 50% complete with fewer than 30 days remaining." });
    actions.push("Implement crash schedule: add shifts or weekend work immediately.");
  } else if (daysLate > 0) {
    const add = Math.min(daysLate * 1.5, 15);
    score += add; breakdown.Schedule += add;
    risks.push({ cat: "Schedule", msg: `Project is ${daysLate} days behind schedule, risking deadline breach.` });
    actions.push("Review schedule baseline and compress non-critical activities.");
  }

  // Material risks
  const critMats = [form.cementStatus, form.steelStatus, form.electricalStatus, form.plumbingStatus].filter(m => m === "critical");
  const delayMats = [form.cementStatus, form.steelStatus, form.electricalStatus, form.plumbingStatus].filter(m => m === "delayed");
  const matNames = { cementStatus: "Cement", steelStatus: "Steel", electricalStatus: "Electrical materials", plumbingStatus: "Plumbing materials" };
  const critMatNames = Object.entries(matNames).filter(([k]) => form[k] === "critical").map(([, v]) => v);
  const delayMatNames = Object.entries(matNames).filter(([k]) => form[k] === "delayed").map(([, v]) => v);

  if (critMats.length > 0) {
    score += 20 * critMats.length; breakdown.Materials += 20 * critMats.length;
    risks.push({ cat: "Materials", msg: `Critical shortage: ${critMatNames.join(", ")} may halt construction immediately.` });
    actions.push("Expedite procurement — contact alternate suppliers for critical materials.");
  }
  if (delayMats.length > 0) {
    const add = 8 * delayMats.length;
    score += add; breakdown.Materials += add;
    risks.push({ cat: "Materials", msg: `Delayed materials: ${delayMatNames.join(", ")} could impact upcoming work phases.` });
    actions.push("Confirm ETA with suppliers and adjust work sequencing around delays.");
  }

  // Labor risk
  const laborRatio = workersAvail / workersNeeded;
  if (form.laborStatus === "critical" || laborRatio < 0.7) {
    score += 20; breakdown.Labor += 20;
    risks.push({ cat: "Labor", msg: `Labor availability at ${Math.round(laborRatio * 100)}% of requirement — productivity severely impacted.` });
    actions.push("Engage subcontractors or temp workforce agencies immediately.");
  } else if (form.laborStatus === "partial" || laborRatio < 0.9) {
    score += 10; breakdown.Labor += 10;
    risks.push({ cat: "Labor", msg: "Partial labor shortage — some activities may run below optimal capacity." });
    actions.push("Reassign labor from non-critical to critical path activities.");
  }

  // Budget risk
  const budgetRatio = spent / planned;
  if (budgetRatio > 0.8 && progress < 70) {
    score += 25; breakdown.Budget += 25;
    risks.push({ cat: "Budget", msg: `${Math.round(budgetRatio * 100)}% of budget consumed with only ${progress}% progress — cost overrun highly likely.` });
    actions.push("Conduct immediate cost audit. Freeze non-essential expenditures.");
    actions.push("Re-estimate to-complete costs and present revised forecast to client.");
  } else if (budgetRatio > 0.65 && progress < 60) {
    const add = 12;
    score += add; breakdown.Budget += add;
    risks.push({ cat: "Budget", msg: "Budget burn rate exceeds progress rate — overrun trending." });
    actions.push("Review cost drivers and identify areas for value engineering.");
  }

  // Site / Equipment risk
  if (form.siteCondition === "equipment") {
    score += 15; breakdown.Site += 15;
    risks.push({ cat: "Site", msg: "Equipment breakdown is causing productivity loss and potential schedule cascades." });
    actions.push("Source rental equipment immediately. Evaluate repair vs. replace decision.");
  }
  if (form.siteCondition === "weather") {
    score += 10; breakdown.Site += 10;
    risks.push({ cat: "Site", msg: "Weather delays are impacting outdoor work and may trigger contract extension claims." });
    actions.push("Document weather events for EOT claims. Prioritize indoor tasks during bad weather.");
  }
  if (form.siteCondition === "permit") {
    score += 12; breakdown.Site += 12;
    risks.push({ cat: "Site", msg: "Permit issues may cause work stoppages and legal exposure." });
    actions.push("Assign dedicated resource to resolve permit issues with authorities.");
  }

  score = clamp(Math.round(score), 0, 100);
  breakdown.Schedule = Math.round(clamp(breakdown.Schedule, 0, 100));
  breakdown.Budget = Math.round(clamp(breakdown.Budget, 0, 100));
  breakdown.Materials = Math.round(clamp(breakdown.Materials, 0, 100));
  breakdown.Labor = Math.round(clamp(breakdown.Labor, 0, 100));
  breakdown.Site = Math.round(clamp(breakdown.Site, 0, 100));

  if (risks.length === 0) {
    risks.push({ cat: "General", msg: "No critical risks detected. Continue monitoring all project parameters." });
    actions.push("Maintain current management approach and regular reporting cadence.");
  }

  return { score, risks, actions, breakdown };
}

function buildSummary(form, score, risks, breakdown) {
  const level = riskLevel(score);
  const topRisk = Object.entries(breakdown).sort((a, b) => b[1] - a[1])[0];
  const progressN = Number(form.progress) || 0;
  const budgetPct = Math.round((Number(form.currentSpending) || 0) / (Number(form.plannedBudget) || 1) * 100);

  return `Project "${form.projectName || "Unnamed"}" is currently rated as ${level} Risk with an overall score of ${score}/100. The project stands at ${progressN}% completion against a planned target, with budget consumption at ${budgetPct}%.

The primary area of concern is ${topRisk[0]} risk (score: ${topRisk[1]}), followed by ${risks.slice(0, 2).map(r => r.cat).join(" and ")} exposures. ${risks.length > 1 ? `A total of ${risks.length} risk factors have been identified that require management attention.` : ""}

${score >= 71 ? "Immediate intervention is required. Left unaddressed, current risk factors are likely to cause significant delays and cost overruns." : score >= 31 ? "Proactive mitigation is recommended. Current trends suggest emerging issues that could escalate if not managed promptly." : "The project appears to be in good health. Continue monitoring and maintain current mitigation controls to sustain this performance."}

Key recommended actions include: ${[...new Set(risks.map(r => r.cat))].map(c => `addressing ${c.toLowerCase()} vulnerabilities`).join(", ")}. Regular review cycles and stakeholder communication are essential to maintain control.`;
}

// ─── Components ───────────────────────────────────────────────────────────────

function RiskGauge({ score }) {
  const r = 80;
  const cx = 110;
  const cy = 110;
  const circumference = Math.PI * r;
  const dashoffset = circumference * (1 - score / 100);
  const color = riskColor(score);

  const angle = (score / 100) * 180 - 90;
  const rad = (angle * Math.PI) / 180;
  const needleX = cx + r * 0.75 * Math.cos(rad);
  const needleY = cy + r * 0.75 * Math.sin(rad);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg width="220" height="130" viewBox="0 0 220 130">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22C55E" />
            <stop offset="45%" stopColor="#EAB308" />
            <stop offset="100%" stopColor="#EF4444" />
          </linearGradient>
        </defs>
        {/* Track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="#1E3A5F" strokeWidth="16" strokeLinecap="round"
        />
        {/* Fill */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
        {/* Needle */}
        <line
          x1={cx} y1={cy}
          x2={needleX} y2={needleY}
          stroke={color} strokeWidth="3" strokeLinecap="round"
          style={{ transition: "all 1s ease" }}
        />
        <circle cx={cx} cy={cy} r="6" fill={color} />
        {/* Labels */}
        <text x={cx - r - 4} y={cy + 20} fill="#64748B" fontSize="10" textAnchor="middle">0</text>
        <text x={cx} y={cy - r - 8} fill="#64748B" fontSize="10" textAnchor="middle">50</text>
        <text x={cx + r + 4} y={cy + 20} fill="#64748B" fontSize="10" textAnchor="middle">100</text>
        {/* Score */}
        <text x={cx} y={cy + 16} fill={color} fontSize="28" fontWeight="800" textAnchor="middle"
          style={{ fontFamily: "'Space Mono', monospace" }}>
          {score}
        </text>
        <text x={cx} y={cy + 30} fill="#94A3B8" fontSize="10" textAnchor="middle">/ 100</text>
      </svg>
      <span style={{
        padding: "4px 16px", borderRadius: 20,
        background: riskBg(score), color: riskColor(score),
        fontWeight: 700, fontSize: 13, letterSpacing: 1
      }}>{riskLevel(score).toUpperCase()} RISK</span>
    </div>
  );
}

function BarChart({ breakdown }) {
  const entries = Object.entries(breakdown);
  const colors = { Schedule: "#F97316", Budget: "#EF4444", Materials: "#EAB308", Labor: "#3B82F6", Site: "#8B5CF6" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {entries.map(([cat, val]) => (
        <div key={cat}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ color: "#94A3B8", fontSize: 12, fontWeight: 600 }}>{cat}</span>
            <span style={{ color: colors[cat], fontSize: 12, fontWeight: 700 }}>{val}</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: "#0F172A", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 4,
              background: colors[cat],
              width: `${val}%`,
              transition: "width 1s ease",
              boxShadow: `0 0 8px ${colors[cat]}80`
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ProgressBar({ value, expected }) {
  const actual = clamp(Number(value) || 0, 0, 100);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ color: "#94A3B8", fontSize: 12 }}>Actual Progress</span>
        <span style={{ color: "#22C55E", fontSize: 12, fontWeight: 700 }}>{actual}%</span>
      </div>
      <div style={{ position: "relative", height: 12, borderRadius: 6, background: "#0F172A", overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 6, background: "linear-gradient(90deg,#22C55E,#86EFAC)", width: `${actual}%`, transition: "width 1s ease" }} />
        {expected && (
          <div style={{
            position: "absolute", top: 0, bottom: 0, width: 2, background: "#F97316",
            left: `${clamp(Number(expected), 0, 100)}%`
          }} />
        )}
      </div>
      {expected && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
          <span style={{ color: "#F97316", fontSize: 11 }}>Expected: {expected}%</span>
        </div>
      )}
    </div>
  );
}

const CARD_STYLE = {
  background: "#1E293B",
  border: "1px solid #334155",
  borderRadius: 16,
  padding: "20px 24px",
};

const INPUT_STYLE = {
  width: "100%", background: "#0F172A", border: "1px solid #334155",
  borderRadius: 8, padding: "10px 14px", color: "#E2E8F0", fontSize: 14,
  outline: "none", boxSizing: "border-box",
  fontFamily: "inherit",
};

const SELECT_STYLE = { ...INPUT_STYLE, cursor: "pointer" };

function Field({ label, children, col }) {
  return (
    <div style={{ gridColumn: col || "span 1" }}>
      <label style={{ display: "block", color: "#94A3B8", fontSize: 12, fontWeight: 600, marginBottom: 6, letterSpacing: 0.5 }}>
        {label.toUpperCase()}
      </label>
      {children}
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div style={CARD_STYLE}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, paddingBottom: 14, borderBottom: "1px solid #334155" }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 16 }}>{title}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {children}
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ analyses, onNew }) {
  const total = analyses.length;
  const high = analyses.filter(a => a.result.score > 70).length;
  const med = analyses.filter(a => a.result.score > 30 && a.result.score <= 70).length;
  const low = analyses.filter(a => a.result.score <= 30).length;

  const stats = [
    { label: "Total Projects", value: total, color: "#F97316", icon: "🏗️" },
    { label: "High Risk", value: high, color: "#EF4444", icon: "🚨" },
    { label: "Medium Risk", value: med, color: "#EAB308", icon: "⚠️" },
    { label: "Low Risk", value: low, color: "#22C55E", icon: "✅" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        {stats.map(s => (
          <div key={s.label} style={{
            ...CARD_STYLE,
            borderTop: `3px solid ${s.color}`,
            display: "flex", alignItems: "center", gap: 16,
          }}>
            <span style={{ fontSize: 28 }}>{s.icon}</span>
            <div>
              <div style={{ color: s.color, fontSize: 28, fontWeight: 800, lineHeight: 1, fontFamily: "'Space Mono', monospace" }}>{s.value}</div>
              <div style={{ color: "#64748B", fontSize: 12, marginTop: 4 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Analyses */}
      <div style={CARD_STYLE}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 16 }}>📋 Recent Analyses</span>
          <button onClick={onNew} style={{
            background: "#F97316", border: "none", color: "#fff",
            padding: "8px 20px", borderRadius: 8, cursor: "pointer",
            fontWeight: 700, fontSize: 13
          }}>+ New Analysis</button>
        </div>
        {analyses.length === 0 ? (
          <div style={{ textAlign: "center", color: "#475569", padding: "40px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏗️</div>
            <div style={{ fontSize: 15 }}>No analyses yet. Start by analyzing a project.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[...analyses].reverse().map((a, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 16,
                padding: "14px 16px", borderRadius: 10, background: "#0F172A",
                border: "1px solid #334155"
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: riskBg(a.result.score),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0
                }}>
                  <span style={{ color: riskColor(a.result.score), fontWeight: 800, fontSize: 15, fontFamily: "'Space Mono', monospace" }}>
                    {a.result.score}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#F1F5F9", fontWeight: 600, fontSize: 14 }}>{a.form.projectName || "Unnamed Project"}</div>
                  <div style={{ color: "#64748B", fontSize: 12, marginTop: 2 }}>{a.form.projectType} · {formatDate(a.timestamp)}</div>
                </div>
                <span style={{
                  padding: "3px 12px", borderRadius: 20,
                  background: riskBg(a.result.score), color: riskColor(a.result.score),
                  fontWeight: 700, fontSize: 11
                }}>{riskLevel(a.result.score).toUpperCase()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Analysis Results ─────────────────────────────────────────────────────────
function Results({ form, result, onBack, onSave }) {
  const { score, risks, actions, breakdown } = result;
  const summary = buildSummary(form, score, risks, breakdown);
  const color = riskColor(score);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ ...CARD_STYLE, borderLeft: `4px solid ${color}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: "#94A3B8", fontSize: 13, marginBottom: 4 }}>Risk Analysis Complete</div>
          <div style={{ color: "#F1F5F9", fontSize: 22, fontWeight: 800 }}>{form.projectName || "Unnamed Project"}</div>
          <div style={{ color: "#64748B", fontSize: 13, marginTop: 2 }}>{form.projectType} · Analyzed {formatDate(new Date())}</div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onSave} style={{
            background: "#F97316", border: "none", color: "#fff",
            padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13
          }}>💾 Save to Dashboard</button>
          <button onClick={onBack} style={{
            background: "transparent", border: "1px solid #334155", color: "#94A3B8",
            padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13
          }}>← Back</button>
        </div>
      </div>

      {/* Score + Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
        <div style={{ ...CARD_STYLE, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ color: "#94A3B8", fontSize: 12, fontWeight: 600, letterSpacing: 0.5 }}>OVERALL RISK SCORE</div>
          <RiskGauge score={score} />
        </div>
        <div style={CARD_STYLE}>
          <div style={{ color: "#94A3B8", fontSize: 12, fontWeight: 600, letterSpacing: 0.5, marginBottom: 16 }}>RISK BREAKDOWN</div>
          <BarChart breakdown={breakdown} />
        </div>
        <div style={CARD_STYLE}>
          <div style={{ color: "#94A3B8", fontSize: 12, fontWeight: 600, letterSpacing: 0.5, marginBottom: 16 }}>TIMELINE HEALTH</div>
          <ProgressBar value={form.progress} expected={70} />
          <div style={{ marginTop: 20 }}>
            <div style={{ color: "#94A3B8", fontSize: 12, marginBottom: 8 }}>PROJECT DETAILS</div>
            {[
              ["Type", form.projectType],
              ["Completion", form.completionDate ? formatDate(form.completionDate) : "—"],
              ["Days Behind", form.daysBehind || "0"],
              ["Labor Ratio", `${form.workersAvailable || 0}/${form.workersRequired || 0}`],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #1E3A5F" }}>
                <span style={{ color: "#64748B", fontSize: 12 }}>{k}</span>
                <span style={{ color: "#E2E8F0", fontSize: 12, fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Risks + Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={CARD_STYLE}>
          <div style={{ color: "#94A3B8", fontSize: 12, fontWeight: 600, letterSpacing: 0.5, marginBottom: 16 }}>🚨 IDENTIFIED RISKS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {risks.map((r, i) => {
              const catColors = { Schedule: "#F97316", Budget: "#EF4444", Materials: "#EAB308", Labor: "#3B82F6", Site: "#8B5CF6", General: "#22C55E" };
              const c = catColors[r.cat] || "#F97316";
              return (
                <div key={i} style={{ padding: "12px 14px", borderRadius: 8, background: "#0F172A", borderLeft: `3px solid ${c}` }}>
                  <span style={{ color: c, fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>{r.cat.toUpperCase()}</span>
                  <div style={{ color: "#CBD5E1", fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>{r.msg}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={CARD_STYLE}>
          <div style={{ color: "#94A3B8", fontSize: 12, fontWeight: 600, letterSpacing: 0.5, marginBottom: 16 }}>✅ RECOMMENDED ACTIONS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {actions.map((a, i) => (
              <div key={i} style={{ padding: "12px 14px", borderRadius: 8, background: "#0F172A", display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ color: "#F97316", fontWeight: 800, flexShrink: 0, marginTop: 1 }}>{i + 1}.</span>
                <span style={{ color: "#CBD5E1", fontSize: 13, lineHeight: 1.5 }}>{a}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div style={{ ...CARD_STYLE, borderTop: `3px solid #F97316` }}>
        <div style={{ color: "#94A3B8", fontSize: 12, fontWeight: 600, letterSpacing: 0.5, marginBottom: 14 }}>📄 EXECUTIVE SUMMARY</div>
        <p style={{ color: "#CBD5E1", fontSize: 14, lineHeight: 1.8, margin: 0 }}>{summary}</p>
      </div>
    </div>
  );
}

// ─── Risk Form ────────────────────────────────────────────────────────────────
const INITIAL_FORM = {
  projectName: "", projectType: "Commercial Building", location: "",
  progress: "", completionDate: "", daysBehind: "",
  cementStatus: "available", steelStatus: "available",
  electricalStatus: "available", plumbingStatus: "available",
  laborStatus: "full", workersRequired: "", workersAvailable: "",
  plannedBudget: "", currentSpending: "",
  siteCondition: "normal", notes: "",
};

function RiskForm({ onResult }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.projectName) { alert("Please enter a project name."); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    const result = analyzeRisks(form);
    setLoading(false);
    onResult(form, result);
  };

  const matOptions = [["available", "Available"], ["delayed", "Delayed"], ["critical", "Critical Shortage"]];
  const laborOptions = [["full", "Fully Available"], ["partial", "Partially Available"], ["critical", "Critical Shortage"]];
  const siteOptions = [["normal", "Normal"], ["weather", "Weather Delays"], ["permit", "Permit Issues"], ["equipment", "Equipment Breakdown"]];
  const projectTypes = ["Commercial Building", "Residential Complex", "Infrastructure", "Industrial Facility", "Road & Highway", "Bridge", "Renovation", "Other"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ ...CARD_STYLE, borderLeft: "4px solid #F97316" }}>
        <div style={{ color: "#F1F5F9", fontSize: 20, fontWeight: 800 }}>🔍 New Risk Analysis</div>
        <div style={{ color: "#64748B", fontSize: 13, marginTop: 4 }}>Fill in project details to generate an AI-powered risk assessment</div>
      </div>

      {/* Project Info */}
      <Section title="Project Information" icon="🏗️">
        <Field label="Project Name" col="span 2">
          <input style={INPUT_STYLE} value={form.projectName} onChange={set("projectName")} placeholder="e.g. Downtown Office Complex Phase 2" />
        </Field>
        <Field label="Project Type">
          <select style={SELECT_STYLE} value={form.projectType} onChange={set("projectType")}>
            {projectTypes.map(t => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Location">
          <input style={INPUT_STYLE} value={form.location} onChange={set("location")} placeholder="City, Country" />
        </Field>
      </Section>

      {/* Schedule */}
      <Section title="Schedule" icon="📅">
        <Field label="Current Progress (%)">
          <input style={INPUT_STYLE} type="number" min="0" max="100" value={form.progress} onChange={set("progress")} placeholder="0–100" />
        </Field>
        <Field label="Expected Completion Date">
          <input style={INPUT_STYLE} type="date" value={form.completionDate} onChange={set("completionDate")} />
        </Field>
        <Field label="Days Behind Schedule">
          <input style={INPUT_STYLE} type="number" min="0" value={form.daysBehind} onChange={set("daysBehind")} placeholder="0" />
        </Field>
      </Section>

      {/* Materials */}
      <Section title="Materials" icon="🧱">
        {[["cementStatus", "Cement"], ["steelStatus", "Steel"], ["electricalStatus", "Electrical Materials"], ["plumbingStatus", "Plumbing Materials"]].map(([k, label]) => (
          <Field key={k} label={label}>
            <select style={SELECT_STYLE} value={form[k]} onChange={set(k)}>
              {matOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
        ))}
      </Section>

      {/* Labor */}
      <Section title="Labor" icon="👷">
        <Field label="Labor Availability">
          <select style={SELECT_STYLE} value={form.laborStatus} onChange={set("laborStatus")}>
            {laborOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <div />
        <Field label="Workers Required">
          <input style={INPUT_STYLE} type="number" min="0" value={form.workersRequired} onChange={set("workersRequired")} placeholder="e.g. 120" />
        </Field>
        <Field label="Workers Available">
          <input style={INPUT_STYLE} type="number" min="0" value={form.workersAvailable} onChange={set("workersAvailable")} placeholder="e.g. 85" />
        </Field>
      </Section>

      {/* Budget */}
      <Section title="Budget" icon="💰">
        <Field label="Planned Budget ($)">
          <input style={INPUT_STYLE} type="number" min="0" value={form.plannedBudget} onChange={set("plannedBudget")} placeholder="e.g. 5000000" />
        </Field>
        <Field label="Current Spending ($)">
          <input style={INPUT_STYLE} type="number" min="0" value={form.currentSpending} onChange={set("currentSpending")} placeholder="e.g. 4200000" />
        </Field>
      </Section>

      {/* Site */}
      <Section title="Site Conditions & Notes" icon="🚧">
        <Field label="Site Condition">
          <select style={SELECT_STYLE} value={form.siteCondition} onChange={set("siteCondition")}>
            {siteOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <div />
        <Field label="Additional Notes" col="span 2">
          <textarea style={{ ...INPUT_STYLE, height: 80, resize: "vertical" }} value={form.notes} onChange={set("notes")} placeholder="Any additional context, issues, or concerns..." />
        </Field>
      </Section>

      {/* Submit */}
      <button onClick={handleSubmit} disabled={loading} style={{
        background: loading ? "#7C3AED" : "linear-gradient(135deg,#F97316,#EA580C)",
        border: "none", color: "#fff", padding: "16px 32px",
        borderRadius: 12, cursor: loading ? "not-allowed" : "pointer",
        fontWeight: 800, fontSize: 16, letterSpacing: 0.5,
        boxShadow: "0 4px 24px rgba(249,115,22,0.4)",
        transition: "all 0.2s",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10
      }}>
        {loading ? (
          <>
            <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⚙️</span>
            Analyzing Risks...
          </>
        ) : "🔍 Analyze Project Risk"}
      </button>
    </div>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("dashboard"); // dashboard | form | result
  const [analyses, setAnalyses] = useState(() => {
    try { return JSON.parse(localStorage.getItem("risk_analyses") || "[]"); } catch { return []; }
  });
  const [pendingResult, setPendingResult] = useState(null);

  const save = (analyses) => {
    setAnalyses(analyses);
    try { localStorage.setItem("risk_analyses", JSON.stringify(analyses)); } catch {}
  };

  const handleResult = (form, result) => {
    setPendingResult({ form, result });
    setPage("result");
  };

  const handleSave = () => {
    const updated = [...analyses, { form: pendingResult.form, result: pendingResult.result, timestamp: new Date().toISOString() }];
    save(updated);
    setPage("dashboard");
  };

  const NAV = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "form", label: "New Analysis", icon: "🔍" },
  ];

  return (
    <div style={{
      minHeight: "100vh", background: "#0F172A",
      fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
      color: "#E2E8F0"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.5); }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #0F172A; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        button:hover { opacity: 0.92; }
        select option { background: #1E293B; }
      `}</style>

      {/* Sidebar */}
      <div style={{
        position: "fixed", top: 0, left: 0, bottom: 0, width: 220,
        background: "#111827", borderRight: "1px solid #1E293B",
        display: "flex", flexDirection: "column", zIndex: 100
      }}>
        {/* Logo */}
        <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid #1E293B" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#F97316,#EA580C)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏗️</div>
            <div>
              <div style={{ color: "#F1F5F9", fontWeight: 800, fontSize: 13, lineHeight: 1 }}>RISKWISE</div>
              <div style={{ color: "#475569", fontSize: 10, marginTop: 2 }}>Construction AI</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: "16px 12px", flex: 1 }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 8, border: "none",
              background: page === n.id ? "rgba(249,115,22,0.15)" : "transparent",
              color: page === n.id ? "#F97316" : "#64748B",
              cursor: "pointer", fontWeight: page === n.id ? 700 : 500,
              fontSize: 14, marginBottom: 4, transition: "all 0.15s",
              textAlign: "left"
            }}>
              <span>{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid #1E293B" }}>
          <div style={{ color: "#334155", fontSize: 11 }}>
            <div style={{ color: "#475569", fontWeight: 600 }}>RiskWise v1.0</div>
            <div style={{ marginTop: 2 }}>{analyses.length} project{analyses.length !== 1 ? "s" : ""} analyzed</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ marginLeft: 220, padding: "32px 36px", maxWidth: 1200 }}>
        {/* Page Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ color: "#F1F5F9", fontSize: 24, fontWeight: 800, margin: 0 }}>
            {page === "dashboard" ? "Project Dashboard" : page === "form" ? "Risk Analysis" : "Analysis Results"}
          </h1>
          <p style={{ color: "#475569", fontSize: 14, margin: "4px 0 0" }}>
            {page === "dashboard" ? "Overview of all project risk assessments" : page === "form" ? "Enter project details to generate an AI risk report" : `${pendingResult?.form?.projectName || "Project"} · Risk Report`}
          </p>
        </div>

        {page === "dashboard" && <Dashboard analyses={analyses} onNew={() => setPage("form")} />}
        {page === "form" && <RiskForm onResult={handleResult} />}
        {page === "result" && pendingResult && (
          <Results
            form={pendingResult.form}
            result={pendingResult.result}
            onBack={() => setPage("form")}
            onSave={handleSave}
          />
        )}
      </div>
    </div>
  );
}
