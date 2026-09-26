"use client"

import { motion } from "motion/react"
import { FileText, Brain, MagnifyingGlass, Warning, ArrowRight, Check } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { variants } from "@/lib/motion"
import { cn } from "@/lib/utils"

const features = [
  { icon: Brain, title: "Skill Extraction", desc: "AI identifies 200+ technical skills from your CV with 96% accuracy", metric: "200+ skills" },
  { icon: FileText, title: "Experience Timeline", desc: "Automatic parsing of roles, companies, durations and achievements", metric: "Auto-parsed" },
  { icon: Warning, title: "ATS Gap Analysis", desc: "Missing keywords flagged against German job descriptions", metric: "88% ATS Score" },
  { icon: MagnifyingGlass, title: "CEFR Detection", desc: "Language proficiency inferred from education and certifications", metric: "B1–C2 Range" },
] as const

const mockSkills = [
  { name: "React", matched: true },
  { name: "TypeScript", matched: true },
  { name: "Node.js", matched: true },
  { name: "PostgreSQL", matched: true },
  { name: "GraphQL", matched: true },
  { name: "Docker", matched: true },
  { name: "Kubernetes", matched: false },
  { name: "AWS", matched: false },
  { name: "German C1", matched: false },
  { name: "CI/CD", matched: true },
] as const

export function CVIntelligence() {
  return (
    <section id="cv-intelligence" className="section">
      <div className="container-xl">
        <motion.div variants={variants.scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-xs font-mono text-primary uppercase tracking-wider">STAGE 01</span>
          <h2 className="mt-4 text-4xl md:text-5xl font-display font-semibold tracking-tight text-neutral-0">CV Intelligence Neural Layer</h2>
          <p className="mt-4 text-lg text-neutral-400">Upload your CV and watch our AI engine extract, structure, and score your profile against the German tech market.</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: Feature breakdown */}
          <motion.div variants={variants.staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-6">
            {features.map(({ icon: Icon, title, desc, metric }) => (
              <motion.div key={title} variants={variants.staggerItem} className="surface-1 backdrop-blur-sm rounded-2xl border border-white/5 p-6 flex gap-4 group">
                <div className="surface-2 p-4 rounded-xl border border-white/5 flex-shrink-0 group-hover:border-primary/30 transition-fast">
                  <Icon size={24} className="text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-display font-semibold text-xl text-neutral-0">{title}</h3>
                  <p className="mt-1 text-sm text-neutral-400">{desc}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs font-mono text-primary px-2 py-0.5 surface-2 rounded border border-white/5">{metric}</span>
                    <ArrowRight size={14} className="text-neutral-500 group-hover:text-primary transition-fast" />
                  </div>
                </div>
              </motion.div>
            ))}
            <motion.div variants={variants.staggerItem} className="surface-1 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
              <Button size="lg" className="w-full shadow-[0_0_20px_rgba(108,198,212,0.2)]">
                Upload CV for Free Analysis
                <ArrowRight className="ml-2" />
              </Button>
            </motion.div>
          </motion.div>

          {/* Right: Interactive Scanner Mockup */}
          <motion.div variants={variants.scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="sticky top-32">
            <Card variant="elevated" padding="none" className="overflow-hidden h-[600px] md:h-[700px] relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5" />
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-blue-400" />

              <div className="relative z-10 p-6 h-full flex flex-col">
                {/* Scanner Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 surface-2 rounded-xl border border-white/5 flex items-center justify-center">
                      <FileText size={20} className="text-primary" />
                    </div>
                    <div>
                      <div className="font-display font-semibold text-neutral-0">Alex_M_Resume.pdf</div>
                      <div className="text-xs text-neutral-400">2.4 MB • 2 pages • PDF</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 surface-2 px-3 py-1 rounded-lg border border-white/5 text-xs">
                    <div className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-neutral-300 font-mono">SCANNING...</span>
                  </div>
                </div>

                {/* Scan Animation Area */}
                <div className="relative flex-1 flex items-center justify-center">
                  <div className="relative w-full max-w-md">
                    {/* Document preview */}
                    <div className="surface-0 rounded-xl border border-white/10 overflow-hidden aspect-[3/4] relative">
                      <div className="absolute inset-0 p-6">
                        <div className="space-y-4">
                          <div className="h-8 w-3/4 surface-2 rounded" />
                          <div className="h-4 w-full surface-2 rounded" />
                          <div className="h-4 w-5/6 surface-2 rounded" />
                          <div className="h-12 w-full surface-2 rounded" />
                          <div className="h-4 w-4/5 surface-2 rounded" />
                          <div className="h-4 w-3/4 surface-2 rounded" />
                          <div className="h-16 w-full surface-2 rounded" />
                          <div className="h-4 w-2/3 surface-2 rounded" />
                        </div>
                      </div>

                      {/* Scanning line */}
                      <motion.div
                        animate={{ top: ["0%", "100%", "0%"] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary to-blue-400 opacity-80 shadow-[0_0_20px_rgba(108,198,212,0.6)] pointer-events-none"
                        style={{ top: "0%" }}
                      />

                      {/* Highlight overlays */}
                      {mockSkills.slice(0, 4).map((skill, i) => (
                        <motion.div
                          key={skill.name}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.5 + i * 0.2 }}
                          className="absolute surface-1 border border-primary/50 rounded px-2 py-0.5 text-xs font-mono text-primary shadow-[0_0_10px_rgba(108,198,212,0.3)]"
                          style={{
                            top: `${15 + i * 18}%`,
                            left: `${5 + (i % 2) * 45}%`,
                          }}
                        >
                          {skill.name} ✓
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Results Panel */}
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between p-4 surface-2 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <Check size={20} className="text-green-500" />
                      <span className="font-medium text-neutral-0">ATS Score: <span className="text-primary font-display">88%</span></span>
                    </div>
                    <span className="text-xs text-neutral-400 font-mono">Above German market avg</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {mockSkills.map(skill => (
                      <motion.span
                        key={skill.name}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className={cn(
                          "px-3 py-1.5 text-xs font-mono rounded-full border transition-fast",
                          skill.matched
                            ? "bg-primary/10 border-primary/30 text-primary"
                            : "bg-white/5 border-white/10 text-neutral-400"
                        )}
                      >
                        {skill.name} {skill.matched ? <Check size={10} className="inline ml-1" /> : "+"}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}