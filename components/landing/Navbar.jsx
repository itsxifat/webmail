"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Cloud, LayoutDashboard, ArrowRight } from "lucide-react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const isLogged = status === "authenticated";

  return (
    <nav className="fixed w-full z-[100] bg-[#050505]/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:scale-105 transition-transform duration-300">
            <Cloud size={20} className="text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">
            Enfinito<span className="text-gray-500">Cloud</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="/contact" className="hover:text-white transition-colors">Support</Link>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-4">
          {isLogged ? (
            <Link 
              href="/dashboard" 
              className="flex items-center gap-2 text-xs font-bold bg-white/5 border border-white/10 px-5 py-2.5 rounded-full hover:bg-white/10 transition-all hover:border-white/20 text-white"
            >
              <LayoutDashboard size={16} className="text-blue-400" />
              GO TO DASHBOARD
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden sm:block text-sm font-medium text-gray-400 hover:text-white transition">
                Sign In
              </Link>
              <Link 
                href="/register" 
                className="text-sm font-bold bg-white text-black px-6 py-2.5 rounded-full hover:bg-gray-200 transition-all flex items-center gap-2"
              >
                Get Started <ArrowRight size={16} />
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}