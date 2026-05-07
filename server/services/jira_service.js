import axios from "axios";
import { generateEvidenceExplanation } from "../modules/report/formatEvidence.js";

const requiredEnv = [
  "JIRA_BASE_URL",
  "JIRA_EMAIL",
  "JIRA_API_TOKEN",
  "JIRA_PROJECT_KEY",
];

const hasJiraConfig = () =>
  requiredEnv.every((k) => Boolean(process.env[k] && String(process.env[k]).trim()));

const jiraClient = () =>
  axios.create({
    baseURL: process.env.JIRA_BASE_URL,
    auth: {
      username: process.env.JIRA_EMAIL,
      password: process.env.JIRA_API_TOKEN,
    },
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

const escapeJql = (value) =>
  String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, " ")
    .trim();

export async function searchJiraIssues(jql) {
  const auth = Buffer.from(
    `${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`
  ).toString("base64");

  try {
    const response = await axios.post(
      `${process.env.JIRA_BASE_URL}/rest/api/3/search/jql`,
      {
        jql,
        maxResults: 10,
      },
      {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    return response?.data?.issues || [];
  } catch (err) {
    console.error("Jira search error:", err?.response?.data || err?.message || err);
    return [];
  }
}

export function mapSeverityToPriority(severity) {
  switch (String(severity || "").toLowerCase()) {
    case "critical":
      return "Highest";
    case "high":
      return "High";
    case "medium":
      return "Medium";
    case "low":
      return "Low";
    default:
      return "Medium";
  }
}

export function normalizeType(type) {
  if (!type) return "Unknown";
  const t = String(type).toLowerCase();
  if (t.includes("xss")) return "XSS";
  if (t.includes("sql")) return "SQL Injection";
  return String(type);
}

function getObservationText(v) {
  const t = String(v?.type || "");
  if (t.includes("XSS")) return "JavaScript execution in browser (alert/console log)";
  if (t.includes("SQL")) return "Response changes or unauthorized data returned";
  return "Unexpected application behavior observed";
}

function fingerprintFor(v) {
  const td = v?.technical_details || {};
  const url = v?.url ?? v?.endpoint ?? "";
  const param = v?.param ?? v?.parameter ?? td.parameter_name ?? "no-param";
  const payload = v?.payload ?? td.payload_used ?? "no-payload";
  return [
    normalizeType(v?.type),
    url || "no-url",
    param || "no-param",
    payload || "no-payload",
  ].join("|");
}

function buildADF(text) {
  const lines = String(text || "").replace(/\r\n/g, "\n").split("\n");
  return {
    type: "doc",
    version: 1,
    content: [
      {
        type: "paragraph",
        content: lines.map((line, idx) => ({
          type: "text",
          text: `${idx === 0 ? "" : "\n"}${line}`,
        })),
      },
    ],
  };
}

export function buildJiraDescription(v) {
  const td = v.technical_details || {};
  const param = v.parameter ?? td.parameter_name ?? "unknown";
  const method = v.method ?? td.http_method ?? "GET";
  const payload = v.payload ?? td.payload_used ?? "N/A";
  const confidence = v.confidence_label ?? v.confidence_band ?? v.confidence ?? "Low";
  const url = v.url ?? v.endpoint ?? "";

  const explanation = generateEvidenceExplanation(v.evidence || {});
  const reproductionNote = getObservationText(v);

  const mitigation = String(v.mitigation || v.mitigation_markdown || "").trim() || "Not available";
  const fingerprint = fingerprintFor(v);
  const normalizedType = normalizeType(v?.type);

  return `
Fingerprint: ${fingerprint}

Type: ${normalizedType}
Original Type: ${String(v?.type || "Unknown")}
Severity: ${String(v?.severity || "medium")}
Confidence: ${String(confidence)}

Endpoint:
${url || "no-url"}

Parameter:
${param || "N/A"}

Payload:
${payload || "N/A"}

Description:
${String(v?.description || "").trim() || "Security issue detected based on response analysis."}

Explanation:
${String(explanation || "").trim() || "- No strong indicators detected."}

Reproduction Steps:
1. Open ${url || "no-url"}
2. Inject payload: ${payload || "N/A"}
3. Observe: ${reproductionNote}

Mitigation:
${mitigation}
  `.trim();
}

export async function createJiraIssue(v) {
  console.log("Creating Jira issue for:", v?.type);

  const fingerprint = fingerprintFor(v);
  const normalizedType = normalizeType(v?.type);
  const severity = String(v?.severity || "medium");
  const confidence = v?.confidence_label ?? v?.confidence_band ?? v?.confidence ?? "Low";
  const url = v?.url ?? v?.endpoint ?? "no-url";
  const param = v?.param ?? v?.parameter ?? v?.technical_details?.parameter_name ?? "N/A";
  const payload = v?.payload ?? v?.technical_details?.payload_used ?? "N/A";

  const descriptionText = `
Fingerprint: ${fingerprint}

Type: ${String(v?.type || "Unknown")}
Severity: ${severity}
Confidence: ${String(confidence)}

Description:
${String(v?.description || "").trim() || "Security issue detected based on response analysis."}

Explanation:
${String(v?.explanation || "").trim() || generateEvidenceExplanation(v?.evidence || {})}

Endpoint:
${url}

Parameter:
${param || "N/A"}

Payload:
${payload || "N/A"}
`.trim();

  const descriptionADF = buildADF(descriptionText);

  const body = {
    fields: {
      project: { key: process.env.JIRA_PROJECT_KEY },
      summary: `[${severity}] ${normalizedType}`,
      description: descriptionADF,
      issuetype: { name: "Bug" },
      priority: { name: mapSeverityToPriority(v.severity) },
      labels: ["security", normalizedType.toLowerCase().replace(/\s+/g, "_")],
    },
  };

  return jiraClient().post("/rest/api/3/issue", body);
}

export async function createJiraIssuesForFindings(findings = []) {
  if (!hasJiraConfig()) {
    console.warn(
      `⚠️ Jira env not configured. Set ${requiredEnv.join(", ")} to enable ticket creation.`
    );
    return { created: 0, skipped: findings.length, errors: 0 };
  }

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const v of findings) {
    try {
      if (!v || !v.type) {
        skipped++;
        continue;
      }

      const url = v.url ?? v.endpoint ?? "";
      if (!url) {
        skipped++;
        continue;
      }

      console.log("Processing vuln:", {
        type: v.type,
        url,
        param: v.param ?? v.parameter ?? v.technical_details?.parameter_name,
        payload: v.payload ?? v.technical_details?.payload_used,
      });

      const fingerprint = fingerprintFor(v);
      const normalizedType = normalizeType(v.type);
      const jql = `project = ${escapeJql(process.env.JIRA_PROJECT_KEY)} AND summary ~ "${escapeJql(normalizedType)}" AND description ~ "${escapeJql(url)}"`;
      const existingIssues = await searchJiraIssues(jql);

      if (existingIssues.length > 0) {
        skipped++;
        console.log("⚠️ Duplicate Jira ticket exists:", existingIssues[0]?.key || "(unknown)");
        continue;
      }

      const res = await createJiraIssue(v);
      created++;
      console.log("Jira ticket created:", res?.data?.key || v.type, url);
    } catch (e) {
      errors++;
      console.error("Jira error:", e?.response?.data || e?.message || e);
    }
  }

  return { created, skipped, errors };
}
