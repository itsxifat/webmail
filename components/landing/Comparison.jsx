"use client";
import { Check, X } from "lucide-react";

export default function Comparison() {
  return (
    <section className="py-24 px-6 bg-[#050505] border-t border-white/5">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-16">Why switch to Enfinito?</h2>
        
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5">
                <th className="p-6 text-sm font-bold text-gray-500 uppercase tracking-wider">Feature</th>
                <th className="p-6 text-sm font-bold text-white uppercase tracking-wider bg-blue-600/10 border-b-2 border-blue-500">Enfinito Cloud</th>
                <th className="p-6 text-sm font-bold text-gray-500 uppercase tracking-wider">Big Tech</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-[#0A0A0A]">
              <Row label="Privacy Policy" us="Zero Tracking" them="Ad Profiling" />
              <Row label="Support" us="24/7 Human Chat" them="Community Forum" />
              <Row label="Custom Domains" us="Unlimited*" them="Extra Cost" />
              <Row label="Storage" us="NVMe SSD" them="Standard HDD" />
              <Row label="Setup Time" us="2 Minutes" them="24-48 Hours" />
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Row({ label, us, them }) {
  return (
    <tr className="group hover:bg-white/[0.02] transition-colors">
      <td className="p-6 text-gray-400 font-medium">{label}</td>
      <td className="p-6 text-white font-bold bg-blue-600/5 group-hover:bg-blue-600/10 transition-colors flex items-center gap-2">
        <Check size={16} className="text-blue-500" /> {us}
      </td>
      <td className="p-6 text-gray-500">{them}</td>
    </tr>
  );
}