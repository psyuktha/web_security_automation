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
 * Convenience function to fetch a page and parse its DOM looking for a CSRF user_token
 */
export const fetchCsrfToken = async (client, url) => {
  try {
    const response = await client.get(url, { timeout: 10000 });
    const $ = cheerio.load(response.data || '');
    const token = $('input[name="user_token"]').first().val();
    return token;
  } catch (error) {
    console.error(`❌ Failed to fetch CSRF token from ${url}:`, error.message);
    return null;
  }
};

/**
 * Login flow specifically designed for DVWA targets.
 * Extracts the initial CSRF token, posts login credentials, and drops security to LOW.
 */
export const loginToDVWA = async (client, targetUrl) => {
  try {
    console.log("🔐 Initiating DVWA Login Flow...");
    
    // 1. Fetch the login page to gather cookie and CSRF token
    const loginUrl = new URL('/login.php', targetUrl).toString();
    const csrfToken = await fetchCsrfToken(client, loginUrl);
    
    if (!csrfToken) {
      console.warn("⚠️ Could not find CSRF token on login page. Trying to proceed anyway...");
    } else {
      console.log(`🎫 Extracted CSRF Token: ${csrfToken}`);
    }

    // 2. Perform Login POST
    const params = new URLSearchParams();
    params.append('username', 'admin');
    params.append('password', 'password');
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

    if (loginResponse.data?.includes("Welcome to Damn Vulnerable Web Application!") || loginResponse.status === 302) {
      console.log("✅ Successfully logged into DVWA");
    } else {
      console.warn("⚠️ Login might have failed. Unexpected response.");
    }

    // 3. Optional Bonus: Downgrade security level to LOW to ensure simpler vulnerabilities are exposed
    const securityUrl = new URL('/security.php', targetUrl).toString();
    const securityCsrf = await fetchCsrfToken(client, securityUrl);
    
    if (securityCsrf) {
      const secParams = new URLSearchParams();
      secParams.append('security', 'low');
      secParams.append('seclev_submit', 'Submit');
      secParams.append('user_token', securityCsrf);

      await client.post(securityUrl, secParams.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Referer': securityUrl }
      });
      console.log("✅ Set DVWA security level to LOW");
    }
    
    return true;
  } catch (error) {
    console.error("❌ Error setting up DVWA session:", error);
    return false;
  }
};
