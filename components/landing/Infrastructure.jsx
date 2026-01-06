"use client";
import { motion } from "framer-motion";

export default function Infrastructure() {
  return (
    <section className="py-32 px-6 bg-black relative overflow-hidden">
      {/* Background Map Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
      
      <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-16">
        <div className="flex-1">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">Global Edge Network</h2>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              Your data is replicated across 3 continents ensuring redundancy and speed. 
              We own our hardware in Tier-4 data centers.
            </p>
            
            <div className="space-y-6">
               <LocationItem city="Frankfurt, DE" ping="12ms" />
               <LocationItem city="New York, USA" ping="24ms" />
               <LocationItem city="Singapore, SG" ping="45ms" />
            </div>
          </motion.div>
        </div>

        {/* Abstract Map Visualization */}
        <div className="flex-1 w-full h-[400px] relative">
          <motion.div 
             initial={{ opacity: 0, scale: 0.8 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
             className="w-full h-full bg-gradient-to-tr from-blue-900/20 to-purple-900/20 rounded-full blur-3xl absolute top-0 left-0"
          />
          {/* Mock Map Dots */}
          <div className="absolute inset-0 border border-white/10 rounded-3xl bg-white/[0.02] backdrop-blur-sm p-8 flex items-center justify-center">
             <span className="text-gray-500 font-mono text-xs">interactive_map_module_loading...</span>
             {/* Add pulsating dots */}
             <div className="absolute top-1/3 left-1/4 w-3 h-3 bg-blue-500 rounded-full animate-ping" />
             <div className="absolute top-1/2 right-1/3 w-3 h-3 bg-purple-500 rounded-full animate-ping delay-75" />
             <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-green-500 rounded-full animate-ping delay-150" />
          </div>
        </div>
      </div>
    </section>
  );
}

function LocationItem({ city, ping }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 pb-4">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]" />
        <span className="text-white font-medium">{city}</span>
      </div>
      <span className="font-mono text-blue-400 text-sm">{ping}</span>
    </div>
  );
}