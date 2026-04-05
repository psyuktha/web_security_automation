// import axios from "axios";

// /**
//  * Perform SQL injection attack on an endpoint
//  */
// export const performSQLInjectionAttack = async (endpoint, payload) => {
//   try {
//     const url = endpoint.url;
//     const method = endpoint.method.toUpperCase();
    
//     let response;
//     let attackData = {
//       payload: payload,
//       endpoint: url,
//       method: method,
//       vulnerable: false,
//       evidence: "",
//       responseTime: 0,
//       statusCode: 0,
//       responseBody: "",
//     };
    
//     const startTime = Date.now();
    
//     if (method === "GET") {
//       // Inject payload into URL parameters
//       const urlObj = new URL(url);
//       const testUrl = new URL(url);
      
//       // Try injecting into each parameter
//       for (const [key, value] of Object.entries(endpoint.urlParams)) {
//         testUrl.searchParams.set(key, payload);
        
//         try {
//           response = await axios.get(testUrl.toString(), {
//             timeout: 10000,
//             validateStatus: () => true, // Don't throw on any status
//             headers: {
//               "User-Agent": "Security-Scanner/1.0",
//             },
//           });
          
//           attackData.responseTime = Date.now() - startTime;
//           attackData.statusCode = response.status;
//           attackData.responseBody = response.data?.toString().substring(0, 1000) || "";
          
//           // Check for SQL error indicators
//           if (isSQLInjectionVulnerable(response, payload)) {
//             attackData.vulnerable = true;
//             attackData.evidence = extractEvidence(response, payload);
//             break;
//           }
//         } catch (error) {
//           // Continue to next parameter
//           continue;
//         }
//       }
//     } else if (method === "POST") {
//       // Inject payload into body parameters
//       const testData = { ...endpoint.bodyParams };
      
//       // Try injecting into each body parameter
//       for (const key of Object.keys(testData)) {
//         testData[key] = payload;
        
//         try {
//           response = await axios.post(url, testData, {
//             timeout: 10000,
//             validateStatus: () => true,
//             headers: {
//               "Content-Type": "application/x-www-form-urlencoded",
//               "User-Agent": "Security-Scanner/1.0",
//             },
//           });
          
//           attackData.responseTime = Date.now() - startTime;
//           attackData.statusCode = response.status;
//           attackData.responseBody = response.data?.toString().substring(0, 1000) || "";
          
//           // Check for SQL error indicators
//           if (isSQLInjectionVulnerable(response, payload)) {
//             attackData.vulnerable = true;
//             attackData.evidence = extractEvidence(response, payload);
//             break;
//           }
//         } catch (error) {
//           // Continue to next parameter
//           continue;
//         }
//       }
//     }
    
//     return attackData;
//   } catch (error) {
//     console.error(`❌ Error performing attack on ${endpoint.url}:`, error.message);
//     return {
//       payload: payload,
//       endpoint: endpoint.url,
//       method: endpoint.method,
//       vulnerable: false,
//       evidence: "",
//       error: error.message,
//     };
//   }
// };

// /**
//  * Check if response indicates SQL injection vulnerability
//  */
// export const isSQLInjectionVulnerable = (response, payload, attackData = null, baseline = null) => {
//   const responseText = JSON.stringify(response.data || "").toLowerCase();
//   const responseHeaders = JSON.stringify(response.headers || {}).toLowerCase();
//   const fullResponse = responseText + responseHeaders;
//   const statusCode = response.status;

//   // ── 1. ERROR-BASED ────────────────────────────────────────
//   const sqlErrorPatterns = [
//     /sql syntax.*mysql/i,
//     /warning.*mysql/i,
//     /valid mysql result/i,
//     /mysql_fetch/i,
//     /postgresql.*error/i,
//     /warning.*pg_/i,
//     /valid postgresql result/i,
//     /microsoft.*odbc.*sql/i,
//     /sql.*server.*driver/i,
//     /sqlserver.*error/i,
//     /ora-\d{5}/i,
//     /oracle.*error/i,
//     /quoted string not properly terminated/i,
//     /unclosed quotation mark/i,
//     /sql command not properly ended/i,
//     /syntax error.*sql/i,
//     /sql.*exception/i,
//     /sql.*error/i,
//     /database.*error/i,
//     /sqlstate/i,
//   ];

