"use client"

import { motion } from "motion/react"
import { ArrowRight, Cpu, ShieldCheck, Globe, Lightning } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { GlowWrapper } from "@/components/ui/glow-wrapper"
import { variants } from "@/lib/motion"

const trustMetrics = [
  { icon: Cpu, value: "12,500+", label: "German Tech Jobs" },
  { icon: Globe, value: "B1–C2", label: "CEFR Levels" },
  { icon: ShieldCheck, value: "100%", label: "GDPR Compliant" },
  { icon: Lightning, value: "Ready", label: "Europass Format" },
] as const

export function HeroSection() {
  return (
    <section id="hero" className="relative min-h-[90vh] flex flex-col items-center justify-center pt-32 overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none -z-10 bg-[radial-gradient(circle_at_50%_30%,oklch(0.68_0.2_195_/_0.15)_0%,transparent_70%)]" />
      <div className="absolute inset-0 pointer-events-none -z-10 opacity-5 pattern" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' stroke=\'%23ffffff\' stroke-width=\'0.1\'%3E%3Cpath d=\'M0 0h40v40H0V0z\'/%3E%3C/g%3E%3C/svg%3E")' }} />

      <div className="container-xl flex flex-col items-center text-center space-y-8 relative z-10">
        <motion.div variants={variants.fadeIn} initial="hidden" animate="visible">
          <div className="surface-1 px-4 py-1.5 rounded-full border border-primary/20 flex items-center gap-2 mb-6 w-fit mx-auto">
            <div className="size-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-primary font-mono">Powered by Germany-First AI Engine</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight text-neutral-0 leading-[1.1] max-w-4xl">
            Germany's #1 AI <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-blue-400">Application Engine</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            From CV extraction to city-specific matching and automated application generation. The professional gateway to the German tech ecosystem.
          </p>
        </motion.div>

        <motion.div variants={variants.slideUp} initial="hidden" animate="visible" className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button size="lg" className="h-14 px-8 text-base shadow-[0_0_20px_rgba(108,198,212,0.3)] group">
            Scan Your CV — Free <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button variant="outline" size="lg" className="h-14 px-8 text-base surface-1 border-white/10 hover:border-primary/30">
            Explore Germany Jobs
          </Button>
        </motion.div>

        {/* Trust Metrics Bar */}
        <motion.div variants={variants.staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-4xl mt-16">
          {trustMetrics.map(({ icon: Icon, value, label }) => (
            <motion.div
              key={label}
              variants={variants.staggerItem}
              className="surface-1 backdrop-blur-sm rounded-xl border border-white/5 p-6 text-center"
            >
              <Icon size={24} className="text-primary mx-auto mb-2" />
              <div className="text-3xl font-display font-bold text-neutral-0">{value}</div>
              <div className="text-xs text-neutral-400 uppercase tracking-wider mt-1">{label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* The Command Card Visual Anchor */}
        <motion.div variants={variants.scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="w-full max-w-5xl mt-20">
          <GlowWrapper intensity="default" className="p-1 rounded-2xl">
            <Card variant="glass" padding="none" className="overflow-hidden aspect-video md:aspect-[21/9] border-white/5 flex flex-col relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5" />
              <div className="absolute top-4 left-4 right-4 flex justify-between">
                <div className="flex items-center gap-2 surface-2 px-3 py-1 rounded-lg border border-white/5">
                  <div className="size-1.5 rounded-full bg-green-500" />
                  <span className="text-xs font-mono text-neutral-300">LIVE SCAN</span>
                </div>
                <div className="flex items-center gap-2 surface-2 px-3 py-1 rounded-lg border border-white/5">
                  <span className="text-xs font-mono text-neutral-400">00:42</span>
                </div>
              </div>
              <div className="z-10 flex flex-col items-center justify-center flex-1 space-y-8 p-8">
                <div className="flex flex-col items-center space-y-2">
                  <div className="text-xs font-mono text-primary tracking-wider">CANDIDATE PROFILE</div>
                  <div className="text-2xl font-display font-bold text-neutral-0">Alex M. — Senior Full-Stack Engineer</div>
                  <div className="text-sm text-neutral-400">React • TypeScript • Node.js • PostgreSQL • 7y exp</div>
                </div>
                <div className="flex flex-col items-center space-y-3 w-full max-w-md">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-300">Match Confidence</span>
                    <span className="font-display font-bold text-primary">94%</span>
                  </div>
                  <div className="w-full h-1.5 surface-2 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: "94%" }}
                      transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                      className="h-full bg-gradient-to-r from-primary to-blue-400"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm text-neutral-400">
                  <div className="flex items-center gap-1.5"><Globe size={16} /> Berlin, Munich, Hamburg</div>
                  <div className="flex items-center gap-1.5"><ShieldCheck size={16} /> Visa Sponsorship Available</div>
                  <div className="flex items-center gap-1.5"><Lightning size={16} /> 42 Active Matches</div>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex justify-center">
                <div className="flex items-center gap-4 surface-2 px-4 py-2 rounded-lg border border-white/5 text-xs">
                  <span className="text-primary">●</span>
                  <span className="text-neutral-300">Analyzing German market requirements...</span>
                  <span className="text-neutral-500">CEFR: C1 • DIN 5008: Valid</span>
                </div>
              </div>
            </Card>
          </GlowWrapper>
        </motion.div>
      </div>
    </section>
  )
}