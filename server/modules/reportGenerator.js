const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// ── AI MITIGATION GENERATOR ───────────────────────────────────────────────────
const generateAIMitigation = async (vuln) => {
  try {
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set");

    const prompt = `You are a security expert. A SQL injection vulnerability was found during a security scan. Generate specific, actionable mitigation steps.

Vulnerability Details:
- Type: ${vuln.type}
- Injection Technique: ${vuln.injectionType}
- Severity: ${vuln.severity}
- Endpoint: ${vuln.endpoint} (${vuln.method})
- Payload that worked: ${vuln.payload}
- Evidence: ${vuln.evidence}
- HTTP Status: ${vuln.statusCode}

Return ONLY a JSON array of 4-6 mitigation steps as strings. Each step must be specific to this exact vulnerability — mention the endpoint, the injection technique, and concrete code-level fixes. No preamble, no markdown, no backticks, just the raw JSON array.

Example format:
["Step 1 specific to this vuln", "Step 2...", "Step 3..."]`;

    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1000,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${err}`);
    }

    const data = await response.json();

    // Gemini response path: candidates[0].content.parts[0].text
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const steps = JSON.parse(clean);

    if (Array.isArray(steps) && steps.length > 0) {
      return steps;
    }

    throw new Error("Invalid response format from Gemini");
  } catch (error) {
    console.warn(`⚠️ Gemini mitigation failed for ${vuln.endpoint}, using fallback:`, error.message);
    return getFallbackMitigation(vuln.injectionType);
  }
};

// ── STATIC FALLBACK ───────────────────────────────────────────────────────────
const getFallbackMitigation = (injectionType) => {
  const fallbacks = {
    "auth-bypass": [
      "Use parameterized queries — never concatenate credentials into SQL strings",
      "Hash passwords with bcrypt/argon2 and compare hashes, never raw strings in SQL",
      "Add account lockout after repeated failed login attempts",
      "Log and alert on multiple failed login attempts from the same IP",
    ],
    "error-based": [
      "Disable verbose SQL error messages in production — never expose raw query errors to the client",
      "Use parameterized queries to prevent injection entirely",
      "Set up a global error handler that returns generic 500 messages",
      "Review database user permissions — the app should not have DDL privileges",
    ],
    "boolean-based": [
      "Use parameterized queries — boolean-based injection works by altering query logic via string concatenation",
      "Implement strict input validation — reject input containing SQL keywords (OR, AND, UNION)",
      "Use an ORM (SQLAlchemy, Sequelize) that parameterizes by default",
      "Add a WAF rule to block common boolean injection patterns",
    ],
    "union-based": [
      "Use parameterized queries — UNION injection relies on raw string concatenation",
      "Restrict the DB user to only SELECT on required tables",
      "Implement output encoding and limit fields returned by queries",
      "Use an allowlist for expected query structures",
    ],
    "time-based": [
      "Use parameterized queries — time-based blind injection exploits string concatenation",
      "Set strict query timeouts at the database level",
      "Monitor for unusually slow queries in your database logs",
      "Use an ORM that handles parameterization automatically",
    ],
  };

  return fallbacks[injectionType] || [
    "Use parameterized queries (prepared statements) instead of string concatenation",
    "Validate and sanitize all user inputs — reject SQL metacharacters",
    "Use least privilege database accounts for the web application",
    "Disable detailed SQL error messages in production",
  ];
};

// ── MAIN REPORT GENERATOR ─────────────────────────────────────────────────────
export const generateReport = async (scanData) => {
  const {
    targetUrl,
    endpoints,
    vulnerabilities,
    scanDuration,
    scanStartTime,
  } = scanData;

  const endpointsWithParams = endpoints.filter((e) => e.hasParams).length;
  const uniqueVulnerableEndpoints = new Set(vulnerabilities.map((v) => v.endpoint)).size;

  console.log(`🤖 Generating Gemini AI mitigations for ${vulnerabilities.length} vulnerabilities...`);

  // Generate all mitigations in parallel
  const mitigations = await Promise.all(
    vulnerabilities.map((vuln) => generateAIMitigation(vuln))
  );

  console.log("✅ AI mitigations generated");

  const report = {
    summary: {
      targetUrl,
      scanDate: new Date(scanStartTime).toISOString(),
      scanDuration,
      totalEndpoints: endpoints.length,
      endpointsWithParams,
      totalVulnerabilities: vulnerabilities.length,
      criticalCount: vulnerabilities.filter((v) => v.severity === "critical").length,
      highCount:     vulnerabilities.filter((v) => v.severity === "high").length,
      mediumCount:   vulnerabilities.filter((v) => v.severity === "medium").length,
      lowCount:      vulnerabilities.filter((v) => v.severity === "low").length,
    },

    endpoints: endpoints.map((ep) => ({
      url: ep.url,
      method: ep.method,
      hasParams: ep.hasParams,
      params: { ...ep.urlParams, ...ep.bodyParams },
    })),

    vulnerabilities: vulnerabilities.map((vuln, i) => ({
      type:            vuln.type,
      injectionType:   vuln.injectionType || "unknown",
      confidence:      vuln.confidence    || "medium",
      severity:        vuln.severity,
      endpoint:        vuln.endpoint,
      method:          vuln.method,
      payload:         vuln.payload,
      statusCode:      vuln.statusCode,
      description:     vuln.description,
      evidence:        vuln.evidence,
      responseSnippet: JSON.stringify(vuln.responseBody || "").substring(0, 500),
      recommendation:  mitigations[i],
    })),

    statistics: {
      endpointsScanned:          endpoints.length,
      endpointsWithParams,
      vulnerableEndpoints:       uniqueVulnerableEndpoints,
      payloadsTested:            scanData.totalPayloads || 0,
      attacksPerformed:          scanData.totalAttacks  || 0,
      endpointVulnerabilityRate:
        endpointsWithParams > 0
          ? ((uniqueVulnerableEndpoints / endpointsWithParams) * 100).toFixed(0) + "%"
          : "0%",
    },
  };

  return report;
};

// ── TEXT FORMATTER ────────────────────────────────────────────────────────────
export const formatReportText = (report) => {
  let text = "=".repeat(80) + "\n";
  text += "SECURITY SCAN REPORT\n";
  text += "=".repeat(80) + "\n\n";

  text += "SUMMARY\n";
  text += "-".repeat(80) + "\n";
  text += `Target URL:              ${report.summary.targetUrl}\n`;
  text += `Scan Date:               ${report.summary.scanDate}\n`;
  text += `Scan Duration:           ${report.summary.scanDuration}s\n`;
  text += `Total Endpoints:         ${report.summary.totalEndpoints}\n`;
  text += `Endpoints with Params:   ${report.summary.endpointsWithParams}\n`;
  text += `Total Vulnerabilities:   ${report.summary.totalVulnerabilities}\n`;
  text += `  Critical: ${report.summary.criticalCount}\n`;
  text += `  High:     ${report.summary.highCount}\n`;
  text += `  Medium:   ${report.summary.mediumCount}\n`;
  text += `  Low:      ${report.summary.lowCount}\n\n`;

  text += "STATISTICS\n";
  text += "-".repeat(80) + "\n";
  text += `Endpoints Scanned:         ${report.statistics.endpointsScanned}\n`;
  text += `Vulnerable Endpoints:      ${report.statistics.vulnerableEndpoints}\n`;
  text += `Endpoint Vulnerability %:  ${report.statistics.endpointVulnerabilityRate}\n`;
  text += `Payloads Tested:           ${report.statistics.payloadsTested}\n`;
  text += `Attacks Performed:         ${report.statistics.attacksPerformed}\n\n`;

  if (report.vulnerabilities.length > 0) {
    text += "VULNERABILITIES\n";
    text += "-".repeat(80) + "\n";

    report.vulnerabilities.forEach((vuln, index) => {
      text += `\n${index + 1}. ${vuln.type} — ${vuln.injectionType} (${vuln.severity.toUpperCase()}) [confidence: ${vuln.confidence}]\n`;
      text += `   Endpoint:    ${vuln.endpoint}\n`;
      text += `   Method:      ${vuln.method}\n`;
      text += `   Payload:     ${vuln.payload}\n`;
      text += `   Status Code: ${vuln.statusCode ?? "n/a"}\n`;
      text += `   Description: ${vuln.description}\n`;
      text += `   Evidence:    ${vuln.evidence}\n`;
      text += `   Response:    ${vuln.responseSnippet}\n`;
      text += `   AI Mitigations (Gemini):\n`;
      vuln.recommendation.forEach((rec) => {
        text += `     - ${rec}\n`;
      });
      text += "\n";
    });
  } else {
    text += "\n✅ No vulnerabilities found.\n";
  }

  return text;
};

// ── JSON FORMATTER ────────────────────────────────────────────────────────────
export const formatReportJSON = (report) => JSON.stringify(report, null, 2);