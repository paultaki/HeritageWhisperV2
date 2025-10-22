"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Mic,
  Heart,
  Clock,
  Sparkles,
  BookOpen,
  Users,
  MapPin,
  Calendar,
  Star,
  ChevronRight,
  HelpCircle,
  Bookmark,
  MessageCircle,
  Home,
  Briefcase,
  GraduationCap,
  Baby,
  Music,
  Utensils
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useModeSelection } from "@/hooks/use-mode-selection";
import { ModeSelectionModal } from "@/components/recording/ModeSelectionModal";
import { QuickStoryRecorder } from "@/components/recording/QuickStoryRecorder";
import { LeftSidebar } from "@/components/LeftSidebar";
import { useMediaQuery } from "@/hooks/use-media-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Category prompts data
const CATEGORY_PROMPTS: Record<string, string[]> = {
  childhood: [
    "What's your earliest memory?",
    "What games did you play as a child?",
    "Who was your best friend growing up?",
    "What was your favorite toy?",
    "What did your childhood home look like?",
    "What was Sunday dinner like in your family?",
    "What was your favorite hiding spot?",
    "What scared you most as a child?",
  ],
  school: [
    "Who was your favorite teacher and why?",
    "What was your most embarrassing moment in school?",
    "What subject did you love or hate most?",
    "Tell me about your first day of school",
    "What was in your lunchbox?",
    "What trouble did you get into at school?",
    "What was your proudest school achievement?",
    "Who was your first crush?",
  ],
  work: [
    "What was your first job?",
    "How much did you make at your first job?",
    "Who taught you the most about work?",
    "What was your biggest career mistake?",
    "Tell me about a boss you'll never forget",
    "What job did you dream of having?",
    "What was the hardest day at work?",
    "When did you know it was time to retire?",
  ],
  family: [
    "How did you meet your spouse?",
    "What was your wedding day like?",
    "Tell me about the day your first child was born",
    "What family tradition do you cherish most?",
    "What's your favorite family vacation memory?",
    "What did you learn from your parents?",
    "What do you wish you'd asked your parents?",
    "What's the funniest thing your kids ever did?",
  ],
  places: [
    "What place feels most like home to you?",
    "Where did you go on your honeymoon?",
    "What's the farthest you've ever traveled?",
    "What place would you love to see again?",
    "Where did you feel most at peace?",
    "What was your neighborhood like growing up?",
    "Tell me about a place that changed your life",
    "Where would you go if you could go anywhere?",
  ],
  hobbies: [
    "What hobby brought you the most joy?",
    "What skill are you most proud of learning?",
    "What collection did you have?",
    "What was your favorite way to spend a Saturday?",
    "What book changed your life?",
    "What music takes you back?",
    "What sport did you love to play or watch?",
    "What craft or art did you create?",
  ],
  food: [
    "What meal reminds you most of home?",
    "What was your grandmother's best dish?",
    "What food did you hate as a child but love now?",
    "What was your family's Sunday dinner like?",
    "Tell me about a memorable holiday meal",
    "What recipe do you wish you had?",
    "What was your favorite restaurant?",
    "What food takes you back to childhood?",
  ],
  milestones: [
    "What was the happiest day of your life?",
    "What achievement are you most proud of?",
    "When did you feel most brave?",
    "What was your biggest turning point?",
    "Tell me about a time you surprised yourself",
    "What risk was worth taking?",
    "When did you know you were in love?",
    "What moment changed everything?",
  ],
};

// Types remain the same
interface QueuedPrompt {
  id: string;
  prompt_text: string;
  context_note?: string | null;
  source: 'ai' | 'catalog';
  category?: string;
  tier?: number;
  queue_position: number;
  queued_at: string;
  anchor_entity?: string;
  anchor_year?: number;
}

interface ActivePrompt {
  id: string;
  prompt_text: string;
  context_note: string | null;
  tier: number;
  created_at: string;
  shown_count: number;
  anchor_entity?: string;
  anchor_year?: number;
}

interface FamilyPrompt {
  id: string;
  prompt_text: string;
  context_note?: string | null;
  source: 'family';
  status: string;
  created_at: string;
  submittedBy: {
    id: string;
    name: string;
    email?: string;
    relationship?: string;
  };
}

