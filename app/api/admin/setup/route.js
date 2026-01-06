import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Package from '@/models/Package';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET() {
  await dbConnect();

  // 1. Create Default Packages
  const starter = await Package.findOneAndUpdate(
    { name: "Starter" },
    { name: "Starter", price: 0, maxDomains: 1, maxMailboxes: 5, storageLimitGB: 5 },
    { upsert: true, new: true }
  );

  const pro = await Package.findOneAndUpdate(
    { name: "Pro" },
    { name: "Pro", price: 29, maxDomains: 10, maxMailboxes: 50, storageLimitGB: 100, isPopular: true },
    { upsert: true, new: true }
  );

  // 2. Make YOU the Admin (Change this email to yours)
  const adminEmail = "info@enfinito.cloud"; // <--- YOUR LOGIN EMAIL
  
  const admin = await User.findOne({ email: adminEmail });
  if (admin) {
    admin.role = 'admin';
    admin.package = pro._id; // Admins get Pro features free
    await admin.save();
    return NextResponse.json({ success: true, message: "Admin upgraded & Packages created!" });
  }

  return NextResponse.json({ error: "Admin user not found. Register first!" });
}