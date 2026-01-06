import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import User from "@/models/User";     // Needed for population
import Package from "@/models/Package"; // Needed for population

export async function GET(req) {
  try {
    await dbConnect();
    const session = await auth();

    // 1. Security Check: Only Admin can access this
    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch ALL orders (sorted by newest first)
    const orders = await Order.find({})
      .populate("user", "name email") // Get the user's name and email
      .populate("package", "name")    // Get the package name
      .sort({ createdAt: -1 });

    return NextResponse.json({ orders });

  } catch (error) {
    console.error("Admin Fetch Orders Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}