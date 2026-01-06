import { NextResponse } from 'next/server';
import { mailcowRequest } from '@/lib/mailcow'; 
import { auth } from "@/auth";
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function GET(req) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();
    
    // 1. Get the current User from DB to see THEIR domains
    const user = await User.findById(session.user.id).populate('package');
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // 2. Fetch all mailboxes from Mailcow
    const allMailboxes = await mailcowRequest('get/mailbox/all');

    // 3. FILTER: Only count mailboxes that match the user's domains
    // user.domains is an array like [{ domainName: "client.com" }]
    const userDomainNames = user.domains.map(d => d.domainName);

    let myMailboxCount = 0;
    
    if (Array.isArray(allMailboxes)) {
      myMailboxCount = allMailboxes.filter(mbox => {
        // Mailcow returns 'domain' field in mailbox object
        return userDomainNames.includes(mbox.domain);
      }).length;
    }

    return NextResponse.json({ 
      success: true, 
      stats: {
        activeDomains: user.domains.length,
        mailboxes: myMailboxCount, // <--- NOW CORRECTLY FILTERED
        subscriptionStatus: user.subscriptionStatus,
        package: user.package,
        storageUsed: 0, 
        storageLimit: user.package?.storageLimitGB || 0
      }
    });

  } catch (error) {
    console.error("Stats Error:", error);
    return NextResponse.json({ success: false, error: error.message });
  }
}