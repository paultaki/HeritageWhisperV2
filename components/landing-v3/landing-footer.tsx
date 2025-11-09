'use client'

import { useRouter } from 'next/navigation'

export default function LandingFooter() {
  const router = useRouter()

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const headerOffset = 80
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  return (
    <footer className="bg-gradient-to-b from-gray-50 to-gray-100 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-20">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Column 1: Product */}
          <div className="space-y-4">
            <h3 className="text-gray-900 font-bold text-lg mb-4">Product</h3>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="block text-gray-600 hover:text-blue-600 transition-colors"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="block text-gray-600 hover:text-blue-600 transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="block text-gray-600 hover:text-blue-600 transition-colors"
            >
              Pricing
            </button>
          </div>

          {/* Column 2: Company */}
          <div className="space-y-4">
            <h3 className="text-gray-900 font-bold text-lg mb-4">Company</h3>
            <button
              onClick={() => scrollToSection('founder-story')}
              className="block text-gray-600 hover:text-blue-600 transition-colors"
            >
              Founder Story
            </button>
            <button
              onClick={() => router.push('/privacy')}
              className="block text-gray-600 hover:text-blue-600 transition-colors"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => router.push('/terms')}
              className="block text-gray-600 hover:text-blue-600 transition-colors"
            >
              Terms of Service
            </button>
          </div>

          {/* Column 3: Support */}
          <div className="space-y-4">
            <h3 className="text-gray-900 font-bold text-lg mb-4">Support</h3>
            <button
              onClick={() => router.push('/help')}
              className="block text-gray-600 hover:text-blue-600 transition-colors"
            >
              Help Center
            </button>
            <a
              href="mailto:support@heritagewhisper.com"
              className="block text-gray-600 hover:text-blue-600 transition-colors"
            >
              support@heritagewhisper.com
            </a>
          </div>

          {/* Column 4: Trust Badges */}
          <div className="space-y-4">
            <h3 className="text-gray-900 font-bold text-lg mb-4">Trust & Security</h3>

            <div className="space-y-3">
              {/* No apps to download */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 text-blue-600">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">No apps to download</div>
                  <div className="text-xs text-gray-600">Works in your browser instantly</div>
                </div>
              </div>

              {/* SSL Encrypted */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 text-blue-600">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">SSL Encrypted</div>
                  <div className="text-xs text-gray-600">Bank-level security</div>
                </div>
              </div>

              {/* Grandma-tested */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 text-blue-600">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Grandma-tested simplicity</div>
                  <div className="text-xs text-gray-600">If you can text, you can use this</div>
                </div>
              </div>

              {/* Powered by Vercel */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 text-blue-600">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Powered by Vercel</div>
                  <div className="text-xs text-gray-600">Enterprise infrastructure</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-300">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 text-sm text-center md:text-left">
              © 2025 HeritageWhisper. All rights reserved.
            </p>
            <p className="text-gray-500 text-sm text-center md:text-right italic">
              Built by family, for families preserving memories.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
