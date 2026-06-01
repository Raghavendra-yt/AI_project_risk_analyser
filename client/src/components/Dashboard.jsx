import React, { useState } from "react";
import { riskColor, riskBg, riskLevel } from "./RiskGauge";

export default function Dashboard({
  analyses,
  onNew,
  onView,
  onEdit,
  onDelete,
  onCompare
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [sortBy, setSortBy] = useState("latest");
  const [selectedForCompare, setSelectedForCompare] = useState([]);

  // Calculate high-level stats
  const total = analyses.length;
  const high = analyses.filter((a) => a.result.score > 70).length;
  const med = analyses.filter((a) => a.result.score > 30 && a.result.score <= 70).length;
  const low = analyses.filter((a) => a.result.score <= 30).length;

  const stats = [
    { label: "Total Projects", value: total, color: "#3B82F6", icon: "🏗️" },
    { label: "High Risk", value: high, color: "#EF4444", icon: "🚨" },
    { label: "Medium Risk", value: med, color: "#F59E0B", icon: "⚠️" },
    { label: "Low Risk", value: low, color: "#10B981", icon: "✅" }
  ];

  const projectTypes = [
    "All",
    "Commercial Building",
    "Residential Complex",
    "Infrastructure",
    "Industrial Facility",
    "Road & Highway",
    "Bridge",
    "Renovation",
    "Other"
  ];

  const handleSelectCompare = (id) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      } else {
        if (prev.length >= 2) {
          // Limit to max 2 projects
          alert("You can select up to 2 projects to compare side-by-side.");
          return prev;
        }
        return [...prev, id];
      }
    });
  };

  // Filter & Search logic
  let filtered = analyses.filter((a) => {
    const matchesSearch =
      (a.form.projectName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.form.location || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "All" || a.form.projectType === filterType;
    return matchesSearch && matchesType;
  });

  // Sorting logic
  filtered.sort((a, b) => {
    if (sortBy === "latest") {
      return new Date(b.timestamp) - new Date(a.timestamp);
    }
    if (sortBy === "oldest") {
      return new Date(a.timestamp) - new Date(b.timestamp);
    }
    if (sortBy === "risk-desc") {
      return b.result.score - a.result.score;
    }
    if (sortBy === "risk-asc") {
      return a.result.score - b.result.score;
    }
    return 0;
  });

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  return (
    <div className="dashboard-container animate-fade-in">
      {/* Stat Cards */}
      <div className="stats-grid">
        {stats.map((s) => (
          <div
            key={s.label}
            className="stat-card card-glow"
            style={{ borderTop: `4px solid ${s.color}` }}
          >
            <span className="stat-icon" style={{ textShadow: `0 0 15px ${s.color}60` }}>
              {s.icon}
            </span>
            <div className="stat-content">
              <div
                className="stat-value mono-font"
                style={{ color: s.color }}
              >
                {s.value}
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Control bar */}
      <div className="control-bar card-bg">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search by project name or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-wrapper">
          <div className="filter-item">
            <label>Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="select-input"
            >
              {projectTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label>Sort</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="select-input"
            >
              <option value="latest">Latest First</option>
              <option value="oldest">Oldest First</option>
              <option value="risk-desc">Highest Risk</option>
              <option value="risk-asc">Lowest Risk</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main List */}
      <div className="recent-analyses-card card-bg">
        <div className="card-header">
          <div className="header-title-wrapper">
            <span className="header-emoji">📋</span>
            <h2 className="card-title">Project Risk Assessments</h2>
            <span className="project-count-badge">
              {filtered.length} shown
            </span>
          </div>

          <div className="header-actions">
            {selectedForCompare.length === 2 && (
              <button
                onClick={() => onCompare(selectedForCompare[0], selectedForCompare[1])}
                className="compare-action-btn button-glow"
              >
                ⚖️ Compare Selected (2)
              </button>
            )}
            <button onClick={onNew} className="new-analysis-btn button-glow">
              ➕ New Analysis
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏗️</div>
            <h3 className="empty-title">No projects match criteria</h3>
            <p className="empty-subtitle">
              Try modifying your filters, clearing your search, or initiate a new project risk calculation.
            </p>
            <button onClick={onNew} className="new-analysis-btn" style={{ marginTop: 12 }}>
              Generate First Analysis
            </button>
          </div>
        ) : (
          <div className="projects-grid animate-slide-up">
            {filtered.map((a) => {
              const color = riskColor(a.result.score);
              const isChecked = selectedForCompare.includes(a.id);
              return (
                <div key={a.id} className="project-list-card card-hover-effect">
                  {/* Gauge indicator and core information */}
                  <div className="card-core-row">
                    <div
                      className="project-risk-indicator"
                      style={{
                        background: riskBg(a.result.score),
                        color: color,
                        border: `1.5px solid ${color}30`
                      }}
                    >
                      <span className="indicator-score mono-font">
                        {a.result.score}
                      </span>
                      <span className="indicator-label">
                        {riskLevel(a.result.score).toUpperCase()}
                      </span>
                    </div>

                    <div className="project-meta-info">
                      <h4 className="project-name-title">{a.form.projectName || "Unnamed Project"}</h4>
                      <div className="project-specs">
                        <span className="spec-tag">{a.form.projectType}</span>
                        {a.form.location && (
                          <span className="spec-tag location-tag">📍 {a.form.location}</span>
                        )}
                      </div>
                      <div className="project-date-stamp">
                        Analyzed {formatDate(a.timestamp)}
                      </div>
                    </div>

                    {/* Compare Selection Box */}
                    <div className="compare-selector-box">
                      <label className="checkbox-container">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectCompare(a.id)}
                        />
                        <span className="checkmark"></span>
                        <span className="checkbox-text">Compare</span>
                      </label>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="project-card-footer">
                    <button
                      onClick={() => onView(a.id)}
                      className="btn-action btn-view"
                    >
                      📄 View Report
                    </button>
                    <button
                      onClick={() => onEdit(a.id)}
                      className="btn-action btn-edit"
                    >
                      ✏️ Edit Inputs
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete the analysis for "${a.form.projectName}"?`)) {
                          onDelete(a.id);
                        }
                      }}
                      className="btn-action btn-delete"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
