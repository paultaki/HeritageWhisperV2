'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface YearScrubberProps {
  decades: string[];
  onSelectDecade: (decade: string) => void;
}

export default function YearScrubber({ decades, onSelectDecade }: YearScrubberProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentDecade, setCurrentDecade] = useState(decades[0] || '');

  // Update current decade based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      // Find which decade section is currently in view
      decades.forEach((decade) => {
        const element = document.querySelector(`[data-decade="${decade}"]`);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top >= 0 && rect.top <= window.innerHeight / 2) {
            setCurrentDecade(decade);
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [decades]);

  const handleDecadeClick = (decade: string) => {
    setCurrentDecade(decade);
    onSelectDecade(decade);
    setIsExpanded(false);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div 
      className="fixed right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col items-end gap-2"
      style={{ touchAction: 'manipulation' }}
    >
      {/* Collapsed state: Current year pill (60px tall for seniors) */}
      {!isExpanded && (
        <button
          onClick={toggleExpanded}
          className="bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-full shadow-md transition-all flex items-center justify-center gap-2 px-4"
          style={{ 
            height: '60px', 
            minWidth: '60px',
            fontSize: '16px'
          }}
          aria-label="Open year navigation"
        >
          <span>{currentDecade}</span>
          <ChevronUp className="w-5 h-5" />
        </button>
      )}

      {/* Expanded state: Decade list */}
      {isExpanded && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Close button */}
          <button
            onClick={toggleExpanded}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-all flex items-center justify-center gap-2 px-4"
            style={{ 
              height: '60px',
              fontSize: '16px'
            }}
            aria-label="Close year navigation"
          >
            <span>{currentDecade}</span>
            <ChevronDown className="w-5 h-5" />
          </button>

          {/* Decade list - iOS Contacts style */}
          <div 
            className="max-h-96 overflow-y-auto"
            style={{ 
              scrollbarWidth: 'thin',
              scrollbarColor: '#F59E0B #FEF3C7'
            }}
          >
            {decades.map((decade) => (
              <button
                key={decade}
                onClick={() => handleDecadeClick(decade)}
                className={`w-full text-left px-6 py-4 transition-all border-b border-gray-100 last:border-b-0 ${
                  decade === currentDecade
                    ? 'bg-amber-50 text-amber-900 font-semibold'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                style={{ 
                  fontSize: '18px',
                  minHeight: '60px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {decade}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

