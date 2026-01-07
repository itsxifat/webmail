import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Domain from "@/models/Domain";
import Mailbox from "@/models/Mailbox"; // Ensure this model exists

// --- MAILCOW FETCH HELPER ---
const mailcowFetch = async (endpoint, method = "GET", body = null) => {
  let host = process.env.MAILCOW_HOST || "";
  if (!host.startsWith("http")) host = "https://" + host;
  host = host.replace(/\/$/, "");
  
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": process.env.MAILCOW_API_KEY
    }
  };
  if (body) options.body = JSON.stringify(body);

  try {
    const res = await fetch(`${host}/api/v1${endpoint}`, options);
    if (!res.ok) {
        console.error(`[Mailcow API Fail] ${endpoint}: ${res.status} ${res.statusText}`);
        try {
            const errBody = await res.json();
            console.error("[Mailcow Error Body]:", JSON.stringify(errBody));
        } catch(e) {}
        return null;
    }
    return res.json();
  } catch (e) {
    console.error(`[Mailcow Network Error] ${endpoint}:`, e);
    return null;
  }
};

// --- GET: LIST RESOURCES ---
export async function GET(req) {
  try {
    await dbConnect();
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const domainName = searchParams.get("domain");

    if(!domainName) return NextResponse.json({ error: "Domain required" }, { status: 400 });

    const domainDoc = await Domain.findOne({ name: domainName, user: session.user.id });
    if (!domainDoc) return NextResponse.json({ error: "Domain not found" }, { status: 404 });

    const [mailboxes, aliases] = await Promise.all([
      mailcowFetch(`/get/mailbox/all/${domainName}`),
      mailcowFetch(`/get/alias/all/${domainName}`)
    ]);

    return NextResponse.json({ 
      success: true, 
      mailboxes: Array.isArray(mailboxes) ? mailboxes : [],
      aliases: Array.isArray(aliases) ? aliases : [],
      limits: {
        maxMailboxes: domainDoc.quotaMailboxes || 0,
        maxAliases: domainDoc.quotaAliases || 0,
        maxStorageMB: domainDoc.quotaStorage || 0
      }
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- POST: CREATE RESOURCE ---
export async function POST(req) {
  try {
    await dbConnect();
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    let { type, domain, localPart, password, name, target } = body;

    // 1. Sanitize Inputs
    domain = domain?.trim().toLowerCase();
    localPart = localPart?.trim().toLowerCase();
    name = name?.trim() || localPart;
    if (password) password = password.trim(); 

    // 2. Validate Ownership
    const domainDoc = await Domain.findOne({ name: domain, user: session.user.id });
    if (!domainDoc) return NextResponse.json({ error: "Domain not found" }, { status: 404 });

    // --- CREATE MAILBOX ---
    if (type === "mailbox") {
        
      // A. Check Limits
      const currentMailboxes = await mailcowFetch(`/get/mailbox/all/${domain}`);
      const count = Array.isArray(currentMailboxes) ? currentMailboxes.length : 0;
      
      if (count >= domainDoc.quotaMailboxes) {
        return NextResponse.json({ error: "Mailbox limit reached" }, { status: 403 });
      }

      // B. Quota Calculation
      const maxStorage = domainDoc.quotaStorage || 1024;
      const maxBoxes = domainDoc.quotaMailboxes > 0 ? domainDoc.quotaMailboxes : 1;
      const quotaPerBox = Math.floor(maxStorage / maxBoxes);

      // C. Construct FULL Payload
      const payload = {
        active: "1",
        domain: domain,
        local_part: localPart,
        name: name,
        password: password,
        password2: password,
        quota: quotaPerBox,
        force_pw_update: "0",
        sogo_access: ["0", "1"],
        protocol_access: ["0", "imap", "pop3", "smtp", "sieve"],
        authsource: "mailcow",
        tags: "",
        tagged_mail_handler: "none",
        quarantine_notification: "hourly",
        quarantine_category: "reject",
        rl_value: "",
        rl_frame: "s",
        acl: [
            "spam_alias", "tls_policy", "spam_score", "spam_policy", 
            "delimiter_action", "eas_reset", "pushover", "quarantine", 
            "quarantine_attachments", "quarantine_notification", 
            "quarantine_category", "app_passwds"
        ]
      };

      console.log(`[DEBUG] Creating Mailbox: ${localPart}@${domain}`);

      // D. Send to Mailcow
      const res = await mailcowFetch("/add/mailbox", "POST", payload);

      if (Array.isArray(res) && res[0].type === "danger") {
          const msg = res[0].msg;
          if (msg.includes("password_complexity")) {
              return NextResponse.json({ error: "Weak Password" }, { status: 400 });
          }
          if (msg.includes("exists")) {
              return NextResponse.json({ error: "Email already exists" }, { status: 409 });
          }
          return NextResponse.json({ error: msg }, { status: 400 });
      }

      // E. SAVE CREDENTIALS TO DATABASE (Crucial for reading emails later)
      await Mailbox.findOneAndUpdate(
        { email: `${localPart}@${domain}` },
        {
            domain: domain,
            email: `${localPart}@${domain}`,
            password: password, // In production, encrypt this field!
            user: session.user.id
        },
        { upsert: true, new: true }
      );

    // --- CREATE ALIAS ---
    } else if (type === "alias") {
      const currentAliases = await mailcowFetch(`/get/alias/all/${domain}`);
      const count = Array.isArray(currentAliases) ? currentAliases.length : 0;

      if (count >= domainDoc.quotaAliases) {
        return NextResponse.json({ error: "Alias limit reached" }, { status: 403 });
      }

      const payload = {
        address: `${localPart}@${domain}`,
        goto: target,
        active: 1
      };

      const res = await mailcowFetch("/add/alias", "POST", payload);
      
      if (Array.isArray(res) && res[0].type === "danger") {
          return NextResponse.json({ error: res[0].msg }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[Backend Error]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// --- DELETE RESOURCE ---
export async function DELETE(req) {
    try {
        await dbConnect();
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
        const { type, id, domain } = await req.json();
        
        const domainDoc = await Domain.findOne({ name: domain, user: session.user.id });
        if (!domainDoc) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const endpoint = type === 'mailbox' ? '/delete/mailbox' : '/delete/alias';
        const res = await mailcowFetch(endpoint, "POST", { items: [id] });
        
        if (Array.isArray(res) && res[0].type === "danger") {
             return NextResponse.json({ error: res[0].msg }, { status: 400 });
        }

        // If deleting a mailbox, remove from MongoDB too
        if (type === 'mailbox') {
            await Mailbox.findOneAndDelete({ email: id });
        }

        return NextResponse.json({ success: true });
    } catch(err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}