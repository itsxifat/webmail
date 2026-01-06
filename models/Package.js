import mongoose from "mongoose";

const PackageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  renewPrice: { type: Number, default: 0 },
  maxDomains: { type: Number, default: 1 },
  maxMailboxes: { type: Number, default: 5 },
  
  // 👇 ADD THIS SECTION 👇
  maxAliases: {
    type: Number,
    default: 10, 
  },
  // 👆 END ADD SECTION 👆

  storageLimitGB: { type: Number, default: 5 },
  isPopular: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.models.Package || mongoose.model("Package", PackageSchema);