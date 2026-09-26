"use client"

import { motion } from "motion/react"
import { ArrowRight, ShieldCheck, Globe, Lightning, Sparkle } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { GlowWrapper } from "@/components/ui/glow-wrapper"
import { variants } from "@/lib/motion"

const trustBadges = [
  { icon: ShieldCheck, label: "GDPR & BDSG Compliant" },
  { icon: Globe, label: "Hosted in Frankfurt, DE" },
  { icon: Lightning, label: "CEFR B1–C2 Certified" },
  { icon: Sparkle, label: "DIN 5008 / Europass Ready" },
] as const

export function CTASection() {
  return (
    <section id="cta" className="section relative overflow-hidden">
      {/* Background atmospheric glow */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,oklch(0.68_0.2_195_/_0.08)_0%,transparent_70%)]" />
      <div className="absolute inset-0 -z-10 opacity-3 pattern" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' stroke=\'%23ffffff\' stroke-width=\'0.1\'%3E%3Cpath d=\'M0 0h60v60H0V0z\'/%3E%3C/g%3E%3C/svg%3E")' }} />

      <div className="container-xl relative z-10">
        <motion.div variants={variants.scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-4xl mx-auto text-center mb-16">
          <span className="text-xs font-mono text-primary uppercase tracking-wider">LAUNCH</span>
          <h2 className="mt-4 text-4xl md:text-5xl font-display font-semibold tracking-tight text-neutral-0">
            Ready to Launch Your German Tech Career?
          </h2>
          <p className="mt-4 text-lg text-neutral-400 max-w-2xl mx-auto">
            Join 12,500+ engineers who found their German role through AI-powered matching. Free CV scan. No credit card required.
          </p>
        </motion.div>

        {/* Primary CTA Card */}
        <motion.div variants={variants.scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="max-w-2xl mx-auto mb-16">
          <GlowWrapper intensity="strong" className="p-1 rounded-2xl animate-pulse" style={{ animationDuration: "3s" }}>
            <Card variant="elevated" padding="lg" className="relative overflow-hidden border-primary/20">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5" />
              <div className="relative z-10 text-center space-y-6">
                <div className="flex items-center justify-center gap-2 text-sm text-primary font-mono">
                  <div className="size-2 rounded-full bg-primary animate-pulse" />
                  <span>FREE CV SCAN • NO CREDIT CARD • INSTANT RESULTS</span>
                </div>
                <h3 className="font-display font-bold text-2xl md:text-3xl text-neutral-0">Start Your Free Analysis</h3>
                <p className="text-neutral-400">Upload your CV and get a 94% match confidence report against the German tech market in under 60 seconds.</p>
                <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-base shadow-[0_0_30px_rgba(108,198,212,0.4)] group">
                  Scan My CV — Free
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <div className="flex items-center justify-center gap-6 text-xs text-neutral-500">
                  <span className="flex items-center gap-1"><ShieldCheck size={12} /> GDPR Compliant</span>
                  <span className="flex items-center gap-1"><Sparkle size={12} /> No Data Stored</span>
                  <span className="flex items-center gap-1"><Lightning size={12} /> Instant Results</span>
                </div>
              </div>
            </Card>
          </GlowWrapper>
        </motion.div>

        {/* Trust Badges */}
        <motion.div variants={variants.staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {trustBadges.map(({ icon: Icon, label }) => (
            <motion.div key={label} variants={variants.staggerItem} className="surface-1 backdrop-blur-sm rounded-xl border border-white/5 p-4 text-center group hover:border-primary/30 transition-fast">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-2 group-hover:bg-primary/20 transition-fast">
                <Icon size={20} className="text-primary" />
              </div>
              <span className="text-sm font-medium text-neutral-0">{label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Secondary Actions */}
        <motion.div variants={variants.scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true }} className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8 border-white/10 hover:border-primary/30">
            Explore Germany Jobs
          </Button>
          <Button variant="ghost" size="lg" className="w-full sm:w-auto h-14 px-8">
            View Demo Dashboard
          </Button>
        </motion.div>

        {/* Footer Note */}
        <motion.div variants={variants.fadeIn} initial="hidden" animate="visible" className="pt-12 border-t border-white/5 text-center text-sm text-neutral-500">
          <p>JobApply AI — Germany's #1 AI Application Engine for Technical Careers</p>
          <p className="mt-1">Built for the German market • CEFR B1–C2 • DIN 5008 • Blue Card Ready • GDPR Compliant</p>
        </motion.div>
      </div>
    </section>
  )
}