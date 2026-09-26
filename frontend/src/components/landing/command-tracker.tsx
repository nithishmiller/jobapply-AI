"use client"

import { motion } from "motion/react"
import { Briefcase, Building, MapPin, CheckCircle, PaperPlane, ChatCircle, Trophy } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { variants } from "@/lib/motion"
import { cn } from "@/lib/utils"

const columns = [
  { id: "saved", title: "Saved", icon: Briefcase, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", count: 12 },
  { id: "applied", title: "Applied", icon: PaperPlane, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20", count: 8 },
  { id: "interview", title: "Interview", icon: ChatCircle, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", count: 3 },
  { id: "offer", title: "Offer", icon: Trophy, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20", count: 1 },
] as const

const applications = [
  { id: 1, company: "TechFlow GmbH", role: "Senior Full-Stack", location: "Berlin", salary: "€95k", stage: "offer", date: "2026-01-15", match: 94 },
  { id: 2, company: "DataScale AG", role: "Lead Backend Engineer", location: "Munich", salary: "€110k", stage: "interview", date: "2026-01-10", match: 89 },
  { id: 3, company: "FinPulse.io", role: "Full-Stack Developer", location: "Hamburg", salary: "€85k", stage: "interview", date: "2026-01-08", match: 91 },
  { id: 4, company: "AutoTech Robotics", role: "Senior React Engineer", location: "Stuttgart", salary: "€92k", stage: "applied", date: "2026-01-05", match: 87 },
  { id: 5, company: "CloudNine Systems", role: "Platform Engineer", location: "Frankfurt", salary: "€105k", stage: "applied", date: "2026-01-03", match: 84 },
  { id: 6, company: "MediaStream GmbH", role: "Full-Stack Engineer", location: "Cologne", salary: "€78k", stage: "saved", date: "2026-01-01", match: 78 },
] as const

export function CommandTracker() {
  return (
    <section id="command-tracker" className="section">
      <div className="container-xl">
        <motion.div variants={variants.scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-xs font-mono text-primary uppercase tracking-wider">STAGE 06</span>
          <h2 className="mt-4 text-4xl md:text-5xl font-display font-semibold tracking-tight text-neutral-0">Command Center Tracker</h2>
          <p className="mt-4 text-lg text-neutral-400">Full pipeline visibility. From saved searches to signed offers. Real-time status, conversion metrics, and deadline tracking.</p>
        </motion.div>

        {/* Kanban Board */}
        <motion.div variants={variants.scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {columns.map((col, i) => (
              <motion.div
                key={col.id}
                variants={variants.staggerItem}
                className="surface-1 backdrop-blur-sm rounded-2xl border border-white/5 flex flex-col h-full"
              >
                <div className="p-4 border-b border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <col.icon size={20} className={col.color} />
                      <h3 className="font-display font-semibold text-neutral-0">{col.title}</h3>
                    </div>
                    <span className={cn("text-2xl font-display font-bold", col.color)}>{col.count}</span>
                  </div>
                  <div className="h-1.5 surface-2 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(col.count / 24) * 100}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 * i }}
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${col.color.replace("text-", "")} 0%, ${col.color.replace("text-", "").replace("400", "500")} 100%)` }}
                    />
                  </div>
                </div>
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {applications.filter(a => a.stage === col.id).map((app, idx) => (
                    <motion.div
                      key={app.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * idx }}
                      className="surface-2 p-3 rounded-xl border border-white/5 hover:border-primary/30 transition-fast group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-neutral-0 truncate">{app.role}</div>
                          <div className="text-sm text-neutral-400 flex items-center gap-2 mt-0.5">
                            <Building size={12} /> {app.company}
                            <span className="w-px h-3 bg-white/10 mx-1" />
                            <MapPin size={12} /> {app.location}
                          </div>
                        </div>
                        <span className="text-xs font-mono text-primary whitespace-nowrap">{app.match}%</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-neutral-500 font-mono">{app.salary}</span>
                        <span className="text-[10px] font-mono text-neutral-400">{app.date}</span>
                      </div>
                    </motion.div>
                  ))}
                  {(col.count as number) === 0 && (
                    <div className="text-center py-8 text-neutral-500 text-sm">
                      No applications yet
                    </div>
                  )}
                </div>
                <div className="p-4 border-t border-white/5">
                  <Button variant="outline" size="sm" className="w-full text-xs">View All</Button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Analytics Summary */}
        <motion.div variants={variants.scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-4 gap-6">
          <Card variant="glass" padding="lg" className="text-center">
            <div className="text-4xl font-display font-bold text-primary mb-1">24</div>
            <div className="text-sm text-neutral-400">Total Applications</div>
          </Card>
          <Card variant="glass" padding="lg" className="text-center">
            <div className="text-4xl font-display font-bold text-cyan-400 mb-1">33%</div>
            <div className="text-sm text-neutral-400">Response Rate</div>
          </Card>
          <Card variant="glass" padding="lg" className="text-center">
            <div className="text-4xl font-display font-bold text-amber-400 mb-1">12.5%</div>
            <div className="text-sm text-neutral-400">Interview Rate</div>
          </Card>
          <Card variant="glass" padding="lg" className="text-center">
            <div className="text-4xl font-display font-bold text-green-400 mb-1">4.2%</div>
            <div className="text-sm text-neutral-400">Offer Rate</div>
          </Card>
        </motion.div>

        {/* Timeline View */}
        <motion.div variants={variants.scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="mt-16">
          <h3 className="font-display font-semibold text-xl text-neutral-0 mb-6">Recent Activity Timeline</h3>
          <Card variant="elevated" padding="none" className="overflow-hidden">
            <div className="divide-y divide-white/5">
              {[
                { type: "offer", action: "Offer received", company: "TechFlow GmbH", role: "Senior Full-Stack Engineer", time: "2 hours ago", icon: Trophy, color: "text-green-400" },
                { type: "interview", action: "Technical interview scheduled", company: "DataScale AG", role: "Lead Backend Engineer", time: "1 day ago", icon: ChatCircle, color: "text-amber-400" },
                { type: "interview", action: "First round completed", company: "FinPulse.io", role: "Full-Stack Developer", time: "3 days ago", icon: CheckCircle, color: "text-cyan-400" },
                { type: "applied", action: "Application submitted", company: "AutoTech Robotics", role: "Senior React Engineer", time: "5 days ago", icon: PaperPlane, color: "text-blue-400" },
                { type: "applied", action: "Application submitted", company: "CloudNine Systems", role: "Platform Engineer", time: "7 days ago", icon: PaperPlane, color: "text-blue-400" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className="p-4 flex items-center gap-4 hover:bg-white/2.5 transition-fast"
                >
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", item.color.replace("text-", "bg-").replace("400", "500/10"), "border", item.color.replace("text-", "border-").replace("400", "500/30"))}>
                    <item.icon size={20} className={item.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-neutral-0">{item.action}</div>
                    <div className="text-sm text-neutral-400">{item.role} at {item.company}</div>
                  </div>
                  <div className="text-xs text-neutral-500 font-mono whitespace-nowrap">{item.time}</div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}