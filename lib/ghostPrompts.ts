export interface GhostPrompt {
  id: string;
  title: string;
  prompt: string;
  year: number;
  age: number;
  isGhost: true;
  icon?: string;
}

export function generateGhostPrompts(birthYear: number): GhostPrompt[] {
  const currentYear = new Date().getFullYear();
  const prompts: GhostPrompt[] = [];

  // 1. The Day You Were Born
  prompts.push({
    id: 'ghost-birth-day',
    title: 'The Day You Were Born',
    prompt: 'What stories have you been told about the day you were born? What was happening in your family and the world at that time?',
    year: birthYear,
    age: 0,
    isGhost: true,
    icon: '👶'
  });

  // 2. First Day of School (age ~6)
  if (birthYear + 6 <= currentYear) {
    prompts.push({
      id: 'ghost-first-school',
      title: 'First Day of School',
      prompt: 'Do you remember your first day of school? What did you wear? Who took you? How did you feel walking into that classroom?',
      year: birthYear + 6,
      age: 6,
      isGhost: true,
      icon: '🎒'
    });
  }

  // 3. My First Car (age ~16)
  if (birthYear + 16 <= currentYear) {
    prompts.push({
      id: 'ghost-first-car',
      title: 'My First Car',
      prompt: 'Tell us about your first car. How did you get it? Where was the first place you drove? What did that freedom feel like?',
      year: birthYear + 16,
      age: 16,
      isGhost: true,
      icon: '🚗'
    });
  }

  // 4. Falling in Love (age ~25)
  if (birthYear + 25 <= currentYear) {
    prompts.push({
      id: 'ghost-falling-love',
      title: 'Falling in Love',
      prompt: 'When did you first fall in love? How did you meet? What made them special? What do you remember most about those early days?',
      year: birthYear + 25,
      age: 25,
      isGhost: true,
      icon: '❤️'
    });
  }

  // 5. A Major World Event (age ~35-45, adjusted based on actual events)
  const userAge = currentYear - birthYear;
  if (userAge >= 35) {
    // Determine which major event based on birth year
    let eventYear, eventTitle, eventPrompt;

    if (birthYear <= 1955) {
      // Moon landing (1969)
      eventYear = 1969;
      eventTitle = 'The Moon Landing';
      eventPrompt = 'Where were you when humans first walked on the moon? How did you watch it? What did it mean to you?';
    } else if (birthYear <= 1965) {
      // Fall of Berlin Wall (1989)
      eventYear = 1989;
      eventTitle = 'The Fall of the Berlin Wall';
      eventPrompt = 'What do you remember about the fall of the Berlin Wall? How did the end of the Cold War affect your life?';
    } else if (birthYear <= 1975) {
      // 9/11 (2001)
      eventYear = 2001;
      eventTitle = 'September 11th';
      eventPrompt = 'Where were you on September 11, 2001? How did you first hear the news? How did that day change things?';
    } else {
      // COVID-19 (2020)
      eventYear = 2020;
      eventTitle = 'The Pandemic';
      eventPrompt = 'What do you remember about the start of the COVID-19 pandemic? How did your life change? What surprised you most?';
    }

    if (eventYear <= currentYear) {
      prompts.push({
        id: 'ghost-world-event',
        title: eventTitle,
        prompt: eventPrompt,
        year: eventYear,
        age: eventYear - birthYear,
        isGhost: true,
        icon: '🌍'
      });
    }
  }

  return prompts;
}

// Helper function to merge ghost prompts with real stories
export function mergeGhostPromptsWithStories(
  realStories: any[],
  ghostPrompts: GhostPrompt[],
  maxStories: number = 3
): any[] {
  // Only show ghost prompts if user has fewer than maxStories
  if (realStories.length >= maxStories) {
    return realStories;
  }

  // Merge and sort by year
  const merged = [...realStories, ...ghostPrompts].sort((a, b) => {
    const yearA = a.storyYear || a.year;
    const yearB = b.storyYear || b.year;
    return yearA - yearB;
  });

  return merged;
}