import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar"; 

export default async function DashboardLayout({ children }) {
  const session = await auth();
  if (!session) redirect("/login");

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    // 1. OUTER SHELL: 100% Viewport Height, NO window scroll
    <div className="flex h-screen w-full bg-[#0F1117] text-white font-sans overflow-hidden">
      
      {/* Sidebar (Fixed width) */}
      <Sidebar user={session.user} signOutAction={handleSignOut} />

      {/* 2. MAIN AREA: Fills remaining width */}
      <main className="flex-1 flex flex-col relative min-w-0 bg-black">
        
        {/* Background Glow */}
        <div className="absolute top-0 left-0 w-full h-96 bg-blue-900/5 blur-[120px] pointer-events-none" />
        
        {/* 3. SCROLL CONTAINER: This is the ONLY element that scrolls */}
        {/* 'overflow-y-auto' enables scroll. 'no-scrollbar' hides the bar. */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 h-full">
           {children}
        </div>
      </main>
    </div>
  );
}