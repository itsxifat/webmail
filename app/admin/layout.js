import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { 
  Users, 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  ShieldCheck, 
  Package, 
  Globe, 
  Server,
  ShoppingCart,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { signOut } from "@/auth"; 
import NavLink from "@/components/admin/NavLink"; // We'll create this for active states

export default async function AdminLayout({ children }) {
  const session = await auth();
  
  if (!session) redirect("/login");
  if (session.user.role !== 'admin') redirect("/dashboard");

  const navItems = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard },
    { name: "Order Approvals", href: "/admin/orders", icon: ShoppingCart, badge: "Action" },
    { name: "User Management", href: "/admin/users", icon: Users },
    { name: "Packages & Plans", href: "/admin/packages", icon: Package },
    { name: "All Domains", href: "/admin/domains", icon: Globe },
    { name: "System Health", href: "/admin/system", icon: Server },
  ];

  return (
    <div className="flex h-screen bg-[#050505] text-white font-sans selection:bg-purple-500/30 overflow-hidden">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-72 bg-[#080808] border-r border-white/5 flex flex-col z-20">
        {/* Brand Header */}
        <div className="p-8">
          <div className="flex items-center gap-3 group cursor-default">
            <div className="w-11 h-11 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/20 group-hover:scale-105 transition-transform duration-500">
              <ShieldCheck size={24} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tighter leading-none">Command</h1>
              <p className="text-[10px] text-purple-500 font-black uppercase tracking-[0.2em] mt-1">Infrastructure</p>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-4 overflow-y-auto space-y-8 pt-4 custom-scrollbar">
          <div>
            <p className="px-4 text-[10px] font-bold text-gray-600 uppercase tracking-[0.15em] mb-4">Core Management</p>
            <div className="space-y-1">
              {navItems.map((item) => (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className="flex items-center justify-between group px-4 py-3 text-sm font-medium text-gray-400 rounded-xl hover:bg-white/[0.03] hover:text-white transition-all border border-transparent hover:border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={18} className="group-hover:text-purple-500 transition-colors" />
                    {item.name}
                  </div>
                  {item.badge ? (
                    <span className="text-[9px] bg-purple-500/10 text-purple-500 px-2 py-0.5 rounded-full border border-purple-500/20 font-bold">
                      {item.badge}
                    </span>
                  ) : (
                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-gray-600" />
                  )}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="px-4 text-[10px] font-bold text-gray-600 uppercase tracking-[0.15em] mb-4">Configuration</p>
            <Link 
              href="/admin/settings"
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-400 rounded-xl hover:bg-white/[0.03] hover:text-white transition-all"
            >
              <Settings size={18} />
              Platform Settings
            </Link>
          </div>
        </nav>

        {/* Bottom User Section */}
        <div className="p-4 mt-auto border-t border-white/5 bg-black/20">
          <Link 
            href="/dashboard"
            className="flex items-center justify-between px-4 py-3 text-xs font-bold text-gray-500 hover:text-white transition-all bg-white/5 rounded-xl border border-white/5 mb-3 group"
          >
            <div className="flex items-center gap-2">
              <LayoutDashboard size={14} />
              EXIT TO APP
            </div>
            <ExternalLink size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
          
          <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-500/70 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all tracking-widest uppercase">
              <LogOut size={16} /> Terminate Session
            </button>
          </form>
        </div>
      </aside>

      {/* --- MAIN AREA --- */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Animated Background Gradients */}
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
        
        {/* Header/Top Bar */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#050505]/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <span className="text-gray-300">Admin</span>
            <ChevronRight size={12} />
            <span className="text-white">Active Management</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-white leading-none">{session.user.name}</p>
              <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-tighter">Root Administrator</p>
            </div>
            <div className="w-10 h-10 rounded-full border border-white/10 p-0.5">
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center font-bold text-xs">
                {session.user.name[0]}
              </div>
            </div>
          </div>
        </header>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto z-10 p-10 custom-scrollbar">
           {children}
        </div>
      </main>
    </div>
  );
}