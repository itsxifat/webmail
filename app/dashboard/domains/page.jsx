"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Plus, AlertCircle, Loader2, Globe, ArrowRight, Settings, 
  X, Lock, HardDrive, Mail, Copy, Edit3, BarChart3, Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner"; 

export default function DomainsPage() {
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [domainName, setDomainName] = useState("");
  
  const [allocation, setAllocation] = useState({
    storageMB: 1024, 
    mailboxes: 5,
    aliases: 10
  });

  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [domains, setDomains] = useState([]);
  
  const [stats, setStats] = useState({
    domains: { used: 0, max: 0 },
    storage: { usedMB: 0, maxMB: 0 },
    mailboxes: { used: 0, max: 0 },
    aliases: { used: 0, max: 0 }
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [domainsRes, statsRes] = await Promise.all([
        fetch("/api/user/domains"), 
        fetch("/api/saas/stats")    
      ]);

      const domainsData = await domainsRes.json();
      const statsData = await statsRes.json();

      if (domainsData.domains) setDomains(domainsData.domains);
      
      if (statsData.success) {
        const pkg = statsData.stats.package;
        const currentDomains = domainsData.domains || [];

        const allocatedStorage = currentDomains.reduce((acc, d) => acc + (d.quotaStorage || 0), 0);
        const allocatedMailboxes = currentDomains.reduce((acc, d) => acc + (d.quotaMailboxes || 0), 0);
        const allocatedAliases = currentDomains.reduce((acc, d) => acc + (d.quotaAliases || 0), 0);

        setStats({
          domains: { used: currentDomains.length, max: pkg.maxDomains },
          storage: { usedMB: allocatedStorage, maxMB: pkg.storageLimitGB * 1024 },
          mailboxes: { used: allocatedMailboxes, max: pkg.maxMailboxes },
          aliases: { used: allocatedAliases, max: pkg.maxAliases || 0 },
        });
      }
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    await submitDomain("/api/saas/add-domain", { 
        domain: domainName, 
        quotaStorage: allocation.storageMB,
        quotaMailboxes: allocation.mailboxes,
        quotaAliases: allocation.aliases
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    await submitDomain("/api/saas/update-domain", {
        domainId: selectedDomain._id,
        quotaStorage: allocation.storageMB,
        quotaMailboxes: allocation.mailboxes,
        quotaAliases: allocation.aliases
    });
  };

  const handleDelete = async (domainId) => {
    if(!confirm("Are you sure? This will permanently delete the domain and all its emails from the server.")) return;
    
    setDeletingId(domainId);
    try {
        const res = await fetch("/api/saas/delete-domain", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ domainId })
        });
        const data = await res.json();
        if(data.success) {
            toast.success("Domain deleted successfully");
            fetchData();
        } else {
            toast.error(data.error || "Delete failed");
        }
    } catch(err) {
        toast.error("Network error");
    } finally {
        setDeletingId(null);
    }
  };

  const submitDomain = async (url, body) => {
    setLoading(true);
    setError("");

    // Calculate Available
    const currentStorage = isEditing ? (selectedDomain.quotaStorage || 0) : 0;
    const currentMailboxes = isEditing ? (selectedDomain.quotaMailboxes || 0) : 0;
    const currentAliases = isEditing ? (selectedDomain.quotaAliases || 0) : 0;

    const availableStorage = (stats.storage.maxMB - stats.storage.usedMB) + currentStorage;
    const availableMailboxes = (stats.mailboxes.max - stats.mailboxes.used) + currentMailboxes;
    const availableAliases = (stats.aliases.max - stats.aliases.used) + currentAliases;

    if (allocation.storageMB > availableStorage) { setError(`Not enough storage. Available: ${availableStorage} MB`); setLoading(false); return; }
    if (allocation.mailboxes > availableMailboxes) { setError(`Not enough mailboxes. Available: ${availableMailboxes}`); setLoading(false); return; }
    if (allocation.aliases > availableAliases) { setError(`Not enough aliases. Available: ${availableAliases}`); setLoading(false); return; }

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        
        if (data.success) {
            toast.success(isEditing ? "Resources updated!" : "Domain created!");
            closeModal();
            fetchData();
        } else {
            setError(data.error || "Operation failed");
        }
    } catch (err) {
        setError("Network connection error");
    } finally {
        setLoading(false);
    }
  };

  const openEditModal = (domain) => {
      setSelectedDomain(domain);
      setAllocation({
          storageMB: domain.quotaStorage || 1024,
          mailboxes: domain.quotaMailboxes || 5,
          aliases: domain.quotaAliases || 10
      });
      setIsEditing(true);
  };

  const closeModal = () => {
      setIsAdding(false);
      setIsEditing(false);
      setSelectedDomain(null);
      setDomainName("");
      setAllocation({ storageMB: 1024, mailboxes: 5, aliases: 10 });
      setError("");
  };

  const isLimitReached = stats.domains.used >= stats.domains.max;

  if (initialLoading) return <div className="h-[80vh] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={32}/></div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-full">
      {/* --- HEADER --- */}
      <div className="mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Domains & Resources</h1>
                <p className="text-gray-400 mt-1">Allocate your package resources across your domains.</p>
            </div>
            {isLimitReached ? (
                <button disabled className="px-5 py-2.5 bg-gray-800 text-gray-400 border border-white/5 rounded-lg text-sm font-medium flex items-center gap-2 cursor-not-allowed opacity-75">
                  <Lock size={16} /> Max Domains Reached
                </button>
            ) : (
                <button onClick={() => setIsAdding(true)} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-95">
                  <Plus size={18} /> Add New Domain
                </button>
            )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<Globe size={18} />} label="Domains" used={stats.domains.used} max={stats.domains.max} color="blue" />
            <StatCard icon={<HardDrive size={18} />} label="Allocated Storage (MB)" used={stats.storage.usedMB} max={stats.storage.maxMB} color="purple" />
            <StatCard icon={<Mail size={18} />} label="Allocated Mailboxes" used={stats.mailboxes.used} max={stats.mailboxes.max} color="green" />
            <StatCard icon={<Copy size={18} />} label="Allocated Aliases" used={stats.aliases.used} max={stats.aliases.max} color="orange" />
        </div>
      </div>

      {/* --- DOMAIN LIST --- */}
      <div className="space-y-4">
        {domains.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-white/10 rounded-2xl bg-white/5">
            <Globe className="text-gray-600 mx-auto mb-4" size={48} />
            <h3 className="text-white font-medium mb-1">No domains yet</h3>
            <p className="text-gray-500 text-sm">Add your first domain to start.</p>
          </div>
        ) : (
          domains.map((d) => (
            <motion.div key={d._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#16181F] border border-white/5 p-6 rounded-xl flex flex-col md:flex-row md:items-center justify-between group hover:border-white/10 transition-all">
              <div className="flex items-center gap-4 mb-4 md:mb-0">
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                  <Globe size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{d.name}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                     <span className={`font-bold uppercase tracking-wide ${d.status === 'Verified' ? 'text-green-500' : 'text-yellow-500'}`}>{d.status || 'Pending'}</span>
                     <span>|</span>
                     <span className="flex items-center gap-1"><Mail size={10}/> {d.quotaMailboxes} Boxes</span>
                     <span className="flex items-center gap-1"><Copy size={10}/> {d.quotaAliases} Aliases</span>
                     <span className="flex items-center gap-1"><HardDrive size={10}/> {d.quotaStorage} MB</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={() => openEditModal(d)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg text-sm font-medium border border-white/5 transition flex items-center gap-2">
                  <BarChart3 size={16} /> Resources
                </button>
                <Link href={`/dashboard/domains/${d.name}`} className="px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-lg text-sm font-medium border border-blue-500/20 transition flex items-center gap-2">
                  <Settings size={16} /> Manage
                </Link>
                {/* DELETE BUTTON */}
                <button 
                    onClick={() => handleDelete(d._id)} 
                    disabled={deletingId === d._id}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition disabled:opacity-50"
                >
                    {deletingId === d._id ? <Loader2 className="animate-spin" size={18}/> : <Trash2 size={18} />}
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* --- ADD / EDIT MODAL --- */}
      <AnimatePresence>
        {(isAdding || isEditing) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-[#16181F] border border-white/10 w-full max-w-lg p-6 md:p-8 rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white">{isEditing ? `Manage Resources: ${selectedDomain?.name}` : "Connect a Domain"}</h3>
                  <button onClick={closeModal} className="text-gray-400 hover:text-white transition"><X size={20} /></button>
                </div>

                <form onSubmit={isEditing ? handleUpdate : handleCreate}>
                    {isAdding && (
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Domain Name</label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-3.5 text-gray-500" size={18} />
                                <input type="text" placeholder="yourcompany.com" className="w-full bg-black/50 border border-white/10 text-white pl-10 pr-4 py-3 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono" value={domainName} onChange={(e) => setDomainName(e.target.value.toLowerCase())} autoFocus required />
                            </div>
                        </div>
                    )}

                    <div className="mb-6 bg-white/5 border border-white/5 rounded-xl p-5 space-y-5">
                        <AllocationSlider label="Storage (MB)" value={allocation.storageMB} max={(stats.storage.maxMB - stats.storage.usedMB) + (isEditing ? (selectedDomain.quotaStorage || 0) : 0)} onChange={(val) => setAllocation({...allocation, storageMB: val})} color="purple" />
                        <AllocationSlider label="Mailboxes" value={allocation.mailboxes} max={(stats.mailboxes.max - stats.mailboxes.used) + (isEditing ? (selectedDomain.quotaMailboxes || 0) : 0)} onChange={(val) => setAllocation({...allocation, mailboxes: val})} color="green" />
                        <AllocationSlider label="Aliases" value={allocation.aliases} max={(stats.aliases.max - stats.aliases.used) + (isEditing ? (selectedDomain.quotaAliases || 0) : 0)} onChange={(val) => setAllocation({...allocation, aliases: val})} color="orange" />
                    </div>

                    {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-200 text-xs font-medium"><AlertCircle size={16} /> {error}</div>}

                    <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-white/10">
                        <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-400 hover:text-white font-medium transition">Cancel</button>
                        <button disabled={loading} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 transition-all">
                            {loading && <Loader2 className="animate-spin" size={18} />}
                            {loading ? "Processing..." : (isEditing ? "Update Resources" : "Create Domain")}
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

function StatCard({ icon, label, used, max, color }) {
    const percentage = Math.min((used / max) * 100, 100) || 0;
    const colors = { blue: "text-blue-500 bg-blue-500", purple: "text-purple-500 bg-purple-500", green: "text-green-500 bg-green-500", orange: "text-orange-500 bg-orange-500" };
    return (
        <div className="bg-[#16181F] border border-white/5 p-4 rounded-xl">
            <div className={`flex items-center gap-2 mb-2 ${colors[color].split(" ")[0]}`}>{icon} <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{label}</span></div>
            <div className="flex items-baseline gap-1 mb-2"><span className="text-xl font-bold text-white">{used}</span><span className="text-xs text-gray-500">/ {max}</span></div>
            <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-500 ${colors[color].split(" ")[1]}`} style={{ width: `${percentage}%` }} /></div>
        </div>
    );
}

function AllocationSlider({ label, value, max, onChange, color }) {
    const colors = { purple: "accent-purple-500 bg-purple-500", green: "accent-green-500 bg-green-500", orange: "accent-orange-500 bg-orange-500" };
    return (
        <div>
            <div className="flex justify-between text-xs mb-2"><span className="text-gray-300 font-medium">{label}</span><span className="text-gray-500">Available: {Math.floor(max)}</span></div>
            <div className="flex items-center gap-3">
                <input type="range" min="0" max={max} className={`flex-1 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer ${colors[color].split(" ")[0]}`} value={value} onChange={(e) => onChange(Number(e.target.value))} />
                <div className="relative"><input type="number" min="0" max={max} className="bg-black/50 border border-white/10 px-2 py-1 rounded text-white text-sm font-mono w-16 text-center outline-none focus:border-white/30" value={value} onChange={(e) => onChange(Number(e.target.value))} /></div>
            </div>
        </div>
    );
}