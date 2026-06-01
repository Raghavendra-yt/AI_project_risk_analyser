const fs = require("fs/promises");
const path = require("path");

const DB_DIR = path.join(__dirname, "..", "data");
const DB_PATH = path.join(DB_DIR, "db.json");

// Ensure data folder and file exists
async function ensureDb() {
  try {
    await fs.mkdir(DB_DIR, { recursive: true });
  } catch (err) {
    // Already exists or can't write, ignore for now
  }
  try {
    await fs.access(DB_PATH);
  } catch (err) {
    // If db.json does not exist, initialize it
    await fs.writeFile(DB_PATH, JSON.stringify({ projects: [] }, null, 2), "utf8");
  }
}

// Read database
async function readDb() {
  await ensureDb();
  try {
    const data = await fs.readFile(DB_PATH, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading file database, returning empty payload:", err);
    return { projects: [] };
  }
}

// Write database
async function writeDb(data) {
  await ensureDb();
  try {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("Error writing file database:", err);
    throw err;
  }
}

const dbService = {
  // Get all projects
  async getProjects() {
    const db = await readDb();
    return db.projects || [];
  },

  // Get project by ID
  async getProjectById(id) {
    const db = await readDb();
    return (db.projects || []).find((p) => p.id === id) || null;
  },

  // Save new project analysis
  async saveProject(form, result) {
    const db = await readDb();
    const { v4: uuidv4 } = require("uuid");
    
    const newProject = {
      id: uuidv4(),
      form,
      result,
      timestamp: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    db.projects.push(newProject);
    await writeDb(db);
    return newProject;
  },

  // Update existing project details & run calculations again
  async updateProject(id, form, result) {
    const db = await readDb();
    const index = db.projects.findIndex((p) => p.id === id);
    if (index === -1) {
      return null;
    }
    
    db.projects[index] = {
      ...db.projects[index],
      form,
      result,
      updatedAt: new Date().toISOString()
    };
    
    await writeDb(db);
    return db.projects[index];
  },

  // Delete an analysis
  async deleteProject(id) {
    const db = await readDb();
    const index = db.projects.findIndex((p) => p.id === id);
    if (index === -1) {
      return false;
    }
    
    db.projects.splice(index, 1);
    await writeDb(db);
    return true;
  }
};

module.exports = dbService;
