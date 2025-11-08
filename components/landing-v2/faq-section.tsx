"use client"

import { useState } from "react"

interface FAQItem {
  question: string
  answer: string
}

const faqData: FAQItem[] = [
  {
    question: "What if my parent isn't tech-savvy?",
    answer:
      "If they can use FaceTime, they can use HeritageWhisper. Just press the big red button and talk. We handle everything else. Plus, you get a free onboarding call with our team to walk them through it.",
  },
  {
    question: "How is this different from recording on my phone?",
    answer:
      "Our story system transcribes, organizes by date, extracts Lessons Learned, asks personalized follow-up questions, notifies family, and creates a beautiful timeline. It's like having a professional biographer in your pocket.",
  },
  {
    question: "Can I cancel and keep my stories?",
    answer:
      "Absolutely. You can download everything (audio, transcripts, photos) at any time. No lock-in. Your stories are yours forever, even if you cancel.",
  },
  {
    question: "Do you use my stories to train AI?",
    answer:
      "NEVER. Your stories are private and sacred. We will never use them for AI training, sell them, or share them. Ever. This is legally binding in our Terms of Service.",
  },
  {
    question: "What's the 'story system'?",
    answer:
      "Our smart technology that listens to your stories, finds gaps in your timeline, identifies people you've mentioned, and asks personalized questions to help you tell the full story. It's like having a thoughtful interviewer who actually pays attention.",
  },
  {
    question: "How many family members can access the stories?",
    answer:
      "Unlimited! Invite your kids, grandkids, siblings—everyone gets access and real-time notifications when new stories are added. No extra charge for family members.",
  },
  {
    question: "What if I want a printed book?",
    answer:
      "You can order a premium printed book anytime with all your stories, photos, and timeline. Your first book is included in your annual plan. Additional copies available at cost.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "We offer a 30-day money-back guarantee, which is even better than a trial. Start building your legacy, and if you're not completely satisfied, get a full refund—no questions asked.",
  },
]

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function FAQSection() {
  const [openItems, setOpenItems] = useState<number[]>([])

  const toggleItem = (index: number) => {
    setOpenItems((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]))
  }

  return (
    <div className="w-full flex justify-center items-start border-t border-[rgba(55,50,47,0.12)] py-16">
      <div className="flex-1 px-4 md:px-12 flex flex-col lg:flex-row justify-start items-start gap-6 lg:gap-12 max-w-[1060px]">
        {/* Left Column - Header */}
        <div className="w-full lg:flex-1 flex flex-col justify-center items-start gap-4 lg:py-5">
          <h2 className="w-full text-[#111827] font-semibold leading-tight md:leading-[44px] font-serif text-4xl tracking-tight">
            Common Questions
          </h2>
          <p className="w-full text-[#6B7280] text-lg font-normal leading-7 font-sans">
            Everything you need to know
            <br className="hidden md:block" />
            before you start
          </p>
        </div>

        {/* Right Column - FAQ Items */}
        <div className="w-full lg:flex-1 flex flex-col justify-center items-center">
          <div className="w-full flex flex-col">
            {faqData.map((item, index) => {
              const isOpen = openItems.includes(index)

              return (
                <div key={index} className="w-full border-b border-[rgba(73,66,61,0.16)] overflow-hidden">
                  <button
                    onClick={() => toggleItem(index)}
                    className="w-full min-h-[48px] px-5 py-[18px] flex justify-between items-center gap-5 text-left hover:bg-[rgba(73,66,61,0.02)] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded-lg"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${index}`}
                  >
                    <div className="flex-1 text-[#111827] text-lg font-medium leading-6 font-sans">
                      {item.question}
                    </div>
                    <div className="flex justify-center items-center flex-shrink-0">
                      <ChevronDownIcon
                        className={`w-6 h-6 text-[#6B7280] transition-transform duration-300 ease-in-out ${
                          isOpen ? "rotate-180" : "rotate-0"
                        }`}
                      />
                    </div>
                  </button>

                  <div
                    id={`faq-answer-${index}`}
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
                    aria-hidden={!isOpen}
                  >
                    <div className="px-5 pb-[18px] text-[#6B7280] text-lg font-normal leading-7 font-sans">
                      {item.answer}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
