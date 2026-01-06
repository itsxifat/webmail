"use client";
import { useSession } from "next-auth/react";
import { User, Lock, Bell, Shield } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-8">Account Settings</h1>

      <div className="space-y-6">
        
        {/* Profile Section */}
        <section className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
           <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold text-white">
                 {session?.user?.name?.[0]}
              </div>
              <div className="flex-1">
                 <h3 className="text-lg font-bold text-white">Public Profile</h3>
                 <p className="text-sm text-gray-400 mb-4">This will be displayed on your invoices.</p>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Full Name</label>
                       <input defaultValue={session?.user?.name} className="w-full bg-[#16181F] border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                    </div>
                    <div>
                       <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Email</label>
                       <input defaultValue={session?.user?.email} disabled className="w-full bg-[#16181F] border border-white/10 rounded-lg px-3 py-2 text-gray-500 text-sm cursor-not-allowed" />
                    </div>
                 </div>
              </div>
           </div>
           <div className="mt-6 flex justify-end">
              <button className="px-4 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-gray-200">Save Changes</button>
           </div>
        </section>

        {/* Security Section */}
        <section className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
           <div className="flex items-center gap-3 mb-4">
              <Lock className="text-gray-400" size={20} />
              <h3 className="text-lg font-bold text-white">Security</h3>
           </div>
           <div className="space-y-4">
              <div className="flex justify-between items-center p-4 border border-white/5 rounded-xl bg-[#16181F]">
                 <div>
                    <div className="text-sm font-bold text-white">Password</div>
                    <div className="text-xs text-gray-500">Last changed 3 months ago</div>
                 </div>
                 <button className="text-xs border border-white/10 px-3 py-1.5 rounded-lg text-white hover:bg-white/5">Change</button>
              </div>
              <div className="flex justify-between items-center p-4 border border-white/5 rounded-xl bg-[#16181F]">
                 <div>
                    <div className="text-sm font-bold text-white">Two-Factor Authentication</div>
                    <div className="text-xs text-gray-500">Add an extra layer of security</div>
                 </div>
                 <button className="text-xs bg-blue-600/10 text-blue-400 px-3 py-1.5 rounded-lg border border-blue-500/20">Enable</button>
              </div>
           </div>
        </section>

      </div>
    </div>
  );
}