import { NextResponse } from "next/server";
import { auth } from "@/auth"; 
import dbConnect from "@/lib/db";
import Domain from "@/models/Domain";

export async function GET(req) {
  try {
    await dbConnect();
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const domains = await Domain.find({ user: session.user.id })
      .select("-mailcowAdminPass") // Security: Don't send password to frontend list
      .sort({ createdAt: -1 });

    return NextResponse.json({ domains });

  } catch (error) {
    console.error("Fetch Domains Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}