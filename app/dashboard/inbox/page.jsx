"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import DOMPurify from "dompurify";
import { formatDistanceToNow } from "date-fns";
import { 
  Search, RefreshCw, Mail, ChevronLeft, Star, Trash2, Reply, 
  MoreVertical, Archive, AlertCircle 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Fetcher
const fetchEmails = async () => {
  const res = await fetch("/api/emails");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

export default function InboxPage() {
  const [selectedEmail, setSelectedEmail] = useState(null);
  
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["emails"],
    queryFn: fetchEmails,
    refetchInterval: 30000, // Sync every 30s
  });

  const emails = data?.data || [];

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#050505] overflow-hidden">
      
      {/* --- SIDEBAR LIST --- */}
      <div className={`w-full md:w-[420px] border-r border-white/5 flex flex-col bg-[#050505] flex-shrink-0 ${selectedEmail ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Header */}
        <div className="h-16 px-4 border-b border-white/5 flex justify-between items-center bg-[#050505]/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-white tracking-tight">Primary Inbox</h1>
            <span className="text-[10px] bg-white/5 text-gray-500 px-2 py-0.5 rounded-full font-mono">
              {emails.length}
            </span>
          </div>
          <button 
            onClick={() => refetch()} 
            className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition group"
          >
            <RefreshCw size={14} className={isLoading || isRefetching ? "animate-spin text-blue-500" : "group-hover:text-white"} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-white/[0.02]">
          <div className="relative group">
            <Search className="absolute left-3 top-2.5 text-gray-600 group-focus-within:text-blue-500 transition-colors" size={14} />
            <input 
              type="text" 
              placeholder="Search messages..." 
              className="w-full pl-9 pr-4 py-2 bg-[#0A0A0A] border border-white/5 rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/30 focus:bg-[#0f0f0f] transition-all"
            />
          </div>
        </div>

        {/* Email List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-white/[0.02] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : isError ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-2">
              <AlertCircle className="text-red-500" size={24} />
              <p className="text-xs">Connection failed</p>
            </div>
          ) : emails.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-4">
               <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                 <Mail size={24} className="opacity-20" />
               </div>
               <p className="text-sm">Inbox is empty</p>
             </div>
          ) : (
            <div className="divide-y divide-white/[0.03]">
              {emails.map((email) => (
                <div
                  key={email.id}
                  onClick={() => setSelectedEmail(email)}
                  className={`group p-4 cursor-pointer transition-all hover:bg-white/[0.02] relative ${
                    selectedEmail?.id === email.id ? "bg-blue-500/[0.08]" : ""
                  }`}
                >
                  {selectedEmail?.id === email.id && (
                    <motion.div layoutId="active-indicator" className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-500" />
                  )}
                  
                  <div className="flex justify-between items-baseline mb-1.5">
                    <span className={`text-sm font-semibold truncate max-w-[70%] ${selectedEmail?.id === email.id ? "text-blue-400" : "text-gray-200"}`}>
                      {email.from}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono tabular-nums">
                      {formatDistanceToNow(new Date(email.date), { addSuffix: false })}
                    </span>
                  </div>
                  <div className="text-sm text-gray-300 font-medium truncate mb-1">
                    {email.subject || "(No Subject)"}
                  </div>
                  <div className="text-xs text-gray-500 truncate font-medium">
                    {email.snippet}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- READING PANE --- */}
      <div className={`flex-1 bg-[#0A0A0A] flex flex-col ${!selectedEmail ? 'hidden md:flex' : 'flex'} relative`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <AnimatePresence mode="wait">
          {selectedEmail ? (
            <motion.div 
              key={selectedEmail.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full z-10"
            >
              {/* Toolbar */}
              <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0A0A0A]/80 backdrop-blur-md">
                 <div className="flex items-center gap-2">
                   <button onClick={() => setSelectedEmail(null)} className="md:hidden p-2 -ml-2 text-gray-400 hover:text-white">
                      <ChevronLeft size={20} />
                   </button>
                   <div className="flex bg-white/5 rounded-lg p-1 gap-1">
                      <ToolbarBtn icon={<Reply size={15} />} tooltip="Reply" />
                      <ToolbarBtn icon={<Star size={15} />} tooltip="Star" />
                      <ToolbarBtn icon={<Archive size={15} />} tooltip="Archive" />
                   </div>
                   <div className="h-6 w-px bg-white/10 mx-2" />
                   <ToolbarBtn icon={<Trash2 size={15} />} tooltip="Delete" color="hover:text-red-400 hover:bg-red-500/10" />
                 </div>
                 <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">
                       {new Date(selectedEmail.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    <button className="text-gray-500 hover:text-white"><MoreVertical size={16} /></button>
                 </div>
              </div>

              {/* Email Content */}
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="max-w-4xl mx-auto">
                  <h2 className="text-2xl font-bold text-white mb-8 leading-snug">
                    {selectedEmail.subject}
                  </h2>
                  
                  <div className="flex items-start gap-4 mb-10 pb-8 border-b border-white/5">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20">
                      {selectedEmail.from[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-base font-bold text-white">{selectedEmail.from}</div>
                      <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                         to <span className="text-gray-300 bg-white/5 px-1.5 py-0.5 rounded">me</span>
                      </div>
                    </div>
                  </div>

                  {/* Safe HTML Content */}
                  <div className="prose prose-invert prose-sm max-w-none text-gray-300/90 leading-relaxed selection:bg-blue-500/30">
                    <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedEmail.html) }} />
                  </div>
                  
                  {/* Reply Box Stub */}
                  <div className="mt-12 pt-8 border-t border-white/5">
                    <div className="h-24 border border-white/10 rounded-xl bg-[#0F0F0F] hover:border-white/20 transition cursor-text flex items-center justify-center text-gray-600 text-sm gap-2">
                       <Reply size={16} /> Click here to <span className="text-blue-500 font-medium">Reply</span> to {selectedEmail.from}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 select-none z-10">
              <div className="w-24 h-24 bg-white/[0.02] rounded-[2rem] flex items-center justify-center mb-6 border border-white/5 shadow-2xl">
                <Mail size={32} className="opacity-30" />
              </div>
              <p className="text-sm font-medium text-gray-400">Select an email to read</p>
              <div className="mt-2 flex gap-2 text-[10px] text-gray-600 font-mono uppercase tracking-widest">
                 <span>Pro Tip: Press</span> 
                 <kbd className="bg-white/10 px-1 rounded text-gray-400">R</kbd> 
                 <span>to refresh</span>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ToolbarBtn({ icon, tooltip, color = "text-gray-400 hover:text-white hover:bg-white/10" }) {
  return (
    <button title={tooltip} className={`p-2 rounded-md transition ${color}`}>
      {icon}
    </button>
  );
}