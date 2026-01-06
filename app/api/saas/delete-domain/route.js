import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Domain from "@/models/Domain";

export async function POST(req) {
  try {
    await dbConnect();
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { domainId } = await req.json();

    // 1. Find Domain
    const domainDoc = await Domain.findOne({ _id: domainId, user: session.user.id });
    if (!domainDoc) return NextResponse.json({ error: "Domain not found" }, { status: 404 });

    // 2. Delete from Mailcow
    let host = process.env.MAILCOW_HOST;
    if (!host.startsWith("http")) host = "https://" + host;
    host = host.replace(/\/$/, ""); 
    const MAILCOW_API = `${host}/api/v1`;
    const HEADERS = { "Content-Type": "application/json", "X-API-Key": process.env.MAILCOW_API_KEY };

    // Delete Domain (Mailcow expects an array of domain names)
    await fetch(`${MAILCOW_API}/delete/domain`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify([domainDoc.name])
    });

    // Delete Domain Admin (Cleanup)
    if (domainDoc.mailcowAdminUser) {
        await fetch(`${MAILCOW_API}/delete/domain-admin`, {
            method: "POST",
            headers: HEADERS,
            body: JSON.stringify([domainDoc.mailcowAdminUser])
        });
    }

    // 3. Delete from MongoDB
    await Domain.deleteOne({ _id: domainId });

    return NextResponse.json({ success: true, message: "Deleted successfully" });

  } catch (error) {
    console.error("Delete Error:", error);
    return NextResponse.json({ error: "Failed to delete domain" }, { status: 500 });
  }
}