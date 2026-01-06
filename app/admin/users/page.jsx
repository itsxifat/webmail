"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { 
  Search, 
  UserCog, 
  Mail, 
  Calendar, 
  Shield, 
  ExternalLink, 
  MoreHorizontal,
  Loader2,
  Filter,
  Globe
} from "lucide-react";
import { format } from "date-fns";

// Fetcher function
const fetchUsers = async () => {
  const res = await fetch("/api/admin/users");
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
};

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-users-list"],
    queryFn: fetchUsers,
  });

  const users = data?.users || [];

  // Filter logic for search
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
      <Loader2 className="animate-spin text-purple-500" size={40} />
      <p className="text-gray-500 font-medium">Loading User Database...</p>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto">
      
      {/* --- HEADER & ACTIONS --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <UserCog className="text-purple-500" />
            User Management
          </h1>
          <p className="text-gray-400 mt-1">
            Total registered users: <span className="text-white font-bold">{users.length}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
            <input 
              type="text" 
              placeholder="Search name or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#0a0a0a] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500 w-64 transition-all"
            />
          </div>
          <button className="p-2 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* --- USERS TABLE --- */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.02] border-b border-white/10">
              <tr>
                <th className="px-6 py-5 font-semibold text-gray-400">User Profile</th>
                <th className="px-6 py-5 font-semibold text-gray-400">Role & Status</th>
                <th className="px-6 py-5 font-semibold text-gray-400">Current Plan</th>
                <th className="px-6 py-5 font-semibold text-gray-400">Infrastructure</th>
                <th className="px-6 py-5 font-semibold text-gray-400">Join Date</th>
                <th className="px-6 py-5 font-semibold text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center text-gray-500">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-white/[0.01] transition-colors group">
                    {/* User Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-purple-900/20">
                          {user.name[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-white font-semibold">{user.name}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Mail size={12} /> {user.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role & Status */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <span className={`w-fit px-2 py-0.5 rounded text-[10px] font-bold border tracking-wider ${
                          user.role === 'admin' 
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                          {user.role?.toUpperCase()}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-green-500 font-bold uppercase">
                          <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                          Active
                        </div>
                      </div>
                    </td>

                    {/* Package */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">
                          {user.package?.name || "Free Tier"}
                        </span>
                        {user.package?.price > 0 && (
                          <span className="text-[10px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded border border-green-500/20">
                            PAID
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        ${user.package?.price || 0} / month
                      </div>
                    </td>

                    {/* Domains/Infrastructure */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs text-gray-300">
                          <Globe size={14} className="text-gray-500" />
                          <span>{user.domains?.length || 0} Domains</span>
                        </div>
                        <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                           <div 
                             className="h-full bg-purple-500" 
                             style={{ width: `${Math.min((user.domains?.length || 0) * 20, 100)}%` }} 
                           />
                        </div>
                      </div>
                    </td>

                    {/* Joined Date */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Calendar size={14} />
                        <span className="text-xs">
                          {user.createdAt ? format(new Date(user.createdAt), "MMM dd, yyyy") : "N/A"}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 hover:bg-purple-500/10 hover:text-purple-400 rounded-lg text-gray-500 transition shadow-sm border border-transparent hover:border-purple-500/20">
                          <UserCog size={16} />
                        </button>
                        <button className="p-2 hover:bg-white/10 hover:text-white rounded-lg text-gray-500 transition border border-transparent hover:border-white/10">
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer Info */}
        <div className="p-6 bg-white/[0.01] border-t border-white/5 text-xs text-gray-500">
          Showing <span className="text-white">{filteredUsers.length}</span> users from total database.
        </div>
      </div>
    </div>
  );
}