// lib/mailcow.js

// 1. Configuration
// We strip any trailing slashes from the host URL to ensure clean API paths
const RAW_URL = process.env.MAILCOW_HOST || "";
const API_URL = RAW_URL.endsWith('/') ? RAW_URL.slice(0, -1) : RAW_URL;
const API_KEY = process.env.MAILCOW_API_KEY;

if (!API_URL || !API_KEY) {
  console.warn("⚠️ MAILCOW_HOST or MAILCOW_API_KEY is missing in .env file.");
}

/**
 * Core Helper Function to talk to Mailcow API
 */
export async function mailcowRequest(endpoint, method = 'GET', body = null) {
  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
  };

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  // Handle leading slashes to avoid double // in URL
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  try {
    const res = await fetch(`${API_URL}/api/v1/${cleanEndpoint}`, options);
    
    // If the server returns 401/403/500, we should know
    if (!res.ok) {
        const errorText = await res.text();
        console.error(`Mailcow API Error [${res.status}]: ${errorText}`);
        return { type: 'error', msg: `API Error ${res.status}: ${res.statusText}` };
    }

    // Parse JSON
    const data = await res.json();
    return data;

  } catch (error) {
    console.error("Mailcow Fetch Failed:", error);
    return { type: 'error', msg: "Network error connecting to Mail server" };
  }
}

// --- DOMAIN FUNCTIONS ---

/**
 * 1. Create a Domain
 * Required for: app/api/domains/route.js
 */
export async function createDomain(domainName, packageLimitGB = 10) {
  // Convert GB to MB for Mailcow (10GB = 10240MB)
  const maxQuotaMB = packageLimitGB * 1024; 

  return await mailcowRequest('add/domain', 'POST', {
    domain: domainName,
    active: 1,
    description: "Created via Enfinito Cloud SaaS",
    // Set global limits for this domain
    def_new_mailbox_quota: 3072, // Default 3GB per mailbox
    max_quota_for_domain: maxQuotaMB * 1024 * 1024, // Bytes
    max_num_mboxes_for_domain: 100 // High default, we limit via SaaS DB instead
  });
}

/**
 * 2. Get General Domain Info
 * Useful for debugging or validation
 */
export async function getDomain(domainName) {
  return await mailcowRequest(`get/domain/${domainName}`);
}

// --- MAILBOX FUNCTIONS ---

/**
 * 3. Create a Mailbox
 * Required for: app/api/mailboxes/route.js
 */
export async function createMailbox(domain, localPart, name, password) {
  return await mailcowRequest('add/mailbox', 'POST', {
    local_part: localPart,
    domain: domain,
    password: password,
    name: name,
    active: 1,
    quota: 3072 // 3GB default quota
  });
}

/**
 * 4. Get All Mailboxes
 * Required for: app/api/saas/stats/route.js (Counting user mailboxes)
 */
export async function getAllMailboxes() {
  return await mailcowRequest('get/mailbox/all');
}

// --- SECURITY & DNS FUNCTIONS ---

/**
 * 5. Get DKIM Keys
 * Required for: Domain Setup Instructions page
 */
export async function getDKIM(domainName) {
  return await mailcowRequest(`get/dkim/${domainName}`);
}