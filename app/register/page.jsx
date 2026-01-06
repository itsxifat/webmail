"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { User, Mail, Lock, ArrowRight, Loader2, Cloud, CheckCircle2 } from "lucide-react";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (res.ok) {
        router.push("/login?registered=true"); 
      } else {
        setError(data.error || "An unexpected error occurred");
      }
    } catch (err) {
      setError("Connection failed. Please check your internet.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 sm:p-6 lg:p-8 selection:bg-blue-500/30">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]" />
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
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Create your account</h1>
          <p className="text-gray-400 text-sm">Start your 14-day free trial. No credit card required.</p>
        </div>

        {/* Card */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-[24px] p-8 shadow-2xl ring-1 ring-white/5">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex items-center gap-2"
            >
              <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 px-1">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-500 transition-colors" size={17} />
                <input 
                  type="text" 
                  required
                  placeholder="Steve Jobs"
                  className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-xl pl-11 pr-4 text-[14px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none"
                  onChange={(e) => setForm({...form, name: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 px-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-500 transition-colors" size={17} />
                <input 
                  type="email" 
                  required
                  placeholder="steve@apple.com"
                  className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-xl pl-11 pr-4 text-[14px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none"
                  onChange={(e) => setForm({...form, email: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 px-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-500 transition-colors" size={17} />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••••••"
                  className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-xl pl-11 pr-4 text-[14px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none"
                  onChange={(e) => setForm({...form, password: e.target.value})}
                />
              </div>
            </div>

            <motion.button 
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit" 
              disabled={isLoading}
              className="w-full h-12 bg-white text-black font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-all disabled:opacity-50 mt-4"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  Create Account <ArrowRight size={16} />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center gap-4">
            <p className="text-sm text-gray-500">
              Already have an account?{" "}
              <Link href="/login" className="text-white hover:text-blue-400 transition font-medium underline underline-offset-4">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Social Proof / Security */}
        <div className="mt-10 flex items-center justify-center gap-6">
           <div className="flex items-center gap-2 text-[10px] text-gray-600 uppercase tracking-widest font-bold">
              <CheckCircle2 size={12} className="text-blue-500" />
              SLA Guaranteed
           </div>
           <div className="flex items-center gap-2 text-[10px] text-gray-600 uppercase tracking-widest font-bold">
              <CheckCircle2 size={12} className="text-blue-500" />
              SOC2 Compliant
           </div>
        </div>
      </motion.div>
    </div>
  );
}