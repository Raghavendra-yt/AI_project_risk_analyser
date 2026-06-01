import React from "react";
import RiskGauge, { riskColor, riskBg, riskLevel } from "./RiskGauge";

export default function Results({
  project,
  onBack,
  onSave,
  isPendingSave
}) {
  const { form, result, timestamp } = project;
  const { score, risks, actions, breakdown } = result;

  const color = riskColor(score);

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric"
    });
  };

  const daysUntil = (d) => {
    if (!d) return 0;
    return Math.ceil((new Date(d) - new Date()) / 86400000);
  };

  const getExpectedProgress = () => {
    return 70; // Simulated expected baseline progress threshold
  };

  const handlePrint = () => {
    window.print();
  };

  const catColors = {
    Schedule: "#F97316",
    Budget: "#EF4444",
    Materials: "#EAB308",
    Labor: "#3B82F6",
    Site: "#8B5CF6",
    General: "#10B981"
  };

  // Re-compute detailed narrative summary locally if it's missing (should already be passed, but good fallback)
  const summaryText = result.summary || `Project "${form.projectName || "Unnamed"}" is currently rated as ${riskLevel(score)} Risk with an overall score of ${score}/100. The project stands at ${form.progress || 0}% completion against a planned target, with budget consumption at ${Math.round((Number(form.currentSpending) || 0) / (Number(form.plannedBudget) || 1) * 100)}%. Immediate reviews of active Schedule, Budget, and Material constraints are recommended.`;

  return (
    <div className="results-container animate-fade-in">
      {/* Header Info Block */}
      <div
        className="results-header-card card-bg"
        style={{ borderLeft: `6px solid ${color}` }}
      >
        <div className="results-header-info">
          <span className="results-label-badge" style={{ color: color, background: riskBg(score) }}>
            CONSTRUCTION AI AUDIT REPORT
          </span>
          <h2 className="results-project-name">{form.projectName || "Unnamed Project"}</h2>
          <div className="results-project-meta">
            <span>{form.projectType}</span>
            {form.location && <span className="meta-divider">·</span>}
            {form.location && <span>📍 {form.location}</span>}
            <span className="meta-divider">·</span>
            <span>Analyzed {formatDate(timestamp || new Date())}</span>
          </div>
        </div>

        {/* Header Button Actions */}
        <div className="results-header-actions hide-on-print">
          {isPendingSave ? (
            <button onClick={onSave} className="results-btn-save button-glow">
              💾 Save to Dashboard
            </button>
          ) : (
            <span className="status-saved-badge">✓ Database Persisted</span>
          )}
          
          <button onClick={handlePrint} className="results-btn-print">
            🖨️ Export PDF / Print
          </button>
          
          <button onClick={onBack} className="results-btn-back">
            ← Dashboard
          </button>
        </div>
      </div>

      {/* Grid: Charts & Breakdown */}
      <div className="results-charts-grid">
        
        {/* Card 1: Score Gauge */}
        <div className="results-chart-card card-bg flex-center">
          <h3 className="chart-card-title">OVERALL RISK FOOTPRINT</h3>
          <div className="results-gauge-box">
            <RiskGauge score={score} />
          </div>
        </div>

        {/* Card 2: Bar Breakdown */}
        <div className="results-chart-card card-bg">
          <h3 className="chart-card-title">RISK FACTOR BREAKDOWN</h3>
          <div className="bar-charts-list">
            {Object.entries(breakdown).map(([cat, val]) => (
              <div key={cat} className="bar-item">
                <div className="bar-label-row">
                  <span className="bar-cat-name">{cat}</span>
                  <span className="bar-cat-value" style={{ color: catColors[cat] }}>
                    {val} / 100
                  </span>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${val}%`,
                      background: catColors[cat],
                      boxShadow: `0 0 10px ${catColors[cat]}50`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Timeline & Core Stats */}
        <div className="results-chart-card card-bg">
          <h3 className="chart-card-title">PROJECT METRICS PROFILE</h3>
          
          {/* Actual vs Expected Progress */}
          <div className="progress-benchmark-box">
            <div className="progress-label-row">
              <span className="p-label">Actual Progress</span>
              <span className="p-val-actual">{form.progress || 0}%</span>
            </div>
            
            <div className="benchmark-bar-container">
              {/* Actual progress track */}
              <div className="benchmark-bar-track">
                <div
                  className="benchmark-bar-fill"
                  style={{ width: `${Math.min(Number(form.progress) || 0, 100)}%` }}
                />
                
                {/* Expected progress marker pin */}
                <div
                  className="benchmark-expected-pin"
                  style={{ left: `${getExpectedProgress()}%` }}
                  title={`Expected Baseline: ${getExpectedProgress()}%`}
                />
              </div>
            </div>

            <div className="progress-benchmarks-legend">
              <span className="legend-expected">Expected Target: {getExpectedProgress()}%</span>
            </div>
          </div>

          {/* Quick specs list */}
          <div className="quick-specs-profile">
            {[
              ["Target Completion Date", form.completionDate ? formatDate(form.completionDate) : "—"],
              ["Days remaining to deadline", form.completionDate ? `${daysUntil(form.completionDate)} Days` : "—"],
              ["Days Behind baseline schedule", `${form.daysBehind || 0} Days`],
              ["Active Labor Supply ratio", `${form.workersAvailable || 0} avail / ${form.workersRequired || 0} req`],
              ["Site Environmental Status", form.siteCondition ? form.siteCondition.toUpperCase() : "NORMAL"]
            ].map(([label, val]) => (
              <div key={label} className="spec-profile-row">
                <span className="spec-p-label">{label}</span>
                <span className="spec-p-value">{val}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Grid: Threats & Mitigations side-by-side */}
      <div className="results-risks-mitigations-grid">
        
        {/* Left: Identified Threats list */}
        <div className="threats-mitigations-card card-bg">
          <div className="card-header-styled">
            <span className="title-emoji">🚨</span>
            <h3 className="card-sub-title">Active Risk Threats ({risks.length})</h3>
          </div>
          
          <div className="threats-list-box">
            {risks.map((r, i) => {
              const borderCol = catColors[r.cat] || "#F97316";
              return (
                <div
                  key={i}
                  className="threat-item-card"
                  style={{ borderLeft: `4px solid ${borderCol}` }}
                >
                  <span className="threat-category" style={{ color: borderCol }}>
                    {r.cat.toUpperCase()} RISK
                  </span>
                  <p className="threat-message">{r.msg}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Mitigations Action Plan */}
        <div className="threats-mitigations-card card-bg">
          <div className="card-header-styled">
            <span className="title-emoji">✅</span>
            <h3 className="card-sub-title">AI-Recommended Mitigation Action Plan</h3>
          </div>

          <div className="actions-list-box">
            {actions.map((a, i) => (
              <div key={i} className="action-plan-item">
                <span className="action-step-num">{i + 1}</span>
                <p className="action-step-text">{a}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Card: Executive narrative report summary */}
      <div className="executive-report-narrative-card card-bg border-glow-orange">
        <div className="narrative-header">
          <span className="narrative-icon">📄</span>
          <h3 className="narrative-title">EXECUTIVE AI AUDIT SUMMARY NARRATIVE</h3>
        </div>
        <p className="narrative-text">{summaryText}</p>
      </div>
    </div>
  );
}
