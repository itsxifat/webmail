"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Loader2, Copy, AlertTriangle, ArrowRight, ShieldCheck, Tag } from "lucide-react";
import { toast } from "sonner"; 

export default function CheckoutPage() {
  const { id } = useParams();
  const router = useRouter();
  const [pkg, setPkg] = useState(null);
  
  // States
  const [term, setTerm] = useState(1); // Default to 1 Month
  const [method, setMethod] = useState("bkash");
  const [senderNumber, setSenderNumber] = useState("");
  const [trxId, setTrxId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/packages").then(res => res.json()).then(data => {
      setPkg(data.packages.find(p => p._id === id));
    });
  }, [id]);

  if (!pkg) return <div className="h-[80vh] flex items-center justify-center"><Loader2 className="animate-spin text-purple-500" size={40} /></div>;

  // --- CALCULATIONS ---
  // If renewPrice is set and higher than price, that's the "Regular" price. 
  // Otherwise, regular price is just the current price.
  const regularPrice = pkg.renewPrice > 0 ? pkg.renewPrice : pkg.price;
  const promoPrice = pkg.price; 
  
  const subtotal = regularPrice * term;
  const total = promoPrice * term;
  const discount = subtotal - total;
  const discountPercent = Math.round(((subtotal - total) / subtotal) * 100);

  const handleOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (senderNumber.length < 11 || trxId.length < 5) {
        toast.error("Invalid payment details provided");
        setError("Please enter a valid Wallet Number and Transaction ID.");
        setLoading(false);
        return;
    }

    try {
        const res = await fetch("/api/user/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                packageId: id,
                paymentMethod: method,
                senderNumber,
                transactionId: trxId,
                termMonths: term, 
                totalAmount: total 
            })
        });

        const data = await res.json();
        if (res.ok) {
            toast.success("Order submitted successfully!");
            router.push(`/dashboard/orders?success=true`);
        } else {
            setError(data.error || "Order failed");
            toast.error(data.error || "Order failed");
        }
    } catch (err) {
        setError("Network connection error");
        toast.error("Network connection error");
    } finally {
        setLoading(false);
    }
  };

  const copyNumber = () => {
    navigator.clipboard.writeText("01963949880");
    toast.success("Number copied to clipboard");
  };

  const activeColor = method === "bkash" ? "#e2136e" : "#ec1c24";

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-12 flex flex-col lg:flex-row gap-8">
      
      {/* LEFT COLUMN: Configuration & Payment */}
      <div className="flex-1 space-y-8">
        
        {/* 1. Period Selection */}
        <section>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="bg-blue-600 text-xs w-6 h-6 rounded-full flex items-center justify-center">1</span> 
                Choose billing cycle
            </h2>
            {/* Changed Grid to cols-2 since we removed extra terms */}
            <div className="grid grid-cols-2 gap-4">
                {[1, 12].map((months) => {
                    // Local calculation for display
                    const isDiscounted = months === 12 && regularPrice > promoPrice;
                    
                    return (
                        <div 
                            key={months}
                            onClick={() => setTerm(months)}
                            className={`relative cursor-pointer border rounded-2xl p-6 transition-all duration-200 group ${term === months ? 'bg-blue-900/20 border-blue-500 ring-1 ring-blue-500 transform scale-[1.02]' : 'bg-[#0A0A0A] border-white/10 hover:border-white/30'}`}
                        >
                            {/* Discount Badge for Yearly */}
                            {months === 12 && discountPercent > 0 && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-lg flex items-center gap-1">
                                    <Tag size={10} /> SAVE {discountPercent}%
                                </div>
                            )}
                            
                            <div className="text-center space-y-2">
                                <div className="text-lg font-bold text-gray-300 group-hover:text-white">
                                    {months === 12 ? "Yearly" : "Monthly"}
                                </div>
                                
                                <div className="flex flex-col items-center justify-center gap-1">
                                    {/* Main Price Display */}
                                    <div className="flex items-baseline gap-1.5 text-white">
                                        <span className="text-xs font-bold text-gray-400">BDT</span>
                                        <span className="text-3xl font-bold">{promoPrice}</span>
                                        <span className="text-sm text-gray-400 font-medium">/mo</span>
                                    </div>

                                    {/* Regular Price (Strikethrough) */}
                                    {regularPrice > promoPrice && (
                                        <div className="text-xs text-gray-500 line-through decoration-red-500/50 decoration-2">
                                            Regular: BDT {regularPrice}/mo
                                        </div>
                                    )}
                                </div>
                                
                                {/* Renewal Note */}
                                {regularPrice > promoPrice && (
                                    <div className="text-[10px] text-blue-400/80 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/10 mt-2">
                                        Renews at BDT {regularPrice}/mo
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>

        {/* 2. Payment Method */}
        <section>
             <h2 className="text-xl md:text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="bg-blue-600 text-xs w-6 h-6 rounded-full flex items-center justify-center">2</span>
                Select Payment
             </h2>
             <div className="bg-[#0A0A0A] border border-white/10 p-6 md:p-8 rounded-[2rem] shadow-2xl">
                
                {/* Method Tabs */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <button 
                        onClick={() => setMethod("bkash")}
                        className={`h-16 rounded-xl border-2 font-bold text-lg flex items-center justify-center gap-2 transition-all ${method === 'bkash' ? 'bg-[#e2136e]/10 border-[#e2136e] text-white' : 'border-white/5 bg-white/5 text-gray-500 hover:bg-white/10'}`}
                    >
                        <img src="https://freelogopng.com/images/all_img/1656227518bkash-logo-png.png" className="h-8 object-contain" alt="bKash" />
                    </button>
                    <button 
                        onClick={() => setMethod("nagad")}
                        className={`h-16 rounded-xl border-2 font-bold text-lg flex items-center justify-center gap-2 transition-all ${method === 'nagad' ? 'bg-[#ec1c24]/10 border-[#ec1c24] text-white' : 'border-white/5 bg-white/5 text-gray-500 hover:bg-white/10'}`}
                    >
                        <img src="https://www.logo.wine/a/logo/Nagad/Nagad-Horizontal-Logo.wine.svg" className="h-18 object-contain" alt="Nagad" />
                    </button>
                </div>

                {/* Sender Info Box */}
                <div className="mb-8 p-4 rounded-xl bg-[#16181F] border border-dashed border-white/10 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: activeColor }} />
                    <p className="text-gray-400 text-xs font-bold uppercase mb-2 tracking-widest">Send Money (Personal)</p>
                    <div 
                        onClick={copyNumber}
                        className="text-2xl md:text-3xl font-mono font-bold text-white cursor-pointer hover:text-blue-400 flex items-center justify-center gap-3 active:scale-95 transition-transform"
                    >
                        01963949880 <Copy size={18} className="text-gray-500" />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2">Tap number to copy</p>
                </div>

                {/* Form */}
                <form onSubmit={handleOrder} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Your Wallet Number</label>
                        <input 
                            required 
                            type="number"
                            placeholder="e.g. 017xxxxxxxx" 
                            value={senderNumber} 
                            onChange={e => setSenderNumber(e.target.value)} 
                            className="w-full h-14 bg-black/50 border border-white/10 rounded-xl px-4 text-white font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder:text-gray-700" 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Transaction ID</label>
                        <input 
                            required 
                            placeholder="e.g. 9H7G6F5D" 
                            value={trxId} 
                            onChange={e => setTrxId(e.target.value)} 
                            className="w-full h-14 bg-black/50 border border-white/10 rounded-xl px-4 text-white font-mono uppercase focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder:text-gray-700" 
                        />
                    </div>
                    
                    {error && (
                        <div className="text-red-400 text-sm bg-red-500/10 p-4 rounded-xl flex items-center gap-3 border border-red-500/20">
                            <AlertTriangle size={18} /> {error}
                        </div>
                    )}
                    
                    <button 
                        disabled={loading} 
                        type="submit" 
                        className="w-full h-16 rounded-xl font-bold text-white text-lg flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50 disabled:scale-100 shadow-xl" 
                        style={{ backgroundColor: activeColor, boxShadow: `0 8px 20px -5px ${activeColor}55` }}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : "Verify & Complete Order"} 
                        {!loading && <ArrowRight size={20} />}
                    </button>
                    
                    <p className="text-center text-xs text-gray-500 mt-4 leading-relaxed">
                          Admin will verify the Transaction ID within 15-30 minutes.<br/>
                          Service activates automatically upon approval.
                    </p>
                </form>
             </div>
        </section>
      </div>

      {/* RIGHT COLUMN: Sticky Order Summary */}
      <div className="w-full lg:w-[380px]">
         <div className="sticky top-8 bg-[#0F1117] border border-white/10 p-6 md:p-8 rounded-[2rem] shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">Order Summary</h3>
            
            {/* Items */}
            <div className="space-y-4 mb-6 pb-6 border-b border-white/10">
                <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-medium">{pkg.name} Plan</span>
                    <span className="text-white font-bold">{term === 12 ? "1 Year" : "1 Month"}</span>
                </div>
                
                {/* Price Breakdown */}
                <div className="flex justify-between items-center text-sm">
                   <span className="text-gray-500">Regular Price</span>
                   <span className="text-gray-400 font-mono line-through decoration-red-500/40">BDT {regularPrice * term}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                   <span className="text-white">Offer Price</span>
                   <span className="text-white font-mono font-bold">BDT {promoPrice * term}</span>
                </div>

                {discount > 0 && (
                   <div className="flex justify-between items-center text-sm text-green-400 bg-green-500/10 px-2 py-1.5 rounded border border-green-500/20 mt-2">
                      <span className="flex items-center gap-1"><Tag size={12}/> You Save</span>
                      <span className="font-bold">- BDT {discount}</span>
                   </div>
                )}
            </div>

            {/* Total */}
            <div className="flex justify-between items-end mb-2">
               <span className="text-gray-300 font-bold text-lg pb-1">Total Pay</span>
               <span className="text-3xl font-bold text-white font-mono tracking-tight">
                  <span className="text-lg text-gray-500 mr-1">BDT</span>
                  {total}
               </span>
            </div>
            
            {/* Disclaimer for Renewal */}
            {regularPrice > promoPrice && (
                 <div className="text-right text-[11px] text-gray-400 mb-6 bg-white/5 p-2 rounded">
                    * Plan renews at <span className="text-white font-bold">BDT {regularPrice}/mo</span> after {term} months.
                 </div>
            )}

            {/* Trust Badges */}
            <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/10 mt-4">
               <div className="flex gap-3 mb-2">
                  <ShieldCheck className="text-blue-500" size={20} />
                  <div className="text-sm font-bold text-white">Secure Payment</div>
               </div>
               <p className="text-xs text-blue-200/70 leading-relaxed">
                  Your payment info is processed securely. We do not store sensitive wallet pins.
               </p>
            </div>
            
         </div>
      </div>

    </div>
  );
}