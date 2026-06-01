// API Utilities to interact with the backend Express services

export async function fetchProjects() {
  const response = await fetch("/api/projects");
  if (!response.ok) {
    throw new Error("Failed to fetch project analyses from backend.");
  }
  return response.json();
}

export async function fetchProjectById(id) {
  const response = await fetch(`/api/projects/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch project analysis for ID: ${id}`);
  }
  return response.json();
}

export async function createProject(form) {
  const response = await fetch("/api/projects", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(form)
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to create project risk analysis.");
  }
  return response.json();
}

export async function updateProject(id, form) {
  const response = await fetch(`/api/projects/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(form)
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to update project analysis for ID: ${id}`);
  }
  return response.json();
}

export async function deleteProject(id) {
  const response = await fetch(`/api/projects/${id}`, {
    method: "DELETE"
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to delete project analysis for ID: ${id}`);
  }
  return response.json();
}
