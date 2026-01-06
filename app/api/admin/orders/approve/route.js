import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import User from "@/models/User";

export async function POST(req) {
  try {
    await dbConnect();
    const session = await auth();

    // 1. Security Check: Ensure User is Admin
    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    // 2. Find the Order
    const order = await Order.findById(orderId).populate("package");
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status === "active") {
      return NextResponse.json({ error: "Order is already active" }, { status: 400 });
    }

    // 3. Update Order Status
    // FIX: Changed 'paid' to 'active' to match your Mongoose Schema Enum
    order.status = "active";
    await order.save();

    // 4. Calculate New Expiry Date
    // Current date + Term months (e.g., 1 or 12)
    const newExpiry = new Date();
    newExpiry.setMonth(newExpiry.getMonth() + order.termInMonths);

    // 5. Upgrade the User's Account
    await User.findByIdAndUpdate(order.user, {
      package: order.package._id,       // Assign new package ID
      packageExpiry: newExpiry,         // Set new expiration date
      
      // Optional: Reset usage limits on upgrade (uncomment if needed)
      // domainsCreated: 0, 
    });

    return NextResponse.json({ 
      success: true, 
      message: "Order approved and User package updated successfully",
      order 
    });

  } catch (error) {
    console.error("Order Approval Error:", error);
    return NextResponse.json({ error: error.message || "Server Error" }, { status: 500 });
  }
}