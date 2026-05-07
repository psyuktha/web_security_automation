export function generateEvidenceExplanation(evidence = {}) {
  if (!evidence) {
    return "No evidence available.";
  }

  if (typeof evidence === "string") {
    return evidence.trim() || "No evidence available.";
  }

  if (Array.isArray(evidence)) {
    const joined = evidence.filter(Boolean).join(" \n");
    return joined || "No evidence available.";
  }

  if (typeof evidence === "object") {
    const entries = Object.entries(evidence)
      .filter(([_, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => `${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`);

    return entries.length > 0 ? entries.join(" \n") : "No evidence available.";
  }

  return String(evidence);
}
