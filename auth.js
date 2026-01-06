import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        console.log("🔍 Attempting Login for:", credentials.email);
        
        try {
          await dbConnect();
          console.log("✅ Database Connected");

          // 1. Check if user exists
          const user = await User.findOne({ email: credentials.email });
          
          if (!user) {
            console.log("❌ User NOT found in Database");
            return null; // This triggers the CredentialsSignin error
          }
          console.log("✅ User Found:", user.email);

          // 2. Check Password
          const passwordsMatch = await bcrypt.compare(credentials.password, user.password);
          
          if (!passwordsMatch) {
            console.log("❌ Password Mismatch");
            return null; // This triggers the CredentialsSignin error
          }

          console.log("✅ Password Matched! Logging in...");
          
          // 3. Return user info
          return { 
            id: user._id, 
            name: user.name, 
            email: user.email, 
            role: user.role 
          };

        } catch (error) {
          console.error("❌ Login Logic Crashed:", error);
          return null;
        }
      },
    }),
  ],
});