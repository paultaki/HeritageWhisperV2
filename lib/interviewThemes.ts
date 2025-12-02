/**
 * Interview Themes - Research-backed life chapters for guided autobiography
 *
 * Based on:
 * - Guided Autobiography framework (life chapters)
 * - Smithsonian Folklife Oral History question categories
 * - Life Review Therapy therapeutic themes
 */

export type InterviewTheme = {
  id: string;
  title: string;
  description: string;
  icon: string; // Emoji
  warmUpQuestions: string[]; // 2-3 easy ice-breaker questions
  mainPrompts: string[]; // 8-10 themed follow-up prompts for deeper exploration
};

export const INTERVIEW_THEMES: InterviewTheme[] = [
  {
    id: 'childhood',
    title: 'My Childhood Home',
    description: 'Early memories, family, and the place you grew up',
    icon: '🏠',
    warmUpQuestions: [
      "Before we dive in, remind me - where did you grow up?",
      "What's one thing you loved about that place?",
    ],
    mainPrompts: [
      "Picture your childhood home. Walk me through the front door - what's the first thing you see?",
      "What did your home smell like? Was there a kitchen smell you remember?",
      "Who was usually there when you came home from school?",
      "What room did your family spend the most time together in?",
      "Was there a special spot that was just yours - maybe a hiding place or a favorite corner?",
      "What sounds do you remember from your childhood home?",
      "What was your neighborhood like? Who lived nearby?",
      "What games did you play outside? Who did you play with?",
      "What did your parents do for work?",
      "What was dinnertime like in your family?",
    ],
  },
  {
    id: 'school',
    title: 'School Days & Friends',
    description: 'Education, teachers, and early friendships',
    icon: '📚',
    warmUpQuestions: [
      "What school did you go to growing up?",
      "Did you walk to school, take a bus, or get a ride?",
    ],
    mainPrompts: [
      "Picture your school building. What did it look like from the outside?",
      "Was there a teacher who really made a difference in your life?",
      "What subject did you enjoy most? What made it interesting?",
      "Who was your best friend in school? How did you meet?",
      "What did you and your friends do for fun after school?",
      "Was there a moment in school you'll never forget - good or bad?",
      "What were school lunches like? Did you bring your lunch or buy it?",
      "Did you play any sports or join any clubs?",
      "What did you want to be when you grew up?",
      "Looking back, what did school teach you beyond the books?",
    ],
  },
  {
    id: 'love',
    title: 'First Love & Courtship',
    description: 'Romance, dating, and meeting your partner',
    icon: '💕',
    warmUpQuestions: [
      "Were you shy or outgoing when you were young?",
      "What did people do for fun on dates back then?",
    ],
    mainPrompts: [
      "Do you remember your first crush? What was special about them?",
      "How did you meet your spouse or partner? What caught your attention first?",
      "What was your first date like? Where did you go?",
      "How did your family react when they met your sweetheart?",
      "Was there a moment when you knew this was 'the one'?",
      "How did the proposal happen? Who asked who?",
      "What was your wedding day like? What do you remember most vividly?",
      "What's the secret to a lasting relationship, in your experience?",
      "What's a funny or sweet story from your early days together?",
      "How did you celebrate anniversaries or special occasions?",
    ],
  },
  {
    id: 'career',
    title: 'Career & Working Life',
    description: 'Jobs, achievements, and professional journey',
    icon: '💼',
    warmUpQuestions: [
      "What was your first paying job?",
      "How did you get that job?",
    ],
    mainPrompts: [
      "What did you want to be when you were young? Did it change over time?",
      "How did you end up in your career? Was it planned or did life lead you there?",
      "What was a typical workday like for you?",
      "Who was the best boss you ever had? What made them good?",
      "What accomplishment at work are you most proud of?",
      "Was there a difficult challenge at work that taught you something important?",
      "How did you balance work and family life?",
      "What changes did you see in your industry over the years?",
      "If you could give career advice to a young person today, what would it be?",
      "What did retirement feel like? Was it what you expected?",
    ],
  },
  {
    id: 'family',
    title: 'Raising a Family',
    description: 'Parenthood, children, and family traditions',
    icon: '👨‍👩‍👧‍👦',
    warmUpQuestions: [
      "How many children do you have?",
      "What were their personalities like growing up?",
    ],
    mainPrompts: [
      "What was it like when you found out you were going to be a parent?",
      "What do you remember about bringing your first child home?",
      "What was the hardest part of being a parent? The most rewarding?",
      "What family traditions did you create? Where did they come from?",
      "What's a funny story about your kids when they were little?",
      "How did you handle discipline? Did you have house rules?",
      "What activities did you do together as a family?",
      "What did your kids teach you?",
      "Is there a moment with your children that still makes you emotional?",
      "What do you hope your children and grandchildren remember about you?",
    ],
  },
  {
    id: 'adventures',
    title: 'Travels & Adventures',
    description: 'Journeys, discoveries, and memorable trips',
    icon: '✈️',
    warmUpQuestions: [
      "Did your family travel much when you were growing up?",
      "What's the farthest from home you've ever been?",
    ],
    mainPrompts: [
      "What's the most memorable trip you've ever taken?",
      "Was there a place that completely surprised you - different from what you expected?",
      "Tell me about a trip where something went wrong - how did you handle it?",
      "Did you ever live somewhere other than where you grew up?",
      "What's a food you tried on a trip that you'll never forget?",
      "Is there a place you've always wanted to visit but never got to?",
      "What did traveling teach you about other people and cultures?",
      "Did you have any adventures that were a little scary at the time but make great stories now?",
      "What's the most beautiful place you've ever seen?",
      "If you could go back to one place you've visited, where would it be and why?",
    ],
  },
  {
    id: 'hardships',
    title: 'Hardships & Lessons',
    description: 'Challenges overcome and wisdom gained',
    icon: '🌱',
    warmUpQuestions: [
      "Was there a time in your life that was particularly difficult?",
      "How did you get through tough times?",
    ],
    mainPrompts: [
      "What was the hardest thing you've ever had to go through?",
      "Who helped you during difficult times? How did they support you?",
      "Was there a moment when you weren't sure things would work out?",
      "What did you learn about yourself from facing challenges?",
      "How did hard times change your perspective on life?",
      "Was there a loss that deeply affected you? How did you cope?",
      "Looking back, did any hardship lead to something unexpected and good?",
      "What gives you strength when times are tough?",
      "What would you tell someone going through something similar?",
      "What's a hardship you're grateful for now, even if it was painful then?",
    ],
  },
  {
    id: 'wisdom',
    title: 'Wisdom for Future Generations',
    description: 'Life lessons, values, and legacy',
    icon: '✨',
    warmUpQuestions: [
      "What are you most proud of in your life?",
      "What makes you laugh these days?",
    ],
    mainPrompts: [
      "What's the most important lesson life has taught you?",
      "What do you know now that you wish you'd known at 20?",
      "What values were you raised with that you've passed on?",
      "What brings you the most joy at this stage of life?",
      "Is there anything you'd do differently if you could live life over?",
      "What do you want your grandchildren to know about you?",
      "What's the best advice you've ever received?",
      "How do you want to be remembered?",
      "What gives your life meaning today?",
      "If you could leave one piece of wisdom for future generations, what would it be?",
    ],
  },
];

