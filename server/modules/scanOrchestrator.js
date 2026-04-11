// import { extractEndpoints } from "./zapCrawler.js";
// import { generateSQLPayloads } from "./geminiPayloadGenerator.js";
// import { performAttacks } from "./attackEngine.js";
// import { generateReport, formatReportJSON } from "./reportGenerator.js";

// /**
//  * Main orchestrator that coordinates the entire security scan process
//  */
// export const runSecurityScan = async (targetUrl, attackTypes) => {
//   const scanStartTime = Date.now();
//   let endpoints = [];
//   let vulnerabilities = [];
//   let totalPayloads = 0;
//   let totalAttacks = 0;
  
//   try {
//     console.log(`\n🚀 Starting security scan for: ${targetUrl}`);
//     console.log(`📋 Attack types: ${JSON.stringify(attackTypes)}\n`);
    
//     // Step 1: Crawl website using ZAP to discover endpoints
//     console.log("=".repeat(60));
//     console.log("STEP 1: CRAWLING WEBSITE");
//     console.log("=".repeat(60));
//     endpoints = await extractEndpoints(targetUrl);
//     console.log(`✅ Discovered ${endpoints.length} endpoints\n`);
    
//     if (endpoints.length === 0) {
//       throw new Error("No endpoints discovered. Please check if the target URL is accessible.");
//     }
    
//     // Step 2: Generate payloads using Gemini AI (if SQL injection is enabled)
//     if (attackTypes.sqlInjection) {
//       console.log("=".repeat(60));
//       console.log("STEP 2: GENERATING PAYLOADS WITH GEMINI AI");
//       console.log("=".repeat(60));
      
//       const allPayloads = [];
      
//       // Generate payloads for each endpoint with parameters
//       const endpointsWithParams = endpoints.filter((ep) => ep.hasParams);
      
//       console.log(`📋 Found ${endpointsWithParams.length} endpoints with parameters out of ${endpoints.length} total endpoints`);
      
//       if (endpointsWithParams.length === 0) {
//         console.warn("⚠️  No endpoints with parameters found. Generating payloads for target URL anyway...");
//         // Create a dummy endpoint with parameters so we can still generate payloads
//         endpointsWithParams.push({
//           url: targetUrl,
//           method: "GET",
//           urlParams: { id: "1", test: "value" },
//           bodyParams: {},
//           hasParams: true,
//         });
//       }
      
//       for (const endpoint of endpoints) {
//         try {
//           console.log(`🔮 Generating payloads for: ${endpoint.url} (${endpoint.method})`);
//           const payloads = await generateSQLPayloads(endpoint, {
//             targetUrl: targetUrl,
//             attackType: "SQL Injection",
//           });
          
//           if (payloads && payloads.length > 0) {
//             allPayloads.push(...payloads);
//             totalPayloads += payloads.length;
//             console.log(`✅ Generated ${payloads.length} payloads for ${endpoint.url}`);
//           } else {
//             console.warn(`⚠️  No payloads generated for ${endpoint.url}`);
//           }
//         } catch (error) {
//           console.error(`❌ Error generating payloads for ${endpoint.url}:`, error.message);
//         }
//       }
      
//       // Remove duplicates
//       let uniquePayloads = [...new Set(allPayloads)];
      
//       // If still no payloads, use fallback directly
//       if (uniquePayloads.length === 0) {
//         console.warn("⚠️  No payloads generated from endpoints, using fallback payloads directly...");
//         // Import fallback function
//         const { getFallbackSQLPayloads } = await import("./geminiPayloadGenerator.js");
//         // Get fallback payloads
//         uniquePayloads = getFallbackSQLPayloads();
//         totalPayloads = uniquePayloads.length;
//         console.log(`✅ Using ${uniquePayloads.length} fallback payloads`);
//       }
      
//       console.log(`✅ Total unique payloads generated: ${uniquePayloads.length}\n`);
      
