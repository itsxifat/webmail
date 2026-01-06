"use client";
import { Link } from "next/link";
import { AlertTriangle, Lock, Globe } from "lucide-react";

export default function UserOverview({ user }) {
  // STRICT CHECK: Is the user actually active?
  const isActive = user.subscriptionStatus === 'active';
  const isTrial = user.subscriptionStatus === 'trial';
  const isPastDue = user.subscriptionStatus === 'past_due';

  return (
    <div className="space-y-6">
      
      {/* 1. Subscription Warning Banner */}
      {!isActive && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-yellow-500" size={20} />
            <div>
              <h3 className="text-yellow-500 font-bold text-sm">Account Restricted</h3>
              <p className="text-yellow-200/60 text-xs">
                {isTrial ? "You are on a limited trial." : "Your subscription is inactive."} 
                Please purchase a plan to add domains.
              </p>
            </div>
          </div>
          <Link 
            href="/dashboard/packages" 
            className="px-4 py-2 bg-yellow-500 text-black text-xs font-bold rounded-lg hover:bg-yellow-400 transition"
          >
            Upgrade Now
          </Link>
        </div>
      )}

      {/* 2. Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Subscription Status" 
          value={user.subscriptionStatus.toUpperCase()} 
          color={isActive ? "text-green-500" : "text-red-500"}
        />
        <StatCard 
          label="Domains Active" 
          value={user.domains.length} 
          sub={`Limit: ${user.package?.maxDomains || 0}`}
        />
        <StatCard 
          label="Mailboxes" 
          value={user.mailboxesCount || 0} // This must be passed from API, filtered by USER ID
          sub={`Limit: ${user.package?.maxMailboxes || 0}`}
        />
      </div>

    </div>
  );
}

function StatCard({ label, value, sub, color = "text-white" }) {
  return (
    <div className="bg-[#111] border border-white/5 p-6 rounded-2xl">
      <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">{label}</p>
      <h3 className={`text-2xl font-bold ${color}`}>{value}</h3>
      {sub && <p className="text-gray-600 text-xs mt-1">{sub}</p>}
    </div>
  );
}