'use client'

import { useState } from 'react'

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      question: 'How is this different from StoryWorth or Remento?',
      answer: 'They create books that end. We create living timelines that grow forever. When grandpa remembers something new next year, he adds it. Your kids get notified. The story continues.'
    },
    {
      question: 'Do I need to be tech-savvy?',
      answer: 'If you can FaceTime your grandkids, you can use HeritageWhisper. No typing. No apps to download. Just talking.'
    },
    {
      question: 'What about a physical book?',
      answer: 'You can export and print anytime. But ask yourself: will your grandkids read a book on their shelf, or stories on their phone during lunch break?'
    },
    {
      question: 'What if I run out of stories?',
      answer: 'You won\'t. Every day brings memories. Plus, family can submit questions. We suggest prompts based on your past stories. The well never runs dry.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes. Your stories are encrypted in transit and at rest. We use enterprise-grade infrastructure (Vercel + Supabase SOC 2 certified). We never sell or share your data. Ever.'
    },
    {
      question: 'Can I export all my stories?',
      answer: 'Absolutely. Download everything anytime in multiple formats. Your data, your control. No lock-in, no hassle.'
    },
    {
      question: 'What happens if I want to cancel?',
      answer: 'Cancel anytime, no questions asked. Your stories stay accessible (read-only). Reactivate whenever you want to add more or share with family again.'
    },
    {
      question: 'Do family members need accounts to listen?',
      answer: 'No. You can share via private link or they can create free accounts to get notifications when you add new stories. Their choice.'
    },
    {
      question: 'Can I edit stories after recording?',
      answer: 'Yes. Edit transcripts, add photos, update dates, or re-record entirely. Your memories evolve, so should your stories.'
    },
    {
      question: 'How many family members can I share with?',
      answer: 'Unlimited. Share with your entire family tree. Everyone gets instant access to new stories, no matter where they are.'
    }
  ]

  return (
    <section className="py-16 md:py-24 px-6 md:px-12 bg-white">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-200 mb-6">
            <span className="text-sm font-semibold text-blue-700">Common Questions</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
            Frequently Asked Questions
          </h2>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-md border border-stone-200 overflow-hidden hover:shadow-lg transition-all duration-200"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 md:px-8 py-6 text-left flex items-center justify-between gap-4 hover:bg-blue-50/50 transition-colors"
              >
                <span className="text-lg md:text-xl font-semibold text-gray-900 pr-4">
                  {faq.question}
                </span>
                <svg
                  className={`w-6 h-6 text-blue-600 flex-shrink-0 transition-transform duration-200 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {openIndex === index && (
                <div className="px-6 md:px-8 pb-6">
                  <p className="text-gray-600 text-lg leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