//       // Step 3: Perform SQL injection attacks
//       console.log("=".repeat(60));
//       console.log("STEP 3: PERFORMING SQL INJECTION ATTACKS");
//       console.log("=".repeat(60));
      
//       console.log(`🚀 Starting attacks on ${endpointsWithParams.length} endpoints with ${uniquePayloads.length} payloads each...`);
//       const attackResults = await performAttacks(endpoints, uniquePayloads);
//       totalAttacks = endpointsWithParams.length * uniquePayloads.length;
      
//       // Convert attack results to vulnerabilities
//       vulnerabilities = attackResults.map((result) => {
//         const responseSnippet = (result.responseBody || "").toString().substring(0, 200);
//         const baseEvidence = result.evidence || "SQL error detected in response";
//         const detailedEvidence = `${baseEvidence}
// Payload: ${result.payload}
// Status code: ${result.statusCode}
// Response snippet: ${responseSnippet}`;

//         return {
//           type: "SQL Injection",
//           severity: determineSeverity(result),
//           endpoint: result.endpoint,
//           method: result.method,
//           payload: result.payload,
//           description: `SQL injection vulnerability detected in ${result.endpoint}`,
//           evidence: detailedEvidence,
//           responseTime: result.responseTime,
//           statusCode: result.statusCode,
//           responseBody: result.responseBody,
//         };
//       });
      
//       console.log(`✅ Found ${vulnerabilities.length} SQL injection vulnerabilities\n`);
//     }
    
//     // Step 4: Generate report
//     console.log("=".repeat(60));
//     console.log("STEP 4: GENERATING REPORT");
//     console.log("=".repeat(60));
    
//     const scanDuration = Math.floor((Date.now() - scanStartTime) / 1000);
    
//     const report = generateReport({
//       targetUrl: targetUrl,
//       endpoints: endpoints,
//       vulnerabilities: vulnerabilities,
//       scanDuration: scanDuration,
//       scanStartTime: scanStartTime,
//       totalPayloads: totalPayloads,
//       totalAttacks: totalAttacks,
//     });
    
//     console.log("✅ Report generated successfully\n");
    
//     return {
//       success: true,
//       report: report,
//       endpoints: endpoints,
//       vulnerabilities: vulnerabilities,
//       scanDuration: scanDuration,
//       statistics: {
//         totalEndpoints: endpoints.length,
//         totalPayloads: totalPayloads,
//         totalAttacks: totalAttacks,
//         vulnerabilitiesFound: vulnerabilities.length,
//       },
//     };
//   } catch (error) {
//     console.error("❌ Scan failed:", error.message);
    
//     const scanDuration = Math.floor((Date.now() - scanStartTime) / 1000);
    
//     return {
//       success: false,
//       error: error.message,
//       endpoints: endpoints,
//       vulnerabilities: vulnerabilities,
//       scanDuration: scanDuration,
//     };
//   }
// };

// /**
//  * Determine severity based on attack result
//  */
// const determineSeverity = (result) => {
//   // Critical if we got SQL errors
//   if (result.vulnerable && result.evidence) {
//     return "critical";
//   }
  
//   // High if status code indicates error
//   if (result.statusCode >= 500) {
//     return "high";
//   }
  
//   // Medium if response time is suspicious
//   if (result.responseTime > 5000) {
//     return "medium";
//   }
  
//   return "low";
// };
import { extractEndpoints } from "./zapCrawler.js";
import { generateSQLPayloads, getFallbackXSSPayloads } from "./geminiPayloadGenerator.js";
import { performAttacks, performXSSAttack } from "./attackEngine.js";
import { generateReport } from "./reportGenerator.js";
import { createSessionClient, loginToDVWA } from "./httpClient.js";
import { extractAuthenticatedEndpoints } from "./dvwaCrawler.js";
import { generateMitigation } from "./mitigationGenerator.js";

/**
 * Main orchestrator that coordinates the entire security scan process
 */
