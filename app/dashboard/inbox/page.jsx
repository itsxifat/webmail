"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import DOMPurify from "dompurify";
import { formatDistanceToNow } from "date-fns";
import { 
  Search, RefreshCw, Mail, ChevronLeft, Star, Trash2, Reply, 
  Archive, AlertCircle, PenSquare, ChevronDown, Check, Send, X,
  Inbox, SendHorizontal, Loader2, ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// --- API FETCHERS ---
const fetchAccounts = async () => {
  const res = await fetch("/api/saas/me/accounts"); 
  if (!res.ok) throw new Error("Failed to load accounts");
  return res.json();
};

const fetchEmails = async ({ queryKey }) => {
  const [_, mailbox, folder] = queryKey;
  if (!mailbox) return [];
  const res = await fetch(`/api/saas/emails?mailbox=${mailbox}&folder=${folder}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to fetch");
  }
  const json = await res.json();
  return json.data || [];
};

export default function InboxPage() {
  const queryClient = useQueryClient();
  
  // Layout States
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedIdentity, setSelectedIdentity] = useState("all");
  const [currentFolder, setCurrentFolder] = useState("inbox"); 
  const [selectedEmail, setSelectedEmail] = useState(null);
  
  // Modal States
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  // 1. Load Accounts
  const { data: accountsData } = useQuery({
    queryKey: ["accounts"],
    queryFn: fetchAccounts,
    onSuccess: (data) => {
        if (!selectedAccount && data?.accounts?.length > 0) {
            setSelectedAccount(data.accounts[0]);
        }
    }
  });

  const accounts = accountsData?.accounts || [];

  // 2. Load Emails
  const { data: emails = [], isLoading, isRefetching, refetch, isError } = useQuery({
    queryKey: ["emails", selectedAccount?.email, currentFolder],
    queryFn: fetchEmails,
    enabled: !!selectedAccount,
    refetchInterval: 30000,
  });

  // 3. Send Email
  const sendMutation = useMutation({
    mutationFn: async (payload) => {
        const res = await fetch("/api/saas/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // CRITICAL FIX: Pass the 'mailbox' (login email) separately from 'from' (sender email)
            body: JSON.stringify({
                ...payload,
                mailbox: selectedAccount?.email 
            })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Failed to send");
        }
        return res.json();
    },
    onSuccess: () => {
        setIsComposeOpen(false);
        toast.success("Message sent successfully!");
        if (currentFolder === 'sent') refetch(); 
    },
    onError: (err) => toast.error(err.message)
  });

  const filteredEmails = useMemo(() => {
    if (selectedIdentity === "all") return emails;
    return emails.filter(e => e.to.includes(selectedIdentity) || e.cc?.includes(selectedIdentity));
  }, [emails, selectedIdentity]);

  const handleAccountSwitch = (acc) => {
      setSelectedAccount(acc);
      setSelectedIdentity("all");
      setIsAccountMenuOpen(false);
      setSelectedEmail(null);
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] bg-[#050505] text-gray-100 overflow-hidden font-sans relative">
      
      {/* Global Style to Hide Scrollbars */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* --- 1. SIDEBAR --- */}
      <div className="order-3 md:order-1 w-full md:w-[240px] h-[65px] md:h-auto border-t md:border-t-0 md:border-r border-white/5 flex flex-row md:flex-col items-center md:items-start py-0 md:py-6 px-4 gap-1 md:gap-3 bg-[#080808] flex-shrink-0 z-40 justify-evenly md:justify-start shadow-xl md:shadow-none">
         
         <div className="hidden md:block w-full mb-6 px-2">
            <button 
                onClick={() => setIsComposeOpen(true)}
                className="w-full bg-white text-black hover:bg-gray-200 h-11 rounded-xl flex items-center justify-center gap-2 transition font-bold text-sm shadow-lg shadow-white/5"
            >
                <PenSquare size={18} /> Compose
            </button>
         </div>

         <button 
            onClick={() => setIsComposeOpen(true)}
            className="md:hidden fixed bottom-24 right-5 w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-2xl z-50"
         >
            <PenSquare size={24} />
         </button>

         <NavButton 
            active={currentFolder === 'inbox'} 
            onClick={() => { setCurrentFolder('inbox'); setSelectedEmail(null); }} 
            icon={<Inbox size={20}/>} 
            label="Inbox" 
            count={currentFolder === 'inbox' ? filteredEmails.length : 0} 
         />
         <NavButton 
            active={currentFolder === 'sent'} 
            onClick={() => { setCurrentFolder('sent'); setSelectedEmail(null); }} 
            icon={<SendHorizontal size={20}/>} 
            label="Sent" 
         />
      </div>

      {/* --- 2. EMAIL LIST --- */}
      <div className={`order-1 md:order-2 w-full md:w-[420px] border-r border-white/5 flex flex-col bg-[#050505] flex-shrink-0 transition-all duration-300 absolute md:relative inset-0 z-10 ${selectedEmail ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}`}>
        
        {/* Header */}
        <div className="h-16 px-4 border-b border-white/5 flex justify-between items-center bg-[#050505]/95 backdrop-blur-md sticky top-0 z-20">
          <div className="relative">
             <button onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)} className="flex items-center gap-3 text-sm font-semibold hover:bg-white/5 px-3 py-2 rounded-xl transition group">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-blue-500/20">
                    {selectedAccount?.email?.[0].toUpperCase() || "M"}
                </div>
                <div className="flex flex-col items-start">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Mailbox</span>
                    <div className="flex items-center gap-2">
                         <span className="truncate max-w-[140px] md:max-w-[180px] text-white font-medium">{selectedAccount?.email || "Select"}</span>
                         <ChevronDown size={12} className="text-gray-500 group-hover:text-white transition" />
                    </div>
                </div>
             </button>

             <AnimatePresence>
                {isAccountMenuOpen && (
                    <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsAccountMenuOpen(false)}/>
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute top-full left-0 mt-2 w-72 bg-[#121212] border border-white/10 rounded-xl shadow-2xl z-30 overflow-hidden py-2 no-scrollbar">
                        <div className="px-4 py-2 text-[10px] uppercase text-gray-500 font-bold tracking-wider">Switch Account</div>
                        {accounts.map(acc => (
                            <button key={acc.email} onClick={() => handleAccountSwitch(acc)} className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center justify-between group transition-colors">
                                <span className={`text-sm ${selectedAccount?.email === acc.email ? 'text-white font-medium' : 'text-gray-400'}`}>{acc.email}</span>
                                {selectedAccount?.email === acc.email && <Check size={14} className="text-blue-500"/>}
                            </button>
                        ))}
                    </motion.div>
                    </>
                )}
             </AnimatePresence>
          </div>
          <button onClick={() => refetch()} className={`p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition ${isRefetching ? 'animate-spin text-blue-500' : ''}`}><RefreshCw size={16} /></button>
        </div>

        {/* Alias Filter */}
        {selectedAccount?.aliases?.length > 0 && (
            <div className="px-4 py-3 border-b border-white/5 flex gap-2 overflow-x-auto no-scrollbar bg-[#050505]">
                <FilterChip label="All" active={selectedIdentity === "all"} onClick={() => setSelectedIdentity("all")} />
                {selectedAccount.aliases.map(alias => <FilterChip key={alias} label={alias} active={selectedIdentity === alias} onClick={() => setSelectedIdentity(alias)} />)}
            </div>
        )}

        {/* Search */}
        <div className="p-4">
          <div className="relative group">
            <Search className="absolute left-3 top-3 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={16} />
            <input type="text" placeholder={`Search ${currentFolder}...`} className="w-full pl-10 pr-4 py-2.5 bg-[#111111] border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-gray-600 font-medium" />
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-24 md:pb-0">
          {isLoading && accounts.length > 0 ? (
            <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-24 bg-white/[0.02] rounded-xl animate-pulse" />)}
            </div>
          ) : isError ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4">
                <AlertCircle className="text-red-500" size={32} />
                <div className="text-center">
                    <p className="text-sm text-white font-medium">Connection Failed</p>
                    <p className="text-xs text-gray-500 mt-1">Check server status</p>
                </div>
                <button onClick={() => refetch()} className="text-xs px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 hover:text-white transition font-bold">Retry</button>
            </div>
          ) : filteredEmails.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-4">
               <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center border border-white/5"><Inbox size={32} className="opacity-20" /></div>
               <p className="text-sm font-medium">{currentFolder === 'sent' ? "No sent messages" : "Inbox is empty"}</p>
             </div>
          ) : (
            <div className="flex flex-col">
              {filteredEmails.map((email, i) => (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.2 }}
                    key={email.id} 
                    onClick={() => setSelectedEmail(email)} 
                    className={`group p-4 cursor-pointer transition-all border-b border-white/[0.03] hover:bg-white/[0.03] relative ${selectedEmail?.id === email.id ? "bg-blue-500/[0.08] border-l-2 border-l-blue-500" : "border-l-2 border-l-transparent"}`}
                >
                  <div className="flex justify-between items-baseline mb-1.5">
                    <span className={`text-sm font-semibold truncate max-w-[70%] ${selectedEmail?.id === email.id ? "text-blue-400" : "text-gray-200"}`}>
                        {currentFolder === 'sent' ? `To: ${email.to}` : email.from}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono tracking-tight">{formatDistanceToNow(new Date(email.date), { addSuffix: false })}</span>
                  </div>
                  <div className={`text-sm truncate mb-1.5 font-medium ${selectedEmail?.id === email.id ? 'text-white' : 'text-gray-400'}`}>{email.subject || "(No Subject)"}</div>
                  <div className="text-xs text-gray-600 truncate font-medium leading-relaxed">{email.snippet}</div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- 3. READING PANE --- */}
      <div className={`order-2 md:order-3 flex-1 bg-[#0A0A0A] flex flex-col transition-transform duration-300 absolute md:relative inset-0 z-20 ${selectedEmail ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
        <AnimatePresence mode="wait">
          {selectedEmail ? (
            <motion.div key={selectedEmail.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full z-10 bg-[#0A0A0A]">
              
              {/* Toolbar */}
              <div className="h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-6 bg-[#0A0A0A]/95 backdrop-blur sticky top-0 z-20">
                 <div className="flex items-center gap-3">
                   <button onClick={() => setSelectedEmail(null)} className="md:hidden p-2 -ml-2 text-gray-400 hover:text-white bg-white/5 rounded-full"><ArrowLeft size={18} /></button>
                   <div className="flex bg-white/5 rounded-lg p-1 gap-1">
                      <ToolbarBtn icon={<Reply size={18} />} onClick={() => setIsComposeOpen(true)} tooltip="Reply"/>
                      <ToolbarBtn icon={<Archive size={18} />} tooltip="Archive"/>
                      <ToolbarBtn icon={<Trash2 size={18} />} color="hover:text-red-400 hover:bg-red-500/10" tooltip="Delete"/>
                   </div>
                 </div>
                 <div className="hidden md:block text-xs text-gray-500 font-mono bg-white/5 px-2 py-1 rounded">{new Date(selectedEmail.date).toLocaleString()}</div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar">
                <div className="max-w-4xl mx-auto">
                  <h1 className="text-xl md:text-3xl font-bold text-white mb-6 leading-tight tracking-tight">{selectedEmail.subject}</h1>
                  
                  <div className="flex items-start gap-4 mb-10 pb-8 border-b border-white/5">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-gray-700 to-gray-800 border border-white/10 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {selectedEmail.from[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-baseline">
                          <div className="text-sm font-bold text-white">{selectedEmail.from}</div>
                          <div className="md:hidden text-xs text-gray-500 mt-1">{new Date(selectedEmail.date).toLocaleString()}</div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-1 items-center">
                          to <span className="text-gray-300 bg-white/5 px-2 py-0.5 rounded border border-white/5">{selectedEmail.to}</span>
                      </div>
                    </div>
                  </div>

                  <div className="prose prose-invert prose-sm md:prose-base max-w-none text-gray-300 leading-relaxed selection:bg-blue-500/30">
                    <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedEmail.html) }} />
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 select-none z-10 bg-[#0A0A0A]">
              <div className="w-24 h-24 bg-white/[0.02] rounded-[2rem] flex items-center justify-center mb-6 border border-white/5 shadow-2xl"><Mail size={40} className="opacity-20" /></div>
              <p className="text-sm font-medium text-gray-500">Select an email to view details</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* --- COMPOSE MODAL --- */}
      <AnimatePresence>
        {isComposeOpen && (
            <ComposeModal 
                onClose={() => setIsComposeOpen(false)} 
                defaultFrom={selectedAccount?.email}
                identities={[selectedAccount?.email, ...(selectedAccount?.aliases || [])]}
                onSend={sendMutation.mutate}
                isSending={sendMutation.isPending}
            />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- SUBCOMPONENTS ---

function NavButton({ icon, label, active, onClick, count }) {
    return (
        <button 
            onClick={onClick} 
            className={`w-full md:w-full flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 px-2 md:px-4 py-2 md:py-3 rounded-xl transition-all relative group 
            ${active ? 'text-white bg-white/10 font-bold shadow-md shadow-white/5' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 font-medium'}`}
        >
            <span className={`${active ? 'text-white' : 'text-gray-500'}`}>{icon}</span>
            <span className="text-[10px] md:text-sm">{label}</span>
            {count > 0 && <span className="absolute top-1 right-2 md:static md:ml-auto text-[9px] md:text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full shadow-lg">{count}</span>}
        </button>
    )
}

function ComposeModal({ onClose, identities, defaultFrom, onSend, isSending }) {
    const [from, setFrom] = useState(defaultFrom || identities[0]);
    const [to, setTo] = useState("");
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");

    const handleSubmit = (e) => { e.preventDefault(); onSend({ from, to, subject, body }); };

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div 
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} 
                className="relative bg-[#16181F] border-t md:border border-white/10 w-full md:max-w-2xl h-[95vh] md:h-auto md:max-h-[90vh] rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col z-50 no-scrollbar"
            >
                <div className="flex justify-between items-center p-4 border-b border-white/5 bg-[#16181F] rounded-t-2xl">
                    <h3 className="font-bold text-white flex items-center gap-2"><PenSquare size={16} className="text-blue-500"/> New Message</h3>
                    <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-white bg-white/5 rounded-full"><X size={18}/></button>
                </div>
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-y-auto no-scrollbar">
                    <div className="p-4 md:p-6 space-y-5">
                        <div className="grid grid-cols-[60px_1fr] items-center gap-4">
                            <label className="text-xs font-bold text-gray-500 text-right uppercase tracking-wider">From</label>
                            <div className="relative">
                                <select className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 pl-3 pr-8 text-sm text-white appearance-none focus:border-blue-500 outline-none" value={from} onChange={(e) => setFrom(e.target.value)}>
                                    {identities.map(id => <option key={id} value={id}>{id}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-3 text-gray-500 pointer-events-none"/>
                            </div>
                        </div>
                        <div className="grid grid-cols-[60px_1fr] items-center gap-4">
                            <label className="text-xs font-bold text-gray-500 text-right uppercase tracking-wider">To</label>
                            <input required type="email" placeholder="recipient@example.com" className="w-full bg-black/30 border border-white/10 rounded-xl p-2.5 text-sm text-white focus:border-blue-500 outline-none placeholder:text-gray-700" value={to} onChange={e => setTo(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-[60px_1fr] items-center gap-4">
                            <label className="text-xs font-bold text-gray-500 text-right uppercase tracking-wider">Subject</label>
                            <input required type="text" placeholder="What is this about?" className="w-full bg-black/30 border border-white/10 rounded-xl p-2.5 text-sm text-white focus:border-blue-500 outline-none placeholder:text-gray-700" value={subject} onChange={e => setSubject(e.target.value)} />
                        </div>
                        <div className="pt-2 flex-1 min-h-[300px]">
                            <textarea className="w-full h-full bg-transparent resize-none outline-none text-sm text-gray-300 placeholder:text-gray-700 leading-relaxed no-scrollbar" placeholder="Type your message here..." value={body} onChange={e => setBody(e.target.value)}/>
                        </div>
                    </div>
                    <div className="p-4 border-t border-white/5 flex justify-end gap-3 bg-[#16181F] md:rounded-b-2xl pb-8 md:pb-4">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm text-gray-400 hover:text-white font-medium">Discard</button>
                        <button disabled={isSending} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all">
                            {isSending ? <Loader2 className="animate-spin" size={16}/> : <Send size={16}/>} 
                            Send Message
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

function FilterChip({ label, active, onClick }) { return <button onClick={onClick} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all ${active ? "bg-white text-black shadow-lg shadow-white/10" : "text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-white/5"}`}>{label}</button> }
function ToolbarBtn({ icon, onClick, tooltip, color = "text-gray-400 hover:text-white hover:bg-white/10" }) { return <button title={tooltip} onClick={onClick} className={`p-2 rounded-xl transition ${color}`}>{icon}</button>; }