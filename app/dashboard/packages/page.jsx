"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Loader2, ArrowRight, Zap } from "lucide-react";

export default function PackagesPage() {
  const { data: session } = useSession();
  const [packages, setPackages] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/packages").then(res => res.json()),
      fetch("/api/saas/stats").then(res => res.json())
    ]).then(([pkgData, statsData]) => {
      setPackages(pkgData.packages || []);
      if (statsData.success) setUserStats(statsData.stats);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-blue-500" size={40} />
        <p className="text-gray-500 text-sm animate-pulse">Loading plans...</p>
    </div>
  );

  const currentPlanId = userStats?.package?._id;

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="p-4 md:p-12 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
            Upgrade your infrastructure
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Choose a plan that fits your scale. Upgrade or downgrade anytime as your business grows.
        </p>
      </div>

      {/* Pricing Grid */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
      >
        {packages.map((pkg) => {
          const isCurrent = currentPlanId === pkg._id;
          
          return (
            <motion.div 
              variants={item}
              key={pkg._id} 
              className={`relative flex flex-col p-8 rounded-[2rem] border transition-all duration-300 group ${
                pkg.isPopular 
                  ? "bg-[#0A0A0A] border-blue-500/50 shadow-2xl shadow-blue-900/10 z-10 scale-100 md:scale-105" 
                  : "bg-[#050505] border-white/5 hover:border-white/10 hover:bg-[#080808]"
              }`}
            >
              {/* Popular Badge */}
              {pkg.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-blue-500/20 flex items-center gap-1">
                  <Zap size={12} fill="currentColor" /> Best Value
                </div>
              )}

              {/* Header Section */}
              <div className="mb-8 border-b border-white/5 pb-8">
                <h3 className={`text-xl font-bold ${pkg.isPopular ? 'text-white' : 'text-gray-200'}`}>
                    {pkg.name}
                </h3>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-lg font-bold text-gray-500">BDT</span>
                  <span className="text-5xl font-bold text-white tracking-tight">{pkg.price}</span>
                  <span className="text-gray-500 font-medium">/mo</span>
                </div>
                <p className="text-xs text-gray-500 mt-3 font-medium">
                    Billed monthly. VAT included.
                </p>
              </div>

              {/* Features List */}
              <div className="flex-1 space-y-4 mb-8">
                <Feature text={`${pkg.maxDomains} Custom Domains`} highlight={pkg.isPopular} />
                <Feature text={`${pkg.maxMailboxes} Mailboxes`} highlight={pkg.isPopular} />
                <Feature text={`${pkg.storageLimitGB}GB NVMe Storage`} highlight={pkg.isPopular} />
                <Feature text="Priority Support" highlight={pkg.isPopular} />
                <Feature text="99.9% Uptime SLA" highlight={pkg.isPopular} />
              </div>

              {/* Action Button */}
              <div className="mt-auto">
                {isCurrent ? (
                    <button disabled className="w-full py-4 bg-white/5 text-gray-500 font-bold rounded-xl cursor-not-allowed border border-white/5 flex items-center justify-center gap-2">
                      <Check size={18} /> Current Plan
                    </button>
                ) : (
                    <Link 
                    href={`/dashboard/checkout/${pkg._id}`}
                    className={`w-full py-4 font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 duration-200 ${
                        pkg.isPopular 
                        ? "bg-white text-black hover:bg-gray-100 shadow-xl shadow-white/5" 
                        : "bg-white/10 text-white hover:bg-white/20 border border-white/5"
                    }`}
                    >
                    {pkg.isPopular ? "Get Started" : "Choose Plan"} <ArrowRight size={18} />
                    </Link>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Trust Footer */}
      <div className="mt-16 text-center border-t border-white/5 pt-8">
        <p className="text-sm text-gray-500">
            Trusted by modern teams. All plans include 24/7 support and daily backups.
        </p>
      </div>

    </div>
  );
}

// Sub-component for clean feature items
function Feature({ text, highlight }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
          highlight ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-gray-400"
      }`}>
        <Check size={12} strokeWidth={3} />
      </div>
      <span className={highlight ? "text-gray-300" : "text-gray-400"}>{text}</span>
    </div>
  );
}