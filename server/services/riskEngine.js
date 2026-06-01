// Helper functions
const daysUntil = (d) => {
  if (!d) return 365; // Default far completion if not provided
  return Math.ceil((new Date(d) - new Date()) / 86400000);
};

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

const riskLevel = (score) => {
  if (score <= 30) return "Low";
  if (score <= 70) return "Medium";
  return "High";
};

const riskColor = (score) => {
  if (score <= 30) return "#22C55E"; // Green
  if (score <= 70) return "#EAB308"; // Yellow
  return "#EF4444"; // Red
};

const riskBg = (score) => {
  if (score <= 30) return "rgba(34,197,94,0.12)";
  if (score <= 70) return "rgba(234,179,8,0.12)";
  return "rgba(239,68,68,0.12)";
};

// Main construction risk analyser engine
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

  // 1. Schedule Risk
  if (progress < 50 && days <= 30) {
    score += 25;
    breakdown.Schedule += 25;
    risks.push({
      cat: "Schedule",
      msg: "Project is critically behind — less than 50% complete with fewer than 30 days remaining."
    });
    actions.push("Implement crash schedule: add shifts or weekend work immediately.");
  } else if (daysLate > 0) {
    const add = Math.min(daysLate * 1.5, 15);
    score += add;
    breakdown.Schedule += add;
    risks.push({
      cat: "Schedule",
      msg: `Project is ${daysLate} days behind schedule, risking deadline breach.`
    });
    actions.push("Review schedule baseline and compress non-critical activities.");
  }

  // 2. Material Risks
  const critMats = [form.cementStatus, form.steelStatus, form.electricalStatus, form.plumbingStatus].filter(m => m === "critical");
  const delayMats = [form.cementStatus, form.steelStatus, form.electricalStatus, form.plumbingStatus].filter(m => m === "delayed");
  const matNames = {
    cementStatus: "Cement",
    steelStatus: "Steel",
    electricalStatus: "Electrical materials",
    plumbingStatus: "Plumbing materials"
  };
  const critMatNames = Object.entries(matNames).filter(([k]) => form[k] === "critical").map(([, v]) => v);
  const delayMatNames = Object.entries(matNames).filter(([k]) => form[k] === "delayed").map(([, v]) => v);

  if (critMats.length > 0) {
    score += 20 * critMats.length;
    breakdown.Materials += 20 * critMats.length;
    risks.push({
      cat: "Materials",
      msg: `Critical shortage: ${critMatNames.join(", ")} may halt construction immediately.`
    });
    actions.push("Expedite procurement — contact alternate suppliers for critical materials.");
  }
  if (delayMats.length > 0) {
    const add = 8 * delayMats.length;
    score += add;
    breakdown.Materials += add;
    risks.push({
      cat: "Materials",
      msg: `Delayed materials: ${delayMatNames.join(", ")} could impact upcoming work phases.`
    });
    actions.push("Confirm ETA with suppliers and adjust work sequencing around delays.");
  }

  // 3. Labor Risk
  const laborRatio = workersAvail / workersNeeded;
  if (form.laborStatus === "critical" || laborRatio < 0.7) {
    score += 20;
    breakdown.Labor += 20;
    risks.push({
      cat: "Labor",
      msg: `Labor availability at ${Math.round(laborRatio * 100)}% of requirement — productivity severely impacted.`
    });
    actions.push("Engage subcontractors or temp workforce agencies immediately.");
  } else if (form.laborStatus === "partial" || laborRatio < 0.9) {
    score += 10;
    breakdown.Labor += 10;
    risks.push({
      cat: "Labor",
      msg: "Partial labor shortage — some activities may run below optimal capacity."
    });
    actions.push("Reassign labor from non-critical to critical path activities.");
  }

  // 4. Budget Risk
  const budgetRatio = spent / planned;
  if (budgetRatio > 0.8 && progress < 70) {
    score += 25;
    breakdown.Budget += 25;
    risks.push({
      cat: "Budget",
      msg: `${Math.round(budgetRatio * 100)}% of budget consumed with only ${progress}% progress — cost overrun highly likely.`
    });
    actions.push("Conduct immediate cost audit. Freeze non-essential expenditures.");
    actions.push("Re-estimate to-complete costs and present revised forecast to client.");
  } else if (budgetRatio > 0.65 && progress < 60) {
    const add = 12;
    score += add;
    breakdown.Budget += add;
    risks.push({
      cat: "Budget",
      msg: "Budget burn rate exceeds progress rate — overrun trending."
    });
    actions.push("Review cost drivers and identify areas for value engineering.");
  }

  // 5. Site / Equipment Risk
  if (form.siteCondition === "equipment") {
    score += 15;
    breakdown.Site += 15;
    risks.push({
      cat: "Site",
      msg: "Equipment breakdown is causing productivity loss and potential schedule cascades."
    });
    actions.push("Source rental equipment immediately. Evaluate repair vs. replace decision.");
  }
  if (form.siteCondition === "weather") {
    score += 10;
    breakdown.Site += 10;
    risks.push({
      cat: "Site",
      msg: "Weather delays are impacting outdoor work and may trigger contract extension claims."
    });
    actions.push("Document weather events for EOT claims. Prioritize indoor tasks during bad weather.");
  }
  if (form.siteCondition === "permit") {
    score += 12;
    breakdown.Site += 12;
    risks.push({
      cat: "Site",
      msg: "Permit issues may cause work stoppages and legal exposure."
    });
    actions.push("Assign dedicated resource to resolve permit issues with authorities.");
  }

  // 6. Intelligent NLP Notes Parser
  if (form.notes && typeof form.notes === "string") {
    const notesLower = form.notes.toLowerCase();

    // Weather risks
    const weatherKeywords = ["flood", "rain", "storm", "hurricane", "freeze", "snow", "weather", "monsoon", "tornado", "climate"];
    if (weatherKeywords.some(keyword => notesLower.includes(keyword))) {
      score += 10;
      breakdown.Site += 10;
      risks.push({
        cat: "Site",
        msg: "Environmental Hazard Alert (AI Extracted): Weather details in project notes highlight risk of structural damage and site stoppages."
      });
      actions.push("Deploy protective enclosures, secure drainage pathways, and coordinate with geo-meteorological forecasts.");
    }

    // Labor disputes / Safety incidents
    const laborKeywords = ["strike", "dispute", "lawsuit", "union", "injury", "accident", "protest", "fatal", "grievance", "stoppage"];
    if (laborKeywords.some(keyword => notesLower.includes(keyword))) {
      score += 15;
      breakdown.Labor += 15;
      risks.push({
        cat: "Labor",
        msg: "Labor/Legal Threat Alert (AI Extracted): Active safety events, disputes, or legal action referenced, introducing major regulatory liability."
      });
      actions.push("Coordinate safety auditing and engage local union liaisons to mitigate walk-outs.");
    }

    // Inflation / supply chain price hikes
    const financeKeywords = ["tariff", "inflation", "interest", "price hike", "bankruptcy", "shortage", "supply chain", "escalation", "pricing"];
    if (financeKeywords.some(keyword => notesLower.includes(keyword))) {
      score += 12;
      breakdown.Budget += 12;
      risks.push({
        cat: "Budget",
        msg: "Supply/Macroeconomic Risk (AI Extracted): Material price escalation or supplier bankruptcy mentioned, threatening project gross margins."
      });
      actions.push("Review supply chain contracts, finalize bulk prepayments to lock in material pricing, and review contingency reserves.");
    }

    // Structural / Subsurface issues
    const structuralKeywords = ["foundation", "soil", "crack", "seismic", "sinkhole", "geotech", "drainage", "structural", "load"];
    if (structuralKeywords.some(keyword => notesLower.includes(keyword))) {
      score += 15;
      breakdown.Site += 15;
      risks.push({
        cat: "Site",
        msg: "Geotechnical / Foundation Failure Threat (AI Extracted): Subsurface instability or cracks flagged, posing extreme rework risk."
      });
      actions.push("Halt high-load installation on affected sectors. Execute geotech core sampling and secure third-party civil engineer certification.");
    }
  }

  // Formatting & clamps
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

module.exports = {
  analyzeRisks,
  buildSummary,
  riskLevel,
  riskColor,
  riskBg
};
