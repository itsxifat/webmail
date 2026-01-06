import mongoose from "mongoose";

const DomainSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ["Pending DNS", "Verified", "Active", "Suspended"],
    default: "Pending DNS",
  },
  // --- NEW FIELDS: RESOURCE ALLOCATION ---
  quotaStorage: {
    type: Number,
    default: 1024, // in MB
  },
  quotaMailboxes: {
    type: Number,
    default: 5,
  },
  quotaAliases: {
    type: Number,
    default: 10,
  },
  // ---------------------------------------
  mailcowAdminUser: { type: String },
  mailcowAdminPass: { type: String },
  dkimKey: { type: String }, 
  spfRecord: { type: String },
}, { timestamps: true });

export default mongoose.models.Domain || mongoose.model("Domain", DomainSchema);