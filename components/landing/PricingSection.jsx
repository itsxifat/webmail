"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { useSession } from "next-auth/react";

export default function PricingSection() {
  const { data: session } = useSession();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/packages")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setPackages(data.packages);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <section id="pricing" className="py-32 px-6 bg-[#020202] relative">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold text-white mb-6 tracking-tight">Simple, transparent pricing</h2>
          <p className="text-gray-400 text-lg">Choose the infrastructure that fits your scale.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {loading ? (
             [1, 2, 3].map((i) => <div key={i} className="h-[600px] bg-white/[0.02] rounded-[2rem] animate-pulse border border-white/5" />)
          ) : (
            packages.map((pkg) => (
              <PricingCard key={pkg._id} pkg={pkg} session={session} />
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function PricingCard({ pkg, session }) {
  const isLogged = !!session;

  return (
    <div className={`relative flex flex-col p-10 rounded-[2.5rem] border transition-all duration-300 group
      ${pkg.isPopular 
        ? "bg-[#0A0A0A] border-blue-500/30 shadow-2xl shadow-blue-900/10" 
        : "bg-transparent border-white/10 hover:border-white/20"
      }`}
    >
      {pkg.isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
          Most Popular
        </div>
      )}

      <div className="mb-8">
        <h3 className="text-xl font-semibold text-white mb-2">{pkg.name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-5xl font-bold text-white">${pkg.price}</span>
          <span className="text-gray-500 font-medium">/mo</span>
        </div>
      </div>

      <div className="flex-1 space-y-5 mb-10">
        <FeatureItem text={`${pkg.maxDomains} Custom Domain${pkg.maxDomains > 1 ? 's' : ''}`} />
        <FeatureItem text={`${pkg.maxMailboxes} Professional Mailboxes`} />
        <FeatureItem text={`${pkg.storageLimitGB}GB NVMe Storage`} />
        <FeatureItem text="Unlimited Bandwidth" />
        <FeatureItem text="Free SSL Certificates" />
        <FeatureItem text="Anti-Spam Protection" />
      </div>

      <Link
        href={isLogged ? `/dashboard/checkout/${pkg._id}` : `/register?plan=${pkg._id}`}
        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95
          ${pkg.isPopular 
            ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20" 
            : "bg-white hover:bg-gray-200 text-black"
          }`}
      >
        {isLogged ? "Select Plan" : "Get Started"} <ArrowRight size={18} />
      </Link>
    </div>
  );
}

function FeatureItem({ text }) {
  return (
    <div className="flex items-center gap-3 text-sm font-medium text-gray-400">
      <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
        <Check size={12} className="text-white" />
      </div>
      {text}
    </div>
  );
}