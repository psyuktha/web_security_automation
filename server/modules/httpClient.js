import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import * as cheerio from 'cheerio';

/**
 * Creates a session-aware Axios client configured with a cookie jar
 */
export const createSessionClient = () => {
  const jar = new CookieJar();
  const client = wrapper(axios.create({
    jar,
    withCredentials: true,
    validateStatus: () => true, // Don't throw on non-200 responses
    headers: {
      'User-Agent': 'Security-Scanner/1.0',
    },
  }));
  return client;
};

/**
 * Convenience function to fetch a page and parse its DOM looking for a CSRF token
 * Tries common CSRF token field names
 */
export const fetchCsrfToken = async (client, url) => {
  try {
    const response = await client.get(url, { timeout: 10000 });
    const $ = cheerio.load(response.data || '');
    
    // Try common CSRF token field names
    const tokenFieldNames = ['user_token', 'csrf_token', 'token', '_token', 'csrf', 'authenticity_token', '_csrf'];
    for (const fieldName of tokenFieldNames) {
      const token = $(`input[name="${fieldName}"]`).first().val();
      if (token) {
        console.log(`✅ Found CSRF token field: ${fieldName}`);
        return token;
      }
    }
    
    console.warn(`⚠️  No CSRF token found in common fields`);
    return null;
  } catch (error) {
    console.error(`❌ Failed to fetch CSRF token from ${url}:`, error.message);
    return null;
  }
};

/**
 * Attempts login to the target application if authentication is available.
 * Looks for common login forms and extracts credentials from environment.
 */
export const loginToDVWA = async (client, targetUrl) => {
  try {
    console.log("🔐 Initiating authentication flow...");
    
    // 1. Fetch the login page to gather cookie and CSRF token
    // Try common login paths
    let loginUrl = null;
    for (const loginPath of ['/login.php', '/login', '/auth/login', '/signin']) {
      try {
        const testUrl = new URL(loginPath, targetUrl).toString();
        const response = await client.get(testUrl, { timeout: 5000 }).catch(() => null);
        if (response?.status === 200) {
          loginUrl = testUrl;
          break;
        }
      } catch (e) {
        // Try next path
      }
    }
    
    if (!loginUrl) {
      console.warn("⚠️ Could not find login page");
      return false;
    }
    
    const csrfToken = await fetchCsrfToken(client, loginUrl);
    
    if (!csrfToken) {
      console.warn("⚠️ Could not find CSRF token on login page. Trying to proceed anyway...");
    } else {
      console.log(`🎫 Extracted CSRF Token: ${csrfToken}`);
    }

    // 2. Perform Login POST with credentials from environment
    const params = new URLSearchParams();
    const username = process.env.TARGET_USERNAME || process.env.LOGIN_USERNAME || '';
    const password = process.env.TARGET_PASSWORD || process.env.LOGIN_PASSWORD || '';
    
    if (!username || !password) {
      console.warn("⚠️  TARGET_USERNAME and TARGET_PASSWORD not set. Authentication may fail.");
    }
    params.append('Login', 'Login');
    if (csrfToken) {
      params.append('user_token', csrfToken);
    }

    const loginResponse = await client.post(loginUrl, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': loginUrl
      }
    });

    // Check for successful login (redirect or success indicators)
    if (loginResponse.status === 302 || loginResponse.status === 200) {
      console.log("✅ Successfully authenticated");
    } else {
      console.warn("⚠️ Login might have failed. Unexpected response.");
    }

    // 3. Optional: Modify security/difficulty settings if available
    const securityUrl = new URL('/security.php', targetUrl).toString();
    const securityResponse = await client.get(securityUrl, { timeout: 5000 }).catch(() => null);
    
    if (securityResponse?.status === 200) {
      const securityCsrf = await fetchCsrfToken(client, securityUrl);
      
      if (securityCsrf) {
        const secParams = new URLSearchParams();
        const securityLevel = process.env.TARGET_SECURITY_LEVEL || 'low';
        secParams.append('security', securityLevel);
        secParams.append('seclev_submit', 'Submit');
        secParams.append('user_token', securityCsrf);

        await client.post(securityUrl, secParams.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Referer': securityUrl }
        });
        console.log(`✅ Set security level to ${securityLevel}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error("❌ Error setting up DVWA session:", error);
    return false;
  }
};
