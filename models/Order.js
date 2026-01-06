import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  package: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Package", // Assuming your package model is named 'Package'
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  termInMonths: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ["bkash", "nagad"],
    required: true,
  },
  senderNumber: {
    type: String,
    required: true,
  },
  transactionId: {
    type: String,
    required: true,
    unique: true, // Prevents duplicate transaction submissions
  },
  status: {
    type: String,
    enum: ["pending", "active", "rejected", "expired"],
    default: "pending",
  },
  expiryDate: {
    type: Date,
  },
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);