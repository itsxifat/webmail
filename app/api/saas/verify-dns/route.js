import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Domain from "@/models/Domain";
import dns from "dns/promises";
import { setServers } from "dns";

// FORCE GOOGLE DNS & CLOUDFLARE DNS FOR RELIABILITY
try { 
  setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1", "1.0.0.1"]); 
} catch (e) {
  console.error("[WARN] Failed to set DNS servers:", e.message);
}

/**
 * Clean and normalize TXT records from DNS responses
 * Handles both string and array formats, removes quotes
 */
const getCleanTxtRecords = (records) => {
  if (!records || !Array.isArray(records)) return [];
  return records.map(chunkArray => {
    const joined = Array.isArray(chunkArray) ? chunkArray.join("") : chunkArray;
    return joined.replace(/["']/g, "").trim().toLowerCase();
  });
};

export async function POST(req) {
  try {
    console.log("[DEBUG] Starting DNS verification");
    
    await dbConnect();
    const session = await auth();
    
    if (!session?.user) {
      console.log("[DEBUG] Unauthorized verification attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { domain } = await req.json();
    const cleanDomain = domain.toLowerCase().trim().replace(/\.$/, "");

    console.log("[DEBUG] Verifying domain:", cleanDomain);

    // Get mail server from environment (should match what's in DNS records API)
    const MAIL_SERVER = (process.env.MAILCOW_HOSTNAME || "mail.enfinito.cloud").toLowerCase();
    console.log("[DEBUG] Expected mail server:", MAIL_SERVER);

    // -------------------------
    // VERIFY DOMAIN OWNERSHIP
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
    // VERIFICATION RESULTS
    // -------------------------
    const results = {
      mx: false,
      spf: false,
      dkim: false,
      dmarc: false,
      autodiscover: null, // Optional
      autoconfig: null,   // Optional
      debug: {
        mxFound: [],
        spfFound: [],
        dkimFound: [],
        dmarcFound: [],
        autodiscoverFound: null,
        autoconfigFound: null
      }
    };

    // -------------------------
    // 1. VERIFY MX RECORD
    // -------------------------
    console.log("[DEBUG] Checking MX records...");
    try {
      const mxRecords = await dns.resolveMx(cleanDomain);
      results.debug.mxFound = mxRecords.map(r => ({ 
        exchange: r.exchange, 
        priority: r.priority 
      }));
      
      console.log("[DEBUG] MX records found:", results.debug.mxFound);
      
      // Check if any MX record points to our mail server
      results.mx = mxRecords.some(r => 
        r.exchange.toLowerCase().includes(MAIL_SERVER) || 
        r.exchange.toLowerCase() === MAIL_SERVER
      );
      
      console.log("[DEBUG] MX verification:", results.mx);
    } catch (e) {
      console.log("[DEBUG] MX lookup failed:", e.message);
      results.mx = false;
    }

    // -------------------------
    // 2. VERIFY SPF RECORD
    // -------------------------
    console.log("[DEBUG] Checking SPF records...");
    try {
      const rawTxt = await dns.resolveTxt(cleanDomain);
      const cleanTxt = getCleanTxtRecords(rawTxt);
      results.debug.spfFound = cleanTxt;
      
      console.log("[DEBUG] TXT records found:", cleanTxt);

      // Find the SPF record
      const spfRecord = cleanTxt.find(t => t.startsWith("v=spf1"));
      
      if (spfRecord) {
        console.log("[DEBUG] SPF record:", spfRecord);
        
        // Check for various valid SPF mechanisms
        const hasMailServer = spfRecord.includes(MAIL_SERVER);
        const hasMx = spfRecord.includes("mx");
        const hasA = spfRecord.includes(`a:${MAIL_SERVER}`);
        const hasInclude = spfRecord.includes("include:");
        const hasIp4 = spfRecord.includes("ip4:");
        const hasIp6 = spfRecord.includes("ip6:");
        
        // SPF is valid if it references our mail server in any way
        results.spf = hasMailServer || hasMx || hasA || hasInclude || hasIp4 || hasIp6;
        
        console.log("[DEBUG] SPF checks:", { 
          hasMailServer, hasMx, hasA, hasInclude, hasIp4, hasIp6, 
          result: results.spf 
        });
      } else {
        console.log("[DEBUG] No SPF record found");
        results.spf = false;
      }
    } catch (e) {
      console.log("[DEBUG] SPF lookup failed:", e.message);
      results.spf = false;
    }

    // -------------------------
    // 3. VERIFY DKIM RECORD
    // -------------------------
    console.log("[DEBUG] Checking DKIM records...");
    try {
      const dkimHost = `dkim._domainkey.${cleanDomain}`;
      const rawTxt = await dns.resolveTxt(dkimHost);
      const cleanTxt = getCleanTxtRecords(rawTxt);
      results.debug.dkimFound = cleanTxt;
      
      console.log("[DEBUG] DKIM records found:", cleanTxt);

      // DKIM record should contain v=DKIM1 and k=rsa (and p= for public key)
      results.dkim = cleanTxt.some(t => 
        (t.includes("v=dkim1") || t.includes("dkim1")) && 
        (t.includes("k=rsa") || t.includes("p="))
      );
      
      console.log("[DEBUG] DKIM verification:", results.dkim);
    } catch (e) {
      console.log("[DEBUG] DKIM lookup failed:", e.message);
      results.dkim = false;
    }

    // -------------------------
    // 4. VERIFY DMARC RECORD
    // -------------------------
    console.log("[DEBUG] Checking DMARC records...");
    try {
      const dmarcHost = `_dmarc.${cleanDomain}`;
      const rawTxt = await dns.resolveTxt(dmarcHost);
      const cleanTxt = getCleanTxtRecords(rawTxt);
      results.debug.dmarcFound = cleanTxt;
      
      console.log("[DEBUG] DMARC records found:", cleanTxt);

      // DMARC record must start with v=DMARC1
      results.dmarc = cleanTxt.some(t => t.startsWith("v=dmarc1"));
      
      console.log("[DEBUG] DMARC verification:", results.dmarc);
    } catch (e) {
      console.log("[DEBUG] DMARC lookup failed:", e.message);
      results.dmarc = false;
    }

    // -------------------------
    // 5. VERIFY AUTODISCOVER (Optional)
    // -------------------------
    console.log("[DEBUG] Checking Autodiscover CNAME...");
    try {
      const autodiscoverHost = `autodiscover.${cleanDomain}`;
      const cnameRecords = await dns.resolveCname(autodiscoverHost);
      results.debug.autodiscoverFound = cnameRecords;
      
      console.log("[DEBUG] Autodiscover CNAME found:", cnameRecords);
      
      results.autodiscover = cnameRecords.some(c => 
        c.toLowerCase().includes(MAIL_SERVER) || 
        c.toLowerCase() === MAIL_SERVER
      );
      
      console.log("[DEBUG] Autodiscover verification:", results.autodiscover);
    } catch (e) {
      console.log("[DEBUG] Autodiscover lookup failed:", e.message);
      results.autodiscover = false;
    }

    // -------------------------
    // 6. VERIFY AUTOCONFIG (Optional)
    // -------------------------
    console.log("[DEBUG] Checking Autoconfig CNAME...");
    try {
      const autoconfigHost = `autoconfig.${cleanDomain}`;
      const cnameRecords = await dns.resolveCname(autoconfigHost);
      results.debug.autoconfigFound = cnameRecords;
      
      console.log("[DEBUG] Autoconfig CNAME found:", cnameRecords);
      
      results.autoconfig = cnameRecords.some(c => 
        c.toLowerCase().includes(MAIL_SERVER) || 
        c.toLowerCase() === MAIL_SERVER
      );
      
      console.log("[DEBUG] Autoconfig verification:", results.autoconfig);
    } catch (e) {
      console.log("[DEBUG] Autoconfig lookup failed:", e.message);
      results.autoconfig = false;
    }

    // -------------------------
    // 7. DETERMINE OVERALL STATUS
    // -------------------------
    // Core records that MUST pass for verification
    const coreRecordsPassed = results.mx && results.spf && results.dkim && results.dmarc;
    
    // Optional records (don't affect verification status)
    const optionalRecordsInfo = {
      autodiscover: results.autodiscover,
      autoconfig: results.autoconfig
    };

    console.log("[DEBUG] Core records passed:", coreRecordsPassed);
    console.log("[DEBUG] Optional records:", optionalRecordsInfo);

    // -------------------------
    // 8. UPDATE DOMAIN STATUS
    // -------------------------
    if (coreRecordsPassed) {
      console.log("[DEBUG] All core records verified, updating domain status to 'Verified'");
      
      await Domain.findOneAndUpdate(
        { name: cleanDomain, user: session.user.id },
        { 
          status: "Verified",
          verifiedAt: new Date()
        }
      );
    } else {
      console.log("[DEBUG] Verification incomplete, keeping current status");
    }

    // -------------------------
    // 9. RETURN RESULTS
    // -------------------------
    return NextResponse.json({ 
      success: true, 
      isVerified: coreRecordsPassed,
      results: results,
      message: coreRecordsPassed 
        ? "All DNS records are correctly configured!" 
        : "Some DNS records are missing or incorrect. Please check your DNS settings.",
      optionalRecords: optionalRecordsInfo
    });

  } catch (error) {
    console.error("[ERROR] DNS Verification Failed:", error);
    return NextResponse.json({ 
      error: error.message || "Verification failed",
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    }, { status: 500 });
  }
}