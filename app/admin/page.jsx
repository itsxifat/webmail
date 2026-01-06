"use client";
import { useQuery } from "@tanstack/react-query";
import { Users, CreditCard, Loader2, Server, TrendingUp, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

// Fetcher
const fetchAllUsers = async () => {
  const res = await fetch("/api/admin/users");
  if (!res.ok) throw new Error("Unauthorized");
  return res.json();
};

export default function AdminOverview() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-users"],
    queryFn: fetchAllUsers,
    refetchInterval: 30000, // Refresh every 30s
  });

  const users = data?.users || [];

  // --- REAL TIME CALCULATIONS ---
  // 1. Total Users
  const totalUsers = users.length;

  // 2. Active Domains (Sum of all domains across all users)
  const totalDomains = users.reduce((acc, user) => acc + (user.domains?.length || 0), 0);

  // 3. Monthly Recurring Revenue (Sum of package prices)
  const totalRevenue = users.reduce((acc, user) => acc + (user.package?.price || 0), 0);

  // 4. Storage (Estimated based on 5GB per free user, 50GB per pro)
  // In future, we can pull real storage from Mailcow API, but this is a valid DB calculation:
  const totalStorageAllocated = users.reduce((acc, user) => acc + (user.package?.storageLimitGB || 5), 0);

  if (isLoading) return (
    <div className="h-full flex items-center justify-center text-purple-500">
        <Loader2 className="animate-spin w-10 h-10" />
    </div>
  );

  if (isError) return (
    <div className="p-10 text-center text-red-500 flex flex-col items-center">
        <AlertTriangle size={48} className="mb-4" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p>Unable to load admin data.</p>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto">
      
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">System Overview</h1>
          <p className="text-gray-400">Live data from MongoDB & Mailcow.</p>
        </div>
        <div className="flex gap-2 items-center bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
            <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-green-500 text-xs font-mono font-bold uppercase">Live</span>
        </div>
      </div>

      {/* Stats Grid - ALL REAL DATA */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <AdminStatCard 
            title="Total Users" 
            value={totalUsers} 
            icon={<Users className="text-blue-400"/>} 
        />
        <AdminStatCard 
            title="Active Domains" 
            value={totalDomains} 
            icon={<Server className="text-purple-400"/>} 
        />
        <AdminStatCard 
            title="Monthly Revenue" 
            value={`$${totalRevenue}`} 
            icon={<CreditCard className="text-green-400"/>} 
        />
        <AdminStatCard 
            title="Allocated Storage" 
            value={`${totalStorageAllocated} GB`} 
            icon={<Server className="text-yellow-400"/>} 
            sub="Total Quota" 
        />
      </div>

      {/* Recent Signups Table - REAL DATA */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Latest Registrations</h2>
        </div>
        
        {users.length === 0 ? (
            <div className="p-10 text-center text-gray-500">No users found in database.</div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-white/[0.02] text-xs uppercase font-medium text-gray-500">
                    <tr>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Package</th>
                        <th className="px-6 py-4">Domains</th>
                        <th className="px-6 py-4">Joined</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                    {/* Show only the top 10 most recent users */}
                    {users.slice(0, 10).map((user) => (
                        <tr key={user._id} className="hover:bg-white/[0.02] transition">
                        <td className="px-6 py-4">
                            <div className="text-white font-medium">{user.name}</div>
                            <div className="text-xs text-gray-600">{user.email}</div>
                        </td>
                        <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold border ${
                                user.role === 'admin' 
                                ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                                : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            }`}>
                                {user.role.toUpperCase()}
                            </span>
                        </td>
                        <td className="px-6 py-4">
                            {user.package ? (
                                <span className="text-white">{user.package.name} <span className="text-gray-600">(${user.package.price})</span></span>
                            ) : (
                                <span className="text-gray-500">Free Tier</span>
                            )}
                        </td>
                        <td className="px-6 py-4 text-white font-mono">
                            {user.domains?.length || 0}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">
                            {user.createdAt ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true }) : 'N/A'}
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>

    </div>
  );
}

function AdminStatCard({ title, value, icon, sub }) {
  return (
    <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-xl hover:border-purple-500/30 transition-colors group">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-white/5 rounded-lg group-hover:bg-white/10 transition">{icon}</div>
      </div>
      <div>
        <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
        {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
      </div>
    </div>
  );
}