//   for (const pattern of sqlErrorPatterns) {
//     if (pattern.test(fullResponse)) {
//       return {
//         vulnerable: true,
//         type: "error-based",
//         confidence: "high",
//         evidence: extractEvidence(response, payload),
//       };
//     }
//   }

//   // ── 2. TIME-BASED ─────────────────────────────────────────
//   const isTimeBased = /sleep\s*\(|waitfor\s+delay/i.test(payload);
//   if (isTimeBased && attackData?.responseTime) {
//     const sleepMatch =
//       payload.match(/sleep\s*\((\d+)\)/i) ||
//       payload.match(/delay\s+'00:00:(\d+)'/i);
//     const expectedDelay = sleepMatch ? parseInt(sleepMatch[1]) * 1000 : 3000;

//     if (attackData.responseTime >= expectedDelay * 0.8) {
//       return {
//         vulnerable: true,
//         type: "time-based",
//         confidence: "high",
//         evidence: `Response took ${attackData.responseTime}ms — expected delay: ${expectedDelay}ms`,
//       };
//     }
//   }

//   // ── 3. AUTH BYPASS ────────────────────────────────────────
//   // Baseline was 401, now getting 200 after injection
//   if (baseline?.statusCode === 401 && statusCode === 200) {
//     return {
//       vulnerable: true,
//       type: "auth-bypass",
//       confidence: "high",
//       evidence: `Status changed from 401 to 200 with payload: ${payload}`,
//     };
//   }

//   // ── 4. ERROR CODE CHANGE ──────────────────────────────────
//   // Was 200, now 500 — injection triggered a crash
//   if (baseline?.statusCode === 200 && statusCode === 500) {
//     return {
//       vulnerable: true,
//       type: "error-based",
//       confidence: "medium",
//       evidence: `Status changed from 200 to 500 with payload: ${payload}`,
//     };
//   }

//   // ── 5. BOOLEAN-BASED ──────────────────────────────────────
//   if (baseline?.responseBody) {

//     const currentLength = (response.data?.toString() || "").length;
//     const baselineLength = baseline.responseBody.length;
//     const lengthRatio = Math.abs(currentLength - baselineLength) / (baselineLength || 1);

//     const isTrueCondition = /or\s+['"]?1['"]?\s*=\s*['"]?1/i.test(payload) || /or\s+1=1/i.test(payload);
//     const isFalseCondition = /or\s+['"]?1['"]?\s*=\s*['"]?2/i.test(payload) || /or\s+1=2/i.test(payload);

//     // ✅ Add this check — true condition must return MORE data, not less or empty
//     const currentData = response.data;
//     const isEmpty = !currentData || 
//       (Array.isArray(currentData) && currentData.length === 0) ||
//       (typeof currentData === 'object' && Object.values(currentData).every(v => 
//         Array.isArray(v) ? v.length === 0 : !v
//       ));

//     if (isTrueCondition && isEmpty) {
//       // Returned empty on a true condition → parameterized query, not vulnerable
//       return { vulnerable: false, type: null, confidence: null, evidence: "" };
//     }

//     if (isTrueCondition && lengthRatio > 0.3 && currentLength > baselineLength) {
//       return {
//         vulnerable: true,
//         type: "boolean-based",
//         confidence: "medium",
//         evidence: `Response body grew by ${Math.round(lengthRatio * 100)}% with true condition payload`,
//       };
//     }

//     if (isFalseCondition && currentLength < baselineLength * 0.5) {
//       return {
//         vulnerable: true,
//         type: "boolean-based",
//         confidence: "medium",
//         evidence: `Response body shrank by ${(1 - currentLength / baselineLength).toFixed(2) * 100}% with false condition payload`,
//       };
//     }
//   }

//   // ── 6. UNION-BASED ────────────────────────────────────────
//   if (/union\s+select/i.test(payload) && baseline?.responseBody) {
//     const currentLength = (response.data?.toString() || "").length;
//     const baselineLength = baseline.responseBody.length;

//     if (currentLength > baselineLength * 1.5) {
//       return {
//         vulnerable: true,
//         type: "union-based",
//         confidence: "medium",
//         evidence: `Response body is ${Math.round(currentLength / baselineLength)}x larger than baseline — possible data exfiltration`,
//       };
//     }
//   }

