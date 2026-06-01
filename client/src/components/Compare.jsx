import React from "react";
import RiskGauge, { riskColor, riskBg, riskLevel } from "./RiskGauge";

export default function Compare({ projectA, projectB, onBack }) {
  if (!projectA || !projectB) {
    return (
      <div className="compare-container card-bg animate-fade-in" style={{ padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
        <h3>Select two projects to compare</h3>
        <button onClick={onBack} className="new-analysis-btn" style={{ marginTop: 16 }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const pA = projectA;
  const pB = projectB;

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getLaborRatio = (form) => {
    const req = Number(form.workersRequired) || 1;
    const avail = Number(form.workersAvailable) || 0;
    return Math.round((avail / req) * 100);
  };

  const getBudgetRatio = (form) => {
    const planned = Number(form.plannedBudget) || 1;
    const spent = Number(form.currentSpending) || 0;
    return Math.round((spent / planned) * 100);
  };

  // Compare categories side-by-side helper
  const categories = ["Schedule", "Budget", "Materials", "Labor", "Site"];
  const catColors = { Schedule: "#F97316", Budget: "#EF4444", Materials: "#EAB308", Labor: "#3B82F6", Site: "#8B5CF6" };

  return (
    <div className="compare-container animate-fade-in">
      {/* Header */}
      <div className="compare-header card-bg">
        <div>
          <span className="compare-header-label">⚖️ SIDE-BY-SIDE EVALUATION</span>
          <h2 className="compare-title">Comparing Project Risk Footprints</h2>
        </div>
        <button onClick={onBack} className="compare-back-btn">
          ← Back to Dashboard
        </button>
      </div>

      {/* Main Grid Comparison */}
      <div className="compare-grid">
        
        {/* Core Project Cards Row */}
        <div className="compare-sides-container">
          
          {/* Project A Column */}
          <div className="compare-side-column card-bg border-glow-orange">
            <div className="side-badge-label bg-orange-text">PROJECT ALPHA</div>
            <h3 className="compare-project-name">{pA.form.projectName || "Unnamed Project A"}</h3>
            <p className="compare-project-meta">{pA.form.projectType} · {pA.form.location || "Unknown Location"}</p>
            <div className="compare-gauge-wrapper">
              <RiskGauge score={pA.result.score} />
            </div>
          </div>

          {/* Project B Column */}
          <div className="compare-side-column card-bg border-glow-blue">
            <div className="side-badge-label bg-blue-text">PROJECT BETA</div>
            <h3 className="compare-project-name">{pB.form.projectName || "Unnamed Project B"}</h3>
            <p className="compare-project-meta">{pB.form.projectType} · {pB.form.location || "Unknown Location"}</p>
            <div className="compare-gauge-wrapper">
              <RiskGauge score={pB.result.score} />
            </div>
          </div>

        </div>

        {/* Breakdown Sub-scores compared */}
        <div className="compare-section card-bg">
          <h3 className="compare-section-title">🔍 Categorical Vulnerability Breakdown</h3>
          <div className="compare-factors-table">
            <div className="table-header-row">
              <div className="table-col-label">Vulnerability Category</div>
              <div className="table-col-project-a text-orange">{pA.form.projectName}</div>
              <div className="table-col-project-b text-blue">{pB.form.projectName}</div>
            </div>
            
            {categories.map(cat => {
              const valA = pA.result.breakdown[cat] || 0;
              const valB = pB.result.breakdown[cat] || 0;
              const diff = valA - valB;
              
              return (
                <div key={cat} className="table-data-row">
                  <div className="table-col-label font-bold" style={{ color: catColors[cat] }}>{cat}</div>
                  
                  {/* Project A score and mini bar */}
                  <div className="table-col-project-a">
                    <div className="compare-subscore-row">
                      <span className="subscore-num">{valA}</span>
                      <div className="mini-progress-track">
                        <div className="mini-progress-fill" style={{ width: `${valA}%`, background: catColors[cat] }} />
                      </div>
                    </div>
                  </div>

                  {/* Project B score and mini bar */}
                  <div className="table-col-project-b">
                    <div className="compare-subscore-row">
                      <span className="subscore-num">{valB}</span>
                      <div className="mini-progress-track">
                        <div className="mini-progress-fill" style={{ width: `${valB}%`, background: catColors[cat] }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quantitative Metrics Side-by-side */}
        <div className="compare-sides-container" style={{ gap: 20 }}>
          
          {/* Key Parameters Project A */}
          <div className="compare-side-column card-bg">
            <h4 className="card-sub-title text-orange">🔑 Key Metrics Profile</h4>
            <div className="compare-metrics-list">
              <div className="metric-row">
                <span className="metric-label">Actual Progress</span>
                <span className="metric-value font-bold" style={{ color: "#10B981" }}>{pA.form.progress}%</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Timeline Status</span>
                <span className="metric-value font-bold" style={{ color: Number(pA.form.daysBehind) > 0 ? "#EF4444" : "#10B981" }}>
                  {pA.form.daysBehind ? `${pA.form.daysBehind} Days Behind` : "On Schedule"}
                </span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Labor Supply Ratio</span>
                <span className="metric-value font-bold">
                  {getLaborRatio(pA.form)}% ({pA.form.workersAvailable || 0}/{pA.form.workersRequired || 0})
                </span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Budget Consumption</span>
                <span className="metric-value font-bold" style={{ color: getBudgetRatio(pA.form) > 90 ? "#EF4444" : "#E2E8F0" }}>
                  {getBudgetRatio(pA.form)}% (${pA.form.currentSpending || 0}/${pA.form.plannedBudget || 0})
                </span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Site Operations</span>
                <span className="metric-value text-capitalize">{pA.form.siteCondition}</span>
              </div>
            </div>
          </div>

          {/* Key Parameters Project B */}
          <div className="compare-side-column card-bg">
            <h4 className="card-sub-title text-blue">🔑 Key Metrics Profile</h4>
            <div className="compare-metrics-list">
              <div className="metric-row">
                <span className="metric-label">Actual Progress</span>
                <span className="metric-value font-bold" style={{ color: "#10B981" }}>{pB.form.progress}%</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Timeline Status</span>
                <span className="metric-value font-bold" style={{ color: Number(pB.form.daysBehind) > 0 ? "#EF4444" : "#10B981" }}>
                  {pB.form.daysBehind ? `${pB.form.daysBehind} Days Behind` : "On Schedule"}
                </span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Labor Supply Ratio</span>
                <span className="metric-value font-bold">
                  {getLaborRatio(pB.form)}% ({pB.form.workersAvailable || 0}/{pB.form.workersRequired || 0})
                </span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Budget Consumption</span>
                <span className="metric-value font-bold" style={{ color: getBudgetRatio(pB.form) > 90 ? "#EF4444" : "#E2E8F0" }}>
                  {getBudgetRatio(pB.form)}% (${pB.form.currentSpending || 0}/${pB.form.plannedBudget || 0})
                </span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Site Operations</span>
                <span className="metric-value text-capitalize">{pB.form.siteCondition}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Identified Threat Comparison */}
        <div className="compare-sides-container" style={{ gap: 20 }}>
          
          {/* Threats Project A */}
          <div className="compare-side-column card-bg">
            <h4 className="card-sub-title font-bold text-orange">🚨 Active Threats ({pA.result.risks.length})</h4>
            <div className="compare-threat-cards-list">
              {pA.result.risks.map((r, i) => (
                <div key={i} className="mini-threat-card" style={{ borderLeft: `3px solid ${catColors[r.cat] || "#F97316"}` }}>
                  <span className="mini-threat-cat" style={{ color: catColors[r.cat] }}>{r.cat.toUpperCase()}</span>
                  <div className="mini-threat-msg">{r.msg}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Threats Project B */}
          <div className="compare-side-column card-bg">
            <h4 className="card-sub-title font-bold text-blue">🚨 Active Threats ({pB.result.risks.length})</h4>
            <div className="compare-threat-cards-list">
              {pB.result.risks.map((r, i) => (
                <div key={i} className="mini-threat-card" style={{ borderLeft: `3px solid ${catColors[r.cat] || "#3B82F6"}` }}>
                  <span className="mini-threat-cat" style={{ color: catColors[r.cat] }}>{r.cat.toUpperCase()}</span>
                  <div className="mini-threat-msg">{r.msg}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
