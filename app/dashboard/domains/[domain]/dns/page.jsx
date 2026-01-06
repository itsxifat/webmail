"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, Copy, Check, ShieldCheck, ExternalLink, RefreshCw, 
  Info, AlertTriangle, CheckCircle2, XCircle, Globe 
} from "lucide-react";
import { toast } from "sonner";
import confetti from 'canvas-confetti'; 

export default function DomainDNSPage() {
  const params = useParams();
  const router = useRouter();
  const domain = decodeURIComponent(params.domain);
  
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null); 
  const [isVerifying, setIsVerifying] = useState(false);
  const [isFullyActive, setIsFullyActive] = useState(false);

  // 1. Initial Data Fetch
  useEffect(() => {
    fetchData();
  }, [domain]);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/saas/get-dns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      const data = await res.json();
      
      if (data.success) {
        setRecords(data.dns);
        // If the DB says it's verified, we trust it initially
        if (data.status === "Verified") setIsFullyActive(true);
      } else {
        toast.error(data.error || "Failed to load DNS configuration");
      }
    } catch (e) {
      console.error("[ERROR] Failed to fetch DNS:", e);
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  // 2. Live Verification Action
  const handleVerify = async () => {
    setIsVerifying(true);
    setVerificationStatus(null); 

    try {
      const res = await fetch("/api/saas/verify-dns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      
      const data = await res.json();

      if (data.success) {
        setVerificationStatus(data.results);
        
        if (data.isVerified) {
          setIsFullyActive(true);
          toast.success("Domain successfully verified!");
          // Trigger Celebration
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#22c55e', '#3b82f6', '#ffffff']
          });
        } else {
          setIsFullyActive(false);
          toast.error("Verification failed. Please check missing records.");
        }
      } else {
        toast.error(data.error || "Verification failed");
      }
    } catch (err) {
      console.error("[ERROR] Verification failed:", err);
      toast.error("Network error during verification");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-[#0F0F0F] text-white">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-8 gap-6 border-b border-white/5 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <button 
            onClick={() => router.back()} 
            className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg transition text-gray-400 hover:text-white shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight break-all flex items-center gap-3">
                <Globe className="text-gray-600" size={28}/>
                {domain}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              {isFullyActive ? (
                 <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 w-fit">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"/>
                    <p className="text-green-500 text-xs font-bold uppercase tracking-wide">Active & Secured</p>
                 </div>
              ) : (
                 <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 w-fit">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"/>
                    <p className="text-yellow-500 text-xs font-bold uppercase tracking-wide">Setup Required</p>
                 </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
           <a 
             href="https://www.google.com/search?q=how+to+add+dns+records" 
             target="_blank" 
             className="px-4 py-3 sm:py-2 border border-white/10 hover:bg-white/5 text-gray-300 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition w-full sm:w-auto"
           >
             <ExternalLink size={16} /> Help Guide
           </a>
           <button 
             onClick={handleVerify}
             disabled={isVerifying}
             className={`px-4 py-3 sm:py-2 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto ${
               isFullyActive 
               ? "bg-green-600 hover:bg-green-500 shadow-green-500/20" 
               : "bg-blue-600 hover:bg-blue-500 shadow-blue-500/20"
             }`}
           >
             {isVerifying ? <RefreshCw size={16} className="animate-spin" /> : isFullyActive ? <ShieldCheck size={16} /> : <RefreshCw size={16} />}
             {isVerifying ? "Verifying Records..." : isFullyActive ? "Re-Verify Connection" : "Verify Connection"}
           </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <RefreshCw className="animate-spin text-blue-500" size={32} />
          <p className="text-gray-500 text-sm">Fetching configuration...</p>
        </div>
      ) : !records ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <AlertTriangle className="text-red-500" size={32} />
          <p className="text-gray-500 text-sm">Failed to load DNS records</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* --- LEFT COLUMN: Records --- */}
          <div className="xl:col-span-2 space-y-8">
            
            {/* Group 1: Incoming Mail */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-purple-500/10 text-purple-400 flex items-center justify-center text-xs font-bold">1</div>
                Route Incoming Emails
              </h2>
              <div className="bg-[#16181F] border border-white/5 rounded-xl overflow-hidden">
                <RecordItem 
                  type="MX"
                  host={records?.mx?.host || "@"} 
                  value={records?.mx?.value} 
                  priority={records?.mx?.priority || "10"}
                  desc="Directs emails to our server."
                  status={isFullyActive ? true : verificationStatus?.mx}
                />
              </div>
            </section>

            {/* Group 2: Security */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-green-500/10 text-green-400 flex items-center justify-center text-xs font-bold">2</div>
                Security & Authentication
              </h2>
              <div className="bg-[#16181F] border border-white/5 rounded-xl overflow-hidden divide-y divide-white/5">
                <RecordItem 
                  type="TXT"
                  host={records?.spf?.host || "@"} 
                  value={records?.spf?.value} 
                  label="SPF"
                  desc="Prevents spammers from using your domain."
                  status={isFullyActive ? true : verificationStatus?.spf}
                />
                <RecordItem 
                  type="TXT"
                  host={records?.dkim?.host || "dkim._domainkey"} 
                  value={records?.dkim?.value || records?.dkim?.error} 
                  label="DKIM"
                  desc="Digitally signs your emails to prove they are safe."
                  note={records?.dkim?.note}
                  isLong
                  isError={!!records?.dkim?.error || records?.dkim?.value?.includes("Error")}
                  status={isFullyActive ? true : verificationStatus?.dkim}
                />
                <RecordItem 
                  type="TXT"
                  host={records?.dmarc?.host || "_dmarc"} 
                  value={records?.dmarc?.value} 
                  label="DMARC"
                  desc="Tells Gmail/Outlook what to do with fake emails."
                  status={isFullyActive ? true : verificationStatus?.dmarc}
                />
              </div>
            </section>

            {/* Group 3: Email Client Auto-Configuration */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-blue-500/10 text-blue-400 flex items-center justify-center text-xs font-bold">3</div>
                Email Client Auto-Configuration (Optional)
              </h2>
              <div className="bg-[#16181F] border border-white/5 rounded-xl overflow-hidden divide-y divide-white/5">
                <RecordItem 
                  type="CNAME"
                  host={records?.autodiscover?.host || "autodiscover"} 
                  value={records?.autodiscover?.value} 
                  label="Autodiscover"
                  desc="Enables automatic email setup in Outlook and other Microsoft clients."
                  status={isFullyActive ? true : verificationStatus?.autodiscover}
                />
                <RecordItem 
                  type="CNAME"
                  host={records?.autoconfig?.host || "autoconfig"} 
                  value={records?.autoconfig?.value} 
                  label="Autoconfig"
                  desc="Enables automatic email setup in Thunderbird and other Mozilla clients."
                  status={isFullyActive ? true : verificationStatus?.autoconfig}
                />
              </div>
            </section>
          </div>

          {/* --- RIGHT COLUMN: Help & Tips --- */}
          <div className="space-y-6">
              {isFullyActive ? (
                <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-xl text-center">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-green-500/20">
                        <Check size={24} className="text-white" strokeWidth={4} />
                    </div>
                    <h3 className="text-green-400 font-bold text-lg">All Systems Operational</h3>
                    <p className="text-green-200/60 text-sm mt-2">
                        Your domain is correctly configured. You can now send and receive emails.
                    </p>
                </div>
              ) : (
                <>
                  <div className="bg-blue-600/10 border border-blue-500/20 p-5 rounded-xl">
                    <div className="flex items-start gap-3">
                      <Info className="text-blue-400 shrink-0 mt-0.5" size={20} />
                      <div>
                        <h3 className="font-semibold text-blue-100 text-sm">Where do I add these?</h3>
                        <p className="text-xs text-blue-200/70 mt-2 leading-relaxed">
                          Log in to your domain provider (GoDaddy, Namecheap, Cloudflare) and find <strong>"DNS Management"</strong>.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-yellow-500/10 bg-yellow-500/5 flex gap-3 items-start">
                      <AlertTriangle size={18} className="text-yellow-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-yellow-500 text-xs font-bold uppercase tracking-wide">Important</h4>
                        <p className="text-gray-400 text-xs mt-1">Changes can take up to 24 hours to propagate worldwide.</p>
                      </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
                    <h3 className="font-semibold text-white text-sm mb-3">Quick Tips</h3>
                    <ul className="space-y-2 text-xs text-gray-400">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-0.5">•</span>
                        <span>Use <code className="px-1 py-0.5 bg-black/40 rounded text-[10px]">@</code> for the root domain</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-0.5">•</span>
                        <span>TTL values can be set to 3600 (1 hour)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-0.5">•</span>
                        <span>For long DKIM records, split them into multiple strings if your provider requires it.</span>
                      </li>
                    </ul>
                  </div>
                </>
              )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Sub Component: Record Item ---
function RecordItem({ type, host, value, priority, label, desc, note, isLong, isError, status }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value || isError) {
      toast.error("Nothing to copy");
      return;
    }
    // Safe Copy Logic (Works on http localhost too)
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(value);
        } else {
            // Fallback for older browsers or insecure contexts
            const textArea = document.createElement("textarea");
            textArea.value = value;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
        setCopied(true);
        toast.success("Copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    } catch (err) {
        toast.error("Failed to copy");
    }
  };

  let borderColor = "border-transparent";
  if (status === true) borderColor = "border-green-500/50 bg-green-500/5";
  if (status === false) borderColor = "border-red-500/50 bg-red-500/5";

  return (
    <div className={`p-4 md:p-6 group transition-all relative border-l-4 ${borderColor} ${status === null ? 'hover:bg-white/[0.02]' : ''}`}>
      
      {/* Header Row */}
      <div className="flex flex-wrap justify-between items-start mb-2 gap-2">
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <span className={`text-xs font-bold px-2 py-1 rounded bg-white/10 text-white min-w-[3rem] text-center`}>{type}</span>
          {label && <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</span>}
          
          {status === true && <span className="flex items-center gap-1 text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full"><CheckCircle2 size={12}/> VERIFIED</span>}
          {status === false && <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full"><XCircle size={12}/> MISSING</span>}
        </div>
        {priority && <span className="text-xs text-gray-500 font-mono">Priority: {priority}</span>}
      </div>
      
      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 mt-4">
        
        {/* Host */}
        <div className="md:col-span-3">
           <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1 block">Name / Host</label>
           <div className="font-mono text-sm text-gray-300 bg-black/20 p-2 rounded border border-white/5 select-all break-all">
             {host}
           </div>
        </div>

        {/* Value */}
        <div className="md:col-span-9 relative">
           <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1 block">Value</label>
           <div 
             className={`font-mono text-sm bg-black/20 p-2 rounded border pr-10 cursor-pointer hover:border-blue-500/30 transition-colors break-all ${
               isLong ? 'text-xs leading-relaxed' : ''
             } ${
               isError 
                 ? 'text-red-400 border-red-500/30' 
                 : 'text-gray-300 border-white/5'
             }`}
             onClick={handleCopy}
           >
             {value || <span className="text-gray-600 italic">Loading...</span>}
             
             {!isError && (
                 <div className="absolute top-7 right-2">
                    {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-gray-500 group-hover:text-white" />}
                 </div>
             )}
           </div>
           {note && (
             <p className="text-[10px] text-yellow-500/80 mt-1 flex items-start gap-1">
               <Info size={12} className="shrink-0 mt-0.5" />
               <span>{note}</span>
             </p>
           )}
        </div>
      </div>
      
      <p className="text-xs text-gray-500 mt-3 leading-relaxed border-t border-white/5 pt-2">{desc}</p>
    </div>
  );
}