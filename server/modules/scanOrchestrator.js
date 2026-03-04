import { extractEndpoints } from "./zapCrawler.js";
import { generateSQLPayloads } from "./geminiPayloadGenerator.js";
import { performAttacks } from "./attackEngine.js";
import { generateReport, formatReportJSON } from "./reportGenerator.js";

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
    
    // Step 1: Crawl website using ZAP to discover endpoints
    console.log("=".repeat(60));
    console.log("STEP 1: CRAWLING WEBSITE");
    console.log("=".repeat(60));
    endpoints = await extractEndpoints(targetUrl);
    console.log(`✅ Discovered ${endpoints.length} endpoints\n`);
    
    if (endpoints.length === 0) {
      throw new Error("No endpoints discovered. Please check if the target URL is accessible.");
    }
    
    // Step 2: Generate payloads using Gemini AI (if SQL injection is enabled)
    if (attackTypes.sqlInjection) {
      console.log("=".repeat(60));
      console.log("STEP 2: GENERATING PAYLOADS WITH GEMINI AI");
      console.log("=".repeat(60));
      
      const allPayloads = [];
      
      // Generate payloads for each endpoint with parameters
      const endpointsWithParams = endpoints.filter((ep) => ep.hasParams);
      
      console.log(`📋 Found ${endpointsWithParams.length} endpoints with parameters out of ${endpoints.length} total endpoints`);
      
      if (endpointsWithParams.length === 0) {
        console.warn("⚠️  No endpoints with parameters found. Generating payloads for target URL anyway...");
        // Create a dummy endpoint with parameters so we can still generate payloads
        endpointsWithParams.push({
          url: targetUrl,
          method: "GET",
          urlParams: { id: "1", test: "value" },
          bodyParams: {},
          hasParams: true,
        });
      }
      
      for (const endpoint of endpointsWithParams) {
        try {
          console.log(`🔮 Generating payloads for: ${endpoint.url} (${endpoint.method})`);
          const payloads = await generateSQLPayloads(endpoint, {
            targetUrl: targetUrl,
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
      
      // Remove duplicates
      let uniquePayloads = [...new Set(allPayloads)];
      
      // If still no payloads, use fallback directly
      if (uniquePayloads.length === 0) {
        console.warn("⚠️  No payloads generated from endpoints, using fallback payloads directly...");
        // Import fallback function
        const { getFallbackSQLPayloads } = await import("./geminiPayloadGenerator.js");
        // Get fallback payloads
        uniquePayloads = getFallbackSQLPayloads();
        totalPayloads = uniquePayloads.length;
        console.log(`✅ Using ${uniquePayloads.length} fallback payloads`);
      }
      
      console.log(`✅ Total unique payloads generated: ${uniquePayloads.length}\n`);
      
      // Step 3: Perform SQL injection attacks
      console.log("=".repeat(60));
      console.log("STEP 3: PERFORMING SQL INJECTION ATTACKS");
      console.log("=".repeat(60));
      
      console.log(`🚀 Starting attacks on ${endpointsWithParams.length} endpoints with ${uniquePayloads.length} payloads each...`);
      const attackResults = await performAttacks(endpointsWithParams, uniquePayloads);
      totalAttacks = endpointsWithParams.length * uniquePayloads.length;
      
      // Convert attack results to vulnerabilities
      vulnerabilities = attackResults.map((result) => {
        const responseSnippet = (result.responseBody || "").toString().substring(0, 200);
        const baseEvidence = result.evidence || "SQL error detected in response";
        const detailedEvidence = `${baseEvidence}
Payload: ${result.payload}
Status code: ${result.statusCode}
Response snippet: ${responseSnippet}`;

        return {
          type: "SQL Injection",
          severity: determineSeverity(result),
          endpoint: result.endpoint,
          method: result.method,
          payload: result.payload,
          description: `SQL injection vulnerability detected in ${result.endpoint}`,
          evidence: detailedEvidence,
          responseTime: result.responseTime,
          statusCode: result.statusCode,
          responseBody: result.responseBody,
        };
      });
      
      console.log(`✅ Found ${vulnerabilities.length} SQL injection vulnerabilities\n`);
    }
    
    // Step 4: Generate report
    console.log("=".repeat(60));
    console.log("STEP 4: GENERATING REPORT");
    console.log("=".repeat(60));
    
    const scanDuration = Math.floor((Date.now() - scanStartTime) / 1000);
    
    const report = generateReport({
      targetUrl: targetUrl,
      endpoints: endpoints,
      vulnerabilities: vulnerabilities,
      scanDuration: scanDuration,
      scanStartTime: scanStartTime,
      totalPayloads: totalPayloads,
      totalAttacks: totalAttacks,
    });
    
    console.log("✅ Report generated successfully\n");
    
    return {
      success: true,
      report: report,
      endpoints: endpoints,
      vulnerabilities: vulnerabilities,
      scanDuration: scanDuration,
      statistics: {
        totalEndpoints: endpoints.length,
        totalPayloads: totalPayloads,
        totalAttacks: totalAttacks,
        vulnerabilitiesFound: vulnerabilities.length,
      },
    };
  } catch (error) {
    console.error("❌ Scan failed:", error.message);
    
    const scanDuration = Math.floor((Date.now() - scanStartTime) / 1000);
    
    return {
      success: false,
      error: error.message,
      endpoints: endpoints,
      vulnerabilities: vulnerabilities,
      scanDuration: scanDuration,
    };
  }
};

/**
 * Determine severity based on attack result
 */
const determineSeverity = (result) => {
  // Critical if we got SQL errors
  if (result.vulnerable && result.evidence) {
    return "critical";
  }
  
  // High if status code indicates error
  if (result.statusCode >= 500) {
    return "high";
  }
  
  // Medium if response time is suspicious
  if (result.responseTime > 5000) {
    return "medium";
  }
  
  return "low";
};
