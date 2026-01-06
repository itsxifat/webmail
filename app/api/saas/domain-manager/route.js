import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Domain from "@/models/Domain";

// Helper for Mailcow fetch
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

  const res = await fetch(`${host}/api/v1${endpoint}`, options);
  if (!res.ok) return null;
  return res.json();
};

// GET: List Mailboxes and Aliases for a specific domain
export async function GET(req) {
  try {
    await dbConnect();
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const domainName = searchParams.get("domain");

    // 1. Verify Ownership
    const domainDoc = await Domain.findOne({ name: domainName, user: session.user.id });
    if (!domainDoc) return NextResponse.json({ error: "Domain not found" }, { status: 404 });

    // 2. Fetch from Mailcow
    const [mailboxes, aliases] = await Promise.all([
      mailcowFetch(`/get/mailbox/all/${domainName}`),
      mailcowFetch(`/get/alias/all/${domainName}`)
    ]);

    return NextResponse.json({ 
      success: true, 
      mailboxes: mailboxes || [],
      aliases: aliases || [],
      limits: {
        maxMailboxes: domainDoc.quotaMailboxes,
        maxAliases: domainDoc.quotaAliases,
        maxStorageMB: domainDoc.quotaStorage
      }
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create Mailbox OR Alias
export async function POST(req) {
  try {
    await dbConnect();
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { type, domain, localPart, password, name, target } = body; 
    // type = 'mailbox' | 'alias'

    // 1. Verify Ownership & Limits
    const domainDoc = await Domain.findOne({ name: domain, user: session.user.id });
    if (!domainDoc) return NextResponse.json({ error: "Domain not found" }, { status: 404 });

    if (type === "mailbox") {
      // Check Mailbox Limit
      const currentMailboxes = await mailcowFetch(`/get/mailbox/all/${domain}`);
      if (currentMailboxes && currentMailboxes.length >= domainDoc.quotaMailboxes) {
        return NextResponse.json({ error: `Mailbox limit (${domainDoc.quotaMailboxes}) reached for this domain.` }, { status: 403 });
      }

      // Calculate safe quota per mailbox
      // We explicitly set this again to be safe, though Mailcow domain default handles it.
      const safeMailboxes = Math.max(1, domainDoc.quotaMailboxes);
      const quotaPerBox = Math.floor(domainDoc.quotaStorage / safeMailboxes); 

      const payload = {
        domain: domain,
        local_part: localPart,
        password: password,
        name: name || localPart,
        active: 1,
        quota: quotaPerBox // MB
      };

      const res = await mailcowFetch("/add/mailbox", "POST", payload);
      if (Array.isArray(res) && res[0].type === "danger") throw new Error(res[0].msg);

    } else if (type === "alias") {
      // Check Alias Limit
      const currentAliases = await mailcowFetch(`/get/alias/all/${domain}`);
      // Note: Mailcow returns ALL aliases, including catch-alls. We generally count them all.
      if (currentAliases && currentAliases.length >= domainDoc.quotaAliases) {
        return NextResponse.json({ error: `Alias limit (${domainDoc.quotaAliases}) reached for this domain.` }, { status: 403 });
      }

      const payload = {
        address: `${localPart}@${domain}`,
        goto: target, // The mailbox it points to
        active: 1
      };

      const res = await mailcowFetch("/add/alias", "POST", payload);
      if (Array.isArray(res) && res[0].type === "danger") throw new Error(res[0].msg);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Manager Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Remove Item
export async function DELETE(req) {
    try {
        await dbConnect();
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
        const { type, id, domain } = await req.json(); // id is usually the email address
        
        // Verify Ownership
        const domainDoc = await Domain.findOne({ name: domain, user: session.user.id });
        if (!domainDoc) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const endpoint = type === 'mailbox' ? '/delete/mailbox' : '/delete/alias';
        
        const res = await mailcowFetch(endpoint, "POST", { items: [id] });
        if (Array.isArray(res) && res[0].type === "danger") throw new Error(res[0].msg);

        return NextResponse.json({ success: true });
    } catch(err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}