//   return { vulnerable: false, type: null, confidence: null, evidence: "" };
// };
// // const isSQLInjectionVulnerable = (response, payload) => {
// //   const responseText = JSON.stringify(response.data || response.data || "").toLowerCase();
// //   const responseHeaders = JSON.stringify(response.headers || {}).toLowerCase();
// //   const fullResponse = responseText + responseHeaders;
  
// //   // SQL error patterns
// //   const sqlErrorPatterns = [
// //     /sql syntax.*mysql/i,
// //     /warning.*mysql/i,
// //     /valid mysql result/i,
// //     /mysql_fetch/i,
// //     /postgresql.*error/i,
// //     /warning.*pg_/i,
// //     /valid postgresql result/i,
// //     /microsoft.*odbc.*sql/i,
// //     /sql.*server.*driver/i,
// //     /sqlserver.*error/i,
// //     /ora-\d{5}/i,
// //     /oracle.*error/i,
// //     /quoted string not properly terminated/i,
// //     /unclosed quotation mark/i,
// //     /sql command not properly ended/i,
// //     /syntax error.*sql/i,
// //     /sql.*exception/i,
// //     /sql.*error/i,
// //     /database.*error/i,
// //     /sqlstate/i,
// //   ];
  
// //   // Check for SQL errors
// //   for (const pattern of sqlErrorPatterns) {
// //     if (pattern.test(fullResponse)) {
// //       return true;
// //     }
// //   }
  
// //   // Check for time-based SQL injection (if payload contains SLEEP or WAITFOR)
// //   if (payload.toLowerCase().includes("sleep") || payload.toLowerCase().includes("waitfor")) {
// //     // This would need baseline comparison, simplified here
// //     return false; // Time-based detection needs more sophisticated logic
// //   }
  
// //   // Check for boolean-based (response difference)
// //   // This would need baseline comparison
  
// //   return false;
// // };

// /**
//  * Extract evidence of vulnerability
//  */
// const extractEvidence = (response, payload) => {
//   const responseText = JSON.stringify(response.data || "").toLowerCase();
  
//   // Try to extract SQL error message
//   const errorMatch = responseText.match(/(sql|mysql|postgresql|oracle|database).*error[^"]*/i);
//   if (errorMatch) {
//     return errorMatch[0].substring(0, 200);
//   }
  
//   // Return snippet of response
//   return responseText.substring(0, 200);
// };

// /**
//  * Perform attacks on all endpoints with all payloads
//  */
// export const performAttacks = async (endpoints, payloads) => {
//   const results = [];
  
//   console.log(`🚀 Starting attacks on ${endpoints.length} endpoints with ${payloads.length} payloads each...`);
  
//   for (const endpoint of endpoints) {
//     if (!endpoint.hasParams) {
//       console.log(`⏭️  Skipping ${endpoint.url} - no parameters`);
//       continue;
//     }
    
//     console.log(`🎯 Attacking endpoint: ${endpoint.url}`);
    
//     for (const payload of payloads) {
//       const result = await performSQLInjectionAttack(endpoint, payload);
      
//       if (result.vulnerable) {
//         console.log(`✅ VULNERABILITY FOUND: ${endpoint.url} with payload: ${payload}`);
//         results.push(result);
//       }
      
//       // Small delay to avoid overwhelming the target
//       await new Promise((resolve) => setTimeout(resolve, 500));
//     }
//   }
  
//   console.log(`✅ Attack phase completed. Found ${results.length} vulnerabilities.`);
  
//   return results;
// };
// 
import axios from "axios";

// ── BASELINE ──────────────────────────────────────────────────────────────────
export const getBaseline = async (endpoint) => {
  try {
    const method = endpoint.method.toUpperCase();
    let response;
    const startTime = Date.now();

    if (method === "GET") {
      const testUrl = new URL(endpoint.url);
      for (const [key, value] of Object.entries(endpoint.urlParams || {})) {
        testUrl.searchParams.set(key, value);
      }
      response = await axios.get(testUrl.toString(), {
        timeout: 10000,
        validateStatus: () => true,
        headers: { "User-Agent": "Security-Scanner/1.0" },
      });
    } else if (method === "POST") {
      response = await axios.post(endpoint.url, { ...endpoint.bodyParams }, {
        timeout: 10000,
        validateStatus: () => true,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Security-Scanner/1.0",
        },
      });
    }

    return {
      statusCode: response.status,
      responseBody: JSON.stringify(response.data || ""),
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    console.warn(`⚠️ Could not get baseline for ${endpoint.url}:`, error.message);
    return null;
  }
};