export const runSecurityScan = async (targetUrl, attackTypes) => {
  const scanStartTime = Date.now();
  let endpoints = [];
  let vulnerabilities = [];
  let totalPayloads = 0;
  let totalAttacks = 0;

  try {
    console.log(`\n🚀 Starting security scan for: ${targetUrl}`);
    console.log(`📋 Attack types: ${JSON.stringify(attackTypes)}\n`);

    // ── STEP 0: AUTHENTICATION (DVWA) ──────────────────────────
    console.log("=".repeat(60));
    console.log("STEP 0: AUTHENTICATION & CLIENT INITIALIZATION");
    console.log("=".repeat(60));
    const client = createSessionClient();
    const isDVWA = targetUrl.toLowerCase().includes('localhost') || targetUrl.toLowerCase().includes('dvwa');
    
    if (isDVWA) {
      await loginToDVWA(client, targetUrl);
    }

    // ── STEP 1: CRAWL ──────────────────────────────────────────
    console.log("=".repeat(60));
    console.log("STEP 1: CRAWLING WEBSITE");
    console.log("=".repeat(60));

    if (isDVWA) {
       endpoints = await extractAuthenticatedEndpoints(client, targetUrl);
    } else {
       endpoints = await extractEndpoints(targetUrl);
    }
    
    // Drop static assets immediately (Requirement 7)
    endpoints = endpoints.filter((ep) => !ep.url.match(/\.(js|css|png|jpg|jpeg|gif|woff|woff2|ttf|svg|ico)$/i));

    console.log(`✅ Discovered ${endpoints.length} active dynamic endpoints\n`);

    if (endpoints.length === 0) {
      throw new Error("No endpoints discovered (or all were static). Please check if the target URL is accessible.");
    }

    // ── FIX 1: Ensure every endpoint has bodyParams/urlParams ──
    // If the crawler doesn't populate these, POST endpoints like
    // /login will have nothing to inject into and get silently skipped.
    endpoints = endpoints.map((ep) => {
      const method = ep.method?.toUpperCase();

      // Ensure urlParams exists for GET endpoints
      if (method === "GET" && (!ep.urlParams || Object.keys(ep.urlParams).length === 0)) {
        // Parse params from the URL itself
        const urlObj = new URL(ep.url);
        const parsed = {};
        for (const [k, v] of urlObj.searchParams.entries()) {
          parsed[k] = v;
        }
        ep.urlParams = parsed;
      }

      // Ensure bodyParams exists for POST endpoints
      if (method === "POST" && (!ep.bodyParams || Object.keys(ep.bodyParams).length === 0)) {
        // Fall back to common field names so the attack loop has something to inject into
        ep.bodyParams = inferBodyParams(ep.url);
      }

      // Recompute hasParams after fixing
      ep.hasParams =
        Object.keys(ep.urlParams || {}).length > 0 ||
        Object.keys(ep.bodyParams || {}).length > 0;

      return ep;
    });

    // ── STEP 2: GENERATE PAYLOADS ──────────────────────────────
    if (attackTypes.sqlInjection) {
      console.log("=".repeat(60));
      console.log("STEP 2: GENERATING PAYLOADS WITH GEMINI AI");
      console.log("=".repeat(60));

      // ── FIX 2: Use endpointsWithParams consistently everywhere ──
      const endpointsWithParams = endpoints.filter((ep) => ep.hasParams);

      console.log(
        `📋 ${endpointsWithParams.length} endpoints with parameters out of ${endpoints.length} total`
      );
      console.log(
        `📋 Endpoints to attack: ${endpointsWithParams.map((e) => `${e.method} ${e.url}`).join(", ")}`
      );

      if (endpointsWithParams.length === 0) {
        console.warn("⚠️  No endpoints with parameters found.");
      }

      const allPayloads = [];

      // Generate payloads per endpoint (use endpointsWithParams, not all endpoints)
      for (const endpoint of endpointsWithParams) {
        try {
          console.log(`🔮 Generating payloads for: ${endpoint.method} ${endpoint.url}`);
          const payloads = await generateSQLPayloads(endpoint, {
            targetUrl,
            attackType: "SQL Injection",
          });

          if (payloads && payloads.length > 0) {
            allPayloads.push(...payloads);
            totalPayloads += payloads.length;
            console.log(`✅ Generated ${payloads.length} payloads for ${endpoint.url}`);
          } else {
            console.warn(`⚠️  No payloads generated for ${endpoint.url}`);
          }
        } catch (error) {
          console.error(`❌ Error generating payloads for ${endpoint.url}:`, error.message);
        }
      }

      // Deduplicate
      let uniquePayloads = [...new Set(allPayloads)];

      // Fallback if AI returned nothing
      if (uniquePayloads.length === 0) {
        console.warn("⚠️  No payloads from AI, using fallback payloads...");
        const { getFallbackSQLPayloads } = await import("./geminiPayloadGenerator.js");
        uniquePayloads = getFallbackSQLPayloads();
        totalPayloads = uniquePayloads.length;
        console.log(`✅ Using ${uniquePayloads.length} fallback payloads`);
      }

      console.log(`✅ Total unique payloads: ${uniquePayloads.length}\n`);

      // ── STEP 3: ATTACK ─────────────────────────────────────────
      console.log("=".repeat(60));
      console.log("STEP 3: PERFORMING SQL INJECTION ATTACKS");
      console.log("=".repeat(60));

      // ── FIX 3: Pass client and endpointsWithParams, not all endpoints ─────
      const attackResults = await performAttacks(client, endpointsWithParams, uniquePayloads);
      totalAttacks = endpointsWithParams.length * uniquePayloads.length;

      // ── FIX 4: Use type/confidence from attack result in severity ──
      vulnerabilities = attackResults.map((result) => {
        const responseSnippet = JSON.stringify(result.responseBody || "").substring(0, 300);

        return {
          type: result.type || "SQL Injection",
          severity: result.severity || "high",
          endpoint: result.endpoint,
          description: result.description || "SQL injection vulnerability detected.",
          payload: result.payload,
          evidence: result.evidence || "Exploitable condition detected.",
          responseSnippet: responseSnippet,
          impact: "Allows attackers to infer database schema, steal sensitive data, and potentially execute administrative commands on the backend database.",
          responseTime: result.responseTime,
          statusCode: result.statusCode,
          method: result.method,
        };
      });

      console.log(`✅ Found ${vulnerabilities.length} SQL injection vulnerabilities\n`);
    }

    // ── STEP 3.5: CROSS-SITE SCRIPTING (XSS) ───────────────────
    if (attackTypes.xss) {
      console.log("=".repeat(60));
      console.log("STEP 3.5: PERFORMING XSS ATTACKS");
      console.log("=".repeat(60));

      const endpointsWithParams = endpoints.filter((ep) => ep.hasParams);

      if (endpointsWithParams.length > 0) {
        const xssPayloads = getFallbackXSSPayloads();
        console.log(`🚀 Starting XSS attacks on ${endpointsWithParams.length} endpoints with ${xssPayloads.length} payloads each...`);
        let xssFound = 0;

        for (const endpoint of endpointsWithParams) {
          for (const payload of xssPayloads) {
            const result = await performXSSAttack(client, endpoint, payload);
            totalAttacks++;
            totalPayloads++;

            if (result.vulnerable) {
              xssFound++;
              console.log(`✅ XSS VULNERABILITY FOUND: ${endpoint.url}`);
              vulnerabilities.push({
                type: result.type, // "Stored XSS" or "Reflected XSS"
                severity: result.severity,
                endpoint: result.endpoint,
                description: result.description,
                payload: result.payload,
                evidence: result.evidence,
                responseSnippet: result.evidence || "", 
                impact: result.type.includes("Stored") 
                   ? "Persistent cross-site scripting allows an attacker to hijack the session of any user who subsequently views the infected page, potentially leading to immediate mass-compromise."
                   : "Reflected cross-site scripting allows an attacker to hijack a user's session, bypass CSRF protections, and perform unauthorized actions on their behalf if the victim clicks a malicious link.",
                responseTime: result.responseTime,
                statusCode: result.statusCode,
                method: result.method,
              });
              // Once one XSS payload works on this endpoint, break to avoid duplicates
              break; 
            }
          }
        }
        console.log(`✅ Found ${xssFound} XSS vulnerabilities\n`);
      } else {
        console.log("⚠️ No endpoints with parameters found to test for XSS.\n");
      }
    }

    // ── STEP 3.8: DYNAMIC MITIGATION GENERATION ────────────────
    console.log("=".repeat(60));
    console.log("STEP 3.8: GENERATING UNIQUE ISOLATED MITIGATION");
    console.log("=".repeat(60));
    
    if (vulnerabilities.length > 0) {
       console.log(`🧠 Synthesizing custom AI mitigations for ${vulnerabilities.length} vulnerabilities...`);
       await Promise.all(vulnerabilities.map(async (vuln) => {
          vuln.mitigation = await generateMitigation(vuln);
       }));
       console.log(`✅ All mitigations successfully generated.\n`);
    }

    // ── STEP 4: REPORT ─────────────────────────────────────────
    console.log("=".repeat(60));
    console.log("STEP 4: GENERATING REPORT");
    console.log("=".repeat(60));

    const scanDuration = Math.floor((Date.now() - scanStartTime) / 1000);

    const report = generateReport({
      targetUrl,
      endpoints,
      vulnerabilities,
      scanDuration,
      scanStartTime,
      totalPayloads,
      totalAttacks,
    });

    console.log("✅ Report generated successfully\n");

    return {
      success: true,
      report,
      endpoints,
      vulnerabilities,
      scanDuration,
      statistics: {
        totalEndpoints: endpoints.length,
        endpointsWithParams: endpoints.filter((e) => e.hasParams).length,
        totalPayloads,
        totalAttacks,
        vulnerabilitiesFound: vulnerabilities.length,
      },
    };
  } catch (error) {
    console.error("❌ Scan failed:", error.message);
    const scanDuration = Math.floor((Date.now() - scanStartTime) / 1000);
    return {
      success: false,
      error: error.message,
      endpoints,
      vulnerabilities,
      scanDuration,
    };
  }
};

