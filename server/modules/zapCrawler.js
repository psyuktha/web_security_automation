import axios from "axios";

const ZAP_API_URL = process.env.ZAP_API_URL || "http://localhost:8090";
const ZAP_API_KEY = process.env.ZAP_API_KEY || "";

/**
 * Initialize ZAP session
 */
export const initZAP = async () => {
  try {
    const params = {};
    if (ZAP_API_KEY) {
      params.apikey = ZAP_API_KEY;
    }
    
    const response = await axios.get(`${ZAP_API_URL}/JSON/core/action/newSession/`, {
      params: params,
    });
    console.log("✅ ZAP session initialized");
    return response.data;
  } catch (error) {
    console.error("❌ Error initializing ZAP:", error.message);
    if (error.response) {
      console.error("❌ ZAP API error:", error.response.data);
    }
    throw new Error("Failed to initialize ZAP. Make sure ZAP is running on port 8090.");
  }
};

/**
 * Start spider scan to crawl the website
 */
export const startSpiderScan = async (targetUrl) => {
  try {
    console.log(`🕷️  Starting spider scan for: ${targetUrl}`);
    
    const params = {
      url: targetUrl,
      maxChildren: 10,
      recurse: true,
    };
    
    // Add API key only if it's set
    if (ZAP_API_KEY) {
      params.apikey = ZAP_API_KEY;
    }
    
    const response = await axios.get(`${ZAP_API_URL}/JSON/spider/action/scan/`, {
      params: params,
      validateStatus: () => true, // Accept any status code
    });

    // Check if response is HTML (means ZAP is not running or wrong URL)
    const responseText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    if (responseText.includes('<!doctype html>') || responseText.includes('<html')) {
      console.error("❌ ZAP returned HTML instead of JSON. This means:");
      console.error("   1. ZAP is not running on port 8090, OR");
      console.error("   2. ZAP_API_URL is pointing to the wrong port (check your .env file)");
      console.error(`   Current ZAP_API_URL: ${ZAP_API_URL}`);
      throw new Error(`ZAP is not accessible at ${ZAP_API_URL}. Make sure ZAP is running on port 8090.`);
    }

    console.log("🔍 ZAP API Response:", JSON.stringify(response.data, null, 2));

    // Handle different response formats - ZAP returns scan ID in different formats
    let scanId = response.data?.scan || response.data?.scanId || response.data?.scanID;
    
    // Sometimes ZAP returns the scan ID as a number in a string
    if (typeof scanId === 'string' && scanId.match(/^\d+$/)) {
      scanId = parseInt(scanId);
    }
    
    // Check if scanId is valid (0 is a valid scan ID)
    if (scanId === undefined || scanId === null || (typeof scanId === 'string' && scanId === '')) {
      console.error("❌ ZAP response:", JSON.stringify(response.data, null, 2));
      console.error("❌ ZAP did not return a valid scan ID");
      throw new Error("ZAP did not return a scan ID. Check ZAP API response format.");
    }
    
    console.log(`✅ Spider scan started with ID: ${scanId} (type: ${typeof scanId})`);
    
    return scanId.toString(); // Ensure it's a string
  } catch (error) {
    console.error("❌ Error starting spider scan:", error.message);
    if (error.response) {
      console.error("❌ ZAP API error response:", error.response.data);
    }
    throw new Error(`Failed to start spider scan: ${error.message}`);
  }
};

/**
 * Check spider scan progress
 */
export const checkSpiderProgress = async (scanId) => {
  try {
    if (!scanId && scanId !== 0) {
      console.error("❌ Invalid scan ID:", scanId);
      return 0;
    }
    
    const params = { scanId: scanId };
    if (ZAP_API_KEY) {
      params.apikey = ZAP_API_KEY;
    }
    
    const response = await axios.get(`${ZAP_API_URL}/JSON/spider/view/status/`, {
      params: params,
    });

    const status = response.data?.status || response.data?.status || 0;
    const progress = parseInt(status);
    
    if (isNaN(progress)) {
      console.error("❌ Invalid progress value:", status);
      return 0;
    }
    
    return progress;
  } catch (error) {
    console.error("❌ Error checking spider progress:", error.message);
    if (error.response) {
      console.error("❌ ZAP API error:", error.response.data);
    }
    return 0;
  }
};

