import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Domain from "@/models/Domain";
import User from "@/models/User";

export async function POST(req) {
  try {
    await dbConnect();
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { domainId, quotaStorage, quotaMailboxes, quotaAliases } = body;

    // 1. Get Domain & User
    const targetDomain = await Domain.findOne({ _id: domainId, user: session.user.id });
    if (!targetDomain) return NextResponse.json({ error: "Domain not found" }, { status: 404 });

    const user = await User.findById(session.user.id).populate("package");
    if (!user.package) return NextResponse.json({ error: "No active plan" }, { status: 403 });

    // 2. Limit Checks
    const otherDomains = await Domain.find({ user: session.user.id, _id: { $ne: domainId } });
    const usedStorage = otherDomains.reduce((acc, d) => acc + (d.quotaStorage || 0), 0);
    const usedMailboxes = otherDomains.reduce((acc, d) => acc + (d.quotaMailboxes || 0), 0);
    const usedAliases = otherDomains.reduce((acc, d) => acc + (d.quotaAliases || 0), 0);

    const pkg = user.package;
    if ((usedStorage + quotaStorage) > (pkg.storageLimitGB * 1024)) return NextResponse.json({ error: "Insufficient storage" }, { status: 400 });
    if ((usedMailboxes + quotaMailboxes) > pkg.maxMailboxes) return NextResponse.json({ error: "Insufficient mailboxes" }, { status: 400 });
    if ((usedAliases + quotaAliases) > pkg.maxAliases) return NextResponse.json({ error: "Insufficient aliases" }, { status: 400 });

    // 3. Mailcow Logic
    let host = process.env.MAILCOW_HOST;
    if (!host.startsWith("http")) host = "https://" + host;
    host = host.replace(/\/$/, ""); 
    const MAILCOW_API = `${host}/api/v1`;
    const HEADERS = { "Content-Type": "application/json", "X-API-Key": process.env.MAILCOW_API_KEY };

    // --- CALCULATE PER-MAILBOX QUOTA (MB) ---
    const safeMailboxes = Number(quotaMailboxes) > 0 ? Number(quotaMailboxes) : 1;
    const perMailboxQuotaMB = Math.floor(Number(quotaStorage) / safeMailboxes);

    console.log(`[DEBUG] Updating ${targetDomain.name}. Default Mailbox Size: ${perMailboxQuotaMB}MB`);

    const mailcowRes = await fetch(`${MAILCOW_API}/edit/domain`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({
        items: [targetDomain.name],
        attr: {
          max_quota: Number(quotaStorage), // Raw MB
          max_mailboxes: Number(quotaMailboxes),
          max_aliases: Number(quotaAliases),
          def_new_mailbox_quota: perMailboxQuotaMB // Raw MB (FIXED)
        }
      })
    });

    const mailcowData = await mailcowRes.json();
    if (mailcowData[0]?.type === "danger") { 
        throw new Error("Mailcow Update Failed: " + mailcowData[0].msg);
    }

    // 4. Update Database
    targetDomain.quotaStorage = quotaStorage;
    targetDomain.quotaMailboxes = quotaMailboxes;
    targetDomain.quotaAliases = quotaAliases;
    await targetDomain.save();

    return NextResponse.json({ success: true, message: "Resources updated successfully" });

  } catch (error) {
    console.error("Update Domain Error:", error);
    return NextResponse.json({ error: error.message || "Server Error" }, { status: 500 });
  }
}