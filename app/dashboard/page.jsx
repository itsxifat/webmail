"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Plus, ArrowUpRight, HardDrive, Globe, Mail, 
  Loader2, CheckCircle2, AlertTriangle, CreditCard 
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function DashboardOverview() {
  const { data: session } = useSession();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/saas/stats');
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
        }
      } catch (e) {
        console.error("Failed to load stats", e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // --- LOGIC: Real Progress Calculation ---
  const hasPlan = !!stats?.package;
  const hasDomain = stats?.activeDomains > 0;
  const hasMailbox = stats?.mailboxes > 0;
  
  // Calculate completion percentage based on real actions
  let completedSteps = 1; // 1. Create Account (Always done if they are here)
  if (hasPlan) completedSteps++;
  if (hasDomain) completedSteps++;
  if (hasMailbox) completedSteps++;
  
  const progress = (completedSteps / 4) * 100;

  if (loading) return (
    <div className="h-[calc(100vh-64px)] flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-500" size={32} />
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      
      {/* --- HEADER --- */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {session?.user?.name?.split(' ')[0]}
          </h1>
          <p className="text-gray-400">Here is what's happening with your infrastructure today.</p>
        </div>
        <div className="flex gap-3">
          <Link 
            href="/dashboard/packages" 
            className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition text-sm font-medium flex items-center gap-2"
          >
            <CreditCard size={16} /> {hasPlan ? "Manage Plan" : "Purchase Plan"}
          </Link>
          <Link 
            href="/dashboard/domains" 
            className={`px-4 py-2 rounded-lg transition text-sm font-bold flex items-center gap-2 shadow-lg ${
                hasPlan 
                ? "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20" 
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
            }`}
            onClick={(e) => !hasPlan && e.preventDefault()}
          >
            <Plus size={16} /> Add Domain
          </Link>
        </div>
      </header>

      {/* --- ALERT: No Plan --- */}
      {!hasPlan && (
        <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center justify-between"
        >
            <div className="flex items-center gap-3">
                <AlertTriangle className="text-red-500" size={20} />
                <div>
                    <h3 className="text-red-500 font-bold text-sm">Action Required</h3>
                    <p className="text-red-200/60 text-xs">You must purchase a subscription package to create domains and mailboxes.</p>
                </div>
            </div>
            <Link href="/dashboard/packages" className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition">
                View Packages
            </Link>
        </motion.div>
      )}

      {/* --- STATS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Active Domains" 
          value={stats?.activeDomains || 0} 
          limit={stats?.package?.maxDomains}
          icon={<Globe className="text-blue-400" size={24} />} 
        />
        <StatCard 
          title="Total Mailboxes" 
          value={stats?.mailboxes || 0} 
          limit={stats?.package?.maxMailboxes}
          icon={<Mail className="text-purple-400" size={24} />} 
        />
        <StatCard 
          title="Storage Usage" 
          value={`${stats?.storageUsed || 0} GB`} 
          limit={stats?.package?.storageLimitGB ? `${stats.package.storageLimitGB} GB` : "0 GB"}
          icon={<HardDrive className="text-green-400" size={24} />} 
        />
      </div>

      {/* --- MAIN CONTENT SPLIT --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Onboarding Checklist */}
        <div className="lg:col-span-2 bg-[#0A0A0A] border border-white/5 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white">Setup Progress</h3>
                <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                    {progress}% Complete
                </span>
            </div>
            
            <div className="space-y-4">
                <CheckItem 
                    completed={true} 
                    title="Create Account" 
                    desc="Your account is active and verified." 
                />
                <CheckItem 
                    completed={hasPlan} 
                    title="Select Subscription" 
                    desc={hasPlan ? `Active Plan: ${stats.package.name}` : "Choose a plan to unlock features."}
                    action={!hasPlan && "/dashboard/packages"}
                    btnText="View Plans"
                />
                <CheckItem 
                    completed={hasDomain} 
                    title="Connect Domain" 
                    desc={hasDomain ? "Domain verified and active." : "Add your custom domain (e.g. company.com)."}
                    action={hasPlan && !hasDomain && "/dashboard/domains"}
                    btnText="Add Domain"
                    disabled={!hasPlan}
                />
                <CheckItem 
                    completed={hasMailbox} 
                    title="Create First Mailbox" 
                    desc="Create an email address for yourself." 
                    action={hasDomain && !hasMailbox && "/dashboard/mailboxes"}
                    btnText="Create Email"
                    disabled={!hasDomain}
                />
            </div>
        </div>

        {/* Right: Real Plan Details */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 flex flex-col h-full">
            <h3 className="text-lg font-bold text-white mb-6">Current Subscription</h3>
            
            {hasPlan ? (
                <>
                    <div className="mb-6 pb-6 border-b border-white/5">
                        <div className="text-2xl font-bold text-white mb-1">{stats.package.name}</div>
                        <div className="text-sm text-gray-400 font-mono">${stats.package.price}/month</div>
                    </div>
                    
                    <div className="space-y-4 mb-8 flex-1">
                        <PlanDetail label="Domains" value={stats.package.maxDomains} used={stats.activeDomains} />
                        <PlanDetail label="Mailboxes" value={stats.package.maxMailboxes} used={stats.mailboxes} />
                        <PlanDetail label="Storage" value={`${stats.package.storageLimitGB} GB`} used={`${stats.storageUsed} GB`} />
                    </div>

                    <Link 
                        href="/dashboard/packages"
                        className="w-full py-3 bg-white/5 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/10 transition text-center text-sm"
                    >
                        Upgrade Plan
                    </Link>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-70">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                        <CreditCard className="text-gray-500" size={32} />
                    </div>
                    <p className="text-sm text-gray-400 mb-6">You have no active subscription.</p>
                    <Link 
                        href="/dashboard/packages"
                        className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition text-center text-sm"
                    >
                        Browse Plans
                    </Link>
                </div>
            )}
        </div>

      </div>
    </div>
  );
}

// --- SUB COMPONENTS ---

function StatCard({ title, value, limit, icon }) {
  return (
    <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-2xl relative overflow-hidden group hover:border-white/10 transition-colors">
      <div className="absolute top-0 right-0 p-5 opacity-40 group-hover:opacity-100 transition-opacity grayscale group-hover:grayscale-0">
        {icon}
      </div>
      <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">{title}</h3>
      <div className="text-3xl font-black text-white mb-1">
        {value} <span className="text-lg text-gray-600 font-medium">/ {limit || "-"}</span>
      </div>
    </div>
  );
}

function CheckItem({ completed, title, desc, action, btnText, disabled }) {
  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${completed ? 'border-green-500/20 bg-green-500/5' : 'border-white/5 bg-white/[0.02]'}`}>
      <div className="flex items-center gap-4">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${completed ? 'bg-green-500 border-green-500' : 'border-gray-700 bg-white/5'}`}>
          {completed && <CheckCircle2 size={14} className="text-black" />}
        </div>
        <div>
          <h4 className={`text-sm font-bold ${completed ? 'text-white' : 'text-gray-400'}`}>{title}</h4>
          <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
        </div>
      </div>
      {action && !completed && (
        <Link 
            href={disabled ? "#" : action} 
            className={`text-xs px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                disabled 
                ? "opacity-50 cursor-not-allowed bg-white/5 text-gray-500" 
                : "bg-blue-600 text-white hover:bg-blue-500"
            }`}
        >
          {btnText} <ArrowUpRight size={12} />
        </Link>
      )}
    </div>
  );
}

function PlanDetail({ label, value, used }) {
    // Calculate percentage for progress bar
    // If value is a string (like "50 GB"), we just show text. If number, we show bar.
    const isNumber = typeof value === 'number';
    const percent = isNumber && value > 0 ? (used / value) * 100 : 0;

    return (
        <div>
            <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-400 font-medium">{label}</span>
                <span className="text-white font-bold">{used} / {value}</span>
            </div>
            {isNumber && (
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${percent}%` }} />
                </div>
            )}
        </div>
    )
}