'use client'

import { useState } from 'react'

const faqs = [
  {
    question: "What if my parent isn't tech-savvy?",
    answer: "HeritageWhisper is designed for simplicity. Large buttons, clear instructions, no passwords to remember. If they can make a phone call, they can record a story. Most users are recording within 2 minutes.",
  },
  {
    question: "How is this different from StoryWorth?",
    answer: "StoryWorth sends weekly email prompts and prints a book after 12 months. HeritageWhisper captures voice—not just text—with follow-up questions that draw out deeper memories. Your family can listen immediately, and there's no subscription.",
  },
  {
    question: "Can I share with my family?",
    answer: "Yes! Invite kids, grandkids, parents, aunts, uncles, nieces, nephews—anyone with stories to share. Each person gets their own recording space. Your family is notified when you add a new story, and they can submit questions or requests for new stories they'd love to hear.",
  },
  {
    question: "What happens to my recordings?",
    answer: "Your stories are encrypted and stored securely. You own them forever. No subscriptions, no expiration. Download anytime.",
  },
  {
    question: "Can I give this as a gift?",
    answer: "Absolutely. It's the perfect gift for milestone birthdays, holidays, or 'just because.' We'll help you set it up for your loved one.",
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="bg-[var(--hw-page-bg)] py-16 md:py-24 px-6 md:px-12">
      <div className="max-w-[800px] mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-[28px] md:text-[32px] font-semibold text-[var(--hw-primary)]">
            Questions families ask
          </h2>
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-[var(--hw-surface)] rounded-xl border border-[var(--hw-border-subtle)] overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full min-h-[60px] px-6 py-4 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--hw-primary)]"
              >
                <span className="text-lg font-medium text-[var(--hw-text-primary)] pr-4">
                  {faq.question}
                </span>
                <svg
                  className={`w-5 h-5 text-[var(--hw-primary)] flex-shrink-0 transition-transform duration-200 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {openIndex === index && (
                <div className="px-6 pb-5">
                  <p className="text-base text-[var(--hw-text-secondary)] leading-relaxed">
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
