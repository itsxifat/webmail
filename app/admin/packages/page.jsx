"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, Package, Trash2, Edit3, Check, X, 
  Globe, Mail, HardDrive, Loader2, Save, TrendingUp, Copy 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner"; 

export default function AdminPackages() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Initial Form State
  const initialFormState = {
    name: "", 
    price: 0,        // Promo Price (Lower)
    renewPrice: 0,   // Regular Price (Higher - for strike-through)
    maxDomains: 1, 
    maxMailboxes: 5, 
    maxAliases: 10,  // NEW: Added Aliases default
    storageLimitGB: 5, 
    isPopular: false
  };

  const [formData, setFormData] = useState(initialFormState);

  // 1. Fetch Packages
  const { data, isLoading } = useQuery({
    queryKey: ["admin-packages"],
    queryFn: () => fetch("/api/admin/packages").then(res => res.json())
  });

  // 2. Create Mutation
  const createMutation = useMutation({
    mutationFn: (newPlan) => fetch("/api/admin/packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPlan)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-packages"]);
      closeModal();
      toast.success("Plan created successfully");
    },
    onError: () => toast.error("Failed to create plan")
  });

  // 3. Update Mutation
  const updateMutation = useMutation({
    mutationFn: (updatedPlan) => fetch("/api/admin/packages", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingId, ...updatedPlan })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-packages"]);
      closeModal();
      toast.success("Plan updated successfully");
    },
    onError: () => toast.error("Failed to update plan")
  });

  // 4. Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => fetch("/api/admin/packages", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-packages"]);
      toast.success("Plan deleted");
    }
  });

  // --- Helpers ---

  const openCreateModal = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const openEditModal = (plan) => {
    setEditingId(plan._id);
    setFormData({
      name: plan.name,
      price: plan.price,
      renewPrice: plan.renewPrice || plan.price, 
      maxDomains: plan.maxDomains,
      maxMailboxes: plan.maxMailboxes,
      maxAliases: plan.maxAliases || 0, // NEW: Load alias limit
      storageLimitGB: plan.storageLimitGB,
      isPopular: plan.isPopular
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!formData.name || formData.price < 0) {
        return toast.error("Please check your inputs");
    }

    if (editingId) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const packages = data?.packages || [];

  return (
    <div className="max-w-7xl mx-auto p-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Package className="text-purple-500" /> Subscription Plans
          </h1>
          <p className="text-gray-400 mt-2 text-sm">Manage pricing, discounts, and resource limits.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-xl shadow-purple-500/20 active:scale-95"
        >
          <Plus size={18} /> Create New Plan
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-32"><Loader2 className="animate-spin text-purple-500 w-10 h-10" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {packages.map((plan) => (
            <motion.div 
              layout 
              key={plan._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`bg-[#0A0A0A] border transition-colors duration-300 p-8 rounded-[2rem] relative group flex flex-col ${plan.isPopular ? 'border-purple-500/50 shadow-2xl shadow-purple-900/10' : 'border-white/10 hover:border-white/20'}`}
            >
              {/* Popular Badge */}
              {plan.isPopular && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                  Most Popular
                </span>
              )}

              {/* Card Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-black text-white">৳{plan.price}</span>
                    <span className="text-xs text-gray-500 font-medium">/mo</span>
                  </div>
                  {/* Show Regular Price if Discounted */}
                  {plan.renewPrice > plan.price && (
                      <div className="text-xs text-gray-500 line-through mt-1">
                         Regular: ৳{plan.renewPrice}
                      </div>
                  )}
                </div>
                
                {/* Actions */}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => openEditModal(plan)}
                    className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition"
                    title="Edit Plan"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button 
                    onClick={() => {
                        if(confirm('Are you sure you want to delete this plan?')) deleteMutation.mutate(plan._id)
                    }}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                    title="Delete Plan"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-4 mb-8 flex-1">
                <PlanDetail icon={<Globe size={16}/>} label={`${plan.maxDomains} Custom Domains`} />
                <PlanDetail icon={<Mail size={16}/>} label={`${plan.maxMailboxes} Mailboxes`} />
                <PlanDetail icon={<Copy size={16}/>} label={`${plan.maxAliases || 0} Aliases`} /> {/* NEW */}
                <PlanDetail icon={<HardDrive size={16}/>} label={`${plan.storageLimitGB} GB NVMe Storage`} />
              </div>

              {/* Quick Edit Button */}
              <button 
                onClick={() => openEditModal(plan)}
                className="w-full py-3 bg-white/5 border border-white/10 text-gray-300 rounded-xl text-sm font-bold hover:bg-white/10 hover:text-white transition"
              >
                Modify Configuration
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* --- CREATE / EDIT MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Content */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-[#0F0F0F] border border-white/10 w-full max-w-xl rounded-2xl p-8 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-8">
                 <h2 className="text-2xl font-bold text-white">
                    {editingId ? "Edit Plan Details" : "Create New Plan"}
                 </h2>
                 <button onClick={closeModal} className="text-gray-500 hover:text-white transition">
                    <X size={24} />
                 </button>
              </div>
              
              <div className="space-y-8">
                
                {/* 1. Basic Info */}
                <div className="space-y-4">
                   <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Plan Basics</label>
                   <div>
                      <input 
                        className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all placeholder:text-gray-700"
                        placeholder="Plan Name (e.g. Enterprise)"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                   </div>
                   
                   {/* Popular Toggle */}
                    <div 
                      onClick={() => setFormData({...formData, isPopular: !formData.isPopular})}
                      className={`h-[50px] w-full rounded-xl border cursor-pointer flex items-center px-4 gap-3 transition-all ${formData.isPopular ? "bg-purple-500/10 border-purple-500/50" : "bg-[#050505] border-white/10 hover:border-white/20"}`}
                    >
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${formData.isPopular ? "bg-purple-500 border-purple-500" : "border-gray-600"}`}>
                           {formData.isPopular && <Check size={14} className="text-white" />}
                        </div>
                        <span className={`text-sm font-medium ${formData.isPopular ? "text-purple-400" : "text-gray-400"}`}>
                           Mark as "Most Popular"
                        </span>
                    </div>
                </div>

                {/* 2. Pricing Configuration */}
                <div className="space-y-4">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        Pricing Configuration <TrendingUp size={12}/>
                    </label>
                    
                    <div className="grid grid-cols-2 gap-4 bg-white/5 p-5 rounded-2xl border border-white/5">
                      <div>
                        <label className="text-[10px] font-bold text-purple-400 uppercase mb-2 block tracking-wider flex items-center gap-1">
                           Promo Price (Sale)
                        </label>
                        <div className="relative">
                           <input 
                             type="number"
                             className="w-full bg-[#050505] border border-white/10 rounded-xl pl-4 pr-12 py-3 text-white focus:border-purple-500 outline-none font-bold text-lg"
                             value={formData.price}
                             onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                           />
                           <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">BDT</span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block tracking-wider">
                           Regular Price (Renew)
                        </label>
                        <div className="relative">
                           <input 
                             type="number"
                             className="w-full bg-[#050505] border border-white/10 rounded-xl pl-4 pr-12 py-3 text-gray-300 focus:border-purple-500 outline-none font-bold text-lg"
                             value={formData.renewPrice}
                             onChange={(e) => setFormData({...formData, renewPrice: Number(e.target.value)})}
                           />
                           <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">BDT</span>
                        </div>
                      </div>
                    </div>
                </div>

                {/* 3. Resource Limits */}
                <div className="space-y-4">
                   <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Resource Limits</label>
                   {/* Changed Grid to 4 cols if possible, or 2 rows */}
                   <div className="grid grid-cols-2 gap-4">
                      <LimitInput 
                        label="Domains" 
                        value={formData.maxDomains} 
                        onChange={(val) => setFormData({...formData, maxDomains: val})} 
                      />
                      <LimitInput 
                        label="Mailboxes" 
                        value={formData.maxMailboxes} 
                        onChange={(val) => setFormData({...formData, maxMailboxes: val})} 
                      />
                      <LimitInput 
                        label="Aliases (NEW)" 
                        value={formData.maxAliases} 
                        onChange={(val) => setFormData({...formData, maxAliases: val})} 
                      />
                      <LimitInput 
                        label="Storage (GB)" 
                        value={formData.storageLimitGB} 
                        onChange={(val) => setFormData({...formData, storageLimitGB: val})} 
                      />
                   </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-10 pt-6 border-t border-white/10">
                <button onClick={closeModal} className="flex-1 py-3.5 text-gray-400 font-bold hover:text-white hover:bg-white/5 rounded-xl transition">
                   Cancel
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                  className="flex-[2] py-3.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-500 shadow-xl shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {(createMutation.isLoading || updateMutation.isLoading) ? (
                     <Loader2 className="animate-spin" />
                  ) : (
                     <>
                       <Save size={18} /> {editingId ? "Update Plan" : "Create Plan"}
                     </>
                  )}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Sub Components ---

function PlanDetail({ icon, label }) {
  return (
    <div className="flex items-center gap-4 text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors">
      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 text-purple-400">
        {icon}
      </div>
      {label}
    </div>
  );
}

function LimitInput({ label, value, onChange }) {
   return (
      <div className="bg-[#050505] rounded-xl border border-white/10 p-3 hover:border-white/20 transition-colors">
         <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">{label}</div>
         <input 
            type="number" 
            className="w-full bg-transparent text-white font-bold text-lg outline-none placeholder:text-gray-700"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
         />
      </div>
   )
}