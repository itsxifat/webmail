// app/api/admin/users/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Package from '@/models/Package'; // Ensure Package model is loaded
import { auth } from "@/auth";

export async function GET(req) {
  try {
    const session = await auth();
    
    // Strict Admin Check
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    await dbConnect();

    // Fetch REAL users from MongoDB
    const users = await User.find({})
      .select('-password') // Don't send passwords
      .populate('package') // Get the actual package details
      .sort({ createdAt: -1 }); // Newest first

    return NextResponse.json({ success: true, users });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}