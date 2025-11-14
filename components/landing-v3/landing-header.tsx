'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LandingHeader() {
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
      const headerOffset = 80 // Account for sticky header
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
    setIsMobileMenuOpen(false)
  }

  const navItems = [
    { label: 'Features', id: 'features' },
    { label: 'How It Works', id: 'how-it-works' },
    { label: 'Pricing', id: 'pricing' },
    { label: 'FAQ', id: 'faq' }
  ]

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white shadow-md'
            : 'bg-white/95 backdrop-blur-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <div className="flex items-center">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <Image
                  src="/final logo/logo-new.svg"
                  alt="HeritageWhisper"
                  width={240}
                  height={56}
                  className="h-10 md:h-14 w-auto"
                  priority
                />
              </button>
            </div>

            {/* Desktop Navigation and Actions */}
            <div className="hidden lg:flex items-center gap-8">
              <nav className="flex items-center gap-8">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </nav>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/auth/login')}
                  className="px-5 py-2 text-gray-700 hover:text-blue-600 font-semibold transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => router.push('/auth/register')}
                  className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Start Free
                </button>
              </div>
            </div>

            {/* Mobile Menu Button - Right Side */}
            <div className="lg:hidden flex items-center ml-auto">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-700 hover:text-blue-600 transition-colors"
                aria-label="Toggle menu"
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
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200 shadow-lg">
            <div className="px-6 py-4 space-y-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="block w-full text-left text-gray-700 hover:text-blue-600 font-medium py-2 transition-colors"
                >
                  {item.label}
                </button>
              ))}
              <div className="pt-4 space-y-3 border-t border-gray-200">
                <button
                  onClick={() => {
                    router.push('/auth/login')
                    setIsMobileMenuOpen(false)
                  }}
                  className="block w-full px-5 py-2.5 text-center text-gray-700 font-semibold border-2 border-gray-300 rounded-lg hover:border-blue-600 hover:text-blue-600 transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    router.push('/auth/register')
                    setIsMobileMenuOpen(false)
                  }}
                  className="block w-full px-5 py-2.5 bg-blue-600 text-white text-center font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md"
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