// ── EVIDENCE EXTRACTOR ────────────────────────────────────────────────────────
const extractEvidence = (response, payload) => {
  const responseText = JSON.stringify(response.data || "");
  const errorMatch = responseText.match(/(sql|mysql|postgresql|oracle|database).*?error[^"]{0,200}/i);
  if (errorMatch) return errorMatch[0].substring(0, 300);
  return responseText.substring(0, 500);
};

// ── DEDUPLICATE ENDPOINTS ─────────────────────────────────────────────────────
// Collapses duplicate endpoints that share the same path+method but differ only
// in param values (e.g. /users/search?q=admin and /users/search?q=alice → one entry)
export const deduplicateEndpoints = (endpoints) => {
  const seen = new Map();

  for (const ep of endpoints) {
    const url = new URL(ep.url);
    // Key = method + pathname only (ignore param values)
    const key = `${ep.method.toUpperCase()}:${url.pathname}`;

    if (!seen.has(key)) {
      // First time seeing this path — keep it, normalize param values to generic placeholders
      const normalized = { ...ep };

      if (ep.urlParams) {
        const normalizedParams = {};
        for (const [k] of Object.entries(ep.urlParams)) {
          // Reset to a safe neutral value for baseline; attack will inject into each
          normalizedParams[k] = "1";
        }
        normalized.urlParams = normalizedParams;

        // Also reset the URL to use normalized params
        const cleanUrl = new URL(ep.url);
        for (const [k, v] of Object.entries(normalizedParams)) {
          cleanUrl.searchParams.set(k, v);
        }
        normalized.url = cleanUrl.toString();
      }

      seen.set(key, normalized);
    }
    // If already seen — skip, it's a duplicate path
  }

  return Array.from(seen.values());
};

// ── VULNERABILITY CLASSIFIER ──────────────────────────────────────────────────
export const isSQLInjectionVulnerable = (response, payload, attackData = null, baseline = null) => {
  const responseText = JSON.stringify(response.data || "").toLowerCase();
  const responseHeaders = JSON.stringify(response.headers || {}).toLowerCase();
  const fullResponse = responseText + responseHeaders;
  const statusCode = response.status;

  // ── 1. ERROR-BASED ──────────────────────────────────────────────────────────
  const sqlErrorPatterns = [
    /sql syntax.*mysql/i,
    /warning.*mysql/i,
    /valid mysql result/i,
    /mysql_fetch/i,
    /postgresql.*error/i,
    /warning.*pg_/i,
    /valid postgresql result/i,
    /microsoft.*odbc.*sql/i,
    /sql.*server.*driver/i,
    /sqlserver.*error/i,
    /ora-\d{5}/i,
    /oracle.*error/i,
    /quoted string not properly terminated/i,
    /unclosed quotation mark/i,
    /sql command not properly ended/i,
    /syntax error.*sql/i,
    /sql.*exception/i,
    /sql.*error/i,
    /database.*error/i,
    /sqlstate/i,
  ];

  for (const pattern of sqlErrorPatterns) {
    if (pattern.test(fullResponse)) {
      return {
        vulnerable: true,
        type: "error-based",
        confidence: "high",
        evidence: extractEvidence(response, payload),
      };
    }
  }

  // ── 2. TIME-BASED ───────────────────────────────────────────────────────────
  const isTimeBased = /sleep\s*\(|waitfor\s+delay/i.test(payload);
  if (isTimeBased && attackData?.responseTime) {
    const sleepMatch =
      payload.match(/sleep\s*\((\d+)\)/i) ||
      payload.match(/delay\s+'00:00:(\d+)'/i);
    const expectedDelay = sleepMatch ? parseInt(sleepMatch[1]) * 1000 : 3000;

    if (attackData.responseTime >= expectedDelay * 0.8) {
      return {
        vulnerable: true,
        type: "time-based",
        confidence: "high",
        evidence: `Response took ${attackData.responseTime}ms — expected delay: ${expectedDelay}ms`,
      };
    }

    // Time-based payload but no delay detected — not vulnerable via this method
    return { vulnerable: false, type: null, confidence: null, evidence: "" };
  }

  // ── 3. AUTH BYPASS ──────────────────────────────────────────────────────────
  if (baseline?.statusCode === 401 && statusCode === 200) {
    return {
      vulnerable: true,
      type: "auth-bypass",
      confidence: "high",
      evidence: `Status changed from 401 → 200 with payload: ${payload}`,
    };
  }

  // ── 4. ERROR CODE CHANGE ────────────────────────────────────────────────────
  if (baseline?.statusCode === 200 && statusCode === 500) {
    return {
      vulnerable: true,
      type: "error-based",
      confidence: "medium",
      evidence: `Status changed from 200 → 500 with payload: ${payload}`,
    };
  }

  // ── 5. BOOLEAN-BASED ────────────────────────────────────────────────────────
  // Only check on successful responses — a 500 means the payload caused an error,
  // which is already caught by error-based above. Don't double-count it here.
  if (baseline?.responseBody && statusCode !== 500) {
    const currentLength = JSON.stringify(response.data || "").length;
    const baselineLength = baseline.responseBody.length;
    const lengthRatio = Math.abs(currentLength - baselineLength) / (baselineLength || 1);

    const isTrueCondition =
      /or\s+['"]?1['"]?\s*=\s*['"]?1/i.test(payload) ||
      /or\s+1=1/i.test(payload);
    const isFalseCondition =
      /or\s+['"]?1['"]?\s*=\s*['"]?2/i.test(payload) ||
      /or\s+1=2/i.test(payload);

    // Check if response data is empty
    const currentData = response.data;
    const isEmpty =
      !currentData ||
      (Array.isArray(currentData) && currentData.length === 0) ||
      (typeof currentData === "object" &&
        Object.values(currentData).every((v) =>
          Array.isArray(v) ? v.length === 0 : !v
        ));

    // Parameterized endpoints return empty on injection → not vulnerable
    if (isTrueCondition && isEmpty) {
      return { vulnerable: false, type: null, confidence: null, evidence: "" };
    }

    // Require meaningful ratio + response must be substantially larger
    // (guards against noise on small baseline responses)
    if (
      isTrueCondition &&
      lengthRatio > 0.3 &&
      currentLength > baselineLength &&
      currentLength > baselineLength + 50
    ) {
      return {
        vulnerable: true,
        type: "boolean-based",
        confidence: "medium",
        evidence: `Response grew by ${Math.round(lengthRatio * 100)}% with true condition — baseline: ${baselineLength}B, attack: ${currentLength}B`,
      };
    }

    if (isFalseCondition && currentLength < baselineLength * 0.5) {
      return {
        vulnerable: true,
        type: "boolean-based",
        confidence: "medium",
        evidence: `Response shrank by ${Math.round((1 - currentLength / baselineLength) * 100)}% with false condition payload`,
      };
    }
  }

  // ── 6. UNION-BASED ──────────────────────────────────────────────────────────
  // Only flag on 200 responses with actual data growth — a 500 with a UNION error
  // is already caught by error-based above. A column mismatch error being "larger"
  // than a tiny baseline is not data exfiltration.
  if (/union\s+select/i.test(payload) && baseline?.responseBody && statusCode === 200) {
    const currentLength = JSON.stringify(response.data || "").length;
    const baselineLength = baseline.responseBody.length;

    if (currentLength > baselineLength * 1.5 && currentLength > baselineLength + 100) {
      return {
        vulnerable: true,
        type: "union-based",
        confidence: "high",
        evidence: `Response is ${Math.round(currentLength / baselineLength)}x larger than baseline — possible data exfiltration`,
      };
    }
  }

  return { vulnerable: false, type: null, confidence: null, evidence: "" };
};

// ── ATTACK RUNNER ─────────────────────────────────────────────────────────────
export const performSQLInjectionAttack = async (endpoint, payload, baseline = null) => {
  try {
    const url = endpoint.url;
    const method = endpoint.method.toUpperCase();

    let response;
    let attackData = {
      payload,
      endpoint: url,
      method,
      vulnerable: false,
      type: null,
      confidence: null,
      evidence: "",
      responseTime: 0,
      statusCode: 0,
      responseBody: "",
    };

    const startTime = Date.now();

    if (method === "GET") {
      for (const [key] of Object.entries(endpoint.urlParams || {})) {
        const testUrl = new URL(url);
        for (const [k, v] of Object.entries(endpoint.urlParams)) {
          testUrl.searchParams.set(k, k === key ? payload : v);
        }

        try {
          response = await axios.get(testUrl.toString(), {
            timeout: 10000,
            validateStatus: () => true,
            headers: { "User-Agent": "Security-Scanner/1.0" },
          });

          attackData.responseTime = Date.now() - startTime;
          attackData.statusCode = response.status;
          attackData.responseBody = JSON.stringify(response.data || "").substring(0, 5000);

          const result = isSQLInjectionVulnerable(response, payload, attackData, baseline);
          if (result.vulnerable) {
            attackData.vulnerable = true;
            attackData.type = result.type;
            attackData.confidence = result.confidence;
            attackData.evidence = result.evidence;
            break;
          }
        } catch (error) {
          continue;
        }
      }
    } else if (method === "POST") {
      for (const key of Object.keys(endpoint.bodyParams || {})) {
        const injectedData = { ...endpoint.bodyParams, [key]: payload };

        try {
          response = await axios.post(url, injectedData, {
            timeout: 10000,
            validateStatus: () => true,
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "User-Agent": "Security-Scanner/1.0",
            },
          });

          attackData.responseTime = Date.now() - startTime;
          attackData.statusCode = response.status;
          attackData.responseBody = JSON.stringify(response.data || "").substring(0, 5000);

          const result = isSQLInjectionVulnerable(response, payload, attackData, baseline);
          if (result.vulnerable) {
            attackData.vulnerable = true;
            attackData.type = result.type;
            attackData.confidence = result.confidence;
            attackData.evidence = result.evidence;
            break;
          }
        } catch (error) {
          continue;
        }
      }
    }

    return attackData;
  } catch (error) {
    console.error(`❌ Error performing attack on ${endpoint.url}:`, error.message);
    return {
      payload,
      endpoint: endpoint.url,
      method: endpoint.method,
      vulnerable: false,
      type: null,
      confidence: null,
      evidence: "",
      error: error.message,
    };
  }
};

// ── MAIN ORCHESTRATOR ─────────────────────────────────────────────────────────
export const performAttacks = async (endpoints, payloads) => {
  const results = [];

  // ── FIX: Deduplicate before attacking — collapses ?q=admin and ?q=alice into one ──
  const uniqueEndpoints = deduplicateEndpoints(endpoints);
  const skipped = endpoints.length - uniqueEndpoints.length;
  if (skipped > 0) {
    console.log(`🧹 Deduplicated ${skipped} duplicate endpoint(s) — attacking ${uniqueEndpoints.length} unique paths`);
  }

  console.log(`🚀 Starting attacks on ${uniqueEndpoints.length} endpoints with ${payloads.length} payloads each...`);

  for (const endpoint of uniqueEndpoints) {
    if (!endpoint.hasParams) {
      console.log(`⏭️  Skipping ${endpoint.url} — no parameters`);
      continue;
    }

    console.log(`🎯 Attacking endpoint: ${endpoint.method} ${endpoint.url}`);

    const baseline = await getBaseline(endpoint);
    if (baseline) {
      console.log(`📊 Baseline: status=${baseline.statusCode}, length=${baseline.responseBody.length}B, time=${baseline.responseTime}ms`);
    }

    // Track unique vulnerabilities per endpoint (one finding per payload type, not per payload)
    const foundTypes = new Set();

    for (const payload of payloads) {
      const result = await performSQLInjectionAttack(endpoint, payload, baseline);

      if (result.vulnerable) {
        // ── FIX: Deduplicate findings — don't report the same type 16 times ──
        const dedupKey = `${result.type}`;
        if (!foundTypes.has(dedupKey)) {
          foundTypes.add(dedupKey);
          console.log(`✅ VULNERABILITY FOUND [${result.type}] [${result.confidence}]: ${endpoint.url} — payload: ${payload}`);
          results.push(result);
        } else {
          console.log(`⏭️  Skipping duplicate [${result.type}] finding for ${endpoint.url}`);
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  console.log(`✅ Attack phase completed. Found ${results.length} unique vulnerabilities.`);
  return results;
};