/**
 * Wait for spider scan to complete
 */
export const waitForSpiderComplete = async (scanId, maxWaitTime = 300000) => {
  if (!scanId && scanId !== 0) {
    throw new Error("Invalid scan ID provided");
  }
  
  const startTime = Date.now();
  let lastProgress = -1;
  let noProgressCount = 0;
  
  while (Date.now() - startTime < maxWaitTime) {
    const progress = await checkSpiderProgress(scanId);
    
    if (isNaN(progress) || progress < 0) {
      console.error(`❌ Invalid progress value: ${progress}`);
      throw new Error("Failed to get valid scan progress");
    }
    
    if (progress >= 100) {
      console.log("✅ Spider scan completed");
      return true;
    }
    
    // Check if progress is stuck
    if (progress === lastProgress) {
      noProgressCount++;
      if (noProgressCount > 30) { // 60 seconds with no progress
        console.warn("⚠️  Spider scan appears stuck, continuing anyway...");
        return true; // Continue even if not 100%
      }
    } else {
      noProgressCount = 0;
      lastProgress = progress;
    }
    
    console.log(`🕷️  Spider scan progress: ${progress}%`);
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
  }
  
  throw new Error("Spider scan timeout");
};

/**
 * Get discovered URLs/endpoints from ZAP
 */
export const getDiscoveredUrls = async () => {
  try {
    const params = {};
    if (ZAP_API_KEY) {
      params.apikey = ZAP_API_KEY;
    }
    
    const response = await axios.get(`${ZAP_API_URL}/JSON/core/view/urls/`, {
      params: params,
    });

    const urls = response.data?.urls || response.data || [];
    console.log(`✅ Discovered ${Array.isArray(urls) ? urls.length : 0} URLs/endpoints`);
    
    return Array.isArray(urls) ? urls : [];
  } catch (error) {
    console.error("❌ Error getting discovered URLs:", error.message);
    if (error.response) {
      console.error("❌ ZAP API error:", error.response.data);
    }
    return [];
  }
};

/**
 * Get messages (requests/responses) from ZAP
 */
export const getMessages = async () => {
  try {
    const params = {};
    if (ZAP_API_KEY) {
      params.apikey = ZAP_API_KEY;
    }
    
    const response = await axios.get(`${ZAP_API_URL}/JSON/core/view/messages/`, {
      params: params,
    });

    return response.data?.messages || response.data || [];
  } catch (error) {
    console.error("❌ Error getting messages:", error.message);
    if (error.response) {
      console.error("❌ ZAP API error:", error.response.data);
    }
    return [];
  }
};

/**
 * Extract endpoints with parameters from discovered URLs
 */
