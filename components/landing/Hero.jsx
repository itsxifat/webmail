"use client";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, CheckCircle2, Cloud } from "lucide-react";
import { useRef } from "react";

export default function Hero() {
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, 50]);

  return (
    <section ref={targetRef} className="relative min-h-[90vh] flex items-center justify-center pt-32 pb-20 px-6 overflow-hidden">
      {/* Parallax Background */}
      <motion.div style={{ opacity, scale }} className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-blue-600/10 rounded-full blur-[160px] pointer-events-none" />
      
      <motion.div style={{ y, opacity }} className="max-w-5xl mx-auto text-center relative z-10">
        
        {/* Animated Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 border border-white/10 bg-white/5 backdrop-blur-md rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-gray-300 mb-8 hover:border-blue-500/50 transition-colors cursor-default"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          v2.0 Infrastructure Live
        </motion.div>
        
        {/* Staggered Heading */}
        <motion.h1 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1, duration: 0.8, ease: "easeOut" }}
          className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 leading-[0.95] text-white"
        >
          Email for the <br /> 
          <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-400 via-white to-gray-500">
            next generation.
          </span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed"
        >
           Zero-knowledge encryption. 100% NVMe storage. <br className="hidden md:block"/>
           The email infrastructure that developers love and enterprises trust.
        </motion.p>
        
        {/* Buttons with Hover Lift */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.3, duration: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-5"
        >
          <Link 
            href="/register" 
            className="group h-14 px-8 rounded-full bg-white text-black font-bold flex items-center gap-3 transition-all hover:scale-105 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
          >
            Start Free Trial <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link 
             href="/contact"
             className="h-14 px-8 rounded-full border border-white/10 hover:bg-white/5 text-white font-bold flex items-center justify-center transition-all"
          >
             Talk to Sales
          </Link>
        </motion.div>

        {/* Social Proof */}
        <motion.div 
           initial={{ opacity: 0 }} 
           animate={{ opacity: 1 }} 
           transition={{ delay: 0.6, duration: 1 }}
           className="mt-16 pt-8 border-t border-white/5 flex flex-wrap justify-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-700"
        >
           {/* Placeholders for partner logos - using text for now */}
           {['Acme Corp', 'NextLevel', 'Stripe-like', 'GlobalTech'].map((brand, i) => (
             <span key={i} className="text-sm font-bold tracking-widest uppercase">{brand}</span>
           ))}
        </motion.div>
      </motion.div>
    </section>
  );
}