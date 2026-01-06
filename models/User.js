import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // --- ROLE BASED ACCESS ---
  role: { 
    type: String, 
    enum: ['user', 'admin', 'support'], 
    default: 'user' 
  },

  // --- SAAS SUBSCRIPTION ---
  package: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Package',
    default: null // Null means "Free Tier" or "No Plan"
  },
  subscriptionStatus: { 
    type: String, 
    enum: ['active', 'past_due', 'cancelled', 'trial'], 
    default: 'trial' 
  },
  
  // --- RESOURCE TRACKING (Cached from Mailcow for speed) ---
  domains: [
    {
      domainName: String,
      dkimKey: String, // Cache it so we don't ask Mailcow every time
      verified: { type: Boolean, default: false },
      addedAt: { type: Date, default: Date.now }
    }
  ],

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);