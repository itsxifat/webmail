import { NextResponse } from 'next/server';
import { auth } from "@/auth";
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { ImapFlow } from 'imapflow';

export async function GET(req) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  // 1. Fetch the user to get their hosted mailbox credentials
  // We assume you stored the mailbox password when you created it in Mailcow
  const user = await User.findById(session.user.id);
  
  if (!user || !user.hostedEmail || !user.hostedEmailPassword) {
    return NextResponse.json({ data: [], error: "No hosted mailbox found." });
  }

  // 2. Dynamic IMAP Connection using USER credentials
  const client = new ImapFlow({
    host: process.env.MAILCOW_HOST || 'mail.enfinito.cloud',
    port: 993,
    secure: true,
    auth: {
      user: user.hostedEmail,      // <--- DYNAMIC USER EMAIL
      pass: user.hostedEmailPassword // <--- DYNAMIC USER PASSWORD
    },
    logger: false,
  });

  try {
    await client.connect();

    // 3. Select Inbox and Fetch
    let lock = await client.getMailboxLock('INBOX');
    try {
      // Fetch latest 20 emails
      let messages = [];
      for await (let message of client.fetch('1:*', { envelope: true, source: true }, { uid: true })) {
        messages.push({
          id: message.uid,
          from: message.envelope.from[0].address, // specific sender
          subject: message.envelope.subject,
          date: message.envelope.date,
          snippet: message.source.toString().substring(0, 100) + "...", // Simplified snippet
          html: "<div>Loading content...</div>" // In a real app, you parse the source/body structure
        });
        if(messages.length >= 20) break; 
      }
      
      return NextResponse.json({ data: messages.reverse() }); // Newest first
    } finally {
      lock.release();
    }
  } catch (err) {
    console.error("IMAP Error:", err);
    return NextResponse.json({ error: "Failed to sync mailbox" }, { status: 500 });
  } finally {
    await client.logout();
  }
}