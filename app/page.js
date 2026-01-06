import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Infrastructure from "@/components/landing/Infrastructure"; // New
import Features from "@/components/landing/Features";
import PricingSection from "@/components/landing/PricingSection";
import Comparison from "@/components/landing/Comparison"; // New
import FAQ from "@/components/landing/FAQ"; // New
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30">
      <Navbar />
      <Hero />
      <Infrastructure />
      <Features />
      <Comparison />
      <PricingSection />
      <FAQ />
      <Footer />
    </div>
  );
}