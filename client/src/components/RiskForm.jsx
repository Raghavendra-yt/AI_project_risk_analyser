import React, { useState, useEffect } from "react";

const INITIAL_FORM = {
  projectName: "",
  projectType: "Commercial Building",
  location: "",
  progress: "",
  completionDate: "",
  daysBehind: "",
  cementStatus: "available",
  steelStatus: "available",
  electricalStatus: "available",
  plumbingStatus: "available",
  laborStatus: "full",
  workersRequired: "",
  workersAvailable: "",
  plannedBudget: "",
  currentSpending: "",
  siteCondition: "normal",
  notes: ""
};

export default function RiskForm({ project, onResult, onCancel }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("info"); // info | schedule | assets | budget

  // Pre-fill form if editing an existing project
  useEffect(() => {
    if (project) {
      setForm({
        projectName: project.form.projectName || "",
        projectType: project.form.projectType || "Commercial Building",
        location: project.form.location || "",
        progress: project.form.progress || "",
        completionDate: project.form.completionDate || "",
        daysBehind: project.form.daysBehind || "",
        cementStatus: project.form.cementStatus || "available",
        steelStatus: project.form.steelStatus || "available",
        electricalStatus: project.form.electricalStatus || "available",
        plumbingStatus: project.form.plumbingStatus || "available",
        laborStatus: project.form.laborStatus || "full",
        workersRequired: project.form.workersRequired || "",
        workersAvailable: project.form.workersAvailable || "",
        plannedBudget: project.form.plannedBudget || "",
        currentSpending: project.form.currentSpending || "",
        siteCondition: project.form.siteCondition || "normal",
        notes: project.form.notes || ""
      });
    } else {
      setForm(INITIAL_FORM);
    }
  }, [project]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.projectName.trim()) {
      alert("Please enter a valid Project Name.");
      return;
    }
    
    setLoading(true);
    // Simulate a brief AI parsing/thinking pause (feels extremely premium!)
    await new Promise((resolve) => setTimeout(resolve, 1400));
    
    onResult(form, project?.id || null);
    setLoading(false);
  };

  const matOptions = [
    ["available", "✅ Available"],
    ["delayed", "⚠️ Delayed"],
    ["critical", "🚨 Critical Shortage"]
  ];
  
  const laborOptions = [
    ["full", "👷 Fully Available"],
    ["partial", "⚠️ Partially Available"],
    ["critical", "🚨 Critical Shortage"]
  ];
  
  const siteOptions = [
    ["normal", "🟢 Normal / Excellent"],
    ["weather", "🌧️ Weather Delays"],
    ["permit", "⚖️ Permit Stoppages"],
    ["equipment", "⚙️ Equipment Breakdown"]
  ];
  
  const projectTypes = [
    "Commercial Building",
    "Residential Complex",
    "Infrastructure",
    "Industrial Facility",
    "Road & Highway",
    "Bridge",
    "Renovation",
    "Other"
  ];

  return (
    <form className="risk-form animate-fade-in" onSubmit={handleSubmit}>
      {/* Section indicator nav tab */}
      <div className="form-sections-nav card-bg">
        <button
          type="button"
          onClick={() => setActiveSection("info")}
          className={`form-nav-btn ${activeSection === "info" ? "active" : ""}`}
        >
          🏗️ 1. Project Info
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("schedule")}
          className={`form-nav-btn ${activeSection === "schedule" ? "active" : ""}`}
        >
          📅 2. Schedule & Timeline
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("assets")}
          className={`form-nav-btn ${activeSection === "assets" ? "active" : ""}`}
        >
          🧱 3. Materials & Labor
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("budget")}
          className={`form-nav-btn ${activeSection === "budget" ? "active" : ""}`}
        >
          💰 4. Budget & Site Notes
        </button>
      </div>

      {/* Dynamic Sections */}
      <div className="form-inputs-area">
        
        {/* Section 1: Info */}
        {activeSection === "info" && (
          <div className="form-card card-bg animate-slide-up">
            <div className="form-card-header">
              <span className="card-header-icon">🏢</span>
              <h3 className="form-card-title">Project Profile Information</h3>
            </div>
            
            <div className="form-grid">
              <div className="form-field span-2">
                <label className="form-label">Project Name <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="input-field"
                  required
                  placeholder="e.g. Midtown Medical Plaza Phase 4"
                  value={form.projectName}
                  onChange={set("projectName")}
                />
              </div>

              <div className="form-field">
                <label className="form-label">Project Type</label>
                <select className="select-input-styled" value={form.projectType} onChange={set("projectType")}>
                  {projectTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label className="form-label">Geographic Location</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Austin, Texas"
                  value={form.location}
                  onChange={set("location")}
                />
              </div>
            </div>

            <div className="form-card-footer-nav">
              <div />
              <button type="button" onClick={() => setActiveSection("schedule")} className="form-btn-next">
                Next: Schedule ➔
              </button>
            </div>
          </div>
        )}

        {/* Section 2: Schedule */}
        {activeSection === "schedule" && (
          <div className="form-card card-bg animate-slide-up">
            <div className="form-card-header">
              <span className="card-header-icon">📅</span>
              <h3 className="form-card-title">Timeline & Progress Reporting</h3>
            </div>
            
            <div className="form-grid">
              <div className="form-field">
                <label className="form-label">Actual Progress (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="input-field"
                  placeholder="0 - 100"
                  value={form.progress}
                  onChange={set("progress")}
                />
              </div>

              <div className="form-field">
                <label className="form-label">Expected Completion Date</label>
                <input
                  type="date"
                  className="input-field date-picker-styled"
                  value={form.completionDate}
                  onChange={set("completionDate")}
                />
              </div>

              <div className="form-field">
                <label className="form-label">Days Behind Schedule</label>
                <input
                  type="number"
                  min="0"
                  className="input-field"
                  placeholder="0 (on-time)"
                  value={form.daysBehind}
                  onChange={set("daysBehind")}
                />
              </div>
            </div>

            <div className="form-card-footer-nav">
              <button type="button" onClick={() => setActiveSection("info")} className="form-btn-back">
                ◀ Back
              </button>
              <button type="button" onClick={() => setActiveSection("assets")} className="form-btn-next">
                Next: Resources ➔
              </button>
            </div>
          </div>
        )}

        {/* Section 3: Materials & Labor */}
        {activeSection === "assets" && (
          <div className="form-card card-bg animate-slide-up">
            <div className="form-card-header">
              <span className="card-header-icon">👷</span>
              <h3 className="form-card-title">Material & Labor Inventory</h3>
            </div>
            
            <h4 className="form-sub-header">🧱 MATERIAL SUITE STATUS</h4>
            <div className="form-grid" style={{ marginBottom: 24 }}>
              {[
                ["cementStatus", "Cement Supply"],
                ["steelStatus", "Steel & Rebars"],
                ["electricalStatus", "Electrical Components"],
                ["plumbingStatus", "Plumbing Materials"]
              ].map(([k, label]) => (
                <div key={k} className="form-field">
                  <label className="form-label">{label}</label>
                  <select className="select-input-styled" value={form[k]} onChange={set(k)}>
                    {matOptions.map(([val, txt]) => (
                      <option key={val} value={val}>
                        {txt}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <h4 className="form-sub-header">👷 RESOURCE SUPPLY CAPABILITY</h4>
            <div className="form-grid">
              <div className="form-field">
                <label className="form-label">Labor Pool Availability</label>
                <select className="select-input-styled" value={form.laborStatus} onChange={set("laborStatus")}>
                  {laborOptions.map(([val, txt]) => (
                    <option key={val} value={val}>
                      {txt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label className="form-label">Workers Required (FTE)</label>
                <input
                  type="number"
                  min="0"
                  className="input-field"
                  placeholder="e.g. 150"
                  value={form.workersRequired}
                  onChange={set("workersRequired")}
                />
              </div>

              <div className="form-field">
                <label className="form-label">Workers Available (FTE)</label>
                <input
                  type="number"
                  min="0"
                  className="input-field"
                  placeholder="e.g. 110"
                  value={form.workersAvailable}
                  onChange={set("workersAvailable")}
                />
              </div>
            </div>

            <div className="form-card-footer-nav">
              <button type="button" onClick={() => setActiveSection("schedule")} className="form-btn-back">
                ◀ Back
              </button>
              <button type="button" onClick={() => setActiveSection("budget")} className="form-btn-next">
                Next: Budget ➔
              </button>
            </div>
          </div>
        )}

        {/* Section 4: Budget & Site Notes */}
        {activeSection === "budget" && (
          <div className="form-card card-bg animate-slide-up">
            <div className="form-card-header">
              <span className="card-header-icon">💰</span>
              <h3 className="form-card-title">Budget Allocation & Environmental Factors</h3>
            </div>
            
            <div className="form-grid" style={{ marginBottom: 20 }}>
              <div className="form-field">
                <label className="form-label">Planned Budget ($ USD)</label>
                <input
                  type="number"
                  min="0"
                  className="input-field"
                  placeholder="e.g. 5000000"
                  value={form.plannedBudget}
                  onChange={set("plannedBudget")}
                />
              </div>

              <div className="form-field">
                <label className="form-label">Current Expenditure ($ USD)</label>
                <input
                  type="number"
                  min="0"
                  className="input-field"
                  placeholder="e.g. 4200000"
                  value={form.currentSpending}
                  onChange={set("currentSpending")}
                />
              </div>

              <div className="form-field">
                <label className="form-label">Active Site Conditions</label>
                <select className="select-input-styled" value={form.siteCondition} onChange={set("siteCondition")}>
                  {siteOptions.map(([val, txt]) => (
                    <option key={val} value={val}>
                      {txt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-field-full">
              <label className="form-label">
                Additional Notes (AI NLP Scanned Keyword Trigger)
              </label>
              <textarea
                className="textarea-field"
                placeholder="Mention specific issues like 'flooding', 'union strike threats', 'inflation material price hikes', or 'soil foundation cracks' for custom deep analysis..."
                value={form.notes}
                onChange={set("notes")}
              />
            </div>

            <div className="form-card-footer-nav" style={{ marginTop: 24 }}>
              <button type="button" onClick={() => setActiveSection("assets")} className="form-btn-back">
                ◀ Back
              </button>

              <div className="form-actions-submit-row">
                <button type="button" onClick={onCancel} className="form-btn-cancel">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="form-btn-submit button-glow">
                  {loading ? (
                    <>
                      <span className="spinner-mini">⚙️</span>
                      Processing Risk footprint...
                    </>
                  ) : (
                    "🔍 Run Risk Engine Analysis"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </form>
  );
}
