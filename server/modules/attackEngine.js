import axios from "axios";

/**
 * Perform SQL injection attack on an endpoint
 */
export const performSQLInjectionAttack = async (endpoint, payload) => {
  try {
    const url = endpoint.url;
    const method = endpoint.method.toUpperCase();
    
    let response;
    let attackData = {
      payload: payload,
      endpoint: url,
      method: method,
      vulnerable: false,
      evidence: "",
      responseTime: 0,
      statusCode: 0,
      responseBody: "",
    };
    
    const startTime = Date.now();
    
    if (method === "GET") {
      // Inject payload into URL parameters
      const urlObj = new URL(url);
      const testUrl = new URL(url);
      
      // Try injecting into each parameter
      for (const [key, value] of Object.entries(endpoint.urlParams)) {
        testUrl.searchParams.set(key, payload);
        
        try {
          response = await axios.get(testUrl.toString(), {
            timeout: 10000,
            validateStatus: () => true, // Don't throw on any status
            headers: {
              "User-Agent": "Security-Scanner/1.0",
            },
          });
          
          attackData.responseTime = Date.now() - startTime;
          attackData.statusCode = response.status;
          attackData.responseBody = response.data?.toString().substring(0, 1000) || "";
          
          // Check for SQL error indicators
          if (isSQLInjectionVulnerable(response, payload)) {
            attackData.vulnerable = true;
            attackData.evidence = extractEvidence(response, payload);
            break;
          }
        } catch (error) {
          // Continue to next parameter
          continue;
        }
      }
    } else if (method === "POST") {
      // Inject payload into body parameters
      const testData = { ...endpoint.bodyParams };
      
      // Try injecting into each body parameter
      for (const key of Object.keys(testData)) {
        testData[key] = payload;
        
        try {
          response = await axios.post(url, testData, {
            timeout: 10000,
            validateStatus: () => true,
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "User-Agent": "Security-Scanner/1.0",
            },
          });
          
          attackData.responseTime = Date.now() - startTime;
          attackData.statusCode = response.status;
          attackData.responseBody = response.data?.toString().substring(0, 1000) || "";
          
          // Check for SQL error indicators
          if (isSQLInjectionVulnerable(response, payload)) {
            attackData.vulnerable = true;
            attackData.evidence = extractEvidence(response, payload);
            break;
          }
        } catch (error) {
          // Continue to next parameter
          continue;
        }
      }
    }
    
    return attackData;
  } catch (error) {
    console.error(`❌ Error performing attack on ${endpoint.url}:`, error.message);
    return {
      payload: payload,
      endpoint: endpoint.url,
      method: endpoint.method,
      vulnerable: false,
      evidence: "",
      error: error.message,
    };
  }
};

/**
 * Check if response indicates SQL injection vulnerability
 */
const isSQLInjectionVulnerable = (response, payload) => {
  const responseText = JSON.stringify(response.data || response.data || "").toLowerCase();
  const responseHeaders = JSON.stringify(response.headers || {}).toLowerCase();
  const fullResponse = responseText + responseHeaders;
  
  // SQL error patterns
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
  
  // Check for SQL errors
  for (const pattern of sqlErrorPatterns) {
    if (pattern.test(fullResponse)) {
      return true;
    }
  }
  
  // Check for time-based SQL injection (if payload contains SLEEP or WAITFOR)
  if (payload.toLowerCase().includes("sleep") || payload.toLowerCase().includes("waitfor")) {
    // This would need baseline comparison, simplified here
    return false; // Time-based detection needs more sophisticated logic
  }
  
  // Check for boolean-based (response difference)
  // This would need baseline comparison
  
  return false;
};

/**
 * Extract evidence of vulnerability
 */
const extractEvidence = (response, payload) => {
  const responseText = JSON.stringify(response.data || "").toLowerCase();
  
  // Try to extract SQL error message
  const errorMatch = responseText.match(/(sql|mysql|postgresql|oracle|database).*error[^"]*/i);
  if (errorMatch) {
    return errorMatch[0].substring(0, 200);
  }
  
  // Return snippet of response
  return responseText.substring(0, 200);
};

/**
 * Perform attacks on all endpoints with all payloads
 */
export const performAttacks = async (endpoints, payloads) => {
  const results = [];
  
  console.log(`🚀 Starting attacks on ${endpoints.length} endpoints with ${payloads.length} payloads each...`);
  
  for (const endpoint of endpoints) {
    if (!endpoint.hasParams) {
      console.log(`⏭️  Skipping ${endpoint.url} - no parameters`);
      continue;
    }
    
    console.log(`🎯 Attacking endpoint: ${endpoint.url}`);
    
    for (const payload of payloads) {
      const result = await performSQLInjectionAttack(endpoint, payload);
      
      if (result.vulnerable) {
        console.log(`✅ VULNERABILITY FOUND: ${endpoint.url} with payload: ${payload}`);
        results.push(result);
      }
      
      // Small delay to avoid overwhelming the target
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  
  console.log(`✅ Attack phase completed. Found ${results.length} vulnerabilities.`);
  
  return results;
};
