/**
 * Starter Memory Templates for Empty Timeline State
 *
 * These templates appear only when a user has zero memories.
 * They provide guided prompts to help new users get started.
 */

export type StarterMemoryTemplate = {
  id: 'childhood-photo' | 'turning-point' | 'family-memory';
  title: string;
  subtitle: string;
  microPrompts: string[];
  placeholderText: string;
  buttonLabel: string;
  helperText: string;
};

export const STARTER_TEMPLATES: StarterMemoryTemplate[] = [
  {
    id: 'childhood-photo',
    title: 'A Favorite Childhood Photo',
    subtitle: 'Start with a picture from when you were young.',
    microPrompts: [
      'Who is in this photo?',
      'Where were you?',
      'What made this moment special?',
    ],
    placeholderText: 'Add your childhood photo here',
    buttonLabel: 'Start with this memory',
    helperText: 'No photo handy? Start talking now and add one later.',
  },
  {
    id: 'turning-point',
    title: 'A Big Turning Point',
    subtitle: 'A decision or event that changed your path.',
    microPrompts: [
      'A move, a job, or a tough decision',
      'that changed your life.',
    ],
    placeholderText: 'Add a photo from that season of life',
    buttonLabel: 'Record this turning point',
    helperText: 'No photo handy? Start talking now and add one later.',
  },
  {
    id: 'family-memory',
    title: 'The People Who Matter Most',
    subtitle: 'Capture a memory with the people you love.',
    microPrompts: [
      'A moment with your spouse, children,',
      'or closest friend.',
    ],
    placeholderText: 'Upload a favorite family photo',
    buttonLabel: 'Add this family memory',
    helperText: 'No photo handy? Start talking now and add one later.',
  },
];
