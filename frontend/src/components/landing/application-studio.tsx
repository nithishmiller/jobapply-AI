"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { FileText, Copy, Download, Sparkle, Globe, ShieldCheck } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { variants } from "@/lib/motion"
import { cn } from "@/lib/utils"

const toneOptions = [
  { id: "formal", label: "Formal (Sie)", desc: "Standard German business correspondence", icon: ShieldCheck },
  { id: "direct", label: "Direct", desc: "Concise, modern tech industry tone", icon: Sparkle },
  { id: "creative", label: "Creative", desc: "Engaging narrative for startup roles", icon: Globe },
] as const

const coverLetterDE = `Sehr geehrte Frau Müller,

mit großem Interesse habe ich Ihre Stellenausschreibung für die Position als Senior Full-Stack Engineer bei TechFlow GmbH gelesen. Als erfahrener Softwareentwickler mit 7 Jahren Erfahrung in der Entwicklung skalierbarer Webanwendungen möchte ich mein Fachwissen in Ihr innovatives Team einbringen.

In meiner aktuellen Position bei DataSystems AG leite ich ein Team von 5 Entwicklern und bin verantwortlich für die Architektur und Implementierung von mikro-service-basierten Plattformen. Zu meinen Kernkompetenzen gehören:

• React 18 / TypeScript für performante Frontend-Architekturen
• Node.js / NestJS für robuste Backend-APIs
• PostgreSQL / Prisma für datenintensive Anwendungen
• Docker / Kubernetes für Cloud-native Deployments

Besonders reizt mich an TechFlow die Verbindung von FinTech-Innovation mit modernster Technologie. Ihre Arbeit im Bereich Echtzeit-Zahlungsverarbeitung deckt sich mit meiner Leidenschaft für komplexe, hochverfügbare Systeme.

Meine Deutschkenntnisse entsprechen dem Niveau B2 (Ziel: C1), und ich bereite mich aktiv auf die Telc C1 Prüfung vor. Ein Visum nach §18g AufenthG wird vom Arbeitgeber unterstützt.

Gerne stelle ich mich in einem persönlichen Gespräch vor. Ich stehe ab dem 01.03.2026 zur Verfügung.

Mit freundlichen Grüßen

Alex M.`

const coverLetterEN = `Dear Ms. Müller,

I read your job posting for the Senior Full-Stack Engineer position at TechFlow GmbH with great interest. As an experienced software engineer with 7 years of experience building scalable web applications, I would like to contribute my expertise to your innovative team.

In my current role at DataSystems AG, I lead a team of 5 developers and am responsible for the architecture and implementation of microservice-based platforms. My core competencies include:

• React 18 / TypeScript for performant frontend architectures
• Node.js / NestJS for robust backend APIs
• PostgreSQL / Prisma for data-intensive applications
• Docker / Kubernetes for cloud-native deployments

What particularly attracts me to TechFlow is the combination of FinTech innovation with cutting-edge technology. Your work in real-time payment processing aligns with my passion for complex, highly available systems.

My German language skills are at B2 level (targeting C1), and I am actively preparing for the Telc C1 exam. A visa under §18g AufenthG is supported by the employer.

I would welcome the opportunity to introduce myself in a personal interview. I am available from March 1, 2026.

Best regards

Alex M.`

