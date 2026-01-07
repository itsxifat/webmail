"use client";
import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, Mail, Lock, ArrowRight, Cloud, CheckCircle2, ShieldCheck } from "lucide-react";

// --- 1. THE FORM COMPONENT (Logic) ---
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Check if redirected from registration
  useEffect(() => {
    if (searchParams.get("registered")) {
      setSuccess("Account created successfully. Please sign in.");
    }
    // Handle NextAuth errors (e.g. ?error=CredentialsSignin)
    if (searchParams.get("error") === "CredentialsSignin") {
        setError("Invalid email or password.");
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
    <>
      {/* Branding Header */}
      <div className="text-center mb-8 sm:mb-10">
        <motion.div 
          initial={{ scale: 0.8, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 mb-6 shadow-2xl shadow-blue-500/30 ring-1 ring-white/20"
        >
          <Cloud className="text-white" size={28} />
        </motion.div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Welcome Back</h1>
        <p className="text-gray-400 text-sm max-w-xs mx-auto">Enter your credentials to access your Enfinito Cloud workspace.</p>
      </div>

      {/* Login Card */}
      <div className="bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/10 rounded-[28px] p-6 sm:p-8 shadow-2xl ring-1 ring-white/5 relative overflow-hidden">
        
        {/* Subtle Top Gradient Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />

        {/* Status Messages */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-3"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-6 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold flex items-center gap-3"
          >
            <CheckCircle2 size={14} className="text-green-500 shrink-0" />
            {success}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 px-1">Work Email</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
              <input 
                type="email" 
                required
                placeholder="name@company.com"
                className="w-full h-12 bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                onChange={(e) => setForm({...form, email: e.target.value})}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Password</label>
              <Link href="#" className="text-[10px] text-gray-500 hover:text-white transition uppercase font-bold tracking-wider">Forgot?</Link>
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
              <input 
                type="password" 
                required
                placeholder="••••••••••••"
                className="w-full h-12 bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                onChange={(e) => setForm({...form, password: e.target.value})}
              />
            </div>
          </div>

          {/* Submit */}
          <motion.button 
            whileHover={{ scale: 1.02, backgroundColor: "#ffffff" }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            disabled={loading}
            className="w-full h-12 bg-gray-100 text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-white transition-all disabled:opacity-50 mt-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
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

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-sm text-gray-500">
            New here?{" "}
            <Link href="/register" className="text-white hover:text-blue-400 transition font-medium underline underline-offset-4 decoration-white/20 hover:decoration-blue-400">
              Create an account
            </Link>
          </p>
        </div>
      </div>

      {/* Compliance Footer */}
      <div className="mt-10 flex flex-wrap justify-center gap-4 sm:gap-8 opacity-60">
         <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-widest font-bold">
            <ShieldCheck size={14} className="text-emerald-500" />
            AES-256 Encrypted
         </div>
         <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-widest font-bold">
            <CheckCircle2 size={14} className="text-blue-500" />
            SOC2 Compliant
         </div>
      </div>
    </>
  );
}

// --- 2. MAIN PAGE COMPONENT (Wrapper) ---
export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-blue-500/30">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute -top-[20%] -right-[10%] w-[70vw] h-[70vw] bg-blue-600/10 rounded-full blur-[100px] animate-pulse" style={{animationDuration: '8s'}} />
         <div className="absolute -bottom-[20%] -left-[10%] w-[70vw] h-[70vw] bg-purple-600/10 rounded-full blur-[100px] animate-pulse" style={{animationDuration: '10s'}} />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-[420px] z-10"
      >
        <Suspense fallback={
            <div className="w-full h-[500px] flex items-center justify-center bg-[#0A0A0A] border border-white/5 rounded-[28px]">
                <Loader2 className="animate-spin text-white/20" size={32} />
            </div>
        }>
            <LoginForm />
        </Suspense>
      </motion.div>
    </div>
  );
}