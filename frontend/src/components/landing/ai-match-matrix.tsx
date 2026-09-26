"use client"

import { motion } from "motion/react"
import { CheckCircle, XCircle, ArrowRight } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { GlowWrapper } from "@/components/ui/glow-wrapper"
import { variants } from "@/lib/motion"
import { cn } from "@/lib/utils"

const matchBreakdown = [
  { category: "Hard Skills", score: 96, weight: 35, items: ["React", "TypeScript", "Node.js", "PostgreSQL", "GraphQL", "Docker"] },
  { category: "Soft Skills", score: 88, weight: 20, items: ["Team Leadership", "Agile/Scrum", "Mentoring", "Stakeholder Mgmt"] },
  { category: "Language (CEFR)", score: 75, weight: 25, items: ["English: C2", "German: B2 (target C1)"] },
  { category: "Location Match", score: 100, weight: 20, items: ["Berlin-based", "Remote-friendly", "Visa ready"] },
] as const

const jobRequirements = [
  { skill: "React 18+", required: true, matched: true },
  { skill: "TypeScript 5+", required: true, matched: true },
  { skill: "Node.js / NestJS", required: true, matched: true },
  { skill: "PostgreSQL / Prisma", required: true, matched: true },
  { skill: "GraphQL / Apollo", required: true, matched: true },
  { skill: "Kubernetes (EKS)", required: true, matched: false },
  { skill: "AWS / GCP", required: true, matched: false },
  { skill: "German C1", required: true, matched: false },
  { skill: "Team Lead 3+ yrs", required: false, matched: true },
  { skill: "FinTech Domain", required: false, matched: true },
] as const

export function AIMatchMatrix() {
  return (
    <section id="ai-match-matrix" className="section">
      <div className="container-xl">
        <motion.div variants={variants.scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-xs font-mono text-primary uppercase tracking-wider">STAGE 04</span>
          <h2 className="mt-4 text-4xl md:text-5xl font-display font-semibold tracking-tight text-neutral-0">AI Match Matrix</h2>
          <p className="mt-4 text-lg text-neutral-400">Deep candidate-to-job analysis. Every requirement mapped. Every gap identified. Transparent scoring you can trust.</p>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_1fr] gap-12">
          {/* Left: Match Score Overview */}
          <motion.div variants={variants.scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-8">
            <GlowWrapper intensity="default" className="p-1 rounded-2xl">
              <Card variant="elevated" padding="lg" className="relative">
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <span className="text-xs font-mono text-primary uppercase tracking-wider">MATCH CONFIDENCE</span>
                    <h3 className="mt-2 font-display font-bold text-2xl text-neutral-0">Senior Full-Stack Engineer — Berlin</h3>
                    <p className="mt-1 text-sm text-neutral-400">FinTech Scale-up • 80–110k EUR • Blue Card Sponsorship</p>
                  </div>
                  <div className="text-right">
                    <div className="text-5xl font-display font-bold text-primary">94%</div>
                    <div className="text-xs text-neutral-400">Overall Match</div>
                  </div>
                </div>

                {/* Circular progress / radial breakdown */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <motion.div
                    initial={{ strokeDashoffset: 377 }}
                    animate={{ strokeDashoffset: 377 * (1 - 0.94) }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                    className="relative w-48 h-48"
                  >
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="96" cy="96" r="60" stroke="currentColor" strokeWidth="8" fill="none" className="text-white/5" />
                      <circle
                        cx="96"
                        cy="96"
                        r="60"
                        stroke="url(#match-gradient)"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={377}
                        strokeLinecap="round"
                        className="text-primary"
                      />
                      <defs>
                        <linearGradient id="match-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#6CC6D4" />
                          <stop offset="100%" stopColor="#3B82F6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl font-display font-bold text-neutral-0">94%</div>
                        <div className="text-xs text-neutral-400">MATCH</div>
                      </div>
                    </div>
                  </motion.div>

                  <div className="flex-1 space-y-4">
                    {matchBreakdown.map(({ category, score, weight }) => (
                      <motion.div
                        key={category}
                        initial={{ width: 0 }}
                        animate={{ width: `${score}%` }}
                        transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
                        className="group"
                      >
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-neutral-0">{category}</span>
                          <span className="text-primary font-display">{score}%</span>
                        </div>
                        <div className="h-2 surface-2 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full"
                            style={{ width: `${score}%` }}
                          />
                        </div>
                        <div className="mt-1 text-xs text-neutral-500 flex justify-between">
                          <span>Weight: {weight}%</span>
                          <span>{matchBreakdown.find(m => m.category === category)?.items.length} criteria</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </Card>
            </GlowWrapper>

            {/* Visa Status Badge */}
            <Card variant="glass" padding="md" className="border-primary/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                  <CheckCircle size={24} className="text-green-500" />
                </div>
                <div>
                  <div className="font-display font-semibold text-neutral-0">Visa Sponsorship: Available</div>
                  <div className="text-sm text-neutral-400">Blue Card eligible • §18g Fast-track • Employer certified</div>
                </div>
                <Button variant="outline" size="sm" className="ml-auto">View Visa Details</Button>
              </div>
            </Card>
          </motion.div>

          {/* Right: Requirements Breakdown */}
          <motion.div variants={variants.scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-xl text-neutral-0">Requirement Analysis</h3>
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <CheckCircle size={14} className="text-green-500" /> 7/10 Matched
                <span className="w-px h-4 bg-white/10" />
                <XCircle size={14} className="text-red-500" /> 3 Gaps
              </div>
            </div>

            <Card variant="elevated" padding="none" className="overflow-hidden">
              <div className="p-4 border-b border-white/5 flex items-center gap-4">
                <div className="flex-1 font-mono text-xs text-neutral-400">REQUIREMENT</div>
                <div className="w-24 text-center font-mono text-xs text-neutral-400">STATUS</div>
                <div className="w-20 text-center font-mono text-xs text-neutral-400">TYPE</div>
              </div>
              <div className="divide-y divide-white/5">
                {jobRequirements.map((req, i) => (
                  <motion.div
                    key={req.skill}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i }}
                    className={cn("p-4 flex items-center gap-4 hover:bg-white/2.5 transition-fast", req.matched ? "" : "bg-red-500/5")}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {req.matched ? (
                          <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle size={16} className="text-red-500 flex-shrink-0" />
                        )}
                        <span className="font-medium text-neutral-0 truncate">{req.skill}</span>
                        {req.required && <span className="text-[10px] font-bold text-red-500 px-1.5 py-0.5 rounded border border-red-500/30">REQUIRED</span>}
                        {!req.required && <span className="text-[10px] font-bold text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/30">PREFERRED</span>}
                      </div>
                    </div>
                    <div className="w-24 text-center">
                      {req.matched ? (
                        <span className="text-green-500 font-mono text-sm">✓ Matched</span>
                      ) : (
                        <span className="text-red-500 font-mono text-sm">Gap</span>
                      )}
                    </div>
                    <div className="w-20 text-center text-xs text-neutral-400">
                      {req.matched ? "Your CV" : "Upskill needed"}
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button size="lg" className="flex-1 shadow-[0_0_20px_rgba(108,198,212,0.3)]">
                Generate Application
                <ArrowRight className="ml-2" />
              </Button>
              <Button variant="outline" size="lg" className="flex-1">
                View Upskill Plan
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}