"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { MapPin, Briefcase, TrendUp, Building, Users, ArrowRight } from "@phosphor-icons/react"
import { Card } from "@/components/ui/card"
import { variants } from "@/lib/motion"
import { cn } from "@/lib/utils"

const cities = [
  { id: "berlin", name: "Berlin", icon: Briefcase, jobs: 3420, avgSalary: "€85k–€110k", topIndustries: ["FinTech", "AI/ML", "SaaS", "E-Commerce"], visaRate: 78, color: "from-primary to-blue-500" },
  { id: "munich", name: "Munich", icon: Building, jobs: 2890, avgSalary: "€90k–€120k", topIndustries: ["Automotive", "Robotics", "Semiconductors", "Defense"], visaRate: 82, color: "from-purple-500 to-pink-500" },
  { id: "hamburg", name: "Hamburg", icon: MapPin, jobs: 1950, avgSalary: "€78k–€100k", topIndustries: ["Logistics", "Media", "Aviation", "Maritime Tech"], visaRate: 71, color: "from-cyan-500 to-teal-500" },
  { id: "frankfurt", name: "Frankfurt", icon: TrendUp, jobs: 2180, avgSalary: "€95k–€130k", topIndustries: ["Banking", "FinTech", "InsurTech", "RegTech"], visaRate: 85, color: "from-amber-500 to-orange-500" },
  { id: "stuttgart", name: "Stuttgart", icon: Users, jobs: 1670, avgSalary: "€82k–€105k", topIndustries: ["Automotive", "Engineering", "IoT", "Manufacturing"], visaRate: 75, color: "from-emerald-500 to-green-500" },
  { id: "cologne", name: "Cologne", icon: Building, jobs: 1340, avgSalary: "€72k–€95k", topIndustries: ["Media", "Gaming", "Insurance", "Chemicals"], visaRate: 68, color: "from-rose-500 to-red-500" },
] as const

export function CityNetwork() {
  const [activeCity, setActiveCity] = useState<typeof cities[number]["id"]>(cities[0].id)

  const city = cities.find(c => c.id === activeCity)!

  return (
    <section id="city-network" className="section">
      <div className="container-xl">
        <motion.div variants={variants.scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-xs font-mono text-primary uppercase tracking-wider">STAGE 03</span>
          <h2 className="mt-4 text-4xl md:text-5xl font-display font-semibold tracking-tight text-neutral-0">City Hub & Regional Network</h2>
          <p className="mt-4 text-lg text-neutral-400">Explore Germany's top tech hubs. Real-time job signals, salary benchmarks in EUR, and visa sponsorship rates per city.</p>
        </motion.div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-12">
          {/* City Selector Sidebar */}
          <motion.div variants={variants.scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="sticky top-32 space-y-3">
            {cities.map((c) => (
              <motion.button
                key={c.id}
                variants={variants.staggerItem}
                onClick={() => setActiveCity(c.id)}
                className={cn(
                  "w-full text-left p-4 rounded-xl border transition-fast group",
                  activeCity === c.id
                    ? "surface-2 border-primary/50 bg-primary/5 shadow-[0_0_20px_rgba(108,198,212,0.15)]"
                    : "surface-1 border-white/5 hover:border-primary/30 hover:bg-primary/5"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br", c.color)}>
                    <c.icon size={20} className="text-neutral-0" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-semibold text-neutral-0 truncate">{c.name}</div>
                    <div className="text-xs text-neutral-400">{c.jobs.toLocaleString()} active positions</div>
                  </div>
                  {activeCity === c.id && <ArrowRight size={18} className="text-primary" />}
                </div>
              </motion.button>
            ))}
          </motion.div>

          {/* City Detail Panel */}
          <motion.div variants={variants.scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-8">
            <Card variant="elevated" padding="lg" className="relative overflow-hidden">
              <div className={cn("absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl opacity-20 -translate-x-1/2 translate-y-1/2 bg-gradient-to-br", city.color)} />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br", city.color)}>
                      <city.icon size={28} className="text-neutral-0" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-3xl text-neutral-0">{city.name}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-neutral-400">
                        <span className="flex items-center gap-1"><MapPin size={14} /> {city.jobs.toLocaleString()} jobs</span>
                        <span className="flex items-center gap-1"><TrendUp size={14} /> {city.avgSalary}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-neutral-400 mt-4 max-w-xl">Germany's leading hub for {city.topIndustries.slice(0, 3).join(", ")} and emerging tech. High international talent density with strong visa sponsorship infrastructure.</p>
                </div>
                <div className="flex items-center gap-4 surface-2 px-6 py-4 rounded-2xl border border-white/5">
                  <div className="text-center">
                    <div className="text-3xl font-display font-bold text-primary">{city.visaRate}%</div>
                    <div className="text-xs text-neutral-400">Visa Sponsorship Rate</div>
                  </div>
                  <div className="w-px h-12 bg-white/10" />
                  <div className="text-center">
                    <div className="text-3xl font-display font-bold text-neutral-0">{city.topIndustries.length}+</div>
                    <div className="text-xs text-neutral-400">Top Industries</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Industry Breakdown */}
            <Card variant="glass" padding="lg" className="relative">
              <h4 className="font-display font-semibold text-xl text-neutral-0 mb-6">Active Industries & Job Signals</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {city.topIndustries.map((industry, i) => (
                  <motion.div
                    key={industry}
                    variants={variants.staggerItem}
                    className="surface-1 p-4 rounded-xl border border-white/5 group hover:border-primary/30 transition-fast"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-neutral-0">{industry}</span>
                      <ArrowRight size={16} className="text-neutral-500 group-hover:text-primary transition-transform group-hover:translate-x-1" />
                    </div>
                    <div className="text-sm text-neutral-400">~{Math.floor(city.jobs / city.topIndustries.length * (1 + i * 0.15)).toLocaleString()} openings</div>
                  </motion.div>
                ))}
              </div>
            </Card>

            {/* Nearby Cities Quick Links */}
            <Card variant="glass" padding="lg" className="relative">
              <h4 className="font-display font-semibold text-xl text-neutral-0 mb-6">Nearby Hubs</h4>
              <div className="flex flex-wrap gap-3">
                {cities.filter(c => c.id !== activeCity).slice(0, 3).map(c => (
                  <motion.button
                    key={c.id}
                    variants={variants.staggerItem}
                    onClick={() => setActiveCity(c.id)}
                    className="surface-1 px-4 py-2 rounded-xl border border-white/5 hover:border-primary/30 hover:bg-primary/5 transition-fast flex items-center gap-2 group"
                  >
                    <c.icon size={16} className="text-primary" />
                    <span className="font-medium text-neutral-0">{c.name}</span>
                    <span className="text-xs text-neutral-400 font-mono">{c.jobs.toLocaleString()} jobs</span>
                  </motion.button>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}