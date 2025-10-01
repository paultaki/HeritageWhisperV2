"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Sparkles, Clock } from 'lucide-react';

interface DecadeIntroPageProps {
  decade: string;
  ageRange: string;
  storiesCount: number;
}

export function DecadeIntroPage({ decade, ageRange, storiesCount }: DecadeIntroPageProps) {
  const isBirthYear = decade === 'birth-year';
  const decadeYear = isBirthYear ? ageRange.split(' ')[0] : decade.replace('s', '');

  const getDecadeStyle = () => {
    if (isBirthYear) {
      return { bg: 'bg-gradient-to-br from-rose-50 to-amber-50', accent: 'text-rose-600' };
    }
    const year = parseInt(decadeYear);
    if (year >= 2020) return { bg: 'bg-gradient-to-br from-purple-50 to-blue-50', accent: 'text-purple-600' };
    if (year >= 2010) return { bg: 'bg-gradient-to-br from-blue-50 to-cyan-50', accent: 'text-blue-600' };
    if (year >= 2000) return { bg: 'bg-gradient-to-br from-indigo-50 to-purple-50', accent: 'text-indigo-600' };
    if (year >= 1990) return { bg: 'bg-gradient-to-br from-teal-50 to-green-50', accent: 'text-teal-600' };
    if (year >= 1980) return { bg: 'bg-gradient-to-br from-pink-50 to-purple-50', accent: 'text-pink-600' };
    if (year >= 1970) return { bg: 'bg-gradient-to-br from-orange-50 to-amber-50', accent: 'text-orange-600' };
    if (year >= 1960) return { bg: 'bg-gradient-to-br from-yellow-50 to-orange-50', accent: 'text-yellow-700' };
    if (year >= 1950) return { bg: 'bg-gradient-to-br from-amber-50 to-yellow-50', accent: 'text-amber-700' };
    return { bg: 'bg-gradient-to-br from-gray-50 to-slate-50', accent: 'text-gray-700' };
  };

  const style = getDecadeStyle();

  return (
    <div className={`h-full flex flex-col items-center justify-center p-8 ${style.bg}`}>
      <div className="text-center space-y-6">
        <div className="relative">
          {isBirthYear ? (
            <>
              <h1 className={`text-5xl md:text-6xl font-bold ${style.accent} tracking-tight`}>
                The Year I Was Born
              </h1>
              <h2 className={`text-6xl md:text-8xl font-black ${style.accent} tracking-tight mt-2`}>
                {decadeYear}
              </h2>
            </>
          ) : (
            <>
              <h1 className={`text-6xl md:text-8xl font-bold ${style.accent} tracking-tight`}>
                THE
              </h1>
              <h2 className={`text-7xl md:text-9xl font-black ${style.accent} tracking-tighter -mt-4`}>
                {decadeYear}s
              </h2>
            </>
          )}
        </div>

        <div className={`w-32 h-1 mx-auto ${
          isBirthYear ? 'bg-rose-400' :
          style.bg.includes('orange') ? 'bg-orange-400' :
          style.bg.includes('blue') ? 'bg-blue-400' :
          style.bg.includes('purple') ? 'bg-purple-400' :
          style.bg.includes('teal') ? 'bg-teal-400' :
          style.bg.includes('pink') ? 'bg-pink-400' :
          style.bg.includes('yellow') ? 'bg-yellow-400' :
          style.bg.includes('amber') ? 'bg-amber-400' : 'bg-gray-400'}`} />

        {!isBirthYear && (
          <div className="flex items-center justify-center gap-2 text-lg md:text-xl text-gray-600">
            <Calendar className="w-5 h-5" />
            <span className="font-medium">{ageRange}</span>
          </div>
        )}
        {isBirthYear && (
          <div className="text-lg md:text-xl text-gray-600 font-medium">
            The Beginning
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-sm md:text-base text-gray-500">
          <Clock className="w-4 h-4" />
          <span>{storiesCount} {storiesCount === 1 ? 'Memory' : 'Memories'} in this chapter</span>
        </div>

        <div className="mt-12 text-sm uppercase tracking-widest text-gray-400">
          Chapter
        </div>
      </div>
    </div>
  );
}

interface DecadeFactsPageProps {
  decade: string;
  ageRange: string;
  facts?: string[];
  loading?: boolean;
}

export function DecadeFactsPage({ decade, ageRange }: DecadeFactsPageProps) {
  const decadeYear = decade.replace('s', '');
  const [facts, setFacts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const defaultFacts = [
    `The ${decadeYear}s was a decade of significant change and innovation.`,
    `During this time, you were ${ageRange.toLowerCase()}, experiencing life through a unique lens.`,
    `Many of the memories from this period shaped who you would become.`
  ];

  useEffect(() => {
    const fetchFacts = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/decade-facts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ decade, ageRange })
        });

        if (response.ok) {
          const data = await response.json();
          setFacts(data.facts || []);
        }
      } catch (error) {
        console.error('Failed to fetch decade facts:', error);
        setFacts(defaultFacts);
      } finally {
        setLoading(false);
      }
    };

    fetchFacts();
  }, [decade, ageRange]);

  const displayFacts = facts.length > 0 ? facts : defaultFacts;

  return (
    <div className="h-full flex flex-col p-8 bg-gradient-to-br from-gray-50 to-white">
      <div className="flex-1 space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-2xl font-serif text-gray-800">Historical Context</h3>
          <p className="text-sm text-gray-500 mt-1">The {decadeYear}s • {ageRange}</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="space-y-4 text-center">
              <Sparkles className="w-8 h-8 text-amber-500 mx-auto animate-pulse" />
              <p className="text-gray-500">Loading historical context...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {displayFacts.map((fact, index) => (
              <div key={index} className="space-y-2">
                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                  <span className="text-amber-700 font-bold text-xs">{index + 1}</span>
                </div>
                <p className="text-gray-700 leading-relaxed text-base md:text-lg">{fact}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-auto pt-8 border-t border-gray-100">
          <p className="text-xs text-gray-400 italic">
            These historical insights provide context for your memories from this era.
          </p>
        </div>
      </div>
    </div>
  );
}
