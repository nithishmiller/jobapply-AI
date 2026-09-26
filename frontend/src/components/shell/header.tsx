"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { List, X } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navItems = ["CV Intelligence", "Germany Jobs", "AI Match", "Tracker"] as const

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
      {/* Scroll progress indicator at top */}
      <div className="fixed top-0 left-0 right-0 z-[200] h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-70" />

      <header className={cn("fixed top-4 left-1/2 -translate-x-1/2 z-sticky w-[calc(100%-2rem)] max-w-[var(--container-xl)] transition-all duration-300", scrolled && "top-2")}>
        <div className="surface-1 backdrop-blur-md rounded-xl border border-white/10 px-6 py-3 flex items-center justify-between transition-all duration-300">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-xl tracking-tight text-neutral-0">JobApply<span className="text-primary">.AI</span></span>
            <div className="size-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
          </div>
          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, "-")}`} className="text-sm font-medium text-neutral-400 hover:text-neutral-0 transition-fast">{item}</a>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 surface-2 rounded-full border border-white/5">
               <span className="text-[10px] font-bold text-primary">DE</span>
               <div className="w-px h-3 bg-white/10" />
               <span className="text-[10px] font-bold text-neutral-400">EN</span>
            </div>
            <Button size="sm" className="hidden sm:flex">Get Started</Button>
            <button
              className="lg:hidden text-neutral-0 p-2 -ml-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X size={24} /> : <List size={24} />}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="surface-1 backdrop-blur-md mt-2 rounded-xl border border-white/10 overflow-hidden lg:hidden"
            >
              <nav className="px-6 py-4 flex flex-col gap-3">
                {navItems.map(item => (
                  <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, "-")}`} className="text-base font-medium text-neutral-0 py-2" onClick={() => setIsMobileMenuOpen(false)}>{item}</a>
                ))}
                <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 surface-2 rounded-full border border-white/5 w-fit">
                    <span className="text-[10px] font-bold text-primary">DE</span>
                    <div className="w-px h-3 bg-white/10" />
                    <span className="text-[10px] font-bold text-neutral-400">EN</span>
                  </div>
                  <Button className="w-full" size="sm">Get Started</Button>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  )
}