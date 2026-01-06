import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Domain from "@/models/Domain";
import User from "@/models/User";
import crypto from "crypto";

export async function POST(req) {
  try {
    console.log("[DEBUG] Incoming add-domain request");

    await dbConnect();
    const session = await auth();

    if (!session?.user) {
      console.log("[DEBUG] Unauthorized request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { domain, quotaStorage, quotaMailboxes, quotaAliases } = body;

    const cleanDomain = domain.toLowerCase().trim();

    console.log(
      `[DEBUG] Domain=${cleanDomain} | Storage=${quotaStorage}MB | Mailboxes=${quotaMailboxes} | Aliases=${quotaAliases}`
    );

    // -------------------------
    // USER + PACKAGE VALIDATION
    // -------------------------
    const user = await User.findById(session.user.id).populate("package");

    if (!user?.package) {
      console.log("[DEBUG] No package found for user");
      return NextResponse.json({ error: "No plan found" }, { status: 403 });
    }

    const existingDomains = await Domain.find({ user: session.user.id });

    const usedStorage = existingDomains.reduce((a, d) => a + (d.quotaStorage || 0), 0);
    const usedMailboxes = existingDomains.reduce((a, d) => a + (d.quotaMailboxes || 0), 0);
    const usedAliases = existingDomains.reduce((a, d) => a + (d.quotaAliases || 0), 0);

    console.log("[DEBUG] Used quotas:", {
      usedStorage,
      usedMailboxes,
      usedAliases
    });

    if (existingDomains.length >= user.package.maxDomains)
      return NextResponse.json({ error: "Domain limit reached" }, { status: 403 });

    if (usedStorage + Number(quotaStorage) > user.package.storageLimitGB * 1024)
      return NextResponse.json({ error: "Insufficient storage" }, { status: 400 });

    if (usedMailboxes + Number(quotaMailboxes) > user.package.maxMailboxes)
      return NextResponse.json({ error: "Insufficient mailboxes" }, { status: 400 });

    if (usedAliases + Number(quotaAliases) > user.package.maxAliases)
      return NextResponse.json({ error: "Insufficient aliases" }, { status: 400 });

    const duplicate = await Domain.findOne({ name: cleanDomain });
    if (duplicate)
      return NextResponse.json({ error: "Domain already exists" }, { status: 400 });

    // -------------------------
    // MAILCOW CONFIG
    // -------------------------
    let host = process.env.MAILCOW_HOST || "";
    if (!host.startsWith("http")) host = "https://" + host;
    host = host.replace(/\/$/, "");

    const MAILCOW_API = `${host}/api/v1`;
    const HEADERS = {
      "Content-Type": "application/json",
      "X-API-Key": process.env.MAILCOW_API_KEY
    };

    // -------------------------
    // QUOTA CALCULATION (MB)
    // -------------------------
    // Mailcow API expects values in MB for add/edit endpoints
    const domainQuotaMB = Math.floor(Number(quotaStorage));
    const safeMailboxes = Math.max(1, Number(quotaMailboxes));

    console.log("[DEBUG] domainQuotaMB:", domainQuotaMB, "safeMailboxes:", safeMailboxes);

    // Minimum domain quota check
    if (domainQuotaMB < 10) {
      console.log("[DEBUG] Domain quota too small");
      return NextResponse.json(
        { error: "Domain quota must be at least 10 MB" },
        { status: 400 }
      );
    }

    // Calculate per-mailbox quota with safety buffer
    // Formula: (domainQuota - buffer) / mailboxes
    // Buffer ensures: def_new_mailbox_quota * max_mailboxes < max_quota (strict inequality)
    const SAFETY_BUFFER_MB = 10; // 10 MB buffer minimum
    const bufferMB = Math.max(SAFETY_BUFFER_MB, Math.ceil(domainQuotaMB * 0.01)); // 1% or 10MB, whichever is larger
    
    let perMailboxQuotaMB = Math.floor((domainQuotaMB - bufferMB) / safeMailboxes);

    console.log("[DEBUG] Buffer:", bufferMB, "MB");
    console.log("[DEBUG] Initial perMailboxQuotaMB:", perMailboxQuotaMB, "MB");

    // Ensure per-mailbox quota is at least 1 MB
    if (perMailboxQuotaMB < 1) {
      console.log("[DEBUG] Calculated per-mailbox quota < 1MB");
      return NextResponse.json(
        { 
          error: `Domain quota ${domainQuotaMB} MB is too small for ${safeMailboxes} mailbox(es). Minimum required: ${safeMailboxes * 2 + bufferMB} MB` 
        },
        { status: 400 }
      );
    }

    // Final safety check: ensure strict inequality
    // def_new_mailbox_quota * max_mailboxes < max_quota
    while (perMailboxQuotaMB * safeMailboxes >= domainQuotaMB && perMailboxQuotaMB > 0) {
      perMailboxQuotaMB--;
      console.log("[DEBUG] Adjusted perMailboxQuotaMB down to:", perMailboxQuotaMB);
    }

    if (perMailboxQuotaMB < 1) {
      console.log("[DEBUG] After safety check, per-mailbox quota < 1MB");
      return NextResponse.json(
        { 
          error: `Unable to allocate mailbox quota. Domain quota ${domainQuotaMB} MB is insufficient for ${safeMailboxes} mailbox(es).` 
        },
        { status: 400 }
      );
    }

    console.log("[DEBUG] Final perMailboxQuotaMB:", perMailboxQuotaMB, "MB");
    console.log("[DEBUG] Verification: (", perMailboxQuotaMB, "*", safeMailboxes, "=", perMailboxQuotaMB * safeMailboxes, ") <", domainQuotaMB);

    // -------------------------
    // CREATE DOMAIN (MAILCOW)
    // -------------------------
    const createPayload = {
      domain: cleanDomain,
      active: 1,
      description: `Owner: ${session.user.email}`,
      restart_sogo: 10,
      aliases: Number(quotaAliases),
      mailboxes: Number(quotaMailboxes),
      quota: domainQuotaMB,                     // MB - total domain quota
      defquota: perMailboxQuotaMB,              // MB - default quota for new mailboxes
      maxquota: perMailboxQuotaMB,              // MB - max quota per mailbox (same as default)
      rl_value: 10,                              // rate limit value
      rl_frame: "s"                              // rate limit frame (s=second, h=hour, d=day)
    };

    console.log("[DEBUG] Mailcow add/domain payload:", JSON.stringify(createPayload, null, 2));

    const addRes = await fetch(`${MAILCOW_API}/add/domain`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify(createPayload)
    });

    let addData;
    try {
      addData = await addRes.json();
    } catch (e) {
      console.log("[DEBUG] Mailcow add/domain returned non-json response");
      addData = null;
    }
    console.log("[DEBUG] Mailcow add/domain response:", JSON.stringify(addData, null, 2));

    // Handle Mailcow error responses
    if (!addRes.ok) {
      console.log("[DEBUG] Mailcow HTTP status:", addRes.status);
      
      // Check for specific error messages
      if (Array.isArray(addData) && addData[0]?.type === "danger") {
        const msg = addData[0].msg;
        console.log("[DEBUG] Mailcow error:", msg);
        
        // If domain already exists, try to update it instead
        if (msg.includes("exists") || msg.includes("domain_exists")) {
          console.log("[DEBUG] Domain exists, attempting to update limits");
        } else {
          return NextResponse.json({ 
            error: `Mailcow Error: ${msg}`,
            details: addData 
          }, { status: 400 });
        }
      } else {
        return NextResponse.json(
          { error: `Mailcow HTTP Error ${addRes.status}`, details: addData },
          { status: 500 }
        );
      }
    }

    // -------------------------
    // SYNC/UPDATE DOMAIN LIMITS
    // -------------------------
    // Always update domain to ensure limits are correct
    const editPayload = {
      items: [cleanDomain],
      attr: {
        active: 1,
        aliases: Number(quotaAliases),
        mailboxes: Number(quotaMailboxes),
        maxquota: perMailboxQuotaMB,              // MB - max quota per mailbox
        quota: domainQuotaMB,                     // MB - total domain quota
        defquota: perMailboxQuotaMB,              // MB - default mailbox quota
        rl_value: 10,
        rl_frame: "s"
      }
    };

    console.log("[DEBUG] Mailcow edit/domain payload:", JSON.stringify(editPayload, null, 2));

    const editRes = await fetch(`${MAILCOW_API}/edit/domain`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify(editPayload)
    });

    let editData;
    try {
      editData = await editRes.json();
      console.log("[DEBUG] Mailcow edit/domain response:", JSON.stringify(editData, null, 2));
      
      // Check for errors in edit response
      if (Array.isArray(editData) && editData[0]?.type === "danger") {
        const msg = editData[0].msg;
        console.log("[ERROR] Mailcow edit failed:", msg);
        return NextResponse.json({ 
          error: `Failed to configure domain: ${msg}`,
          details: editData 
        }, { status: 400 });
      }
    } catch (e) {
      console.log("[DEBUG] Mailcow edit/domain returned no JSON");
    }

    // -------------------------
    // CREATE DOMAIN ADMIN
    // -------------------------
    const adminUser = `admin_${cleanDomain.replace(/\./g, "_")}`;
    const adminPass = crypto.randomBytes(16).toString("hex");

    console.log("[DEBUG] Creating domain admin:", adminUser);

    const adminPayload = {
      username: adminUser,
      password: adminPass,
      password2: adminPass,  // Mailcow requires password confirmation
      active: 1,
      domains: [cleanDomain]
    };

    const adminRes = await fetch(`${MAILCOW_API}/add/domain-admin`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify(adminPayload)
    });

    let adminData;
    try {
      adminData = await adminRes.json();
      console.log("[DEBUG] Mailcow add/domain-admin response:", JSON.stringify(adminData, null, 2));
      
      // Check if admin already exists
      if (Array.isArray(adminData) && adminData[0]?.type === "danger") {
        const msg = adminData[0].msg;
        if (msg.includes("exists") || msg.includes("object_exists")) {
          console.log("[DEBUG] Domain admin already exists, continuing...");
        } else {
          console.log("[WARN] Domain admin creation warning:", msg);
        }
      }
    } catch (e) {
      console.log("[DEBUG] Mailcow add/domain-admin returned no JSON");
    }

    // -------------------------
    // SAVE TO DATABASE
    // -------------------------
    const newDomain = await Domain.create({
      user: session.user.id,
      name: cleanDomain,
      status: "Active",
      quotaStorage: domainQuotaMB,
      quotaMailboxes: Number(quotaMailboxes),
      quotaAliases: Number(quotaAliases),
      mailcowAdminUser: adminUser,
      mailcowAdminPass: adminPass
    });

    console.log("[DEBUG] Domain successfully created:", newDomain._id);

    return NextResponse.json({
      success: true,
      domain: {
        id: newDomain._id,
        name: newDomain.name,
        status: newDomain.status,
        quotaStorage: newDomain.quotaStorage,
        quotaMailboxes: newDomain.quotaMailboxes,
        quotaAliases: newDomain.quotaAliases,
        perMailboxQuota: perMailboxQuotaMB,
        adminUser: adminUser
      }
    });

  } catch (err) {
    console.error("[ERROR] Add Domain Failed:", err);
    return NextResponse.json(
      { 
        error: err.message || "Server Error",
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined
      },
      { status: 500 }
    );
  }
}