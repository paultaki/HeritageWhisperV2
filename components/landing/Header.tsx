'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const navItems = [
  { label: 'Features', id: 'how-it-works' },
  { label: 'How It Works', id: 'how-it-works' },
  { label: 'Pricing', id: 'pricing' },
  { label: 'Gift', id: 'gift', href: '/gift' },
  { label: 'FAQ', id: 'faq' },
]

export default function Header() {
  const router = useRouter()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const headerOffset = 80
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })
    }
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-[var(--hw-surface)] shadow-md'
            : 'bg-[rgba(247,242,236,0.95)] backdrop-blur-sm'
        }`}
      >
        <div className="max-w-[1140px] mx-auto px-6 md:px-12">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-[var(--hw-primary)] rounded"
            >
              <Image
                src="/final logo/logo-new.svg"
                alt="HeritageWhisper"
                width={240}
                height={56}
                className="h-10 md:h-14 w-auto"
                style={{ width: 'auto' }}
                priority
              />
            </button>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              <nav className="flex items-center gap-8">
                {navItems.map((item) => (
                  <button
                    key={item.id + item.label}
                    onClick={() => item.href ? router.push(item.href) : scrollToSection(item.id)}
                    className="text-[var(--hw-text-secondary)] hover:text-[var(--hw-primary)] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--hw-primary)] rounded px-2 py-1"
                  >
                    {item.label}
                  </button>
                ))}
              </nav>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/auth/login')}
                  className="px-5 py-2 text-[var(--hw-text-secondary)] hover:text-[var(--hw-primary)] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--hw-primary)] rounded"
                >
                  Login
                </button>
                <button
                  onClick={() => router.push('/auth/register')}
                  className="min-h-[48px] px-6 py-2.5 bg-[var(--hw-primary)] text-white font-medium rounded-xl hover:bg-[var(--hw-primary-hover)] transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--hw-primary)]"
                >
                  Start Free
                </button>
              </div>
            </div>

            {/* Mobile Menu Button - explicitly positioned right */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden ml-auto p-2 min-h-[44px] flex items-center justify-end text-[var(--hw-text-primary)] hover:text-[var(--hw-primary)] active:text-[var(--hw-primary)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hw-primary)] rounded-lg"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-[var(--hw-surface)] border-t border-[var(--hw-border-subtle)] shadow-lg">
            <div className="px-6 py-4 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id + item.label}
                  onClick={() => {
                    if (item.href) {
                      router.push(item.href)
                    } else {
                      scrollToSection(item.id)
                    }
                    setIsMobileMenuOpen(false)
                  }}
                  className="block w-full text-left text-[var(--hw-text-primary)] hover:text-[var(--hw-primary)] font-medium py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--hw-primary)] rounded"
                >
                  {item.label}
                </button>
              ))}
              <div className="pt-4 space-y-3 border-t border-[var(--hw-border-subtle)]">
                <button
                  onClick={() => {
                    router.push('/auth/login')
                    setIsMobileMenuOpen(false)
                  }}
                  className="block w-full min-h-[48px] px-5 py-3 text-center text-[var(--hw-text-primary)] font-medium border border-[var(--hw-border-subtle)] rounded-xl hover:bg-[var(--hw-section-bg)] transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--hw-primary)]"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    router.push('/auth/register')
                    setIsMobileMenuOpen(false)
                  }}
                  className="block w-full min-h-[48px] px-5 py-3 bg-[var(--hw-primary)] text-white text-center font-medium rounded-xl hover:bg-[var(--hw-primary-hover)] transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--hw-primary)]"
                >
                  Start Free
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Spacer to prevent content from going under fixed header */}
      <div className="h-16 md:h-20" />
    </>
  )
}
