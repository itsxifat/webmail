"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Package, Clock, CheckCircle, XCircle, Search, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Show success toast if redirected from checkout
    if (searchParams.get("success")) {
      toast.success("Order placed successfully! Waiting for approval.");
    }
    fetchOrders();
  }, [searchParams]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/user/orders");
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
      }
    } catch (error) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "pending": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "rejected": return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
            <h1 className="text-2xl font-bold text-white">Order History</h1>
            <p className="text-gray-400 text-sm">Manage and track your service purchases.</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-[#0F0F0F] rounded-2xl border border-white/5">
            <Package size={48} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-lg font-bold text-gray-300">No orders found</h3>
            <p className="text-gray-500 text-sm">You haven't purchased any plans yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0A0A0A]">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider border-b border-white/10">
                        <th className="p-4 font-medium">Package</th>
                        <th className="p-4 font-medium">Transaction ID</th>
                        <th className="p-4 font-medium">Amount</th>
                        <th className="p-4 font-medium">Date</th>
                        <th className="p-4 font-medium text-right">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {orders.map((order) => (
                        <tr key={order._id} className="text-sm text-gray-300 hover:bg-white/5 transition-colors">
                            <td className="p-4">
                                <div className="font-bold text-white">{order.package?.name || "Unknown Package"}</div>
                                <div className="text-xs text-gray-500">{order.termInMonths === 12 ? "Yearly" : "Monthly"} Plan</div>
                            </td>
                            <td className="p-4 font-mono text-gray-400">
                                {order.transactionId}
                                <div className="text-[10px] text-gray-600 uppercase">{order.paymentMethod}</div>
                            </td>
                            <td className="p-4 font-bold text-white">BDT {order.amount}</td>
                            <td className="p-4 text-gray-500">
                                {new Date(order.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-4 text-right">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                                    {order.status === 'active' && <CheckCircle size={12} />}
                                    {order.status === 'pending' && <Clock size={12} />}
                                    {order.status === 'rejected' && <XCircle size={12} />}
                                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      )}
    </div>
  );
}