/**
 * Get a theme by ID
 */
export function getThemeById(themeId: string): InterviewTheme | undefined {
  return INTERVIEW_THEMES.find(t => t.id === themeId);
}

/**
 * Get warm-up questions for a theme
 */
export function getWarmUpQuestions(themeId: string): string[] {
  const theme = getThemeById(themeId);
  return theme?.warmUpQuestions || [
    "Before we begin, tell me - where did you grow up?",
    "What's one thing you loved about your childhood?",
  ];
}

/**
 * Get the first main prompt for a theme (after warm-up)
 */
export function getFirstMainPrompt(themeId: string): string {
  const theme = getThemeById(themeId);
  return theme?.mainPrompts[0] || "Tell me about a moment that changed how you saw yourself.";
}

/**
 * Get a random main prompt from a theme (for variety)
 */
export function getRandomMainPrompt(themeId: string, excludePrompts: string[] = []): string {
  const theme = getThemeById(themeId);
  if (!theme) return "Tell me more about that.";

  const availablePrompts = theme.mainPrompts.filter(p => !excludePrompts.includes(p));
  if (availablePrompts.length === 0) return theme.mainPrompts[0];

  const randomIndex = Math.floor(Math.random() * availablePrompts.length);
  return availablePrompts[randomIndex];
}
