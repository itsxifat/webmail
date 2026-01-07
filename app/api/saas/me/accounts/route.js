import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Domain from "@/models/Domain";

// Helper for Mailcow fetch
const mailcowFetch = async (endpoint) => {
  let host = process.env.MAILCOW_HOST || "";
  if (!host.startsWith("http")) host = "https://" + host;
  host = host.replace(/\/$/, "");
  
  try {
    const res = await fetch(`${host}/api/v1${endpoint}`, {
        headers: { "X-API-Key": process.env.MAILCOW_API_KEY }
    });
    return res.ok ? res.json() : null;
  } catch (e) {
    return null;
  }
};

export async function GET(req) {
  try {
    await dbConnect();
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 1. Get all domains owned by this user
    const domains = await Domain.find({ user: session.user.id });
    
    if (!domains || domains.length === 0) {
        return NextResponse.json({ accounts: [] });
    }

    const accounts = [];

    // 2. Fetch mailboxes for each domain
    for (const d of domains) {
        const mailboxes = await mailcowFetch(`/get/mailbox/all/${d.name}`);
        const aliases = await mailcowFetch(`/get/alias/all/${d.name}`);

        if (Array.isArray(mailboxes)) {
            mailboxes.forEach(mb => {
                // Find aliases belonging to this mailbox
                const myAliases = Array.isArray(aliases) 
                    ? aliases.filter(a => a.goto === mb.username).map(a => a.address)
                    : [];

                accounts.push({
                    email: mb.username,
                    name: mb.name,
                    aliases: myAliases
                });
            });
        }
    }

    return NextResponse.json({ accounts });

  } catch (error) {
    console.error("Accounts API Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}