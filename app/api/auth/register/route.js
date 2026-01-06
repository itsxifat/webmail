import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const { name, email, password } = await req.json();
    console.log("📝 Registering:", email);

    await dbConnect();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("⚠️ User already exists");
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });
    
    console.log("✅ User Created in DB:", newUser._id);

    return NextResponse.json({ success: true, message: "User created" });

  } catch (error) {
    console.error("❌ Registration Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}