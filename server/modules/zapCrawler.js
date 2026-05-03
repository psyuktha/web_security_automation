import axios from "axios";

const ZAP_API_URL = process.env.ZAP_API_URL || "http://localhost:8090";
const ZAP_API_KEY = process.env.ZAP_API_KEY || "";

if (!ZAP_API_URL || ZAP_API_URL === "http://localhost:8090") {
  console.log("⚠️  ZAP_API_URL not explicitly set. Using default: http://localhost:8090. Override with ZAP_API_URL environment variable.");
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
const zapParams = (extra = {}) => {
  const p = { ...extra };
  if (ZAP_API_KEY) p.apikey = ZAP_API_KEY;
  return p;
};

const isHtmlResponse = (data) => {
  const text = typeof data === "string" ? data : JSON.stringify(data);
  return text.includes("<!doctype html>") || text.includes("<html");
};

/**
 * Infer body params from endpoint path when ZAP doesn't capture them
 * Uses generic parameter names to avoid hardcoded test data
 */
const inferBodyParams = (url) => {
  const path = new URL(url).pathname.toLowerCase();
  const genericParams = { input: "", value: "", data: "", query: "", search: "" };
  
  // Return minimal generic params - actual payload injection happens during attack phase
  if (path.includes("login") || path.includes("auth") || path.includes("signin"))
    return { username: "", password: "" };
  if (path.includes("register") || path.includes("signup"))
    return { username: "", password: "", email: "" };
  if (path.includes("search") || path.includes("query"))
    return { q: "", search: "" };
  
  return genericParams;
};

/**
 * Parse form-encoded or JSON body string into an object
 */
const parseBody = (bodyString) => {
  if (!bodyString || !bodyString.trim()) return {};
  try {
    // JSON body
    if (bodyString.trim().startsWith("{")) {
      return JSON.parse(bodyString);
    }
    // Form-encoded body: username=admin&password=test
    const result = {};
    bodyString.split("&").forEach((pair) => {
      const eqIdx = pair.indexOf("=");
      if (eqIdx === -1) return;
      const key = decodeURIComponent(pair.slice(0, eqIdx).trim());
      const val = decodeURIComponent(pair.slice(eqIdx + 1).trim());
      if (key) result[key] = val;
    });
    return result;
  } catch {
    return {};
  }
};

// ── ZAP SESSION ───────────────────────────────────────────────────────────────
export const initZAP = async () => {
  try {
    const response = await axios.get(`${ZAP_API_URL}/JSON/core/action/newSession/`, {
      params: zapParams(),
    });
    console.log("✅ ZAP session initialized");
    return response.data;
  } catch (error) {
    console.error("❌ Error initializing ZAP:", error.message);
    throw new Error("Failed to initialize ZAP. Make sure ZAP is running on port 8090.");
  }
};

// ── SPIDER ────────────────────────────────────────────────────────────────────
export const startSpiderScan = async (targetUrl) => {
  try {
    console.log(`🕷️  Starting spider scan for: ${targetUrl}`);

    const response = await axios.get(`${ZAP_API_URL}/JSON/spider/action/scan/`, {
      params: zapParams({ url: targetUrl, maxChildren: 10, recurse: true }),
      validateStatus: () => true,
    });

    if (isHtmlResponse(response.data)) {
      throw new Error(`ZAP is not accessible at ${ZAP_API_URL}. Make sure ZAP is running on port 8090.`);
    }

    let scanId = response.data?.scan ?? response.data?.scanId ?? response.data?.scanID;
    if (typeof scanId === "string" && /^\d+$/.test(scanId)) scanId = parseInt(scanId);

    if (scanId === undefined || scanId === null || scanId === "") {
      throw new Error("ZAP did not return a scan ID.");
    }

    console.log(`✅ Spider scan started with ID: ${scanId}`);
    return scanId.toString();
  } catch (error) {
    console.error("❌ Error starting spider scan:", error.message);
    throw new Error(`Failed to start spider scan: ${error.message}`);
  }
};

export const checkSpiderProgress = async (scanId) => {
  try {
    const response = await axios.get(`${ZAP_API_URL}/JSON/spider/view/status/`, {
      params: zapParams({ scanId }),
    });
    const progress = parseInt(response.data?.status ?? 0);
    return isNaN(progress) ? 0 : progress;
  } catch {
    return 0;
  }
};

export const waitForSpiderComplete = async (scanId, maxWaitTime = 300000) => {
  if (!scanId && scanId !== 0) throw new Error("Invalid scan ID");

  const startTime = Date.now();
  let lastProgress = -1;
  let noProgressCount = 0;

  while (Date.now() - startTime < maxWaitTime) {
    const progress = await checkSpiderProgress(scanId);

    if (progress >= 100) {
      console.log("✅ Spider scan completed");
      return true;
    }

    if (progress === lastProgress) {
      noProgressCount++;
      if (noProgressCount > 30) {
        console.warn("⚠️  Spider scan appears stuck, continuing anyway...");
        return true;
      }
    } else {
      noProgressCount = 0;
      lastProgress = progress;
    }

    console.log(`🕷️  Spider scan progress: ${progress}%`);
    await new Promise((r) => setTimeout(r, 2000));
  }

  throw new Error("Spider scan timeout");
};

// ── URL + MESSAGE FETCHERS ────────────────────────────────────────────────────
export const getDiscoveredUrls = async () => {
  try {
    const response = await axios.get(`${ZAP_API_URL}/JSON/core/view/urls/`, {
      params: zapParams(),
    });
    const urls = response.data?.urls || response.data || [];
    console.log(`✅ Discovered ${Array.isArray(urls) ? urls.length : 0} URLs`);
    return Array.isArray(urls) ? urls : [];
  } catch {
    return [];
  }
};

export const getMessages = async () => {
  try {
    const response = await axios.get(`${ZAP_API_URL}/JSON/core/view/messages/`, {
      params: zapParams(),
    });
    return response.data?.messages || response.data || [];
  } catch {
    return [];
  }
};

// ── MAIN EXTRACTOR ────────────────────────────────────────────────────────────
export const extractEndpoints = async (targetUrl) => {
  try {
    console.log("🔍 Extracting endpoints from crawled data...");

    // Init ZAP
    try {
      await initZAP();
    } catch (error) {
      console.warn("⚠️  ZAP init failed, using fallback:", error.message);
      return getFallbackEndpoints(targetUrl);
    }

    // Spider
    let scanId;
    try {
      scanId = await startSpiderScan(targetUrl);
    } catch (error) {
      console.warn("⚠️  Spider failed, using fallback:", error.message);
      return getFallbackEndpoints(targetUrl);
    }

    try {
      await waitForSpiderComplete(scanId, 60000);
    } catch (error) {
      console.warn("⚠️  Spider timeout, using what was discovered:", error.message);
    }

    const urls = await getDiscoveredUrls();
    const messages = await getMessages();

    console.log(`📨 ZAP captured ${messages.length} messages, ${urls.length} URLs`);

    const endpoints = [];
    const seen = new Map(); // key: "METHOD:pathname" → endpoint

    // ── Process ZAP messages ──────────────────────────────────
    for (const message of messages) {
      try {
        const requestLine = message.requestHeader?.split("\n")[0];
        if (!requestLine) continue;

        const parts = requestLine.trim().split(/\s+/);
        if (parts.length < 2) continue;

        const method = parts[0].toUpperCase();
        let rawUrl = parts[1];

        // Resolve relative URLs
        if (rawUrl.startsWith("/")) {
          const base = new URL(targetUrl);
          rawUrl = new URL(rawUrl, base.origin).toString();
        } else if (!rawUrl.startsWith("http")) {
          continue;
        }

        let urlObj;
        try {
          urlObj = new URL(rawUrl);
        } catch {
          continue;
        }

        // Only process URLs that belong to our target
        const targetOrigin = new URL(targetUrl).origin;
        if (!rawUrl.startsWith(targetOrigin)) continue;

        const dedupeKey = `${method}:${urlObj.pathname}`;

        // Extract URL params
        const urlParams = {};
        urlObj.searchParams.forEach((value, key) => {
          urlParams[key] = value;
        });

        // ── FIX: Extract body params properly ────────────────
        let bodyParams = {};
        if (method === "POST" || method === "PUT" || method === "PATCH") {
          if (message.requestBody) {
            bodyParams = parseBody(message.requestBody);
          }

          // ── FIX: If ZAP didn't capture body params, infer them from the path ──
          if (Object.keys(bodyParams).length === 0) {
            bodyParams = inferBodyParams(rawUrl);
            console.log(`🔧 Inferred body params for ${method} ${urlObj.pathname}:`, bodyParams);
          }
        }

        const hasParams =
          Object.keys(urlParams).length > 0 || Object.keys(bodyParams).length > 0;

        if (!seen.has(dedupeKey)) {
          const ep = {
            url: rawUrl,
            method,
            urlParams,
            bodyParams,
            hasParams,
          };
          seen.set(dedupeKey, ep);
          endpoints.push(ep);
        }
      } catch {
        continue;
      }
    }

    // ── Also process raw discovered URLs (GET endpoints ZAP saw but didn't message) ──
    for (const rawUrl of urls) {
      try {
        const urlObj = new URL(rawUrl);
        const targetOrigin = new URL(targetUrl).origin;
        if (!rawUrl.startsWith(targetOrigin)) continue;

        const dedupeKey = `GET:${urlObj.pathname}`;
        if (seen.has(dedupeKey)) continue; // already have it from messages

        const urlParams = {};
        urlObj.searchParams.forEach((value, key) => {
          urlParams[key] = value;
        });

        const ep = {
          url: rawUrl,
          method: "GET",
          urlParams,
          bodyParams: {},
          hasParams: Object.keys(urlParams).length > 0,
        };

        seen.set(dedupeKey, ep);
        endpoints.push(ep);
      } catch {
        continue;
      }
    }

    console.log(`✅ Extracted ${endpoints.length} unique endpoints`);
    endpoints.forEach((ep) =>
      console.log(`   ${ep.method} ${ep.url} — params: ${JSON.stringify({ ...ep.urlParams, ...ep.bodyParams })}`)
    );

    return endpoints.length > 0 ? endpoints : getFallbackEndpoints(targetUrl);
  } catch (error) {
    console.error("❌ Error extracting endpoints:", error.message);
    return getFallbackEndpoints(targetUrl);
  }
};

// ── FALLBACK ──────────────────────────────────────────────────────────────────
const getFallbackEndpoints = (targetUrl) => {
  console.log("⚠️  Using fallback endpoint extraction");

  // These mirror the actual routes in app.py
  const routes = [
    { path: "/login",           method: "POST", body: { username: "admin", password: "password" }, url: {} },
    { path: "/users/search",    method: "GET",  body: {},                                           url: { q: "admin" } },
    { path: "/products/1",      method: "GET",  body: {},                                           url: {} },
    { path: "/orders/history",  method: "GET",  body: {},                                           url: { user_id: "1" } },
    { path: "/admin/query",     method: "POST", body: { token: "faketoken", query: "SELECT * FROM products" }, url: {} },
  ];

  const endpoints = routes.map((r) => {
    const url = new URL(r.path, targetUrl).toString();
    const urlObj = new URL(url);
    // For GET endpoints with url params, append them
    for (const [k, v] of Object.entries(r.url)) {
      urlObj.searchParams.set(k, v);
    }
    return {
      url: urlObj.toString(),
      method: r.method,
      urlParams: r.url,
      bodyParams: r.body,
      hasParams: Object.keys(r.url).length > 0 || Object.keys(r.body).length > 0,
    };
  });

  console.log(`✅ Created ${endpoints.length} fallback endpoints`);
  endpoints.forEach((ep) =>
    console.log(`   ${ep.method} ${ep.url} — params: ${JSON.stringify({ ...ep.urlParams, ...ep.bodyParams })}`)
  );

  return endpoints;
};