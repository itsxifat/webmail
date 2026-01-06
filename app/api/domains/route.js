import { NextResponse } from 'next/server';
import { auth } from "@/auth";
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { mailcowRequest } from '@/lib/mailcow'; // Ensure you have this helper

// 1. GET: List all domains for the logged-in user
export async function GET(req) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const user = await User.findById(session.user.id);
    
    return NextResponse.json({ success: true, domains: user.domains || [] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. POST: Add a new domain (WITH LIMIT CHECKS)
export async function POST(req) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { domain } = await req.json();
    
    // Basic Validation
    if (!domain || !domain.includes('.')) {
        return NextResponse.json({ error: "Invalid domain format" }, { status: 400 });
    }

    await dbConnect();

    // --- CRITICAL: FETCH USER WITH PACKAGE ---
    const user = await User.findById(session.user.id).populate('package');

    // CHECK 1: Is Subscription Active?
    // We check if they have a package AND if status is 'active'
    if (!user.package || user.subscriptionStatus !== 'active') {
        return NextResponse.json({ 
            error: "Subscription inactive. Please purchase a plan to add domains." 
        }, { status: 402 }); // 402 Payment Required
    }

    // CHECK 2: Package Limits
    const currentDomains = user.domains.length;
    const maxDomains = user.package.maxDomains;

    if (currentDomains >= maxDomains) {
        return NextResponse.json({ 
            error: `Upgrade required. Your ${user.package.name} plan is limited to ${maxDomains} domains.` 
        }, { status: 403 }); // 403 Forbidden
    }

    // --- STEP 3: Create in Mailcow (External Server) ---
    // We send the request to your Mailcow server
    const mcRes = await mailcowRequest('add/domain', 'POST', {
        domain: domain,
        description: `Created by User ${user._id}`,
        active: 1,
        // Set default quotas based on package if needed
        def_quota_for_mailbox: 3072, // 3GB default
        max_quota_for_mailbox: 10240, // 10GB max
        max_quota_for_domain: user.package.storageLimitGB * 1024 * 1024 * 1024 // Convert GB to Bytes
    });

    if (mcRes.type === 'error') {
        return NextResponse.json({ error: `Mailcow Error: ${mcRes.msg}` }, { status: 400 });
    }

    // --- STEP 4: Save to MongoDB ---
    user.domains.push({
        domainName: domain,
        active: true,
        createdAt: new Date()
    });
    
    await user.save();

    return NextResponse.json({ success: true, message: "Domain added successfully" });

  } catch (error) {
    console.error("Domain Add Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}