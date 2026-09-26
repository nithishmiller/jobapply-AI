import { GithubLogo, TwitterLogo, LinkedinLogo } from "@phosphor-icons/react"

export function Footer() {
  const columns = {
    product: ["CV Intelligence", "Germany Jobs", "AI Matching", "Application Studio", "Command Tracker"],
    company: ["About", "Blog", "Careers", "Press", "Contact"],
    legal: ["Impressum", "Datenschutz", "Terms", "Cookie Policy"],
    resources: ["Help Center", "API Docs", "Community", "Status"],
  }

  return (
    <footer className="section surface-0 border-t border-white/5">
      <div className="container-xl grid grid-cols-2 md:grid-cols-5 gap-12 px-6">
        <div className="col-span-2 md:col-span-1 space-y-4">
          <span className="font-display font-bold text-xl text-neutral-0">JobApply<span className="text-primary">.AI</span></span>
          <p className="text-sm text-neutral-400 leading-relaxed">Germany's #1 AI Application Engine for technical careers.</p>
        </div>
        {Object.entries(columns).map(([key, items]) => (
          <nav key={key} className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary">{key.charAt(0).toUpperCase() + key.slice(1)}</h4>
            <ul className="space-y-2">
              {items.map(item => (
                <li key={item}>
                  <a href="#" className="text-sm text-neutral-500 hover:text-neutral-0 transition-fast">{item}</a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 px-6 text-xs text-neutral-500">
        <span>© 2026 JobApply AI. German Privacy Standard. EU GDPR Compliant.</span>
        <div className="flex items-center gap-8">
          <a href="#" className="hover:text-primary transition-fast" aria-label="GitHub">
            <GithubLogo size={18} />
          </a>
          <a href="#" className="hover:text-primary transition-fast" aria-label="Twitter">
            <TwitterLogo size={18} />
          </a>
          <a href="#" className="hover:text-primary transition-fast" aria-label="LinkedIn">
            <LinkedinLogo size={18} />
          </a>
        </div>
      </div>
    </footer>
  )
}