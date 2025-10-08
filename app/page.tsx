"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { HelpCircle, ChevronDown, Play, Pause } from 'lucide-react';

const logoUrl = "/HW_logo_mic_clean.png";

export default function HomePage() {
  const router = useRouter();
  const [showRipple, setShowRipple] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [visibleTraits, setVisibleTraits] = useState<Set<number>>(new Set());
  const [showTypewriter, setShowTypewriter] = useState(false);
  const [showNeedHelp, setShowNeedHelp] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [confidenceBars, setConfidenceBars] = useState<Set<number>>(new Set());
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Enhanced floating character insights for full viewport coverage
  const floatingInsights = [
    { type: 'trait', content: '💪 Quiet Resilience (0.84)', class: 'float-diagonal-slow', position: 'top-[5%] left-[10%]' },
    { type: 'memory', content: '"The day I met your grandfather..."', class: 'float-horizontal', position: 'top-[15%] right-[5%]' },
    { type: 'trait', content: '❤️ Radical Forgiveness (0.92)', class: 'float-vertical', position: 'top-[25%] left-[70%]' },
    { type: 'memory', content: '"When courage meant staying..."', class: 'float-diagonal-reverse', position: 'top-[35%] left-[20%]' },
    { type: 'trait', content: '🎭 Duty vs Dreams (0.76)', class: 'float-horizontal-reverse', position: 'top-[45%] right-[15%]' },
    { type: 'memory', content: '"The secret I kept for 40 years..."', class: 'float-vertical-slow', position: 'top-[55%] left-[50%]' },
    { type: 'trait', content: '🌟 Sacred Rebel (0.68)', class: 'float-diagonal-slow', position: 'top-[65%] left-[80%]' },
    { type: 'memory', content: '"Why I chose forgiveness..."', class: 'float-horizontal', position: 'top-[75%] left-[10%]' },
    { type: 'trait', content: '👑 Legacy Builder (0.88)', class: 'float-vertical', position: 'top-[85%] right-[30%]' },
    { type: 'memory', content: '"What I learned from losing..."', class: 'float-diagonal-reverse', position: 'bottom-[10%] left-[40%]' },
    { type: 'trait', content: '🌱 Growth Mindset (0.79)', class: 'float-horizontal-reverse', position: 'bottom-[20%] right-[10%]' },
    { type: 'memory', content: '"The moment everything changed..."', class: 'float-vertical-slow', position: 'bottom-[30%] left-[60%]' }
  ];
  
  // Character traits with confidence scores for discovery preview
  const characterTraits: Array<{
    trait: string;
    emoji: string;
    confidence: number;
    decimal: string;
    emerging?: boolean;
  }> = [
    { trait: 'Resilience', emoji: '💪', confidence: 84, decimal: '0.84' },
    { trait: 'Forgiveness', emoji: '❤️', confidence: 92, decimal: '0.92' },
    { trait: 'Choices', emoji: '⚖️', confidence: 76, decimal: '0.76' },
    { trait: 'Duty vs Dreams', emoji: '🎭', confidence: 45, decimal: '0.45', emerging: true },
    { trait: 'Patient Endurance', emoji: '👑', confidence: 73, decimal: '0.73' }
  ];
  
  // Process steps with glassmorphism styles
  const processSteps = [
    {
      icon: '📱',
      title: 'Open on any phone',
      description: 'No downloads. Works everywhere.',
      gradient: 'from-amber-400/70 to-orange-500/70'
    },
    {
      icon: '🎤',
      title: 'Talk for 2 minutes',
      description: 'Our questions guide your story.',
      gradient: 'from-rose-400/70 to-pink-500/70'
    },
    {
      icon: '❤️',
      title: 'Share forever',
      description: 'Character insights + wisdom clips',
      gradient: 'from-purple-400/70 to-indigo-500/70'
    }
  ];
  
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // Trigger typewriter effect faster
    setTimeout(() => setShowTypewriter(true), 200);
    
    // Show help button after delay
    setTimeout(() => setShowNeedHelp(true), 5000);
    
    // Set up Intersection Observer for fade-up animations and confidence bars
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            
            // Animate confidence cards and their bars
            if (entry.target.classList.contains('confidence-card')) {
              const index = parseInt((entry.target as HTMLElement).dataset.index || '0');
              // Make the card visible
              setTimeout(() => {
                setVisibleTraits(prev => new Set(prev).add(index));
              }, index * 150);
              // Animate the confidence bar
              setTimeout(() => {
                setConfidenceBars(prev => new Set(prev).add(index));
              }, index * 200);
            }
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    
    // Observe all fade-up elements
    setTimeout(() => {
      document.querySelectorAll('.fade-up, .confidence-card').forEach(el => {
        observer.observe(el);
      });
    }, 100);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  const handleStartRecording = () => {
    setShowRipple(true);
    // Navigate to register page instead of recording directly
    // User will be redirected to timeline after login/registration
    router.push('/auth/register');
  };

  const handleStartFree = () => {
    router.push('/auth/register');
  };
  
  const handleNeedHelp = () => {
    router.push('/demo-timeline');
  };
  
  const handleScrollToNextSection = () => {
    const nextSection = document.querySelector('#process-section');
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-white overflow-x-hidden">

      {/* Sign In Button - Fixed Position Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => router.push('/auth/login')}
          className="bg-white/90 backdrop-blur-sm text-gray-700 px-6 py-3 rounded-lg font-semibold shadow-sm hover:shadow-md transition-all duration-300 hover:bg-white border border-gray-200"
          style={{fontFamily: 'Poppins, sans-serif'}}
        >
          Sign In
        </button>
      </div>

      {/* Hero Section */}
      <section className="min-h-screen relative flex items-center justify-center">
        <div className="relative z-10 flex flex-col items-center justify-center px-6 py-20">
          {/* Massive Hero Header */}
          <h1 className="text-5xl xs:text-6xl sm:text-7xl md:text-8xl lg:text-[6rem] xl:text-[10rem] text-center text-gray-800 mb-4 sm:mb-8 leading-tight px-4 animate-fade-in-up" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 700}}>
            <div className="block">Everyone has a story.</div>
          </h1>
          
          <h2 className="text-xl xs:text-2xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[8rem] text-center mb-6 px-4" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 800}}>
            <span className={`bg-gradient-to-r from-amber-600 to-rose-600 bg-clip-text text-transparent inline-block transition-all duration-1500 ease-out break-words ${
              showTypewriter ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
            }`}>
              We find your true self within them.
            </span>
          </h2>
          
          {/* Subtitle */}
          <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-gray-700 text-center mb-8 px-4" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 500, animation: 'fade-in-up 0.6s ease-out 300ms forwards'}}>
            Just talk. Our questions follow your memories and find the thread.
          </p>
          
          {/* Subtext - Simplified, no redundancy */}
          <div className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-gray-600 text-center mb-16 sm:mb-20 px-4" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 600, animation: 'fade-in-up 0.6s ease-out 400ms forwards'}}>
            <div className="block">2 minutes. Your voice. Their legacy.</div>
          </div>
          
          {/* Hero CTA with Multiple Ripples */}
          <button
            onClick={handleStartRecording}
            className="group relative"
            style={{animation: 'fade-in-up 0.6s ease-out 600ms forwards'}}
            data-testid="button-start-recording"
          >
            {/* Multiple Ripple Effects */}
            {showRipple && (
              <>
                <div className="absolute inset-0 bg-red-400 rounded-full opacity-30" style={{animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite'}} />
                <div className="absolute inset-0 bg-red-400 rounded-full opacity-30" style={{animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) 300ms infinite'}} />
                <div className="absolute inset-0 bg-red-400 rounded-full opacity-20" style={{animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) 600ms infinite'}} />
              </>
            )}
            
            {/* Button Content */}
            <div className="relative bg-gradient-to-r from-red-500 to-rose-500 text-white px-10 sm:px-14 py-8 sm:py-10 md:px-20 md:py-12 rounded-full shadow-2xl group-hover:shadow-3xl transform transition-all duration-300 group-hover:scale-105 border-4 border-white">
              <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl block" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 700}}>Start your first story</span>
              <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl mt-2 opacity-90 block" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 500}}>Just 2 minutes</span>
            </div>
          </button>
          
          
          {/* Scroll Indicator */}
          <button
            onClick={() => document.querySelector('#character-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="absolute bottom-8 animate-bounce p-2 hover:text-gray-600 transition-colors"
            aria-label="Scroll to next section"
            data-testid="button-scroll-down"
          >
            <ChevronDown className="w-8 h-8 text-gray-400" />
          </button>
        </div>
      </section>
      
      {/* Character Discovery Preview with Glassmorphism Cards - MOVED UP */}
      <section id="character-section" className="py-20 px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-center text-gray-800 mb-4 fade-up" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 700}}>
            After 5 conversations with Margaret, we discovered:
          </h2>
          <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-gray-600 text-center mb-4 fade-up" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 500, transitionDelay: '200ms'}}>
            Your character, rooted in real moments
          </p>
          <p className="text-xl sm:text-2xl text-gray-500 text-center mb-12 fade-up" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 400, transitionDelay: '300ms'}}>
            Every recording leaves clues. Our questions connect them and show the through-line.
          </p>
          
          {/* Glassmorphism Character Trait Cards with Confidence Bars */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {characterTraits.map((trait, index) => (
              <div
                key={index}
                data-index={index}
                className="character-card confidence-card relative transform transition-all duration-500 hover:scale-105 hover:-translate-y-1 shadow-xl hover:shadow-2xl group rounded-2xl overflow-hidden border-2 border-white/60"
                style={{ 
                  minHeight: '180px',
                  opacity: visibleTraits.has(index) ? 1 : 0,
                  transform: visibleTraits.has(index) ? 'translateY(0) scale(1)' : 'translateY(2rem) scale(0.95)',
                  transitionDelay: `${index * 150}ms`,
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 251, 247, 0.9))',
                  boxShadow: '0 4px 20px rgba(232, 93, 93, 0.08), 0 2px 8px rgba(0, 0, 0, 0.06)'
                }}
              >
                {/* Content */}
                <div className="trait relative p-6 h-full flex flex-col">
                  {/* Top section - emoji, trait name, and confidence score */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="icon text-3xl drop-shadow-lg transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12">{trait.emoji}</span>
                      <span className="text-gray-800 font-semibold text-base md:text-lg whitespace-nowrap transition-all duration-300 group-hover:tracking-wider">{trait.trait}</span>
                    </div>
                    <span className="confidence text-3xl text-gray-900 font-bold">
                      {trait.decimal}
                    </span>
                  </div>
                  
                  {/* Middle section - confidence label */}
                  <div className="mb-2">
                    <span className="text-xs text-gray-600 uppercase tracking-wider">
                      {trait.emerging ? 'Emerging Pattern' : 'Confidence Level'}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="meter w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="fill h-full rounded-full transition-all duration-1000 ease-out group-hover:shadow-lg bg-gradient-to-r from-amber-400 to-rose-400"
                        style={{
                          width: confidenceBars.has(index) ? `${trait.confidence}%` : '0%',
                          transitionDelay: `${index * 100}ms`
                        }}
                        data-confidence={`${trait.confidence}%`}
                      />
                    </div>
                  </div>
                  
                  {/* Bottom section - Listen to evidence link */}
                  <div className="mt-auto">
                    <button 
                      onClick={() => {
                        const moments = [
                          `[Conversation 2, 3:45] "When my father was dying, I realized that forgiveness wasn't weakness—it was the strongest thing I could do."`,
                          `[Conversation 3, 1:12] "I held onto that pain for 20 years before understanding it was holding me back."`,
                          `[Conversation 5, 2:33] "My children taught me that love means letting go of who I thought I should be."`
                        ];
                        const sampleTranscript = `${trait.emoji} ${trait.trait} Pattern Detected\n\nMoments from Margaret's stories:\n\n${moments.join('\n\n')}\n\nConfidence Score: ${trait.decimal}\n\nThis pattern appeared across multiple conversations, revealing a consistent character trait.`;
                        alert(sampleTranscript);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-semibold inline-flex items-center gap-1 transition-colors duration-200 cursor-pointer"
                    >
                      <span>Hear yourself →</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Caption after trait cards */}
          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 text-center mt-8 fade-up" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 500, transitionDelay: '800ms'}}>
            Traits only appear when we can point to them in your conversations.
          </p>

          {/* Sample Insight */}
          <div className="mt-16 text-center fade-up" style={{transitionDelay: '1000ms'}}>
            <div className="bg-white/90 rounded-3xl p-8 px-12 max-w-5xl mx-auto border border-gray-200/30 shadow-xl">
              <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl italic text-gray-700 leading-relaxed" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontStyle: 'italic', wordSpacing: '0.1em', letterSpacing: '0.01em'}}>
                "I never knew I had such quiet strength until I heard it in my own words"
              </p>
              <p className="text-xl sm:text-2xl md:text-3xl text-gray-500 mt-4" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 400}}>
                — Margaret, 74, after 5 conversations
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* PROMINENT WISDOM CLIP DEMO SECTION - EMOTIONAL PAYOFF */}
      <section className="py-24 px-6 relative z-10 bg-gradient-to-br from-purple-50 via-pink-50 to-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl text-center text-gray-800 mb-6 fade-up" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 800}}>
            The Wisdom Within
          </h2>
          <p className="text-3xl sm:text-4xl md:text-5xl text-gray-600 text-center mb-16 fade-up" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 600, transitionDelay: '200ms'}}>
            Every life contains profound moments worth preserving
          </p>
          
          {/* Large, Prominent Audio Player with Waveform */}
          <div className="bg-white/98 backdrop-blur-lg rounded-3xl shadow-2xl p-10 md:p-12 max-w-4xl mx-auto border-2 border-purple-200/50 fade-up transform hover:scale-[1.02] transition-all duration-300" style={{transitionDelay: '400ms'}}>
            {/* Label */}
            <div className="text-center mb-6">
              <span className="inline-block px-6 py-3 bg-purple-100 text-purple-700 rounded-full text-xl font-bold" style={{fontFamily: 'Poppins, sans-serif'}}>
                🎧 10-Second Wisdom Clip
              </span>
            </div>
            
            <div className="flex items-center justify-between mb-8">
              {/* Large Play Button */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl hover:shadow-3xl transform transition-all duration-300 hover:scale-110 pulse-shadow"
                data-testid="button-play-wisdom"
              >
                {isPlaying ? (
                  <Pause className="w-10 h-10 md:w-12 md:h-12 text-white" />
                ) : (
                  <Play className="w-10 h-10 md:w-12 md:h-12 text-white ml-2" />
                )}
              </button>
              
              {/* Large Animated Waveform */}
              <div className="flex items-center gap-1 md:gap-[3px] flex-1 mx-8 h-20 md:h-24">
                {Array.from({ length: 40 }).map((_, i) => {
                  const heights = [20, 35, 45, 65, 80, 95, 85, 70, 90, 100, 95, 85, 70, 80, 90, 95, 100, 90, 80, 65, 70, 85, 95, 90, 80, 65, 45, 35, 50, 65, 80, 70, 55, 40, 30, 25, 20, 15, 10, 8];
                  return (
                  <div
                    key={i}
                    className={`bg-gradient-to-t from-purple-400 to-pink-400 rounded-full transition-all duration-300 ${isPlaying ? 'animate-pulse' : ''}`}
                    style={{
                      width: '4px',
                      height: `${heights[i] || 40}%`,
                      animation: isPlaying ? `waveform ${0.8 + (i % 10) * 0.1}s ease-in-out infinite` : 'none',
                      animationDelay: `${i * 0.05}s`,
                      transform: isPlaying ? 'scaleY(1.2)' : 'scaleY(1)'
                    }}
                  />);
                })}
              </div>
              
              <span className="text-gray-600 text-xl font-semibold" style={{fontFamily: 'Poppins, sans-serif'}}>0:10</span>
            </div>
            
            {/* Powerful Quote Display - LARGE AND PROMINENT */}
            <div className="text-center bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100">
              <blockquote className="text-3xl sm:text-4xl md:text-5xl italic text-gray-800 leading-relaxed font-medium mb-6" style={{fontFamily: 'Playfair Display, serif'}}>
                "The quiet moments taught me more than the loud ones ever could."
              </blockquote>
              <p className="text-2xl sm:text-3xl text-gray-600 font-semibold" style={{fontFamily: 'Poppins, sans-serif'}}>
                — Margaret, 74
              </p>
            </div>
          </div>
          
          <p className="text-xl sm:text-2xl text-gray-600 text-center mt-8 fade-up" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 400, transitionDelay: '600ms'}}>
            These clips become treasures for your family to keep forever
          </p>
        </div>
      </section>
      
      {/* Three-Step Process Section - Simplified, No Redundancy */}
      <section id="process-section" className="py-20 px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-center text-gray-800 mb-2 fade-up" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 700}}>
            How it works
          </h2>
          <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-gray-600 text-center mb-16 fade-up" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 500, transitionDelay: '200ms'}}>
            Technology that disappears so wisdom can appear
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 place-items-center">
            {processSteps.map((step, index) => (
              <div key={index} className="flex flex-col items-center text-center group fade-up" style={{ animationDelay: `${400 + index * 200}ms` }}>
                <div className="relative mb-6">
                  {/* Process chip with proper sizing */}
                  <div className="process-circle">
                    <span className="icon">{step.icon}</span>
                  </div>
                </div>
                <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-gray-800 mb-1 text-center" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 700}}>{step.title}</h3>
                <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-gray-600 text-center" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 400}}>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Final CTA Section */}
      <section className="py-20 px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl text-gray-800 mb-6 fade-up" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 700}}>
            Three generations will thank you.
          </h2>
          <p className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-gray-600 mb-12 text-center fade-up" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 600, transitionDelay: '200ms'}}>
            Record your wisdom today.
          </p>
          
          <button
            onClick={handleStartFree}
            className="fade-up bg-gradient-to-r from-amber-500 to-rose-500 text-white px-16 py-8 md:px-20 md:py-10 rounded-full text-3xl sm:text-4xl md:text-5xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 border-4 border-white"
            style={{transitionDelay: '400ms', fontFamily: 'Poppins, sans-serif', fontWeight: 700}}
            data-testid="button-start-free"
          >
            Start your first story
          </button>
          
          <p className="mt-8 mb-20 text-gray-500 text-xl sm:text-2xl md:text-3xl text-center fade-up" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 500, transitionDelay: '600ms'}}>
            No credit card required • Cancel anytime
          </p>
        </div>
      </section>
      
      {/* Footer with Logo */}
      <footer className="relative z-10 py-16 px-6 bg-gradient-to-t from-amber-50 to-transparent">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <img 
            src={logoUrl} 
            alt="HeritageWhisper - Voice-first storytelling for families" 
            className="w-80 sm:w-96 md:w-[28rem] max-w-full mb-6 fade-up"
            style={{ height: 'auto', maxHeight: '120px', objectFit: 'scale-down' }}
          />
          <p className="text-gray-600 text-center text-lg fade-up" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 400, transitionDelay: '200ms'}}>
            © 2025 HeritageWhisper. Preserving wisdom, one story at a time.
          </p>
        </div>
      </footer>
      
      {/* Add keyframe animation for waveform */}
      <style>{`
        @keyframes waveform {
          0%, 100% { transform: scaleY(0.5); }
          50% { transform: scaleY(1); }
        }
      `}</style>
      
      {/* Floating Help Button - Positioned on Right Side */}
      {showNeedHelp && (
        <div className="fixed bottom-8 right-6 z-50 animate-slide-in-right">
          <div className="relative">
            {/* Tooltip */}
            {tooltipVisible && (
              <div className="absolute bottom-full right-0 mb-2 px-4 py-3 bg-gray-800 text-white text-sm rounded-lg whitespace-nowrap shadow-xl">
                See a demo
                <div className="absolute bottom-0 right-6 transform translate-y-1/2 rotate-45 w-3 h-3 bg-gray-800" />
              </div>
            )}
            
            {/* Button */}
            <button
              onClick={handleNeedHelp}
              onMouseEnter={() => setTooltipVisible(true)}
              onMouseLeave={() => setTooltipVisible(false)}
              className="bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300"
              data-testid="button-help"
              aria-label="See a demo"
            >
              <HelpCircle className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}