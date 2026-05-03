import * as cheerio from 'cheerio';
import { URL } from 'url';

/**
 * Extracts authenticated endpoints by spidering the target and parsing forms.
 * Uses dynamic crawling to discover actual endpoints on the target.
 */
export const extractAuthenticatedEndpoints = async (client, targetUrl) => {
  console.log("🔍 Starting authenticated crawl of target...");
  const endpoints = [];
  const seen = new Set();
  
  // Dynamically discover paths by crawling the target
  const targetPaths = [];
  const crawlResponse = await client.get(targetUrl, { timeout: 10000 }).catch(() => null);
  
  if (crawlResponse?.data) {
    const $ = cheerio.load(crawlResponse.data);
    // Extract all links from page
    $('a[href]').each((i, link) => {
      const href = $(link).attr('href');
      if (href && !href.startsWith('javascript:') && !href.startsWith('#')) {
        try {
          const absoluteUrl = new URL(href, targetUrl).toString();
          if (absoluteUrl.startsWith(targetUrl)) {
            const path = new URL(absoluteUrl).pathname;
            if (path && !targetPaths.includes(path)) {
              targetPaths.push(path);
            }
          }
        } catch (e) {
          // Ignore invalid URLs
        }
      }
    });
  }
  
  // If no paths discovered, crawl root and common paths
  if (targetPaths.length === 0) {
    targetPaths.push('/');
  }

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
            // Include submit button as some backend logic relies on it
            const val = $(input).attr('value') || 'Submit';
            if (method === 'GET') urlParams[name] = val;
            if (method === 'POST') bodyParams[name] = val;
            hasParams = true;
          } else if (type.toLowerCase() === 'hidden') {
             // Include hidden fields (may include CSRF tokens with various names)
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
