import { Header } from "./components/shell/header"
import { Footer } from "./components/shell/footer"
import { HeroSection } from "./components/landing/hero-section"
import { CVIntelligence } from "./components/landing/cv-intelligence"
import { GermanyEngine } from "./components/landing/germany-engine"
import { CityNetwork } from "./components/landing/city-network"
import { AIMatchMatrix } from "./components/landing/ai-match-matrix"
import { ApplicationStudio } from "./components/landing/application-studio"
import { CommandTracker } from "./components/landing/command-tracker"
import { CTASection } from "./components/landing/cta-section"
import { ScrollProgressRail } from "./components/motion/scroll-progress-rail"

function App() {
  return (
    <div className="min-h-screen surface-0 text-foreground font-body selection:bg-primary/30">
      <Header />
      <ScrollProgressRail />
      <main>
        <HeroSection />
        <CVIntelligence />
        <GermanyEngine />
        <CityNetwork />
        <AIMatchMatrix />
        <ApplicationStudio />
        <CommandTracker />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}

export default App