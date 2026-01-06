import Link from "next/link";
import { Cloud } from "lucide-react";

export default function Footer() {
  return (
    <footer className="py-20 px-6 bg-black border-t border-white/5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
         <div className="flex items-center gap-2 font-bold text-xl tracking-tighter opacity-70 hover:opacity-100 transition-opacity text-white">
            <Cloud size={24} /> Enfinito Cloud
         </div>
         
         <div className="flex gap-8 text-sm font-medium text-gray-500">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-white transition-colors">Status</Link>
            <Link href="#" className="hover:text-white transition-colors">Contact</Link>
         </div>

         <p className="text-gray-600 text-sm">
           &copy; {new Date().getFullYear()} Enfinito Inc.
         </p>
      </div>
    </footer>
  );
}