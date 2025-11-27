export default function StakesSection() {
  return (
    <section className="relative bg-[var(--hw-section-bg)] py-16 md:py-24 px-6 md:px-12">
      {/* Subtle primary overlay for depth */}
      <div className="absolute inset-0 bg-[var(--hw-primary)] opacity-[0.05]" />

      <div className="relative max-w-[1140px] mx-auto text-center">
        <h2 className="text-[28px] md:text-[32px] font-semibold text-[var(--hw-primary)] mb-6">
          The stories we wish we had asked for
        </h2>

        {/* Large stat as watermark */}
        <div className="relative mb-8">
          <span className="absolute inset-0 flex items-center justify-center text-[120px] md:text-[180px] font-bold text-[var(--hw-primary)] opacity-[0.04] select-none pointer-events-none">
            10,000
          </span>
          <p className="relative text-lg text-[var(--hw-text-secondary)] leading-relaxed max-w-[60ch] mx-auto py-8">
            10,000 Americans turn 65 every day. With them are stories of first jobs, first loves,
            and lessons learned the hard way—waiting to be asked. The question isn't whether these
            memories matter. It's whether they'll be captured before they're gone.
          </p>
        </div>
      </div>
    </section>
  )
}
