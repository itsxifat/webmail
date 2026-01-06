"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, User, Loader2, Copy, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => fetch("/api/admin/orders").then(res => res.json())
  });

  const approveMutation = useMutation({
    mutationFn: (orderId) => fetch("/api/admin/orders/approve", {
      method: "POST",
      body: JSON.stringify({ orderId })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-orders"]);
      alert("Order Approved!");
    }
  });

  const rejectMutation = useMutation({
    mutationFn: (orderId) => fetch("/api/admin/orders/reject", {
      method: "POST",
      body: JSON.stringify({ orderId })
    }),
    onSuccess: () => queryClient.invalidateQueries(["admin-orders"])
  });

  const orders = data?.orders || [];

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Payment Verifications</h1>
      
      <div className="grid grid-cols-1 gap-4">
        {orders.map(order => (
          <div key={order._id} className="bg-[#0A0A0A] border border-white/10 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            
            {/* User Info */}
            <div className="flex items-center gap-4 w-full md:w-1/4">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center">
                <User size={20} className="text-gray-400" />
              </div>
              <div>
                <h4 className="text-white font-bold">{order.user?.name}</h4>
                <p className="text-xs text-gray-500">{order.user?.email}</p>
                <div className="mt-1 text-xs text-blue-400 font-mono">
                   {formatDistanceToNow(new Date(order.createdAt))} ago
                </div>
              </div>
            </div>

            {/* Payment Details (Critical Section) */}
            <div className="flex-1 bg-[#16181F] p-4 rounded-xl border border-white/5 w-full">
               <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                     <span className="text-gray-500 text-xs uppercase font-bold block mb-1">Method</span>
                     <span className={`font-bold capitalize ${order.paymentMethod === 'bkash' ? 'text-pink-500' : 'text-red-500'}`}>
                        {order.paymentMethod}
                     </span>
                  </div>
                  <div>
                     <span className="text-gray-500 text-xs uppercase font-bold block mb-1">Sender Number</span>
                     <span className="text-white font-mono">{order.senderNumber}</span>
                  </div>
                  <div>
                     <span className="text-gray-500 text-xs uppercase font-bold block mb-1">Trx ID</span>
                     <span className="text-yellow-400 font-mono font-bold select-all">{order.transactionId}</span>
                  </div>
               </div>
               <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center">
                  <span className="text-gray-400 text-xs">Plan: <strong className="text-white">{order.packageName}</strong></span>
                  <span className="text-white font-bold text-lg">৳ {order.amount}</span> 
               </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 w-full md:w-auto justify-end">
               {order.status === 'pending' ? (
                  <>
                    <button 
                        onClick={() => rejectMutation.mutate(order._id)}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-500 p-3 rounded-xl transition"
                        title="Reject"
                    >
                        <X size={20} />
                    </button>
                    <button 
                        onClick={() => approveMutation.mutate(order._id)}
                        className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-green-900/20 transition"
                    >
                        {approveMutation.isLoading ? <Loader2 className="animate-spin" /> : <><Check size={18} /> Approve</>}
                    </button>
                  </>
               ) : (
                  <span className={`px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wider ${
                      order.status === 'paid' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                      {order.status}
                  </span>
               )}
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}