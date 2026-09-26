"use client"

import { motion } from "motion/react"
import { Flag, Shield, FileText, Users, TrendUp, CheckCircle } from "@phosphor-icons/react"
import { variants } from "@/lib/motion"

const germanyFeatures = [
  { icon: Flag, title: "Germany-First Architecture", desc: "Built exclusively for the German tech market — not a global tool adapted later.", metrics: ["Local tax IDs", "Sozialversicherung", "Entgeltabrechnung"] },
  { icon: Shield, title: "Visa Sponsorship Intelligence", desc: "Real-time tracking of companies offering Blue Card and §18 Aufenthaltserlaubnis sponsorship.", metrics: ["Blue Card ready", "§18g support", "Fast-track eligible"] },
  { icon: FileText, title: "DIN 5008 & Europass CV", desc: "Auto-generates application documents compliant with German DIN standards and Europass format.", metrics: ["DIN 5008 valid", "Europass XML", "ATS optimized"] },
  { icon: Users, title: "CEFR B1–C2 Language Mapping", desc: "Automatic language proficiency detection from certificates, education, and work history.", metrics: ["Goethe/TELC/DTelc", "Auto-mapped", "Interview ready"] },
  { icon: TrendUp, title: "Probezeit & Kündigungsschutz", desc: "Application strategy accounts for German probation periods and termination protection laws.", metrics: ["6-mo Probezeit", "KSchG aware", "Strategic timing"] },
  { icon: CheckCircle, title: "GDPR & BDSG Compliant", desc: "Data processing fully compliant with EU GDPR and German BDSG — hosted in Frankfurt.", metrics: ["Frankfurt DC", "BDSG §26", "Zero US transfer"] },
] as const

const comparisonData = [
  { aspect: "CV Format", global: "Generic templates", jobapply: "DIN 5008 / Europass" },
  { aspect: "Visa Support", global: "Not mentioned", jobapply: "Blue Card / §18g tracked" },
  { aspect: "Language", global: "Self-reported", jobapply: "CEFR certified mapping" },
  { aspect: "Salary Data", global: "USD estimates", jobapply: "EUR bands by city/level" },
  { aspect: "Legal", global: "US-centric terms", jobapply: "BDSG / KSchG aware" },
  { aspect: "Data Hosting", global: "Global/US clouds", jobapply: "Frankfurt, DE only" },
] as const

export function GermanyEngine() {
  return (
    <section id="germany-engine" className="section">
      <div className="container-xl">
        <motion.div variants={variants.scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-xs font-mono text-primary uppercase tracking-wider">STAGE 02</span>
          <h2 className="mt-4 text-4xl md:text-5xl font-display font-semibold tracking-tight text-neutral-0">Germany Career Engine</h2>
          <p className="mt-4 text-lg text-neutral-400">The only AI application platform engineered from the ground up for German employment law, visa pathways, and local hiring standards.</p>
        </motion.div>

        {/* Feature Grid */}
        <motion.div variants={variants.staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
          {germanyFeatures.map(({ icon: Icon, title, desc, metrics }) => (
            <motion.div key={title} variants={variants.staggerItem} className="surface-1 backdrop-blur-sm rounded-2xl border border-white/5 p-6 group hover:border-primary/20 transition-fast">
              <div className="surface-2 p-4 rounded-xl border border-white/5 w-fit mb-4 group-hover:border-primary/30 transition-fast">
                <Icon size={24} className="text-primary" />
              </div>
              <h3 className="font-display font-semibold text-xl text-neutral-0 mb-2">{title}</h3>
              <p className="text-sm text-neutral-400 mb-4">{desc}</p>
              <div className="flex flex-wrap gap-2">
                {metrics.map(m => (
                  <span key={m} className="text-xs font-mono text-primary/80 px-2 py-0.5 surface-2 rounded border border-white/5">{m}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Comparison Table */}
        <motion.div variants={variants.scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true }} className="surface-1 backdrop-blur-sm rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-6 border-b border-white/5">
            <h3 className="font-display font-semibold text-2xl text-neutral-0">Global Tools vs. JobApply AI</h3>
            <p className="mt-1 text-sm text-neutral-400">Why generic platforms fail German candidates — and how we solve it.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="p-4 font-bold text-sm uppercase tracking-wider text-neutral-400">Aspect</th>
                  <th className="p-4 font-bold text-sm uppercase tracking-wider text-neutral-400 text-center">Generic Platforms</th>
                  <th className="p-4 font-bold text-sm uppercase tracking-wider text-primary text-center">JobApply AI</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map(({ aspect, global, jobapply }) => (
                  <tr key={aspect} className="border-b border-white/5 hover:bg-white/2.5 transition-fast">
                    <td className="p-4 font-medium text-neutral-0">{aspect}</td>
                    <td className="p-4 text-center text-neutral-400">{global}</td>
                    <td className="p-4 text-center text-primary font-mono font-medium">{jobapply}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  )
}