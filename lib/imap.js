import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

export async function fetchLatestEmails() {
  // 1. Configure the Client
  const client = new ImapFlow({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_IMAP_PORT),
    secure: true, // Uses TLS (Port 993)
    auth: {
      user: process.env.TEST_EMAIL_USER,
      pass: process.env.TEST_EMAIL_PASS,
    },
    logger: false, // Turn off noise in console
  });

  // 2. Connect
  await client.connect();

  // 3. Open Inbox and Fetch
  // We use 'lock' so no other process messes with the inbox while we read
  let emails = [];
  
  await client.mailboxOpen('INBOX');

  // Fetch headers of the last 10 emails (seq: '1:*' means all, we filter below)
  // fetching only 'envelope' is fast. fetching 'source' is slow (body).
  // For this test, we fetch the Source of the latest 1 email to prove it works.
  for await (let message of client.fetch('1:*', { envelope: true, source: true })) {
    // Parse the raw email source into nice HTML/Text
    const parsed = await simpleParser(message.source);
    
    emails.push({
      id: message.uid,
      subject: message.envelope.subject,
      from: message.envelope.from[0].address,
      date: message.envelope.date,
      snippet: parsed.text?.substring(0, 100) || "No preview", // First 100 chars
      html: parsed.html || parsed.textAsHtml // The full body
    });
  }

  // 4. Close Connection
  await client.logout();

  // Return the list (reversed so newest is first)
  return emails.reverse();
}