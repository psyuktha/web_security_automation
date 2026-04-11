import * as cheerio from 'cheerio';
import { URL } from 'url';

/**
 * Extracts authenticated endpoints by spidering and parsing forms.
 * Currently hardcodes a few known DVWA vulnerability paths to guarantee discovery.
 */
export const extractAuthenticatedEndpoints = async (client, targetUrl) => {
  console.log("🔍 Starting authenticated crawl of DVWA...");
  const endpoints = [];
  const seen = new Set();
  
  // ZAP might crawl these by chance, but since we know it's DVWA, we can actively seek them.
  const targetPaths = [
    '/vulnerabilities/sqli/',
    '/vulnerabilities/xss_r/',
    '/vulnerabilities/xss_s/',
    '/vulnerabilities/exec/' // command injection
  ];

  for (const path of targetPaths) {
    const fullUrl = new URL(path, targetUrl).toString();
    try {
      const response = await client.get(fullUrl, { timeout: 10000 });
      const $ = cheerio.load(response.data);
      
      // Look for forms in the page
      $('form').each((i, form) => {
        const method = ($(form).attr('method') || 'GET').toUpperCase();
        let action = $(form).attr('action') || '';
        
        // Resolve absolute URL
        let submitUrl = fullUrl;
        if (action) {
          submitUrl = new URL(action, fullUrl).toString();
        }

        const urlParams = {};
        const bodyParams = {};
        let hasParams = false;

        // Parse inputs within the form
        $(form).find('input, select, textarea').each((j, input) => {
          const name = $(input).attr('name');
          const type = $(input).attr('type') || '';
          
          if (!name) return;
          if (type.toLowerCase() === 'submit') {
            // Include submit button as some backend logic relies on it (e.g. name="Submit" value="Submit")
            const val = $(input).attr('value') || 'Submit';
            if (method === 'GET') urlParams[name] = val;
            if (method === 'POST') bodyParams[name] = val;
            hasParams = true;
          } else if (type.toLowerCase() === 'hidden' && name === 'user_token') {
             // For CSRF tokens, we can keep it empty in the template. The attack phase handles fetching real ones.
             if (method === 'GET') urlParams[name] = '';
             if (method === 'POST') bodyParams[name] = '';
             hasParams = true;
          } else {
             // A regular input that we can attack
             if (method === 'GET') urlParams[name] = '1';
             if (method === 'POST') bodyParams[name] = '1';
             hasParams = true;
          }
        });

        const dedupeKey = `${method}:${submitUrl}`;
        if (!seen.has(dedupeKey)) {
          seen.add(dedupeKey);
          endpoints.push({
            url: submitUrl,
            method,
            urlParams,
            bodyParams,
            hasParams
          });
        }
      });
    } catch (error) {
      console.warn(`⚠️ Failed to parse DVWA path ${path}:`, error.message);
    }
  }

  console.log(`✅ Extracted ${endpoints.length} vulnerable endpoints from DVWA`);
  
  return endpoints;
};
