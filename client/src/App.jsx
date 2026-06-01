import React, { useState, useEffect } from "react";
import Dashboard from "./components/Dashboard";
import RiskForm from "./components/RiskForm";
import Results from "./components/Results";
import Compare from "./components/Compare";
import * as api from "./utils/api";

export default function App() {
  const [page, setPage] = useState("dashboard"); // dashboard | form | result | compare
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Focus states
  const [editingProject, setEditingProject] = useState(null);
  const [pendingResult, setPendingResult] = useState(null);
  const [compareProjects, setCompareProjects] = useState({ projA: null, projB: null });

  // Load all analyses from database on startup
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await api.fetchProjects();
        setAnalyses(data);
        setError(null);
      } catch (err) {
        console.error("Error loading projects from server:", err);
        setError("Failed to connect to backend server. Make sure the API is running.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const reloadData = async () => {
    try {
      const data = await api.fetchProjects();
      setAnalyses(data);
    } catch (err) {
      console.error("Error reloading database:", err);
    }
  };

  // Navigators
  const navigateToNewForm = () => {
    setEditingProject(null);
    setPendingResult(null);
    setPage("form");
  };

  const navigateToEditForm = (id) => {
    const proj = analyses.find((p) => p.id === id);
    if (proj) {
      setEditingProject(proj);
      setPendingResult(null);
      setPage("form");
    }
  };

  const navigateToViewReport = (id) => {
    const proj = analyses.find((p) => p.id === id);
    if (proj) {
      setPendingResult(proj);
      setPage("result");
    }
  };

  const handleRunAnalysis = async (formInputs, existingId) => {
    try {
      if (existingId) {
        // Editing existing project: PUT /api/projects/:id
        const updated = await api.updateProject(existingId, formInputs);
        await reloadData();
        setPendingResult(updated);
        setPage("result");
      } else {
        // New project: POST /api/projects
        // We set a temporary pending result in state.
        // It will show up in the Results component with a "Save to Dashboard" button.
        // The real database write happens when they click "Save to Dashboard".
        // This preserves the flow of the original JSX file where save is optional!
        const response = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formInputs)
        });
        
        if (!response.ok) throw new Error("Server risk engine failed.");
        const calculated = await response.json();
        
        // Mark as pending result for user save confirmation
        setPendingResult(calculated);
        setPage("result");
      }
    } catch (err) {
      alert("Error executing risk engine: " + err.message);
    }
  };

  // Confirm saving a newly analyzed project
  const handleSavePending = async () => {
    if (pendingResult && pendingResult.id) {
      // Re-fetch list to ensure sync
      await reloadData();
      setPendingResult(null);
      setPage("dashboard");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteProject(id);
      await reloadData();
      if (pendingResult && pendingResult.id === id) {
        setPendingResult(null);
      }
    } catch (err) {
      alert("Failed to delete project analysis: " + err.message);
    }
  };

  const handleCompare = (idA, idB) => {
    const projA = analyses.find((p) => p.id === idA);
    const projB = analyses.find((p) => p.id === idB);
    if (projA && projB) {
      setCompareProjects({ projA, projB });
      setPage("compare");
    }
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "form", label: "New Analysis", icon: "🔍" }
  ];

  return (
    <div className="app-shell">
      {/* 1. Left Sidebar Navigation */}
      <div className="sidebar hide-on-print">
        
        <div className="sidebar-logo-container">
          <div className="logo-flex">
            <div className="logo-badge">🏗️</div>
            <div>
              <h1 className="logo-title">RISKWISE</h1>
              <div className="logo-sub">CONSTRUCTION AI</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((n) => {
            const isActive = page === n.id || (n.id === "form" && page === "result" && pendingResult && !analyses.some(a => a.id === pendingResult.id));
            return (
              <button
                key={n.id}
                onClick={n.id === "form" ? navigateToNewForm : () => setPage("dashboard")}
                className={`nav-item-btn ${isActive ? "active" : ""}`}
              >
                <span className="nav-icon">{n.icon}</span>
                {n.label}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-text">
            <div className="sidebar-footer-title">RiskWise Engine v2.0</div>
            <div>{analyses.length} Assessment{analyses.length !== 1 ? "s" : ""} active</div>
          </div>
        </div>

      </div>

      {/* 2. Main Content Area */}
      <div className="main-wrapper">
        
        {/* Dynamic Page Header */}
        <div className="page-header hide-on-print">
          <h1 className="page-title">
            {page === "dashboard" && "Dashboard Assessments"}
            {page === "form" && (editingProject ? "Re-evaluate Project Details" : "Initiate Risk Assessment")}
            {page === "result" && "AI Risk Exposure Report"}
            {page === "compare" && "Comparison Audit"}
          </h1>
          <p className="page-subtitle">
            {page === "dashboard" && "Overview of construction threat factors and active portfolios"}
            {page === "form" && "Submit parameters below for live multi-factor threat auditing"}
            {page === "result" && `${pendingResult?.form?.projectName || "Project"} · Executive Audit Analysis`}
            {page === "compare" && "Analyzing metrics variance between key construction items"}
          </p>
        </div>

        {/* Global Loading & Error banners */}
        {loading && page === "dashboard" && (
          <div className="card-bg flex-center" style={{ padding: "60px 0" }}>
            <span className="spinner-mini" style={{ fontSize: 32, marginBottom: 12 }}>⚙️</span>
            <p>Querying Risk database...</p>
          </div>
        )}

        {error && page === "dashboard" && (
          <div className="card-bg border-glow-orange" style={{ padding: 30, color: "var(--red)", textAlign: "center" }}>
            <h3>⚠️ Database Offline</h3>
            <p style={{ marginTop: 8 }}>{error}</p>
          </div>
        )}

        {/* Page Switcher */}
        {!loading && !error && (
          <>
            {page === "dashboard" && (
              <Dashboard
                analyses={analyses}
                onNew={navigateToNewForm}
                onView={navigateToViewReport}
                onEdit={navigateToEditForm}
                onDelete={handleDelete}
                onCompare={handleCompare}
              />
            )}
            
            {page === "form" && (
              <RiskForm
                project={editingProject}
                onCancel={() => setPage("dashboard")}
                onResult={handleRunAnalysis}
              />
            )}

            {page === "result" && pendingResult && (
              <Results
                project={pendingResult}
                onBack={() => setPage("dashboard")}
                onSave={handleSavePending}
                // Check if the current report has already been saved to the analyses collection
                isPendingSave={!analyses.some((x) => x.id === pendingResult.id)}
              />
            )}

            {page === "compare" && (
              <Compare
                projectA={compareProjects.projA}
                projectB={compareProjects.projB}
                onBack={() => setPage("dashboard")}
              />
            )}
          </>
        )}

      </div>
    </div>
  );
}
