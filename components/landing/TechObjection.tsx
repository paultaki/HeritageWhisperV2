const steps = [
  {
    icon: (
      <svg className="w-10 h-10 text-[var(--hw-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
      </svg>
    ),
    label: 'Open the Website',
  },
  {
    icon: (
      <svg className="w-10 h-10 text-[var(--hw-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9.563C9 9.252 9.252 9 9.563 9h4.874c.311 0 .563.252.563.563v4.874c0 .311-.252.563-.563.563H9.564A.562.562 0 019 14.437V9.564z" />
      </svg>
    ),
    label: 'Tap Record',
  },
  {
    icon: (
      <svg className="w-10 h-10 text-[var(--hw-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3.75v16.5M15.75 3.75v16.5" />
      </svg>
    ),
    label: 'Say What Matters',
  },
  {
    icon: (
      <svg className="w-10 h-10 text-[var(--hw-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
    label: 'Family Hears Your Voice',
  },
]

export default function TechObjection() {
  return (
    <section className="bg-[var(--hw-section-bg)] py-16 md:py-24 px-6 md:px-12">
      <div className="max-w-[1140px] mx-auto text-center">
        {/* Header */}
        <h2 className="text-[28px] md:text-[32px] font-semibold text-[var(--hw-primary)] mb-12 md:mb-16">
          So Simple, Grandma Figured It Out in 2 Minutes
        </h2>

        {/* Four-step flow */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-4 mb-12">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              {/* Step */}
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-[var(--hw-surface)] border border-[var(--hw-border-subtle)] flex items-center justify-center shadow-sm">
                  {step.icon}
                </div>
                <span className="mt-3 text-base font-medium text-[var(--hw-text-primary)]">
                  {step.label}
                </span>
              </div>

              {/* Connector arrow (not after last item) */}
              {index < steps.length - 1 && (
                <svg
                  className="hidden md:block w-8 h-8 text-[var(--hw-border-subtle)] mx-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              )}
            </div>
          ))}
        </div>

        {/* Subtext */}
        <p className="text-base md:text-lg text-[var(--hw-text-secondary)] max-w-[50ch] mx-auto">
          Just press record and talk. Easily invite family members to see and hear your stories.
        </p>
      </div>
    </section>
  )
}