// Category data with icons and colors
const CATEGORIES = [
  { id: 'childhood', label: 'Childhood', icon: Baby, color: 'from-blue-400 to-blue-500' },
  { id: 'school', label: 'School Days', icon: GraduationCap, color: 'from-green-400 to-green-500' },
  { id: 'work', label: 'Work & Career', icon: Briefcase, color: 'from-purple-400 to-purple-500' },
  { id: 'family', label: 'Family Life', icon: Home, color: 'from-pink-400 to-pink-500' },
  { id: 'places', label: 'Places & Travel', icon: MapPin, color: 'from-orange-400 to-orange-500' },
  { id: 'hobbies', label: 'Hobbies & Interests', icon: Music, color: 'from-indigo-400 to-indigo-500' },
  { id: 'food', label: 'Food & Traditions', icon: Utensils, color: 'from-red-400 to-red-500' },
  { id: 'milestones', label: 'Life Milestones', icon: Star, color: 'from-yellow-400 to-yellow-500' },
];

// Featured prompt card component
function FeaturedPromptCard({ prompt, onRecord }: { prompt: any; onRecord: (id: string, text: string, source: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-8 md:p-12"
    >
      {/* Decorative elements */}
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-orange-200 to-rose-200 opacity-20 blur-3xl" />
      <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-gradient-to-br from-amber-200 to-orange-200 opacity-20 blur-3xl" />

      <div className="relative">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 backdrop-blur">
          <Sparkles className="h-4 w-4 text-orange-500" />
          <span className="text-sm font-medium text-gray-700">Today's Featured Question</span>
        </div>

        {/* Question */}
        <h2 className="mb-4 text-2xl md:text-3xl font-semibold text-gray-900 leading-relaxed">
          {prompt.prompt_text}
        </h2>

        {/* Context if available */}
        {prompt.context_note && (
          <p className="mb-8 text-lg text-gray-600">
            {prompt.context_note}
          </p>
        )}

        {/* Action button */}
        <Button
          onClick={() => onRecord(prompt.id, prompt.prompt_text, prompt.source)}
          size="lg"
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-lg px-8 py-6 rounded-2xl"
        >
          <Mic className="mr-3 h-5 w-5" />
          Record Your Answer
        </Button>
      </div>
    </motion.div>
  );
}

// Simple prompt card for grid layout
function SimplePromptCard({
  prompt,
  icon: Icon,
  color,
  onRecord,
  onSave,
  isSaved = false
}: {
  prompt: any;
  icon?: any;
  color?: string;
  onRecord: (id: string, text: string, source: string) => void;
  onSave?: (id: string, text: string, source: string) => void;
  isSaved?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative rounded-2xl bg-white p-6 shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-100"
    >
      {/* Icon or category indicator */}
      {Icon && (
        <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color || 'from-gray-400 to-gray-500'} text-white shadow-md`}>
          <Icon className="h-6 w-6" />
        </div>
      )}

      {/* Question text */}
      <p className="mb-6 text-lg font-medium text-gray-900 leading-relaxed">
        {prompt.prompt_text}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          onClick={() => onRecord(prompt.id, prompt.prompt_text, prompt.source || 'catalog')}
          size="lg"
          className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
        >
          <Mic className="mr-2 h-4 w-4" />
          Record
        </Button>

        {onSave && (
          <Button
            onClick={() => onSave(prompt.id, prompt.prompt_text, prompt.source || 'catalog')}
            size="lg"
            variant="outline"
            className={`${isSaved ? 'bg-orange-50 border-orange-300' : ''}`}
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-orange-500 text-orange-500' : ''}`} />
          </Button>
        )}
      </div>
    </motion.div>
  );
}

