import mongoose from "mongoose";

const MailboxSchema = new mongoose.Schema({
  domain: { type: String, required: true },
  email: { type: String, required: true, unique: true }, // The full email (user@domain)
  password: { type: String, required: true }, // In prod, encrypt this!
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Mailbox || mongoose.model("Mailbox", MailboxSchema);