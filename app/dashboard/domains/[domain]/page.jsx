"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Mail, Copy, Plus, Trash2, Loader2, 
  User, Lock, AtSign, RefreshCw, Globe, HardDrive, ShieldCheck 
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function DomainManagerPage() {
  const params = useParams();
  const router = useRouter();
  const domainName = decodeURIComponent(params.domain);

  const [activeTab, setActiveTab] = useState("mailboxes"); 
  // Initial state is safe, but API response might overwrite it with null
  const [data, setData] = useState({ mailboxes: [], aliases: [], limits: {} });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  
  // Form Data
  const [formData, setFormData] = useState({
    localPart: "",
    password: "",
    name: "",
    target: "" 
  });

  useEffect(() => {
    fetchData();
  }, [domainName]);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/saas/domain-manager?domain=${domainName}`);
      const json = await res.json();
      if (json.success) {
        // Safety check: ensure arrays are actually arrays
        setData({
            ...json,
            mailboxes: Array.isArray(json.mailboxes) ? json.mailboxes : [],
            aliases: Array.isArray(json.aliases) ? json.aliases : []
        });
      } else {
        toast.error(json.error || "Error loading data");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load domain data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const res = await fetch("/api/saas/domain-manager", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activeTab === 'mailboxes' ? 'mailbox' : 'alias',
          domain: domainName,
          ...formData
        })
      });

      const json = await res.json();
      if (json.success) {
        toast.success(`${activeTab === 'mailboxes' ? 'Mailbox' : 'Alias'} created!`);
        setIsModalOpen(false);
        setFormData({ localPart: "", password: "", name: "", target: "" });
        fetchData();
      } else {
        toast.error(json.error);
      }
    } catch (e) {
      toast.error("Creation failed");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if(!confirm("Are you sure? This action is irreversible.")) return;
    
    try {
        const res = await fetch("/api/saas/domain-manager", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: activeTab === 'mailboxes' ? 'mailbox' : 'alias',
              id: id,
              domain: domainName
            })
          });
          
          const json = await res.json();
          if(json.success) {
              toast.success("Deleted successfully");
              fetchData();
          } else {
              toast.error(json.error);
          }
    } catch(e) {
        toast.error("Delete failed");
    }
  };

  // --- Calculations (FIXED) ---
  const limits = data.limits || { maxMailboxes: 0, maxAliases: 0, maxStorageMB: 0 };
  
  // SAFE ACCESS: Ensure we default to empty array if data.mailboxes is somehow not an array
  const mailboxes = Array.isArray(data.mailboxes) ? data.mailboxes : [];
  const aliases = Array.isArray(data.aliases) ? data.aliases : [];

  const usageMailboxes = mailboxes.length;
  const usageAliases = aliases.length;

  // SAFE REDUCE: Uses the safe 'mailboxes' array from above
  const usageStorageBytes = mailboxes.reduce((acc, box) => acc + (box.quota || 0), 0);
  const usageStorageMB = Math.round(usageStorageBytes / 1024 / 1024);

  const currentUsageCount = activeTab === 'mailboxes' ? usageMailboxes : usageAliases;
  const currentMaxCount = activeTab === 'mailboxes' ? limits.maxMailboxes : limits.maxAliases;
  const isLimitReached = currentUsageCount >= currentMaxCount;

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#0F0F0F]"><Loader2 className="animate-spin text-blue-500" size={32}/></div>;

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-white/5 pb-8">
            <div className="flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-lg transition text-gray-400 hover:text-white">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        {domainName}
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Manage email accounts, aliases, and resources.</p>
                </div>
            </div>
            <div className="flex gap-3">
                <Link 
                    href={`/dashboard/domains/${domainName}/dns`}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition"
                >
                   <ShieldCheck size={16} className="text-green-400"/> DNS Status
                </Link>
                <button onClick={fetchData} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition">
                   <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
                </button>
            </div>
        </div>

        {/* --- STATS OVERVIEW --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <UsageCard 
                label="Storage" 
                icon={<HardDrive size={18} />} 
                used={usageStorageMB} 
                total={limits.maxStorageMB} 
                unit="MB"
                color="purple" 
            />
            <UsageCard 
                label="Mailboxes" 
                icon={<Mail size={18} />} 
                used={usageMailboxes} 
                total={limits.maxMailboxes} 
                color="blue" 
            />
            <UsageCard 
                label="Aliases" 
                icon={<Copy size={18} />} 
                used={usageAliases} 
                total={limits.maxAliases} 
                color="orange" 
            />
        </div>

        {/* --- TABS --- */}
        <div className="flex gap-8 border-b border-white/10 mb-8">
            <button 
                onClick={() => setActiveTab("mailboxes")}
                className={`pb-3 text-sm font-medium transition relative flex items-center gap-2 ${activeTab === 'mailboxes' ? "text-blue-400" : "text-gray-400 hover:text-white"}`}
            >
                <Mail size={16} /> Mailboxes
                {activeTab === 'mailboxes' && <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />}
            </button>
            <button 
                onClick={() => setActiveTab("aliases")}
                className={`pb-3 text-sm font-medium transition relative flex items-center gap-2 ${activeTab === 'aliases' ? "text-orange-400" : "text-gray-400 hover:text-white"}`}
            >
                <Copy size={16} /> Aliases
                {activeTab === 'aliases' && <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-400" />}
            </button>
        </div>

        {/* --- ACTION BAR --- */}
        <div className="flex justify-between items-center mb-6">
            <div className="text-sm font-mono text-gray-500">
                Showing {currentUsageCount} entries
            </div>
            
            {!isLimitReached ? (
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition shadow-lg ${
                        activeTab === 'mailboxes' 
                        ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20' 
                        : 'bg-orange-600 hover:bg-orange-500 shadow-orange-500/20'
                    }`}
                >
                    <Plus size={16} /> Create {activeTab === 'mailboxes' ? 'Mailbox' : 'Alias'}
                </button>
            ) : (
                 <span className="text-xs text-red-400 font-bold border border-red-400/20 bg-red-400/10 px-4 py-2 rounded-lg flex items-center gap-2">
                    <Lock size={12}/> Plan Limit Reached
                 </span>
            )}
        </div>

        {/* --- LISTS --- */}
        <div className="space-y-3">
            {activeTab === 'mailboxes' ? (
                // MAILBOX LIST (Using safe array 'mailboxes')
                mailboxes.length === 0 ? <EmptyState label="No mailboxes found" sub="Create your first email address above." /> :
                mailboxes.map((box) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                        key={box.username} 
                        className="bg-[#16181F] border border-white/5 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between group hover:border-white/10 transition-all"
                    >
                        <div className="flex items-center gap-4 mb-3 md:mb-0">
                            <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-lg flex items-center justify-center border border-blue-500/20">
                                <Mail size={20} />
                            </div>
                            <div>
                                <div className="font-bold text-white text-base">{box.username}</div>
                                <div className="text-xs text-gray-500 flex items-center gap-2">
                                    <span className="text-gray-400">{box.name || "No Name"}</span>
                                    <span>•</span>
                                    <span>{(box.quota / 1024 / 1024).toFixed(0)} MB Quota</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 md:gap-6 ml-14 md:ml-0">
                            <div className="text-right hidden md:block">
                                <div className="text-[10px] uppercase text-gray-600 font-bold tracking-wider">Usage</div>
                                <div className="text-xs font-mono text-gray-300">
                                    {Math.round((box.quota_used || 0) / 1024 / 1024)} MB Used
                                </div>
                            </div>
                            <button onClick={() => handleDelete(box.username)} className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition" title="Delete Mailbox">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </motion.div>
                ))
            ) : (
                // ALIAS LIST (Using safe array 'aliases')
                aliases.length === 0 ? <EmptyState label="No aliases found" sub="Aliases forward emails to another inbox." /> :
                aliases.map((alias) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                        key={alias.address} 
                        className="bg-[#16181F] border border-white/5 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between group hover:border-white/10 transition-all"
                    >
                         <div className="flex items-center gap-4 mb-3 md:mb-0">
                            <div className="w-10 h-10 bg-orange-500/10 text-orange-400 rounded-lg flex items-center justify-center border border-orange-500/20">
                                <Copy size={20} />
                            </div>
                            <div>
                                <div className="font-bold text-white text-base">{alias.address}</div>
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <span>Redirects to:</span> 
                                    <span className="text-orange-300 bg-orange-500/10 px-1.5 rounded border border-orange-500/20">{alias.goto}</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => handleDelete(alias.address)} className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition" title="Delete Alias">
                            <Trash2 size={18} />
                        </button>
                    </motion.div>
                ))
            )}
        </div>
      </div>

      {/* CREATE MODAL */}
      <AnimatePresence>
        {isModalOpen && (
             <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative bg-[#16181F] border border-white/10 w-full max-w-md p-6 rounded-2xl shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white">
                            New {activeTab === 'mailboxes' ? 'Mailbox' : 'Alias'}
                        </h3>
                        <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition"><X size={20}/></button>
                    </div>
                    
                    <form onSubmit={handleCreate} className="space-y-5">
                        
                        {/* 1. Local Part Input */}
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Email Address</label>
                            <div className="flex items-center bg-black/50 border border-white/10 rounded-lg px-3 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all">
                                <input 
                                    className="bg-transparent py-3 flex-1 outline-none text-white text-sm placeholder:text-gray-600"
                                    placeholder={activeTab === 'mailboxes' ? "john" : "contact"}
                                    value={formData.localPart}
                                    onChange={(e) => setFormData({...formData, localPart: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, "")})}
                                    required
                                />
                                <span className="text-gray-500 text-sm border-l border-white/10 pl-3 select-none">@{domainName}</span>
                            </div>
                        </div>

                        {/* 2. Mailbox Specific Inputs */}
                        {activeTab === 'mailboxes' && (
                            <>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Display Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 text-gray-500" size={16} />
                                        <input 
                                            className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-3 text-white text-sm outline-none focus:border-blue-500 transition-colors placeholder:text-gray-600"
                                            placeholder="e.g. John Doe"
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 text-gray-500" size={16} />
                                        <input 
                                            type="password"
                                            className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-3 text-white text-sm outline-none focus:border-blue-500 transition-colors placeholder:text-gray-600"
                                            placeholder="Secure Password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* 3. Alias Specific Input */}
                        {activeTab === 'aliases' && (
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Forward To</label>
                                <div className="relative">
                                    <AtSign className="absolute left-3 top-3 text-gray-500" size={16} />
                                    <input 
                                        type="email"
                                        className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-3 text-white text-sm outline-none focus:border-orange-500 transition-colors placeholder:text-gray-600"
                                        placeholder={`e.g. admin@${domainName}`}
                                        value={formData.target}
                                        onChange={(e) => setFormData({...formData, target: e.target.value})}
                                        required
                                    />
                                </div>
                                <p className="text-[10px] text-gray-500 mt-2">Emails sent to this alias will be forwarded to the address above.</p>
                            </div>
                        )}

                        <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white text-sm font-medium transition">Cancel</button>
                            <button disabled={formLoading} className={`px-6 py-2 rounded-lg text-white text-sm font-bold flex items-center gap-2 transition shadow-lg ${activeTab === 'mailboxes' ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20' : 'bg-orange-600 hover:bg-orange-500 shadow-orange-500/20'}`}>
                                {formLoading && <Loader2 className="animate-spin" size={14} />} 
                                {formLoading ? "Creating..." : "Create Now"}
                            </button>
                        </div>

                    </form>
                </motion.div>
             </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// --- Sub Components ---

function UsageCard({ label, icon, used, total, unit, color }) {
    const safeTotal = total > 0 ? total : 1; // Prevent div by zero
    const percentage = Math.min((used / safeTotal) * 100, 100);
    const colors = {
        purple: "text-purple-400 bg-purple-500",
        blue: "text-blue-400 bg-blue-500",
        orange: "text-orange-400 bg-orange-500"
    };

    return (
        <div className="bg-[#16181F] border border-white/5 p-5 rounded-xl">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg bg-opacity-10 ${colors[color].split(" ")[1].replace("bg-", "bg-")} ${colors[color].split(" ")[0]}`}>
                        {icon}
                    </div>
                    <span className="text-sm font-bold text-gray-300">{label}</span>
                </div>
                <span className="text-xs font-mono text-gray-500">
                    {percentage.toFixed(0)}%
                </span>
            </div>
            
            <div className="flex items-baseline gap-1 mb-2">
                <span className="text-2xl font-bold text-white">{used}</span>
                <span className="text-sm text-gray-500">/ {total} {unit}</span>
            </div>

            <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${percentage}%` }} 
                    className={`h-full rounded-full ${colors[color].split(" ")[1]}`} 
                />
            </div>
        </div>
    );
}

function EmptyState({ label, sub }) {
    return (
        <div className="text-center py-16 border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
            <Globe className="text-gray-700 mx-auto mb-3" size={48} />
            <div className="text-gray-400 font-medium">{label}</div>
            <div className="text-gray-600 text-sm mt-1">{sub}</div>
        </div>
    )
}