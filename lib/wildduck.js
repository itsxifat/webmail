import axios from 'axios';
import https from 'https'; // Required for SSL handling

const client = axios.create({
  baseURL: process.env.WILDDUCK_API_URL, 
  timeout: 10000, // Increased timeout for remote connection
  headers: {
    'Content-Type': 'application/json',
  },
  // CRITICAL: This allows connection to your VPS even if the SSL cert 
  // matches the domain name but not the IP address we are using.
  httpsAgent: new https.Agent({  
    rejectUnauthorized: false 
  })
});

// --- 1. Get Domain ID Helper ---
export const getDomainId = async (domainName) => {
  try {
    const res = await client.get('/domain');
    
    if (res.data && res.data.results) {
      const found = res.data.results.find(d => d.name === domainName);
      return found ? found.id : null;
    }
    return null;
  } catch (error) {
    console.error("WildDuck Connection Error:", error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error("HINT: Check if port 8443 is open on your VPS (ufw allow 8443)");
    }
    return null;
  }
};

// --- 2. Register a Domain ---
export const createDomain = async (domainName) => {
  try {
    const res = await client.post('/domain', { name: domainName });
    return res.data;
  } catch (error) {
    const msg = error.response?.data?.message || error.message || 'Failed to create domain';
    throw new Error(msg);
  }
};

// --- 3. Create an Email User ---
export const createUser = async (username, password, domainId) => {
  try {
    const res = await client.post('/users', {
      username: username,
      password: password,
      domain: domainId, 
      name: username,
      quota: 1024 * 1024 * 1000 
    });
    return res.data;
  } catch (error) {
    const msg = error.response?.data?.message || error.message || 'Failed to create user';
    throw new Error(msg);
  }
};

export default client;