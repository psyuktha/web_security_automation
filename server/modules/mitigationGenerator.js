import { GoogleGenerativeAI } from "@google/generative-ai";

const generatedMitigationsCache = [];

// Compute Jaccard similarity for two strings to enforce < 70% match
const computeSimilarity = (str1, str2) => {
  const set1 = new Set(str1.toLowerCase().split(/\W+/).filter(Boolean));
  const set2 = new Set(str2.toLowerCase().split(/\W+/).filter(Boolean));
  if (set1.size === 0 && set2.size === 0) return 0;

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
};

// Default generic mitigation if API fails or key is missing
const getFallbackMitigation = (vulnType) => {
  return `Root Cause: The application failed to securely handle user input leading to a ${vulnType} vulnerability.
Recommended Fix: Apply context-specific sanitization and escape routines based on the injection context.
Example Secure Code: Contextual.
Additional Hardening Steps: Enable protective headers and conduct regular code reviews.`;
};

/**
 * Generate a context-aware mitigation plan dynamically
 */
export const generateMitigation = async (vuln) => {
  const MITIGATION_API_KEY = process.env.MITIGATION_API_KEY || process.env.GEMINI_API_KEY;

  if (!MITIGATION_API_KEY) {
    console.warn("⚠️ MITIGATION_API_KEY not set. Using fallback mitigation. Set MITIGATION_API_KEY or GEMINI_API_KEY environment variable.");
    return getFallbackMitigation(vuln.type);
  }

  const genAI = new GoogleGenerativeAI(MITIGATION_API_KEY);
  let model;

  try {
    model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  } catch (e) {
    try {
      model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    } catch {
      return getFallbackMitigation(vuln.type);
    }
  }

  // Extract Parameter from URL if available, else state "N/A"
  let parsedParam = "N/A";
  if (vuln.payload) {
    const urlParams = new URL(vuln.endpoint).searchParams;
    for (const [k, v] of urlParams.entries()) {
      if (v === vuln.payload || vuln.payload.includes(v)) parsedParam = k;
    }
  }
  // Try fallback parameter extraction relying on evidence string
  if (parsedParam === "N/A" && vuln.evidence?.includes("Param:")) {
    const match = vuln.evidence.match(/Param: ([^\s|]+)/);
    if (match) parsedParam = match[1];
  }

  const basePrompt = `Generate a detailed, non-generic mitigation plan for the following vulnerability:

Vulnerability Type: ${vuln.type}
Endpoint: ${vuln.endpoint}
Parameter: ${parsedParam}
Severity: ${vuln.severity}

Requirements:
- Explain root cause clearly
- Provide specific remediation steps (not generic)
- Include secure coding practices
- Tailor response specifically to this vulnerability type
- Do NOT repeat generic advice used for other vulnerabilities
- MUST use OWASP standard formatting (Root Cause, Recommended Fix, Example Secure Code, Additional Hardening Steps)`;

  let attempts = 0;
  let finalMitigation = "";

  while (attempts < 2) {
    try {
      let currentPrompt = basePrompt;
      if (attempts === 1) {
        currentPrompt += `\n\nCRITICAL: Make this COMPLETELY unique from traditional suggestions. Focus extremely heavily on the exact Parameter (${parsedParam}) and endpoint behavior. Use unique wording.`;
      }

      const result = await model.generateContent(currentPrompt);
      const text = result.response.text();

      // Check similarity against cache
      let isTooSimilar = false;
      let highestSimilarity = 0;

      for (const cachedText of generatedMitigationsCache) {
        const similarity = computeSimilarity(text, cachedText);
        if (similarity > highestSimilarity) highestSimilarity = similarity;
      }

      if (highestSimilarity > 0.70) {
        console.warn(`⚠️ Generated mitigation was ${(highestSimilarity * 100).toFixed(1)}% similar to a previous one. Regenerating...`);
        isTooSimilar = true;
      }

      if (!isTooSimilar || attempts === 1) {
        finalMitigation = text;
        generatedMitigationsCache.push(text);
        break;
      }
    } catch (error) {
      console.error(`❌ Error generating mitigation: ${error.message}`);
      return getFallbackMitigation(vuln.type);
    }
    attempts++;
  }

  return finalMitigation || getFallbackMitigation(vuln.type);
};
