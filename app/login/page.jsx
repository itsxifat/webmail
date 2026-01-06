"use client";
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, Mail, Lock, ArrowRight, Cloud, CheckCircle2 } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Check if redirected from a successful registration
  useEffect(() => {
    if (searchParams.get("registered")) {
      setSuccess("Account created successfully. Please sign in.");
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: form.email,
        password: form.password,
      });

      if (res?.error) {
        setError("Invalid email or password");
        setLoading(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 sm:p-6 lg:p-8 selection:bg-blue-500/30">
      
      {/* Dynamic Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[440px] z-10"
      >
        {/* Branding */}
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-400 mb-6 shadow-2xl shadow-blue-500/40"
          >
            <Cloud className="text-white" size={24} />
          </motion.div>
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Welcome back</h1>
          <p className="text-gray-400 text-sm">Sign in to manage your Enfinito Cloud workspace.</p>
        </div>

        {/* Card */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-[24px] p-8 shadow-2xl ring-1 ring-white/5 relative overflow-hidden">
          
          {/* Status Messages */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex items-center gap-2"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium flex items-center gap-2"
            >
              <CheckCircle2 size={14} className="text-green-500" />
              {success}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 px-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-500 transition-colors" size={17} />
                <input 
                  type="email" 
                  required
                  placeholder="name@company.com"
                  className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-xl pl-11 pr-4 text-[14px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all outline-none"
                  onChange={(e) => setForm({...form, email: e.target.value})}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Password</label>
                <Link href="#" className="text-[11px] text-gray-500 hover:text-white transition uppercase font-bold tracking-wider">Forgot?</Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-500 transition-colors" size={17} />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••••••"
                  className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-xl pl-11 pr-4 text-[14px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all outline-none"
                  onChange={(e) => setForm({...form, password: e.target.value})}
                />
              </div>
            </div>

            {/* Submit Button */}
            <motion.button 
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit" 
              disabled={loading}
              className="w-full h-12 bg-white text-black font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-all disabled:opacity-50 mt-4 shadow-xl shadow-white/5"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  Sign In <ArrowRight size={16} />
                </>
              )}
            </motion.button>
          </form>

          {/* Footer Link */}
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-sm text-gray-500">
              New to Enfinito?{" "}
              <Link href="/register" className="text-white hover:text-blue-400 transition font-medium underline underline-offset-4">
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* Security / Compliance Footnotes */}
        <div className="mt-10 flex items-center justify-center gap-6">
           <div className="flex items-center gap-2 text-[10px] text-gray-600 uppercase tracking-widest font-bold">
              <CheckCircle2 size={12} className="text-blue-500" />
              AES-256 Encryption
           </div>
           <div className="flex items-center gap-2 text-[10px] text-gray-600 uppercase tracking-widest font-bold">
              <CheckCircle2 size={12} className="text-blue-500" />
              Secure Session
           </div>
        </div>
      </motion.div>
    </div>
  );
}