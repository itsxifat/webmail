"use client";
import { Globe, Shield, Zap, Lock, Server, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1 // Delays each child by 0.1s
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export default function Features() {
  return (
    <section id="features" className="py-32 px-6 bg-[#050505] relative z-20">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-24"
        >
          <h2 className="text-4xl font-bold text-white mb-6 tracking-tight">Engineered for perfection</h2>
          <p className="text-gray-400 text-lg">We sweat the details so you don't have to.</p>
        </motion.div>

        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-3 gap-x-8 gap-y-12"
        >
          <FeatureCard 
            icon={<Globe className="text-blue-500" />}
            title="Anycast DNS"
            desc="Our custom DNS layer routes traffic to the nearest server, cutting latency by up to 60%."
          />
          <FeatureCard 
            icon={<Shield className="text-purple-500" />}
            title="Ironclad Security"
            desc="Every email is scanned by 3 separate engines for malware, phishing, and spam."
          />
          <FeatureCard 
            icon={<Zap className="text-yellow-500" />}
            title="Instant Sync"
            desc="Push IMAP support means emails arrive on your phone the millisecond they hit our server."
          />
          <FeatureCard 
            icon={<Lock className="text-green-500" />}
            title="Zero-Access Encryption"
            desc="We encrypt data at rest. Even if we wanted to read your emails, we couldn't."
          />
          <FeatureCard 
            icon={<Server className="text-red-500" />}
            title="Bare Metal Power"
            desc="No shared vCPUs. We run on dedicated bare metal for consistent, raw performance."
          />
          <FeatureCard 
            icon={<BarChart3 className="text-indigo-500" />}
            title="Deep Analytics"
            desc="Real-time logs, bounce tracking, and delivery reports accessible via API."
          />
        </motion.div>
      </div>
    </section>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <motion.div variants={item} className="group p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300">
      <div className="mb-6 w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed text-sm">{desc}</p>
    </motion.div>
  );
}