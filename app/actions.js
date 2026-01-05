// app/actions.js
'use server'
import { createDomain, createUser, getDomainId } from '@/lib/wildduck'; 
// Note: If @ alias isn't set up, use: import { ... } from '../lib/wildduck';

export async function registerDomainAndUser(formData) {
  const domainName = formData.get('domain');
  const username = formData.get('username');
  const password = formData.get('password');

  if (!domainName || !username || !password) {
    return { success: false, message: "All fields are required." };
  }

  try {
    // Step A: Check if domain exists, if not create it
    let domainId = await getDomainId(domainName);
    
    if (!domainId) {
      console.log(`Domain ${domainName} not found. Creating new...`);
      const newDomain = await createDomain(domainName);
      domainId = newDomain.id;
    }

    // Step B: Create the User
    const newUser = await createUser(username, password, domainId);

    return { 
      success: true, 
      message: `Successfully created ${username}@${domainName}`,
      data: newUser
    };

  } catch (error) {
    console.error("Registration Error:", error);
    return { success: false, message: error.message };
  }
}