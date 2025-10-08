import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalize a year value to ensure it's a valid 4-digit year.
 * Fixes corrupted year values like "19550" that may have been created by string concatenation.
 * 
 * @param yearValue - The year value to normalize (string or number)
 * @returns The normalized year as a number, or null if invalid
 */
export function normalizeYear(yearValue: string | number | null | undefined): number | null {
  if (!yearValue) return null;
  
  // Convert to string for manipulation
  let yearStr = yearValue.toString();
  
  // Handle specific known corrupted values
  const corruptedYearMappings: { [key: string]: number } = {
    '19550': 1955,
    '19560': 1956,
    '19570': 1957,
    '19580': 1958,
    '19590': 1959,
    '19600': 1960,
    '19610': 1961,
    '19620': 1962,
    '19630': 1963,
    '19640': 1964,
    '19650': 1965,
    '19660': 1966,
    '19670': 1967,
    '19680': 1968,
    '19690': 1969,
    '19700': 1970,
    '19710': 1971,
    '19720': 1972,
    '19730': 1973,
    '19740': 1974,
    '19750': 1975,
    '19760': 1976,
    '19770': 1977,
    '19780': 1978,
    '19790': 1979,
    '19800': 1980,
    '19810': 1981,
    '19820': 1982,
    '19830': 1983,
    '19840': 1984,
    '19850': 1985,
    '19860': 1986,
    '19870': 1987,
    '19880': 1988,
    '19890': 1989,
    '19900': 1990,
    '19910': 1991,
    '19920': 1992,
    '19930': 1993,
    '19940': 1994,
    '19950': 1995,
    '19960': 1996,
    '19970': 1997,
    '19980': 1998,
    '19990': 1999,
    '20000': 2000,
    '20010': 2001,
    '20020': 2002,
    '20030': 2003,
    '20040': 2004,
    '20050': 2005,
    '20060': 2006,
    '20070': 2007,
    '20080': 2008,
    '20090': 2009,
    '20100': 2010,
    '20110': 2011,
    '20120': 2012,
    '20130': 2013,
    '20140': 2014,
    '20150': 2015,
    '20160': 2016,
    '20170': 2017,
    '20180': 2018,
    '20190': 2019,
    '20200': 2020,
    '20210': 2021,
    '20220': 2022,
    '20230': 2023,
    '20240': 2024,
    '20250': 2025,
  };
  
  // Check if this is a known corrupted value
  if (corruptedYearMappings[yearStr]) {
    return corruptedYearMappings[yearStr];
  }
  
  // Handle 5-digit years that look like valid years with an extra 0
  if (yearStr.length === 5 && (yearStr.startsWith('19') || yearStr.startsWith('20'))) {
    // Try removing the last character if it's a 0
    if (yearStr.endsWith('0')) {
      const potentialYear = parseInt(yearStr.slice(0, 4));
      if (potentialYear >= 1900 && potentialYear <= 2100) {
        return potentialYear;
      }
    }
  }
  
  // Handle years with multiple trailing zeros
  if (yearStr.length > 4 && yearStr.endsWith('0')) {
    // Keep removing trailing zeros until we get a 4-digit year
    while (yearStr.length > 4 && yearStr.endsWith('0')) {
      yearStr = yearStr.slice(0, -1);
    }
    const cleanYear = parseInt(yearStr);
    if (!isNaN(cleanYear) && cleanYear >= 1900 && cleanYear <= 2100) {
      return cleanYear;
    }
  }
  
  // Parse the year normally
  const yearNum = parseInt(yearStr);
  if (!isNaN(yearNum) && yearNum >= 1900 && yearNum <= 2100) {
    return yearNum;
  }
  
  // Invalid year
  return null;
}

/**
 * Format a year for display. Returns the year as a string, or empty string if invalid.
 */
export function formatYear(yearValue: string | number | null | undefined): string {
  const normalized = normalizeYear(yearValue);
  return normalized ? normalized.toString() : '';
}

/**
 * Calculate decade from year
 */
export function getDecadeFromYear(year: number | string): string {
  const normalizedYear = normalizeYear(year);
  if (!normalizedYear) return 'Unknown';

  const decade = Math.floor(normalizedYear / 10) * 10;
  return `${decade}s`;
}

/**
 * Get age range for a decade based on birth year
 */
export function getAgeRangeForDecade(birthYear: number, decade: string): string {
  const decadeStart = parseInt(decade.replace('s', ''));
  const startAge = Math.max(0, decadeStart - birthYear);
  const endAge = startAge + 9;
  return `Ages ${startAge}-${endAge}`;
}

/**
 * Get decade display name
 */
export function getDecadeDisplayName(decade: string): string {
  const year = decade.replace('s', '');
  return `THE ${year}s`;
}

/**
 * Calculate age at the time of an event
 */
export function getAge(eventYear: number, birthYear: number): number {
  return eventYear - birthYear;
}

/**
 * Group stories by decade
 */
export function groupStoriesByDecade(stories: any[], birthYear: number) {
  const decades = new Map<string, any[]>();
  const normalizedBirthYear = normalizeYear(birthYear);

  stories.forEach(story => {
    const normalizedStoryYear = normalizeYear(story.storyYear);

    // Skip invalid years
    if (!normalizedStoryYear) {
      return;
    }

    // Skip birth year stories - they go in their own section
    if (normalizedStoryYear === normalizedBirthYear) {
      return;
    }

    const decade = getDecadeFromYear(normalizedStoryYear);
    if (decade !== 'Unknown') {
      if (!decades.has(decade)) {
        decades.set(decade, []);
      }
      decades.get(decade)!.push(story);
    }
  });

  return Array.from(decades.entries())
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([decade, stories]) => ({
      decade,
      displayName: getDecadeDisplayName(decade),
      ageRange: getAgeRangeForDecade(birthYear, decade),
      stories: stories.sort((a, b) => {
        const yearA = normalizeYear(a.storyYear) || 0;
        const yearB = normalizeYear(b.storyYear) || 0;
        return yearA - yearB;
      })
    }));
}
