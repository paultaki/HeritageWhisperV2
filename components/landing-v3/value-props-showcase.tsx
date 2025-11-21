'use client'

// Fallback images (placeholder data URIs)
const IMAGES = {
  timeline: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600"%3E%3Crect fill="%23f5f5f4" width="400" height="600"/%3E%3C/svg%3E',
  book: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000"%3E%3Crect fill="%23f5f5f4" width="1600" height="1000"/%3E%3C/svg%3E',
  memoryBox: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600"%3E%3Crect fill="%23f5f5f4" width="400" height="600"/%3E%3C/svg%3E'
};

export default function ValuePropsShowcase() {
  return (
    <section className="py-16 md:py-24 px-6 md:px-12 bg-heritage-warm-paper">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-sm rounded-full border border-heritage-deep-slate/10 shadow-sm mb-6">
            <span className="text-sm font-semibold text-heritage-deep-slate tracking-wide">Premium Experience</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-heritage-text-primary leading-tight">
            Three Ways to Experience Your Legacy
          </h2>
        </div>

        {/* Product Gallery Composite */}
        <div className="relative mt-12 max-w-7xl mx-auto">
          {/* Background decorative elements */}
          <div className="absolute -inset-4 bg-gradient-to-b from-heritage-warm-paper/0 to-heritage-warm-paper/50 rounded-[3rem] -z-10"></div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">

            {/* Left Card: Timeline (Vertical) */}
            <div className="md:col-span-3 transform translate-y-0 md:translate-y-8 transition-transform hover:-translate-y-2 duration-500 relative group">
              <div className="bg-white p-2 rounded-xl shadow-xl border border-heritage-deep-slate/10 h-full">
                <div className="relative overflow-hidden rounded-lg h-[320px] md:h-[420px] bg-heritage-warm-paper">
                  {/* Object-top is crucial here for the long vertical timeline image */}
                  <img
                    src="/images/timeline-hero.webp"
                    alt="Timeline Interface"
                    className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => e.currentTarget.src = IMAGES.timeline}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10 pointer-events-none"></div>
                </div>
                <div className="p-3 text-center absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur shadow-md rounded-lg border border-heritage-deep-slate/5">
                  <h3 className="font-serif text-heritage-text-primary font-bold text-sm">The Timeline</h3>
                  <p className="text-xs text-heritage-text-primary/60 hidden xl:block">Every story in order</p>
                </div>
              </div>
            </div>

            {/* Center Card: Book View (Landscape/Wide) */}
            <div className="md:col-span-6 z-20 transform transition-transform hover:scale-[1.02] duration-500">
              <div className="bg-white p-3 rounded-2xl shadow-2xl border border-heritage-deep-slate/10">
                <div className="relative overflow-hidden rounded-xl bg-heritage-warm-paper aspect-[16/10]">
                  <img
                    src="/images/book-view.png"
                    alt="Book View Interface"
                    className="w-full h-full object-cover"
                    onError={(e) => e.currentTarget.src = IMAGES.book}
                  />
                </div>
                <div className="p-4 text-center border-t border-heritage-deep-slate/5 mt-2">
                  <h3 className="font-serif text-xl text-heritage-text-primary font-bold">The Living Book</h3>
                  <p className="text-sm text-heritage-text-primary/60 mt-1">Grows automatically with every memory you share.</p>
                </div>
              </div>
            </div>

            {/* Right Card: Memory Box (Grid) */}
            <div className="md:col-span-3 transform translate-y-0 md:translate-y-8 transition-transform hover:-translate-y-2 duration-500 relative group">
              <div className="bg-white p-2 rounded-xl shadow-xl border border-heritage-deep-slate/10 h-full">
                <div className="relative overflow-hidden rounded-lg h-[320px] md:h-[420px] bg-heritage-warm-paper">
                  <img
                    src="/images/memory-box.webp"
                    alt="Memory Box Interface"
                    className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => e.currentTarget.src = IMAGES.memoryBox}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10 pointer-events-none"></div>
                </div>
                <div className="p-3 text-center absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur shadow-md rounded-lg border border-heritage-deep-slate/5">
                  <h3 className="font-serif text-heritage-text-primary font-bold text-sm">Memory Box</h3>
                  <p className="text-xs text-heritage-text-primary/60 hidden xl:block">Keepsakes & loose photos</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
