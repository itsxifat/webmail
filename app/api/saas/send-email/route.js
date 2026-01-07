import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Domain from "@/models/Domain";
import Mailbox from "@/models/Mailbox"; 
import nodemailer from "nodemailer";
import { ImapFlow } from "imapflow";

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();
    
    // 'mailbox' = The account we log in with (e.g. admin@domain.com)
    // 'from'    = The address we show to the recipient (e.g. alias@domain.com)
    const { from, to, subject, body, mailbox } = await req.json();

    if (!from || !to || !subject || !body || !mailbox) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Verify Ownership
    // We check if the user owns the domain of the LOGIN mailbox
    const mailboxDomain = mailbox.split('@')[1];
    const isOwner = await Domain.findOne({ name: mailboxDomain, user: session.user.id });

    if (!isOwner) return NextResponse.json({ error: "You do not own this domain." }, { status: 403 });

    // 2. Get Credentials for the REAL Mailbox
    // We look up the password for the 'mailbox' (the main account), NOT the alias
    const mailboxDoc = await Mailbox.findOne({ email: mailbox, user: session.user.id });
    
    if (!mailboxDoc || !mailboxDoc.password) {
        return NextResponse.json({ error: "Credentials not found. Please recreate the main mailbox." }, { status: 404 });
    }

    // 3. Configure Hosts
    let host = process.env.MAILCOW_HOST || "mail.enfinito.cloud";
    host = host.replace(/^https?:\/\//, '').replace(/\/$/, '');

    // 4. Send via SMTP
    // We authenticate as the User, but send as the Alias
    console.log(`[SMTP] Authenticating as ${mailboxDoc.email}, Sending as ${from}`);
    
    const transporter = nodemailer.createTransport({
      host: host,
      port: 587,
      secure: false,
      tls: { rejectUnauthorized: true },
      auth: { user: mailboxDoc.email, pass: mailboxDoc.password }
    });

    const info = await transporter.sendMail({
      from: from, // This sends as the alias
      to: to,
      subject: subject,
      html: body.replace(/\n/g, "<br>"),
      text: body
    });
    console.log(`[SMTP] Sent: ${info.messageId}`);

    // 5. Append to Sent Folder via IMAP
    // We log in as the main user to save the sent message
    try {
        const client = new ImapFlow({
            host: host,
            port: 993,
            secure: true,
            auth: { user: mailboxDoc.email, pass: mailboxDoc.password },
            tls: { rejectUnauthorized: false },
            logger: false
        });

        await client.connect();
        
        // Construct raw message to save
        const rawMessage = 
`From: ${from}
To: ${to}
Subject: ${subject}
Date: ${new Date().toUTCString()}
Content-Type: text/html; charset=utf-8

${body.replace(/\n/g, "<br>")}
`;

        await client.append('Sent', rawMessage, ['\\Seen']);
        await client.logout();

    } catch (imapErr) {
        console.warn("[IMAP Append Error]:", imapErr.message);
    }

    return NextResponse.json({ success: true, id: info.messageId });

  } catch (error) {
    console.error("[SMTP Error]:", error);
    if (error.responseCode === 535) return NextResponse.json({ error: "Invalid SMTP Password" }, { status: 401 });
    // Handle "Sender address rejected" if Mailcow disallows this alias
    if (error.response && error.response.includes("Sender address rejected")) {
        return NextResponse.json({ error: "Server rejected alias. Ensure 'Sender Check' is disabled or alias exists." }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || "Failed to send email." }, { status: 500 });
  }
}