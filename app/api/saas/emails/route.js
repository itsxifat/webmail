import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import dbConnect from "@/lib/db";
import Mailbox from "@/models/Mailbox";

// Standard Dovecot/Mailcow folder names
const FOLDER_MAP = {
  inbox: "INBOX",
  sent: "Sent",
  trash: "Trash",
  drafts: "Drafts",
  junk: "Junk"
};

export async function GET(req) {
  // Increased timeout for stability
  const clientTimeout = 15000; 
  let client;

  try {
    // 1. Auth & Input Check
    await dbConnect();
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const mailboxEmail = searchParams.get("mailbox");
    const folderParam = searchParams.get("folder") || "inbox"; 

    if (!mailboxEmail) return NextResponse.json({ error: "Mailbox required" }, { status: 400 });

    // 2. Get Password from DB
    const mailboxDoc = await Mailbox.findOne({ 
        email: mailboxEmail, 
        user: session.user.id 
    });

    if (!mailboxDoc) {
        return NextResponse.json({ error: "Credentials not found." }, { status: 404 });
    }

    // 3. Configure Client
    const remoteHost = (process.env.MAILCOW_HOST || "mail.enfinito.cloud")
        .replace(/^https?:\/\//, '')
        .replace(/\/$/, '');

    client = new ImapFlow({
        host: remoteHost,
        port: 993,
        secure: true,
        auth: {
            user: mailboxDoc.email,
            pass: mailboxDoc.password
        },
        tls: { rejectUnauthorized: false },
        logger: false,
        clientTimeout: clientTimeout,
        greetingTimeout: clientTimeout,
        socketTimeout: clientTimeout
    });

    // 4. Connect
    await client.connect();

    // 5. Select Folder (Dynamic)
    const targetFolder = FOLDER_MAP[folderParam.toLowerCase()] || "INBOX";
    let lock;
    
    try {
        lock = await client.getMailboxLock(targetFolder);
    } catch (err) {
        console.warn(`[IMAP] Folder '${targetFolder}' does not exist. Returning empty.`);
        return NextResponse.json({ success: true, data: [] });
    }

    try {
        const messages = [];

        // Check if folder has messages
        const status = await client.status(targetFolder, { messages: true });

        if (status.messages > 0) {
            // Fetch latest 20 emails
            // '1:*' selects all messages. We loop and take the newest.
            for await (const message of client.fetch('1:*', { source: true, envelope: true })) {
                try {
                    const parsed = await simpleParser(message.source);
                    
                    messages.unshift({
                        id: message.uid.toString(),
                        from: message.envelope.from[0]?.name || message.envelope.from[0]?.address || "Unknown",
                        to: message.envelope.to[0]?.address || "Unknown", 
                        cc: message.envelope.cc?.map(c => c.address) || [],
                        subject: message.envelope.subject || "(No Subject)",
                        snippet: parsed.text ? parsed.text.substring(0, 100) : "",
                        html: parsed.html || parsed.textAsHtml || "<p>No content</p>",
                        date: message.envelope.date ? message.envelope.date.toISOString() : new Date().toISOString(),
                    });
    
                    if (messages.length >= 20) break;
                } catch (parseErr) {
                    console.error("Email Parse Error:", parseErr);
                }
            }
        }

        return NextResponse.json({ success: true, data: messages });

    } finally {
        if (lock) lock.release();
        await client.logout();
    }

  } catch (error) {
    console.error("[IMAP Error]:", error.message);
    
    if (error.responseStatus === "NO" || error.message.includes("Authentication")) {
        return NextResponse.json({ error: "Auth Failed. Password mismatch." }, { status: 401 });
    }
    
    return NextResponse.json({ error: "Fetch error: " + error.message }, { status: 500 });
  }
}