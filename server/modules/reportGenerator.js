/**
 * Generate a comprehensive security scan report
 */
export const generateReport = (scanData) => {
  const {
    targetUrl,
    endpoints,
    vulnerabilities,
    scanDuration,
    scanStartTime,
  } = scanData;
  
  const report = {
    summary: {
      targetUrl: targetUrl,
      scanDate: new Date(scanStartTime).toISOString(),
      scanDuration: scanDuration,
      totalEndpoints: endpoints.length,
      totalVulnerabilities: vulnerabilities.length,
      criticalCount: vulnerabilities.filter((v) => v.severity === "critical").length,
      highCount: vulnerabilities.filter((v) => v.severity === "high").length,
      mediumCount: vulnerabilities.filter((v) => v.severity === "medium").length,
      lowCount: vulnerabilities.filter((v) => v.severity === "low").length,
    },
    endpoints: endpoints.map((ep) => ({
      url: ep.url,
      method: ep.method,
      hasParams: ep.hasParams,
    })),
    vulnerabilities: vulnerabilities.map((vuln) => ({
      type: vuln.type,
      severity: vuln.severity,
      endpoint: vuln.endpoint,
      method: vuln.method,
      payload: vuln.payload,
      statusCode: vuln.statusCode,
      description: vuln.description,
      evidence: vuln.evidence,
      responseSnippet: (vuln.responseBody || "").toString().substring(0, 200),
      recommendation: getRecommendation(vuln.type),
    })),
    statistics: {
      endpointsScanned: endpoints.length,
      payloadsTested: scanData.totalPayloads || 0,
      attacksPerformed: scanData.totalAttacks || 0,
      successRate: vulnerabilities.length > 0 ? ((vulnerabilities.length / (scanData.totalAttacks || 1)) * 100).toFixed(2) : "0.00",
    },
  };
  
  return report;
};

/**
 * Get recommendation based on vulnerability type
 */
const getRecommendation = (vulnType) => {
  const recommendations = {
    "SQL Injection": [
      "Use parameterized queries (prepared statements) instead of string concatenation",
      "Implement input validation and sanitization",
      "Use least privilege principle for database users",
      "Enable SQL injection protection in your framework",
      "Regular security audits and penetration testing",
    ],
    "XSS": [
      "Implement Content Security Policy (CSP)",
      "Encode user input before rendering",
      "Use framework's built-in XSS protection",
      "Validate and sanitize all user inputs",
    ],
    "Command Injection": [
      "Avoid executing system commands with user input",
      "Use safe APIs instead of shell commands",
      "Whitelist allowed commands and parameters",
      "Implement proper input validation",
    ],
  };
  
  return recommendations[vulnType] || [
    "Review and fix the identified vulnerability",
    "Implement proper input validation",
    "Follow secure coding practices",
  ];
};

/**
 * Format report as JSON string
 */
export const formatReportJSON = (report) => {
  return JSON.stringify(report, null, 2);
};

/**
 * Format report as text
 */
export const formatReportText = (report) => {
  let text = "=".repeat(80) + "\n";
  text += "SECURITY SCAN REPORT\n";
  text += "=".repeat(80) + "\n\n";
  
  text += "SUMMARY\n";
  text += "-".repeat(80) + "\n";
  text += `Target URL: ${report.summary.targetUrl}\n`;
  text += `Scan Date: ${report.summary.scanDate}\n`;
  text += `Scan Duration: ${report.summary.scanDuration} seconds\n`;
  text += `Total Endpoints: ${report.summary.totalEndpoints}\n`;
  text += `Total Vulnerabilities: ${report.summary.totalVulnerabilities}\n`;
  text += `Critical: ${report.summary.criticalCount}\n`;
  text += `High: ${report.summary.highCount}\n`;
  text += `Medium: ${report.summary.mediumCount}\n`;
  text += `Low: ${report.summary.lowCount}\n\n`;
  
  if (report.vulnerabilities.length > 0) {
    text += "VULNERABILITIES\n";
    text += "-".repeat(80) + "\n";
    
    report.vulnerabilities.forEach((vuln, index) => {
      text += `\n${index + 1}. ${vuln.type} (${vuln.severity.toUpperCase()})\n`;
      text += `   Endpoint: ${vuln.endpoint}\n`;
      text += `   Method: ${vuln.method}\n`;
      text += `   Payload: ${vuln.payload}\n`;
      text += `   Status Code: ${vuln.statusCode || "(n/a)"}\n`;
      text += `   Description: ${vuln.description}\n`;
      text += `   Evidence: ${vuln.evidence}\n`;
      text += `   Response Snippet: ${vuln.responseSnippet || ""}\n`;
      text += `   Recommendations:\n`;
      vuln.recommendation.forEach((rec) => {
        text += `     - ${rec}\n`;
      });
    });
  }
  
  return text;
};
