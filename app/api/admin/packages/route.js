import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Package from "@/models/Package";

export async function GET(req) {
  try {
    await dbConnect();
    const packages = await Package.find({}).sort({ price: 1 });
    return NextResponse.json({ packages });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    // Create package with ALL fields
    const newPackage = await Package.create({
      name: body.name,
      price: body.price,
      renewPrice: body.renewPrice,
      maxDomains: body.maxDomains,
      maxMailboxes: body.maxMailboxes,
      maxAliases: body.maxAliases, // <--- MAKE SURE THIS IS HERE
      storageLimitGB: body.storageLimitGB,
      isPopular: body.isPopular
    });

    return NextResponse.json({ success: true, package: newPackage });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create package" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await dbConnect();
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...updates } = body;

    const updatedPackage = await Package.findByIdAndUpdate(id, updates, { new: true });

    return NextResponse.json({ success: true, package: updatedPackage });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update package" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await dbConnect();
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await req.json();
    await Package.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}