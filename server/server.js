const express = require("express");
const cors = require("cors");
const path = require("path");
const dbService = require("./services/dbService");
const { analyzeRisks } = require("./services/riskEngine");

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing middleware
app.use(cors());
app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Serve frontend client in production (build directory)
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "..", "client", "dist")));
}

// ─── API ROUTES ──────────────────────────────────────────────────────────────

// GET: Retrieve all projects
app.get("/api/projects", async (req, res) => {
  try {
    const projects = await dbService.getProjects();
    res.json(projects);
  } catch (error) {
    console.error("Error retrieving projects:", error);
    res.status(500).json({ error: "Failed to retrieve projects from database." });
  }
});

// GET: Retrieve single project analysis by ID
app.get("/api/projects/:id", async (req, res) => {
  try {
    const project = await dbService.getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: "Project analysis not found." });
    }
    res.json(project);
  } catch (error) {
    console.error(`Error retrieving project ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to retrieve project analysis." });
  }
});

// POST: Run a new risk analysis and save to DB
app.post("/api/projects", async (req, res) => {
  try {
    const form = req.body;
    if (!form || !form.projectName) {
      return res.status(400).json({ error: "Project name is required." });
    }

    // Run risk engine calculation
    const result = analyzeRisks(form);

    // Save project record to file database
    const savedProject = await dbService.saveProject(form, result);
    
    res.status(201).json(savedProject);
  } catch (error) {
    console.error("Error creating project risk analysis:", error);
    res.status(500).json({ error: "Failed to process and save risk analysis." });
  }
});

// PUT: Update an existing project's inputs and re-run risk analysis
app.put("/api/projects/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const form = req.body;

    if (!form || !form.projectName) {
      return res.status(400).json({ error: "Project name is required." });
    }

    // Verify project exists
    const existing = await dbService.getProjectById(id);
    if (!existing) {
      return res.status(404).json({ error: "Project analysis not found." });
    }

    // Run risk engine calculation again based on modified inputs
    const result = analyzeRisks(form);

    // Update DB record
    const updatedProject = await dbService.updateProject(id, form, result);
    
    res.json(updatedProject);
  } catch (error) {
    console.error(`Error updating project ${id}:`, error);
    res.status(500).json({ error: "Failed to update project risk analysis." });
  }
});

// DELETE: Delete a project analysis
app.delete("/api/projects/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const success = await dbService.deleteProject(id);
    if (!success) {
      return res.status(404).json({ error: "Project analysis not found to delete." });
    }
    res.json({ success: true, message: "Project analysis successfully deleted." });
  } catch (error) {
    console.error(`Error deleting project ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to delete project analysis." });
  }
});

// Wildcard fallback for SPA routing in production
if (process.env.NODE_ENV === "production") {
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "client", "dist", "index.html"));
  });
}

// Start listener
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`   RiskWise Construction AI Server is live!      `);
  console.log(`   Listening at: http://localhost:${PORT}        `);
  console.log(`   Environment:  ${process.env.NODE_ENV || "development"}`);
  console.log(`==================================================`);
});
