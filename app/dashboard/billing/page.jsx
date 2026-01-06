"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { CreditCard, Clock, CheckCircle2, XCircle, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";

export default function BillingPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["user-orders"],
    queryFn: () => fetch("/api/user/orders/list").then(res => res.json())
  });

  const orders = data?.orders || [];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-8">
         <div>
            <h1 className="text-2xl font-bold text-white">Billing & Plans</h1>
            <p className="text-gray-400 text-sm">Manage subscription and view invoices.</p>
         </div>
         <Link href="/dashboard/packages" className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-500 transition flex items-center gap-2">
            Change Plan <ArrowUpRight size={16} />
         </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         
         {/* Order History */}
         <div className="lg:col-span-2 bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/5 font-bold text-white">Order History</div>
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.02] text-gray-500 text-xs uppercase">
                <tr>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Description</th>
                  <th className="p-4 font-medium">Amount</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300">
                {orders.map(order => (
                  <tr key={order._id}>
                    <td className="p-4 text-gray-500 font-mono text-xs">{format(new Date(order.createdAt), "MMM dd, yyyy")}</td>
                    <td className="p-4 font-medium text-white">{order.packageName} Subscription</td>
                    <td className="p-4">${order.amount}</td>
                    <td className="p-4">
                      {order.status === 'paid' && <span className="text-green-400 text-xs font-bold px-2 py-1 bg-green-500/10 rounded border border-green-500/20">PAID</span>}
                      {order.status === 'pending' && <span className="text-yellow-500 text-xs font-bold px-2 py-1 bg-yellow-500/10 rounded border border-yellow-500/20">PENDING</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
         </div>

         {/* Payment Methods (Mock) */}
         <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 h-fit">
            <h3 className="font-bold text-white mb-4">Payment Methods</h3>
            <div className="p-4 border border-white/10 rounded-xl bg-[#16181F] flex items-center gap-3 mb-3">
               <CreditCard className="text-blue-500" />
               <div>
                  <div className="text-sm font-bold text-white">Manual Transfer</div>
                  <div className="text-xs text-gray-500">Default Method</div>
               </div>
            </div>
            <button className="w-full py-2 border border-white/10 rounded-lg text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition">
               + Add Method
            </button>
         </div>
      </div>
    </div>
  );
}