// ── HELPERS ───────────────────────────────────────────────────────────────────

/**
 * Infer likely body param names from endpoint URL path.
 * This is a fallback when the crawler doesn't populate bodyParams.
 */
const inferBodyParams = (url) => {
  const path = new URL(url).pathname.toLowerCase();

  if (path.includes("login") || path.includes("auth") || path.includes("signin")) {
    return { username: "admin", password: "password" };
  }
  if (path.includes("register") || path.includes("signup")) {
    return { username: "test", password: "password", email: "test@test.com" };
  }
  if (path.includes("search")) {
    return { q: "test" };
  }
  if (path.includes("admin")) {
    return { token: "test", query: "SELECT 1" };
  }
  if (path.includes("user")) {
    return { user_id: "1", username: "test" };
  }
  if (path.includes("product")) {
    return { id: "1" };
  }
  if (path.includes("order")) {
    return { order_id: "1", user_id: "1" };
  }

  // Generic fallback
  return { id: "1", input: "test" };
};

/**
 * Determine severity using injection type and confidence.
 */
const determineSeverity = (result) => {
  const { type, confidence, statusCode, responseTime } = result;

  // Auth bypass is always critical — attacker can log in as anyone
  if (type === "auth-bypass") return "critical";

  // High confidence error/union based — DB is directly leaking data
  if (confidence === "high" && (type === "error-based" || type === "union-based")) return "critical";

  // Medium confidence findings
  if (confidence === "medium") return "high";

  // Server crashed — something broke
  if (statusCode >= 500) return "high";

  // Time-based — blind injection, harder to exploit but still real
  if (type === "time-based") return "high";

  // Slow response but no confirmed injection type
  if (responseTime > 5000) return "medium";

  return "low";
};