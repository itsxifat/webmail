"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLink({ href, children, icon: Icon, badge }) {
  const pathname = usePathname();
  // Check if the current path matches the link href
  const isActive = pathname === href;

  return (
    <Link 
      href={href}
      className={`flex items-center justify-between group px-4 py-3 text-sm font-medium transition-all border rounded-xl 
        ${isActive 
          ? "bg-purple-500/10 text-white border-purple-500/20 shadow-lg shadow-purple-500/5" 
          : "text-gray-400 border-transparent hover:bg-white/[0.03] hover:text-white hover:border-white/5"
        }`}
    >
      <div className="flex items-center gap-3">
        <Icon size={18} className={isActive ? "text-purple-500" : "group-hover:text-purple-500 transition-colors"} />
        {children}
      </div>
      
      {badge ? (
        <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold ${
          isActive ? "bg-purple-500 text-white border-transparent" : "bg-purple-500/10 text-purple-500 border-purple-500/20"
        }`}>
          {badge}
        </span>
      ) : isActive && (
        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
      )}
    </Link>
  );
}