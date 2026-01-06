"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

export default function FAQ() {
  return (
    <section className="py-24 px-6 bg-black">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold mb-10 text-center">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <FaqItem q="Can I migrate my existing emails?" a="Yes! We provide a one-click migration tool that imports all your emails from Gmail, Outlook, or any IMAP server seamlessly." />
          <FaqItem q="Do you offer a free trial?" a="Absolutely. You get 14 days of full access to our Pro plan. No credit card required to start." />
          <FaqItem q="Where is my data stored?" a="You can choose your data residency region (EU, US, or Asia) during the account setup process to comply with local laws." />
          <FaqItem q="Can I use Outlook or Apple Mail?" a="Yes, Enfinito Cloud supports standard IMAP/SMTP/POP3 protocols, so it works with every email client on Earth." />
        </div>
      </div>
    </section>
  );
}

function FaqItem({ q, a }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-white/10 rounded-2xl bg-[#080808] overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors"
      >
        <span className="font-medium text-white">{q}</span>
        <Plus size={20} className={`text-gray-500 transition-transform ${isOpen ? "rotate-45" : ""}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 pt-0 text-gray-400 text-sm leading-relaxed border-t border-white/5">
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}