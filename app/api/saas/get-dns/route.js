import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Domain from "@/models/Domain";

export async function POST(req) {
  try {
    console.log("[DEBUG] Incoming DNS records request");
    
    await dbConnect();
    const session = await auth();
    
    if (!session?.user) {
      console.log("[DEBUG] Unauthorized request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { domain } = await req.json();
    const cleanDomain = domain.toLowerCase().trim();

    console.log("[DEBUG] Fetching DNS records for domain:", cleanDomain);

    // -------------------------
    // 1. VERIFY OWNERSHIP
    // -------------------------
    const domainDoc = await Domain.findOne({ 
      name: cleanDomain, 
      user: session.user.id 
    });
    
    if (!domainDoc) {
      console.log("[DEBUG] Domain not found or unauthorized");
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    // -------------------------
    // 2. MAILCOW API CONFIG
    // -------------------------
    let host = process.env.MAILCOW_HOST || "";
    if (!host.startsWith("http")) host = "https://" + host;
    host = host.replace(/\/$/, "");

    const MAILCOW_API = `${host}/api/v1`;
    const HEADERS = {
      "Content-Type": "application/json",
      "X-API-Key": process.env.MAILCOW_API_KEY
    };

    // Your mail server hostname (from MAILCOW_HOSTNAME env variable)
    const mailServer = process.env.MAILCOW_HOSTNAME || "mail.enfinito.cloud";

    console.log("[DEBUG] Mailcow host:", host);
    console.log("[DEBUG] Mail server:", mailServer);

    // -------------------------
    // 3. FETCH DKIM FROM MAILCOW
    // -------------------------
    let dkimData = null;
    let dkimSelector = "dkim"; // Default selector
    let dkimPublicKey = "";
    let dkimTxtRecord = "";

    try {
      console.log("[DEBUG] Fetching DKIM from Mailcow API:", `${MAILCOW_API}/get/dkim/${cleanDomain}`);
      
      const dkimRes = await fetch(`${MAILCOW_API}/get/dkim/${cleanDomain}`, {
        method: "GET",
        headers: HEADERS
      });

      if (!dkimRes.ok) {
        console.log("[ERROR] Mailcow DKIM fetch failed with status:", dkimRes.status);
        const errorText = await dkimRes.text();
        console.log("[ERROR] Response:", errorText);
      } else {
        const data = await dkimRes.json();
        console.log("[DEBUG] Raw DKIM API response:", JSON.stringify(data, null, 2));

        // Mailcow returns different response structures:
        // Option 1: Direct object with dkim_txt, pubkey, etc
        // Option 2: Object keyed by domain name
        
        if (data) {
          // Check if response is keyed by domain
          if (data[cleanDomain]) {
            dkimData = data[cleanDomain];
            console.log("[DEBUG] Found DKIM data under domain key");
          } 
          // Check if response has direct DKIM fields
          else if (data.dkim_txt || data.pubkey || data.dkim_selector) {
            dkimData = data;
            console.log("[DEBUG] Found DKIM data in direct response");
          }
          // Check if it's an array response
          else if (Array.isArray(data) && data.length > 0) {
            dkimData = data[0];
            console.log("[DEBUG] Found DKIM data in array response");
          }
        }

        if (dkimData) {
          // Extract DKIM information
          dkimSelector = dkimData.dkim_selector || "dkim";
          dkimPublicKey = dkimData.pubkey || dkimData.dkim_public || "";
          dkimTxtRecord = dkimData.dkim_txt || "";

          console.log("[DEBUG] DKIM Selector:", dkimSelector);
          console.log("[DEBUG] DKIM Public Key (first 50 chars):", dkimPublicKey.substring(0, 50));
          console.log("[DEBUG] DKIM TXT Record (first 50 chars):", dkimTxtRecord.substring(0, 50));
        } else {
          console.log("[WARN] No DKIM data found in response");
        }
      }
    } catch (e) {
      console.error("[ERROR] Failed to fetch DKIM:", e.message);
      console.error("[ERROR] Stack:", e.stack);
    }

    // -------------------------
    // 4. GENERATE DKIM IF MISSING
    // -------------------------
    if (!dkimPublicKey || !dkimTxtRecord) {
      console.log("[DEBUG] DKIM not found, attempting to generate...");
      
      try {
        const generateRes = await fetch(`${MAILCOW_API}/add/dkim`, {
          method: "POST",
          headers: HEADERS,
          body: JSON.stringify({
            domains: [cleanDomain],
            dkim_selector: "dkim",
            key_size: 2048
          })
        });

        const generateData = await generateRes.json();
        console.log("[DEBUG] DKIM generation response:", JSON.stringify(generateData, null, 2));

        if (generateRes.ok) {
          // Wait a moment for DKIM to be generated
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Fetch DKIM again
          const refetchRes = await fetch(`${MAILCOW_API}/get/dkim/${cleanDomain}`, {
            method: "GET",
            headers: HEADERS
          });

          if (refetchRes.ok) {
            const refetchData = await refetchRes.json();
            console.log("[DEBUG] Refetched DKIM data:", JSON.stringify(refetchData, null, 2));

            // Parse refetched data
            let refetchDkim = null;
            if (refetchData[cleanDomain]) {
              refetchDkim = refetchData[cleanDomain];
            } else if (refetchData.dkim_txt || refetchData.pubkey) {
              refetchDkim = refetchData;
            }

            if (refetchDkim) {
              dkimSelector = refetchDkim.dkim_selector || "dkim";
              dkimPublicKey = refetchDkim.pubkey || refetchDkim.dkim_public || "";
              dkimTxtRecord = refetchDkim.dkim_txt || "";
              console.log("[DEBUG] Successfully retrieved generated DKIM");
            }
          }
        } else {
          console.log("[WARN] DKIM generation failed or DKIM already exists");
        }
      } catch (e) {
        console.error("[ERROR] Failed to generate DKIM:", e.message);
      }
    }

    // -------------------------
    // 5. CONSTRUCT DNS RECORDS
    // -------------------------
    // Clean DKIM key (remove line breaks and extra spaces)
    const cleanDkimKey = dkimPublicKey.replace(/[\r\n\s]+/g, "");
    
    // Build full DKIM TXT record value
    let dkimRecordValue;
    if (dkimTxtRecord) {
      // Use the full txt record if available
      dkimRecordValue = dkimTxtRecord.replace(/[\r\n]+/g, "");
    } else if (cleanDkimKey) {
      // Build from public key
      dkimRecordValue = `v=DKIM1; k=rsa; p=${cleanDkimKey}`;
    } else {
      dkimRecordValue = null;
    }

    // SPF Record
    const spfRecord = `v=spf1 mx a:${mailServer} ~all`;

    // DMARC Record (Start with relaxed policy for testing)
    const dmarcRecord = `v=DMARC1; p=quarantine; rua=mailto:postmaster@${cleanDomain}; ruf=mailto:postmaster@${cleanDomain}; fo=1; adkim=r; aspf=r; pct=100; ri=86400`;

    // Construct response object
    const dnsRecords = {
      // MX Record
      mx: {
        type: "MX",
        host: "@",
        value: mailServer,
        priority: 10,
        ttl: 3600
      },
      
      // SPF Record
      spf: {
        type: "TXT",
        host: "@",
        value: spfRecord,
        ttl: 3600
      },
      
      // DMARC Record
      dmarc: {
        type: "TXT",
        host: "_dmarc",
        value: dmarcRecord,
        ttl: 3600
      },
      
      // DKIM Record
      dkim: dkimRecordValue ? {
        type: "TXT",
        host: `${dkimSelector}._domainkey`,
        value: dkimRecordValue,
        ttl: 3600,
        note: dkimRecordValue.length > 255 ? 
          "Note: This DKIM record is longer than 255 characters. You may need to split it into multiple strings in your DNS provider." : 
          null
      } : {
        type: "TXT",
        host: `${dkimSelector}._domainkey`,
        value: null,
        error: "DKIM key not available. Please generate DKIM key in Mailcow or wait a few moments and try again.",
        ttl: 3600
      },

      // Autodiscover (for Outlook/Exchange)
      autodiscover: {
        type: "CNAME",
        host: "autodiscover",
        value: mailServer,
        ttl: 3600
      },

      // Autoconfig (for Thunderbird)
      autoconfig: {
        type: "CNAME",
        host: "autoconfig",
        value: mailServer,
        ttl: 3600
      }
    };

    console.log("[DEBUG] DNS records prepared successfully");
    console.log("[DEBUG] DKIM record length:", dkimRecordValue ? dkimRecordValue.length : 0);

    return NextResponse.json({ 
      success: true, 
      domain: cleanDomain,
      status: domainDoc.status,
      dns: dnsRecords,
      mailServer: mailServer
    });

  } catch (error) {
    console.error("[ERROR] DNS Records Failed:", error);
    return NextResponse.json({ 
      error: error.message || "Server Error",
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    }, { status: 500 });
  }
}