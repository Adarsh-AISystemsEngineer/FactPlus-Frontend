import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/fact-check/navbar";
import { ArrowRight, ShieldCheck, Database, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { AnimatedFeatureCard } from "@/components/fact-check/animated-feature-card";

// Use the NodeVisualizer as a background element
import { NodeVisualizer } from "@/components/fact-check/node-visualizer";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-background text-foreground overflow-hidden selection:bg-primary/30">
      <Navbar />

      <main className="flex-1 relative flex flex-col items-center justify-center">
        {/* Dynamic Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100vw] h-[100vh] bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.08),transparent_60%)]" />
           <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] opacity-30"></div>
        </div>

        {/* Hero Section */}
        <div className="container relative z-10 px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
              <span className="text-sm font-medium text-muted-foreground">FactPlus AI Engine v4.0 Online</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40">
              Truth in <span className="text-primary">Real-Time</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              The advanced AI assistant that turns raw information into clarity. 
              Instantly verify claims, analyze sources, and visualize the truth.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/chat">
                <Button size="lg" className="h-12 px-8 text-lg rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_30px_-5px_hsl(var(--primary)/0.4)] transition-all hover:scale-105">
                  Start Verifying <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/auth">
                <Button size="lg" variant="outline" className="h-12 px-8 text-lg rounded-full">
                  Sign In
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Feature Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-24"
          >
            {[
              {
                icon: ShieldCheck,
                title: "Credibility Scoring",
                desc: "Instant 0-100 reliability scores for any text, URL, or claim."
              },
              {
                icon: Database,
                title: "Evidence Retrieval",
                desc: "Autonomous agents cross-reference trusted databases in milliseconds."
              },
              {
                icon: Zap,
                title: "Reasoning Trace",
                desc: "Transparent logic chains showing exactly how conclusions were reached."
              }
            ].map((feature, i) => (
              <AnimatedFeatureCard
                key={i}
                icon={feature.icon}
                title={feature.title}
                desc={feature.desc}
                index={i}
              />
            ))}
          </motion.div>
        </div>
      </main>

      <footer className="py-8 border-t border-white/5 bg-black/20 text-center">
        <p className="text-sm text-muted-foreground">&copy; 2026 FactPlus AI. Dedicated to truth and clarity.</p>
      </footer>
    </div>
  );
}