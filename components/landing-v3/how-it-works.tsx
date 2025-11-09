export default function HowItWorks() {
  const steps = [
    {
      number: 1,
      title: 'Open on Your Phone',
      description: 'No app download. Works instantly. Use your fingerprint to login.',
      icon: '📱'
    },
    {
      number: 2,
      title: 'Talk for 2-5 Minutes',
      description: 'Answer a prompt or tell any story. AI transcribes perfectly.',
      icon: '🎙️'
    },
    {
      number: 3,
      title: 'AI Finds the Wisdom',
      description: '"What I learned was..." Every story automatically reveals the lesson within.',
      icon: '✨'
    },
    {
      number: 4,
      title: 'Family Gets Notified',
      description: '"Dad just shared: The day he met mom" They listen instantly, anywhere.',
      icon: '🔔'
    }
  ]

  return (
    <section className="py-16 md:py-24 px-6 md:px-12 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-200 mb-6">
            <span className="text-sm font-semibold text-blue-700">How It Works</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            So Simple, Grandma Figured It Out in 2 Minutes
          </h2>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connection lines (desktop only) */}
          <div className="hidden lg:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200 opacity-30"
               style={{ width: 'calc(100% - 8rem)', left: '4rem' }}
          />

          {steps.map((step, index) => (
            <div key={index} className="relative h-full">
              {/* Step card */}
              <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-8 shadow-lg border border-stone-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative z-10 h-full flex flex-col">
                {/* Number badge */}
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                  {step.number}
                </div>

                {/* Icon */}
                <div className="text-5xl mb-4 mt-2">{step.icon}</div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
