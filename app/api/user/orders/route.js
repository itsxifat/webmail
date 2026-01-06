import { NextResponse } from "next/server";
import { auth } from "@/auth"; // <--- Import from your root auth.js
import dbConnect from "@/lib/db"; // <--- Adjusted to match your import style
import Order from "@/models/Order";

// POST: Create a new order
export async function POST(req) {
  try {
    await dbConnect();
    
    // In NextAuth v5, we use auth() instead of getServerSession
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { packageId, paymentMethod, senderNumber, transactionId, termMonths, totalAmount } = body;

    if (!packageId || !transactionId || !senderNumber) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existingTrx = await Order.findOne({ transactionId });
    if (existingTrx) {
      return NextResponse.json({ error: "Transaction ID already used" }, { status: 400 });
    }

    const newOrder = await Order.create({
      user: session.user.id, // Ensure your auth.config callbacks pass the ID
      package: packageId,
      amount: totalAmount,
      termInMonths: termMonths,
      paymentMethod,
      senderNumber,
      transactionId,
      status: "pending",
    });

    return NextResponse.json({ success: true, order: newOrder }, { status: 201 });

  } catch (error) {
    console.error("Order Creation Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// GET: Fetch orders for the logged-in user
export async function GET(req) {
  try {
    await dbConnect();
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch orders
    const orders = await Order.find({ user: session.user.id })
      .populate("package", "name") 
      .sort({ createdAt: -1 });

    return NextResponse.json({ orders });

  } catch (error) {
    console.error("Fetch Orders Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}