// Family prompt card with special styling
function FamilyPromptCard({
  prompt,
  onRecord
}: {
  prompt: FamilyPrompt;
  onRecord: (id: string, text: string, source: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className="group relative rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-6 border-2 border-blue-200"
    >
      {/* From badge */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-blue-600 fill-blue-600" />
          <span className="text-sm font-semibold text-blue-700">
            From {prompt.submittedBy.name}
            {prompt.submittedBy.relationship && ` • ${prompt.submittedBy.relationship}`}
          </span>
        </div>
      </div>

      {/* Question */}
      <p className="mb-6 text-lg font-medium text-gray-900 leading-relaxed">
        {prompt.prompt_text}
      </p>

      {/* Action */}
      <Button
        onClick={() => onRecord(prompt.id, prompt.prompt_text, 'family')}
        size="lg"
        className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
      >
        <MessageCircle className="mr-2 h-4 w-4" />
        Answer {prompt.submittedBy.name.split(' ')[0]}'s Question
      </Button>
    </motion.div>
  );
}

// Main component
export default function PromptsV2Page() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const modeSelection = useModeSelection();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Fetch data (same queries as before)
  const { data: queuedData, isLoading: queuedLoading } = useQuery<{ prompts: QueuedPrompt[] }>({
    queryKey: ["/api/prompts/queued"],
    enabled: !!user,
  });

  const { data: activeData, isLoading: activeLoading } = useQuery<{ prompts: ActivePrompt[] }>({
    queryKey: ["/api/prompts/active"],
    enabled: !!user,
  });

  const { data: familyData } = useQuery<{ prompts: FamilyPrompt[] }>({
    queryKey: ["/api/prompts/family-submitted"],
    enabled: !!user,
    retry: false, // Don't retry if the endpoint doesn't exist
    meta: {
      errorHandler: false // Suppress error notifications
    }
  });

  const { data: userProfile } = useQuery<{ user: { name: string } }>({
    queryKey: ["/api/user/profile"],
    enabled: !!user,
  });

  // Get user's first name
  const firstName = userProfile?.user?.name?.split(' ')[0]
    || user?.user_metadata?.name?.split(' ')[0]
    || user?.user_metadata?.full_name?.split(' ')[0]
    || user?.email?.split('@')[0]
    || 'You';

  // Mutations
  const queueMutation = useMutation({
    mutationFn: ({ promptId, source, text }: any) =>
      apiRequest(`/api/prompts/queue`, {
        method: "POST",
        body: JSON.stringify({ promptId, source, text }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts/queued"] });
      toast({
        title: "Saved for later",
        description: "You can find this prompt in your saved section",
      });
    },
  });

  const handleRecord = (promptId: string, promptText: string, source: string) => {
    if (source === 'ai') {
      sessionStorage.setItem("activePromptId", promptId);
    }
    modeSelection.openModal(promptText);
  };

  const handleSave = (id: string, text: string, source: string) => {
    queueMutation.mutate({ promptId: id, source, text });
  };

  // Data
  const queuedPrompts = queuedData?.prompts || [];
  const activePrompts = activeData?.prompts || [];
  const familyPrompts = familyData?.prompts || [];

  // Get featured prompt (first active or queued)
  const featuredPrompt = activePrompts[0] || queuedPrompts[0] || {
    id: 'default',
    prompt_text: "What's a smell that instantly takes you back to childhood?",
    context_note: "Sensory memories are often the most vivid and can unlock forgotten stories.",
    source: 'catalog'
  };

  // Get quick start prompts (next 3)
  const quickStartPrompts = [...activePrompts.slice(1, 4), ...queuedPrompts.slice(0, 3)].slice(0, 3);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-gray-600">Please sign in to view your prompts</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-rose-50 flex">
      {/* Left Sidebar */}
      {isDesktop && <LeftSidebar />}

      {/* Main content */}
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-40">
          <div className="px-6 py-6" style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Image
                  src="/h-whiper.png"
                  alt="Heritage Whisper"
                  width={40}
                  height={40}
                  className="h-10 w-auto"
                />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Welcome back, {firstName}!
                  </h1>
                  <p className="text-base text-gray-600 mt-1">
                    Choose a question below to record your next memory
                  </p>
                </div>
              </div>

              {/* Help button */}
              <Button
                variant="ghost"
                size="lg"
                onClick={() => setShowHelp(!showHelp)}
                className="text-gray-600 hover:text-gray-900"
              >
                <HelpCircle className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Help overlay */}
        <AnimatePresence>
          {showHelp && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-blue-50 border-b border-blue-200 px-6 py-4"
            >
              <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
                <h3 className="font-semibold text-blue-900 mb-2">How to use this page:</h3>
                <ul className="text-blue-800 space-y-1">
                  <li>• Click "Record" on any question to start recording your story</li>
                  <li>• Click the bookmark icon to save a question for later</li>
                  <li>• Questions from family members appear in blue</li>
                  <li>• Browse categories at the bottom to find more topics</li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="px-6 py-8" style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {/* Featured Prompt */}
          <section className="mb-12">
            <FeaturedPromptCard prompt={featuredPrompt} onRecord={handleRecord} />
          </section>

          {/* Family Questions (if any) */}
          {familyPrompts.length > 0 && (
            <section className="mb-12">
              <div className="mb-6 flex items-center gap-3">
                <Heart className="h-6 w-6 text-blue-600 fill-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Your Family Wants to Know
                </h2>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                  {familyPrompts.length} {familyPrompts.length === 1 ? 'question' : 'questions'}
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {familyPrompts.map((prompt) => (
                  <FamilyPromptCard
                    key={prompt.id}
                    prompt={prompt}
                    onRecord={handleRecord}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Quick Start */}
          {quickStartPrompts.length > 0 && (
            <section className="mb-12">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Quick Start
                </h2>
                <p className="text-gray-600">
                  Easy questions to get you started
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {quickStartPrompts.map((prompt) => (
                  <SimplePromptCard
                    key={prompt.id}
                    prompt={prompt}
                    onRecord={handleRecord}
                    onSave={handleSave}
                    isSaved={queuedPrompts.some(q => q.id === prompt.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Saved for Later */}
          {queuedPrompts.length > 0 && (
            <section className="mb-12">
              <div className="mb-6 flex items-center gap-3">
                <Bookmark className="h-6 w-6 text-orange-600 fill-orange-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Saved for Later
                </h2>
                <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700">
                  {queuedPrompts.length} saved
                </span>
              </div>

              <div className="rounded-2xl bg-orange-50/50 p-6 border border-orange-200">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {queuedPrompts.map((prompt) => (
                    <SimplePromptCard
                      key={prompt.id}
                      prompt={prompt}
                      onRecord={handleRecord}
                      onSave={handleSave}
                      isSaved={true}
                    />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Browse by Category */}
          <section>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Browse Topics
              </h2>
              <p className="text-gray-600">
                Explore questions by category
              </p>
            </div>

            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              {CATEGORIES.map((category) => {
                const Icon = category.icon;
                return (
                  <motion.button
                    key={category.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedCategory(category.id)}
                    className="group relative overflow-hidden rounded-2xl bg-white p-6 text-left shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-100"
                  >
                    <div className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${category.color} text-white shadow-md`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-gray-900">
                      {category.label}
                    </h3>
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </motion.button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Mode Selection Modal */}
        <ModeSelectionModal
          isOpen={modeSelection.isOpen}
          onClose={modeSelection.closeModal}
          onSelectQuickStory={modeSelection.openQuickRecorder}
          promptQuestion={modeSelection.promptQuestion}
        />

        {/* Quick Story Recorder */}
        <QuickStoryRecorder
          isOpen={modeSelection.quickRecorderOpen}
          onClose={modeSelection.closeQuickRecorder}
          promptQuestion={modeSelection.promptQuestion}
        />

        {/* Category Modal */}
        <Dialog open={!!selectedCategory} onOpenChange={() => setSelectedCategory(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {selectedCategory && CATEGORIES.find(c => c.id === selectedCategory)?.label} Questions
              </DialogTitle>
            </DialogHeader>
            <div className="mt-6 grid gap-4">
              {selectedCategory && CATEGORY_PROMPTS[selectedCategory]?.map((question, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <SimplePromptCard
                    prompt={{
                      id: `${selectedCategory}-${index}`,
                      prompt_text: question,
                      source: 'catalog'
                    }}
                    icon={CATEGORIES.find(c => c.id === selectedCategory)?.icon}
                    color={CATEGORIES.find(c => c.id === selectedCategory)?.color}
                    onRecord={(id, text) => {
                      handleRecord(id, text, 'catalog');
                      setSelectedCategory(null);
                    }}
                    onSave={(id, text) => {
                      handleSave(id, text, 'catalog');
                    }}
                  />
                </motion.div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}