export type Sensitivity = 'low' | 'medium' | 'high';
export type CatalogItem = { 
  id: string; 
  text: string; 
  gates?: string[]; 
  sensitivity?: Sensitivity 
};

export type Gates = {
  requiresChildren: boolean;
  requiresCollege: boolean;
  hasSiblings: boolean;
  hasSpouseOrPartner: boolean;
  hasPets: boolean;
};

export const SENSITIVE_CATEGORIES = new Set([
  'Dating',
  'Health & Hard Times',
  'Spirituality & Faith',
  'Reflections & Legacy'
]);

export function isSensitiveCategory(cat: string) {
  return SENSITIVE_CATEGORIES.has(cat);
}

export function categoryGate(category: string, g: Gates) {
  const map: Record<string, boolean> = {
    'Children': g.requiresChildren,
    'College': g.requiresCollege,
    'Siblings': g.hasSiblings,
    'Spouse or Partner': g.hasSpouseOrPartner,
    'Pets': g.hasPets
  };
  return map[category] ?? true;
}

export const CATALOG: Record<string, CatalogItem[]> = {
  'Advice': [
    { id: 'advice-1', text: "When life feels heavy, I remind myself that…" },
    { id: 'advice-2', text: "If you're stressed right now, try this…" },
    { id: 'advice-3', text: "When things go sideways, what helps me most is…" },
    { id: 'advice-4', text: "If you're stuck with a difficult person, remember…" },
    { id: 'advice-5', text: "A piece of advice I wish I had learned sooner is…" }
  ],
  'Ancestry': [
    { id: 'ancestry-1', text: "A story about one of my ancestors that still sticks with me is…" },
    { id: 'ancestry-2', text: "Something passed down for generations in my family is…" },
    { id: 'ancestry-3', text: "A family secret or little-known truth is…", sensitivity: 'medium' }
  ],
  'Celebrations': [
    { id: 'cele-1', text: "A favorite holiday memory of mine is…" },
    { id: 'cele-2', text: "A unique tradition my family kept was…" },
    { id: 'cele-3', text: "One of the best gifts I ever received was…" },
    { id: 'cele-4', text: "A birthday I will never forget was…" },
    { id: 'cele-5', text: "The best party I ever attended was…" },
    { id: 'cele-6', text: "My most memorable Halloween costume was…" },
    { id: 'cele-7', text: "A New Year's Eve I still smile about was…" }
  ],
  'Childhood': [
    { id: 'child-1', text: "One of my very first memories is…" },
    { id: 'child-2', text: "If you stood outside my childhood home, you would see…" },
    { id: 'child-3', text: "A time I was especially happy as a child was…" },
    { id: 'child-4', text: "A toy or game I adored was…" },
    { id: 'child-5', text: "My favorite place to play was…" },
    { id: 'child-6', text: "A moment from elementary school that stands out is…" },
    { id: 'child-7', text: "A hiding place I loved was…" },
    { id: 'child-8', text: "Someone from my childhood who shaped me was…" }
  ],
  'Children': [
    { id: 'kids-1', text: "A favorite story from when my child was little is…", gates: ['requiresChildren'] },
    { id: 'kids-2', text: "A memory from their teen years that stands out is…", gates: ['requiresChildren'] },
    { id: 'kids-3', text: "Three words that describe my child are…", gates: ['requiresChildren'] },
    { id: 'kids-4', text: "A quality I admire in my child is…", gates: ['requiresChildren'] },
    { id: 'kids-5', text: "One of the most rewarding parts of parenting was…", gates: ['requiresChildren'] },
    { id: 'kids-6', text: "An important value I tried to pass on is…", gates: ['requiresChildren'] }
  ],
  'College': [
    { id: 'college-1', text: "A friend I made in college who shaped me was…", gates: ['requiresCollege'] },
    { id: 'college-2', text: "A class I loved and why was…", gates: ['requiresCollege'] },
    { id: 'college-3', text: "A place I lived in college that I loved was…", gates: ['requiresCollege'] },
    { id: 'college-4', text: "An activity or club I enjoyed was…", gates: ['requiresCollege'] }
  ],
  'Dating': [
    { id: 'dating-1', text: "A breakup that taught me something was…", sensitivity: 'medium' },
    { id: 'dating-2', text: "A crush that was not returned led to…", sensitivity: 'medium' },
    { id: 'dating-3', text: "The story of my first kiss is…", sensitivity: 'medium' },
    { id: 'dating-4', text: "My first serious relationship was with…", sensitivity: 'medium' },
    { id: 'dating-5', text: "My first love as a teenager was…", sensitivity: 'medium' }
  ],
  'Feelings': [
    { id: 'feel-1', text: "A moment that still makes me laugh is…" },
    { id: 'feel-2', text: "A big triumph in my life was…" },
    { id: 'feel-3', text: "An experience that felt deeply rewarding was…" },
    { id: 'feel-4', text: "A time I scared myself but kept going was…" },
    { id: 'feel-5', text: "An embarrassing moment I can laugh about now is…" },
    { id: 'feel-6', text: "One of the smartest choices I ever made was…" },
    { id: 'feel-7', text: "A time I felt truly proud was…" },
    { id: 'feel-8', text: "A moment of deep sadness for me was…", sensitivity: 'medium' },
    { id: 'feel-9', text: "One of the hardest times in my life was…", sensitivity: 'medium' }
  ],
  'Friends': [
    { id: 'friends-1', text: "A great friend from childhood was…" },
    { id: 'friends-2', text: "A great friend from college was…", gates: ['requiresCollege'] },
    { id: 'friends-3', text: "A friend I made as an adult who changed me was…" },
    { id: 'friends-4', text: "One of my longest friendships is with…" },
    { id: 'friends-5', text: "How and why we drifted apart is…", sensitivity: 'medium' }
  ],
  'Grandparents': [
    { id: 'gp-1', text: "A favorite memory with my grandparent is…" },
    { id: 'gp-2', text: "Something I loved about my grandparent was…" },
    { id: 'gp-3', text: "A special time I shared with my grandparent was…" },
    { id: 'gp-4', text: "My favorite thing my grandparent cooked was…" }
  ],
  'Historical': [
    { id: 'hist-1', text: "The first big news event I remember as a child was…" },
    { id: 'hist-2', text: "I will never forget a major event because…" },
    { id: 'hist-3', text: "A major historical event that affected me personally was…" },
    { id: 'hist-4', text: "The most uplifting event I lived through was…" },
    { id: 'hist-5', text: "A technological change that influenced my life was…" },
    { id: 'hist-6', text: "The most upsetting event I lived through was…", sensitivity: 'medium' }
  ],
  'Health & Hard Times': [
    { id: 'health-1', text: "A childhood accident I can laugh about now was…" },
    { id: 'health-2', text: "Watching family face illness taught me…", sensitivity: 'medium' },
    { id: 'health-3', text: "Dealing with illness taught me…", sensitivity: 'medium' }
  ],
  'Interests': [
    { id: 'int-1', text: "A simple pleasure I truly enjoy is…" },
    { id: 'int-2', text: "My perfect lazy day looks like…" },
    { id: 'int-3', text: "I really enjoy a hobby because…" },
    { id: 'int-4', text: "I am not great at a hobby, but I love it because…" },
    { id: 'int-5', text: "A particularly good day doing a hobby was when…" },
    { id: 'int-6', text: "A concert I loved was…" },
    { id: 'int-7', text: "A sporting event I will never forget was…" }
  ],
  'Humor & Jokes': [
    { id: 'humor-1', text: "A joke that always gets me is…" },
    { id: 'humor-2', text: "The kind of humor that cracks me up is…" },
    { id: 'humor-3', text: "A line I use that makes people laugh is…" },
    { id: 'humor-4', text: "Why laughter matters in my life is…" }
  ],
  'Parents': [
    { id: 'parents-1', text: "Something we loved doing together was…" },
    { id: 'parents-2', text: "A time I felt especially close to my parent was…" },
    { id: 'parents-3', text: "A memorable story with my mother or father is…" },
    { id: 'parents-4', text: "A lesson I learned from my parent is…" },
    { id: 'parents-5', text: "Something I admired about my parent was…" },
    { id: 'parents-6', text: "How I would describe my relationship with my parents is…", sensitivity: 'medium' }
  ],
  'Personality & Quirks': [
    { id: 'pq-1', text: "One of my best qualities is…" },
    { id: 'pq-2', text: "One of my toughest traits is…" },
    { id: 'pq-3', text: "Something unusual about me is…" },
    { id: 'pq-4', text: "A compliment that stuck with me is…" },
    { id: 'pq-5', text: "People would be surprised to learn that…" },
    { id: 'pq-6', text: "A funny story people always tell about me is…" },
    { id: 'pq-7', text: "A sound I love is…" },
    { id: 'pq-8', text: "A smell I love is…" },
    { id: 'pq-9', text: "A smell I cannot stand is…" },
    { id: 'pq-10', text: "A food I cannot stand is…" },
    { id: 'pq-11', text: "My biggest pet peeve is…" },
    { id: 'pq-12', text: "If someone portrayed me in a movie, I would pick…" },
    { id: 'pq-13', text: "One person I wish I could have dinner with is…" }
  ],
  'Pets': [
    { id: 'pets-1', text: "One of the best pets I ever had was…", gates: ['hasPets'] },
    { id: 'pets-2', text: "A memorable story about one of our pets is…", gates: ['hasPets'] },
    { id: 'pets-3', text: "I love cats, dogs, or another pet because…", gates: ['hasPets'] },
    { id: 'pets-4', text: "I have not been much of a pet owner because…" }
  ],
  'Reflections & Legacy': [
    { id: 'refl-1', text: "A turning point in my life was…" },
    { id: 'refl-2', text: "An intellectual challenge that stretched me was…" },
    { id: 'refl-3', text: "How my life turned out differently than I expected is…" },
    { id: 'refl-4', text: "A time I stood up for my principles was…" },
    { id: 'refl-5', text: "Something important I changed my mind about is…" },
    { id: 'refl-6', text: "A moment I wish I had photographed was…" },
    { id: 'refl-7', text: "Something I built or made with my own hands is…" },
    { id: 'refl-8', text: "A standard I hold myself to is…" },
    { id: 'refl-9', text: "One of my biggest regrets is…", sensitivity: 'medium' },
    { id: 'refl-10', text: "I am or am not afraid of death because…", sensitivity: 'medium' },
    { id: 'refl-11', text: "After I die, I believe…", sensitivity: 'medium' }
  ],
  'Sayings & Quotes': [
    { id: 'say-1', text: "A favorite saying of mine is…" },
    { id: 'say-2', text: "A quote I return to is…" },
    { id: 'say-3', text: "A motto I try to live by is…" },
    { id: 'say-4', text: "A line from a poem I love is…" }
  ],
  'Siblings': [
    { id: 'sib-1', text: "A good story about my brother or sister and me is…", gates: ['hasSiblings'] },
    { id: 'sib-2', text: "Something we loved doing together was…", gates: ['hasSiblings'] },
    { id: 'sib-3', text: "A big way we are different is…", gates: ['hasSiblings'] },
    { id: 'sib-4', text: "A time we got into trouble together was…", gates: ['hasSiblings'] },
    { id: 'sib-5', text: "A time we made our parents proud was…", gates: ['hasSiblings'] }
  ],
  'Spouse or Partner': [
    { id: 'sp-1', text: "How I first met my spouse or partner is…", gates: ['hasSpouseOrPartner'] },
    { id: 'sp-2', text: "An early date that stands out is…", gates: ['hasSpouseOrPartner'] },
    { id: 'sp-3', text: "A distinctive quality they have is…", gates: ['hasSpouseOrPartner'] },
    { id: 'sp-4', text: "An activity we really enjoy together is…", gates: ['hasSpouseOrPartner'] },
    { id: 'sp-5', text: "A moment we felt especially happy was…", gates: ['hasSpouseOrPartner'] }
  ],
  'Songs & Music': [
    { id: 'music-1', text: "A song I love to sing is…" },
    { id: 'music-2', text: "The kinds of music I love are…" },
    { id: 'music-3', text: "A song I sang to my children was…", gates: ['requiresChildren'] },
    { id: 'music-4', text: "A song that makes me cry is…" },
    { id: 'music-5', text: "A song that makes me dance is…" },
    { id: 'music-6', text: "A song that always lifts my mood is…" }
  ],
  'Spirituality & Faith': [
    { id: 'faith-1', text: "The role of faith in my life is…", sensitivity: 'medium' },
    { id: 'faith-2', text: "Spirituality or religion matters to me because…", sensitivity: 'medium' },
    { id: 'faith-3', text: "An experience that tested my faith was…", sensitivity: 'medium' },
    { id: 'faith-4', text: "An experience that strengthened my faith was…", sensitivity: 'medium' },
    { id: 'faith-5', text: "My faith is or is not similar to my parents because…", sensitivity: 'medium' }
  ],
  'Teen Years': [
    { id: 'teen-1', text: "A story from my teenage years is…" },
    { id: 'teen-2', text: "Learning to drive made me feel…" },
    { id: 'teen-3', text: "My favorite teacher was…" },
    { id: 'teen-4', text: "Music I loved as a teen was…" },
    { id: 'teen-5', text: "Styles or clothes I loved then were…" },
    { id: 'teen-6', text: "A fad I embraced was…" },
    { id: 'teen-7', text: "A song that takes me back to high school is…" },
    { id: 'teen-8', text: "Something I am still proud of from those years is…" }
  ],
  'Travel': [
    { id: 'travel-1', text: "A city I loved exploring was…" },
    { id: 'travel-2', text: "One of the best hikes or views I have seen was…" },
    { id: 'travel-3', text: "A great day I spent at the beach was…" },
    { id: 'travel-4', text: "The best road trip I took was…" },
    { id: 'travel-5', text: "A culture I encountered that fascinated me was…" },
    { id: 'travel-6', text: "A travel mishap that makes me laugh is…" },
    { id: 'travel-7', text: "The best photo I took on a trip was…" }
  ],
  'Other': [
    { id: 'other-1', text: "A storm I will never forget was…" },
    { id: 'other-2', text: "A time I was starstruck was…" },
    { id: 'other-3', text: "A true story from my life that is hard to believe is…" },
    { id: 'other-4', text: "A time I surprised myself was…" },
    { id: 'other-5', text: "My first car was…" },
    { id: 'other-6', text: "Watching a sunset with someone I love felt…" },
    { id: 'other-7', text: "A way I express creativity is…" }
  ],
  'Work & Career': [
    { id: 'work-1', text: "A challenge at work I enjoyed solving was…" },
    { id: 'work-2', text: "A professional achievement I am proud of is…" },
    { id: 'work-3', text: "The worst or strangest job I had was…" },
    { id: 'work-4', text: "A memorable summer job I had was…" },
    { id: 'work-5', text: "The first time I quit a job, I felt…" },
    { id: 'work-6', text: "A turning point in my career was when…" },
    { id: 'work-7', text: "I chose a profession because…" }
  ]
};