export const extractEndpoints = async (targetUrl) => {
  try {
    console.log("🔍 Extracting endpoints from crawled data...");
    
    // Initialize ZAP
    try {
      await initZAP();
    } catch (error) {
      console.warn("⚠️  ZAP initialization failed, using fallback:", error.message);
      return getFallbackEndpoints(targetUrl);
    }
    
    // Start spider scan
    let scanId;
    try {
      scanId = await startSpiderScan(targetUrl);
      if (!scanId && scanId !== 0) {
        throw new Error("Failed to get scan ID from ZAP");
      }
    } catch (error) {
      console.warn("⚠️  Failed to start spider scan, using fallback:", error.message);
      return getFallbackEndpoints(targetUrl);
    }
    
    // Wait for completion (with shorter timeout for faster fallback)
    try {
      await waitForSpiderComplete(scanId, 60000); // 1 minute timeout
    } catch (error) {
      console.warn("⚠️  Spider scan timeout, using discovered URLs anyway:", error.message);
      // Continue to try to get URLs even if scan didn't complete
    }
    
    // Get discovered URLs
    const urls = await getDiscoveredUrls();
    
    // Get messages to extract parameters
    const messages = await getMessages();
    
    // Extract endpoints with parameters
    const endpoints = [];
    const processedUrls = new Set();
    
    // Process messages
    for (const message of messages) {
      try {
        const requestLine = message.requestHeader?.split("\n")[0];
        if (!requestLine) continue;
        
        const parts = requestLine.split(" ");
        if (parts.length < 2) continue;
        
        const method = parts[0];
        let url = parts[1];
        
        // Handle relative URLs
        if (url.startsWith("/")) {
          try {
            const baseUrl = new URL(targetUrl);
            url = new URL(url, baseUrl.origin).toString();
          } catch (e) {
            continue;
          }
        } else if (!url.startsWith("http")) {
          continue;
        }
        
        if (!url || processedUrls.has(url)) continue;
        processedUrls.add(url);
        
        // Extract parameters from URL and request body
        let urlObj;
        try {
          urlObj = new URL(url);
        } catch (e) {
          continue;
        }
        
        const params = {};
        
        // URL parameters
        urlObj.searchParams.forEach((value, key) => {
          params[key] = value;
        });
        
        // Request body parameters (if POST)
        let bodyParams = {};
        if (message.requestBody) {
          try {
            if (message.requestBody.includes("&")) {
              // Form data
              message.requestBody.split("&").forEach((param) => {
                const [key, value] = param.split("=");
                if (key) bodyParams[key] = decodeURIComponent(value || "");
              });
            } else if (message.requestBody.startsWith("{")) {
              // JSON
              bodyParams = JSON.parse(message.requestBody);
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
        
        endpoints.push({
          url: url,
          method: method,
          urlParams: params,
          bodyParams: bodyParams,
          hasParams: Object.keys(params).length > 0 || Object.keys(bodyParams).length > 0,
        });
      } catch (error) {
        // Skip malformed messages
        continue;
      }
    }
    
    // If no endpoints found, add discovered URLs as basic endpoints
    if (endpoints.length === 0 && urls.length > 0) {
      for (const url of urls) {
        try {
          const urlObj = new URL(url);
          const params = {};
          urlObj.searchParams.forEach((value, key) => {
            params[key] = value;
          });
          
          endpoints.push({
            url: url,
            method: "GET",
            urlParams: params,
            bodyParams: {},
            hasParams: Object.keys(params).length > 0,
          });
        } catch (e) {
          // Skip invalid URLs
        }
      }
    }
    
    console.log(`✅ Extracted ${endpoints.length} endpoints with parameters`);
    
    return endpoints.length > 0 ? endpoints : getFallbackEndpoints(targetUrl);
  } catch (error) {
    console.error("❌ Error extracting endpoints:", error.message);
    return getFallbackEndpoints(targetUrl);
  }
};

/**
 * Fallback endpoints if ZAP fails
 */
const getFallbackEndpoints = (targetUrl) => {
  console.log("⚠️  Using fallback endpoint extraction");
  
  try {
    const urlObj = new URL(targetUrl);
    const endpoints = [];
    
    // Create endpoints with common parameter names for testing
    const commonParams = ["id", "user", "email", "username", "password", "search", "q", "query", "page", "limit"];
    
    // Main URL with parameters
    const mainUrl = new URL(targetUrl);
    const mainParams = {};
    // Add a test parameter
    mainParams["id"] = "1";
    endpoints.push({
      url: targetUrl,
      method: "GET",
      urlParams: mainParams,
      bodyParams: {},
      hasParams: true,
    });
    
    // Add common endpoints with parameters
    const commonPaths = [
      { path: "/login", method: "POST", params: { username: "test", password: "test" } },
      { path: "/search", method: "GET", params: { q: "test" } },
      { path: "/api/users", method: "GET", params: { id: "1" } },
      { path: "/admin", method: "GET", params: { page: "1" } },
      { path: "/user", method: "GET", params: { id: "1" } },
    ];
    
    for (const item of commonPaths) {
      try {
        const endpointUrl = new URL(item.path, targetUrl).toString();
        endpoints.push({
          url: endpointUrl,
          method: item.method,
          urlParams: item.method === "GET" ? item.params : {},
          bodyParams: item.method === "POST" ? item.params : {},
          hasParams: true,
        });
      } catch (e) {
        // Skip invalid URLs
      }
    }
    
    console.log(`✅ Created ${endpoints.length} fallback endpoints with parameters`);
    return endpoints;
  } catch (error) {
    // Even if URL parsing fails, create at least one endpoint with params
    return [
      {
        url: targetUrl,
        method: "GET",
        urlParams: { id: "1", test: "value" },
        bodyParams: {},
        hasParams: true,
      },
    ];
  }
};