export function ApplicationStudio() {
  const [activeTone, setActiveTone] = useState("formal")
  const [language, setLanguage] = useState("de")

  const currentLetter = language === "de" ? coverLetterDE : coverLetterEN

  return (
    <section id="application-studio" className="section">
      <div className="container-xl">
        <motion.div variants={variants.scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-xs font-mono text-primary uppercase tracking-wider">STAGE 05</span>
          <h2 className="mt-4 text-4xl md:text-5xl font-display font-semibold tracking-tight text-neutral-0">Automated Application Studio</h2>
          <p className="mt-4 text-lg text-neutral-400">AI-generated cover letters and CV adaptations. DIN 5008 compliant. German formal tone (Sie/Du) with CEFR-aware language.</p>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_1fr] gap-12">
          {/* Left: Job Description */}
          <motion.div variants={variants.scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-6">
            <Card variant="elevated" padding="lg" className="h-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-semibold text-xl text-neutral-0">Target Job Description</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-green-500 px-2 py-0.5 surface-2 rounded border border-green-500/30">ACTIVE</span>
                </div>
              </div>
              <div className="space-y-4 text-sm text-neutral-300">
                <div>
                  <div className="font-medium text-neutral-0 mb-1">Senior Full-Stack Engineer (m/w/d)</div>
                  <div className="text-neutral-400">TechFlow GmbH • Berlin (Hybrid) • €85k–€110k</div>
                </div>
                <div className="pt-4 border-t border-white/5 space-y-3">
                  <h4 className="font-semibold text-neutral-0">Requirements:</h4>
                  <ul className="space-y-1 pl-4">
                    <li className="text-neutral-400">• 5+ years React / TypeScript</li>
                    <li className="text-neutral-400">• Node.js / NestJS backend experience</li>
                    <li className="text-neutral-400">• PostgreSQL, GraphQL, Docker</li>
                    <li className="text-neutral-400">• German C1 (or B2 + commitment)</li>
                    <li className="text-neutral-400">• Team leadership experience</li>
                  </ul>
                </div>
                <div className="pt-4 border-t border-white/5">
                  <h4 className="font-semibold text-neutral-0">Benefits:</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {["Blue Card Sponsorship", "§18g Fast-track", "30 Days Vacation", "Learning Budget", "Remote-friendly"].map(b => (
                      <span key={b} className="text-xs px-2 py-1 surface-2 rounded border border-white/5 text-neutral-400">{b}</span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Right: Generated Application */}
          <motion.div variants={variants.scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="space-y-6">
            {/* Controls */}
            <Card variant="glass" padding="md">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono text-primary uppercase tracking-wider">TONE</span>
                  <div className="flex gap-2 surface-2 p-1 rounded-xl border border-white/5">
                    {toneOptions.map(tone => (
                      <button
                        key={tone.id}
                        onClick={() => setActiveTone(tone.id)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-fast",
                          activeTone === tone.id
                            ? "bg-primary text-neutral-0 shadow-[0_0_15px_rgba(108,198,212,0.3)]"
                            : "text-neutral-400 hover:text-neutral-0"
                        )}
                      >
                        <tone.icon size={14} />
                        {tone.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-primary uppercase tracking-wider">LANG</span>
                  <div className="surface-2 px-3 py-1.5 rounded-xl border border-white/5 flex gap-1">
                    <button onClick={() => setLanguage("de")} className={cn("px-3 py-1 rounded-lg text-sm font-medium transition-fast", language === "de" ? "bg-primary text-neutral-0" : "text-neutral-400 hover:text-neutral-0")}>DE</button>
                    <button onClick={() => setLanguage("en")} className={cn("px-3 py-1 rounded-lg text-sm font-medium transition-fast", language === "en" ? "bg-primary text-neutral-0" : "text-neutral-400 hover:text-neutral-0")}>EN</button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Generated Letter */}
            <Card variant="elevated" padding="none" className="overflow-hidden h-[600px] flex flex-col">
              <div className="surface-2 px-6 py-3 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-primary" />
                  <span className="font-mono text-sm text-neutral-0">Anschreiben_Alex_M_TechFlow.pdf</span>
                  <span className="text-xs text-neutral-400">DIN 5008 Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-primary"><Copy size={14} /> Copy</Button>
                  <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-primary"><Download size={14} /> Export</Button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 font-mono text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap bg-surface-0">
                {currentLetter}
              </div>
            </Card>

            {/* Actions */}
            <div className="flex gap-4">
              <Button size="lg" className="flex-1 shadow-[0_0_20px_rgba(108,198,212,0.3)]">
                Save Application
                <Sparkle className="ml-2" />
              </Button>
              <Button variant="outline" size="lg" className="flex-1">
                Edit Manually
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}