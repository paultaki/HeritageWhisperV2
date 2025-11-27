import Link from 'next/link'

const navLinks = [
  { href: '#how-it-works', label: 'Features' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#founder-story', label: 'Our Story' },
  { href: '#faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
]

const legalLinks = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
]

export default function Footer() {
  return (
    <footer className="bg-[var(--hw-primary)] py-12 px-6 md:px-12">
      {/* Gold accent line at top */}
      <div className="max-w-[1140px] mx-auto mb-10">
        <div className="h-px bg-gradient-to-r from-transparent via-[var(--hw-accent-gold)] to-transparent opacity-30" />
      </div>

      <div className="max-w-[1140px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          {/* Logo */}
          <div className="text-white">
            <span className="text-xl font-semibold tracking-tight">
              <span className="font-bold">HERITAGE</span>Whisper
            </span>
          </div>

          {/* Nav Links */}
          <nav className="flex flex-wrap gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-white/80 hover:text-white text-base transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom row */}
        <div className="mt-10 pt-8 border-t border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Legal Links */}
          <div className="flex gap-6">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-white/60 hover:text-white/80 text-sm transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Copyright */}
          <p className="text-white/60 text-sm">
            © {new Date().getFullYear()} HeritageWhisper. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
