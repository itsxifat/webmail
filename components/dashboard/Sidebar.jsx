"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LogOut, Inbox, LayoutDashboard, Globe, CreditCard, Settings, Cloud, 
  Menu, X, ShoppingBag
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Sidebar({ user, signOutAction }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Webmail", href: "/dashboard/inbox", icon: Inbox },
    { name: "My Domains", href: "/dashboard/domains", icon: Globe },
    { name: "Billing & Plans", href: "/dashboard/billing", icon: CreditCard },
    { name: "My Orders", href: "/dashboard/orders", icon: ShoppingBag }, // New Route Added Here
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <>
      {/* --- MOBILE HEADER --- */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0F1117] border-b border-white/5 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2 font-bold text-white">
          <Cloud size={20} className="text-blue-500" /> Enfinito
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-gray-400 hover:text-white">
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* --- MOBILE OVERLAY --- */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* --- SIDEBAR --- */}
      <aside className={`
        fixed md:relative top-0 left-0 h-full w-72 bg-[#0F1117] border-r border-white/5 
        flex flex-col z-50 transition-transform duration-300
        ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        
        {/* Brand */}
        <div className="h-20 flex items-center px-6 gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Cloud size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-white">Enfinito</h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Workspace</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1 mt-6 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">Menu</p>
          
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                onClick={() => setMobileOpen(false)} // Close on click (mobile)
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all group relative overflow-hidden ${
                  isActive 
                  ? "bg-blue-600/10 text-white shadow-lg shadow-blue-500/5" 
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-500 rounded-r-full" />
                )}
                <item.icon size={18} className={`shrink-0 ${isActive ? "text-blue-400" : "group-hover:text-white transition-colors"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Server Status (Professional Touch) */}
        <div className="px-6 py-4">
           <div className="bg-[#0A0C10] rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                 <span className="text-[10px] font-bold text-gray-400 uppercase">System Operational</span>
              </div>
              <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                 <div className="h-full bg-green-500 w-[98%]" />
              </div>
           </div>
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-white/5 bg-[#0A0C10]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center font-bold text-sm text-white">
              {user.name?.[0]}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-bold text-white truncate">{user.name}</div>
              <div className="text-[10px] text-gray-500 truncate font-mono">{user.email}</div>
            </div>
          </div>
          
          <form action={signOutAction}>
            <button className="w-full flex items-center justify-center gap-2 text-xs font-bold text-red-400 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 py-2.5 rounded-lg transition uppercase tracking-wider">
              <LogOut size={14} /> Sign Out
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}