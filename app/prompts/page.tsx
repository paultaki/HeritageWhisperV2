"use client";

// Prevent static generation for this page
export const dynamic = 'force-dynamic';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useAccountContext } from "@/hooks/use-account-context";
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
  Utensils,
  X,
  Lightbulb
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { DesktopPageHeader, MobilePageHeader } from "@/components/PageHeader";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useModeSelection } from "@/hooks/use-mode-selection";
import { ModeSelectionModal } from "@/components/recording/ModeSelectionModal";
import { QuickStoryRecorder } from "@/components/recording/QuickStoryRecorder";
import { useMediaQuery } from "@/hooks/use-media-query";
import { motion, AnimatePresence } from "framer-motion";
import { AccountSwitcher } from "@/components/AccountSwitcher";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

// Local widened types for guards
type AccountContextExtended = {
  activeContext?: any;
  isOwnAccount?: boolean;
  canInvite?: boolean;
  permissionLevel?: string;
  [k: string]: unknown;
};

type UserWithMetadata = {
  id?: string;
  email?: string;
  user_metadata?: {
    name?: string;
    full_name?: string;
    [k: string]: unknown;
  };
  [k: string]: unknown;
};

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

// Category data with icons and colors (using heritage design guidelines - solid premium colors)
const CATEGORIES = [
  { id: 'childhood', label: 'Childhood', icon: Baby, color: '#203954', hoverColor: '#2d4d6e' },
  { id: 'school', label: 'School Days', icon: GraduationCap, color: '#3E6A5A', hoverColor: '#4f7d6b' },
  { id: 'work', label: 'Work & Career', icon: Briefcase, color: '#CBA46A', hoverColor: '#d4b07d' },
  { id: 'family', label: 'Family Life', icon: Home, color: '#203954', hoverColor: '#2d4d6e' },
  { id: 'places', label: 'Places & Travel', icon: MapPin, color: '#3E6A5A', hoverColor: '#4f7d6b' },
  { id: 'hobbies', label: 'Hobbies & Interests', icon: Music, color: '#CBA46A', hoverColor: '#d4b07d' },
  { id: 'food', label: 'Food & Traditions', icon: Utensils, color: '#3E6A5A', hoverColor: '#4f7d6b' },
  { id: 'milestones', label: 'Life Milestones', icon: Star, color: '#CBA46A', hoverColor: '#d4b07d' },
];

// Featured prompt card component
function FeaturedPromptCard({ prompt, onRecord }: { prompt: any; onRecord: (id: string, text: string, source: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl p-8 md:p-12"
      style={{ background: 'linear-gradient(135deg, #EBF4FF 0%, #FFFDF7 50%, #FFF4E6 100%)' }}
    >
      {/* Decorative elements */}
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-15 blur-3xl" style={{ background: 'linear-gradient(135deg, #2C5282 0%, #4A90E2 100%)' }} />
      <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full opacity-15 blur-3xl" style={{ background: 'linear-gradient(135deg, #ED8936 0%, #F6AD55 100%)' }} />

      <div className="relative">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 backdrop-blur border-2" style={{ backgroundColor: 'rgba(255, 253, 247, 0.9)', borderColor: '#ED8936' }}>
          <Sparkles className="h-5 w-5" style={{ color: '#ED8936' }} />
          <span className="text-base font-semibold" style={{ color: '#2C5282' }}>Today's Featured Question</span>
        </div>

        {/* Question */}
        <h2 className="mb-4 text-3xl md:text-4xl font-semibold leading-relaxed" style={{ color: '#1A202C' }}>
          {prompt.prompt_text}
        </h2>

        {/* Context if available */}
        {prompt.context_note && (
          <p className="mb-8 text-xl" style={{ color: '#4A5568' }}>
            {prompt.context_note}
          </p>
        )}

        {/* Action button */}
        <Button
          onClick={() => onRecord(prompt.id, prompt.prompt_text, prompt.source)}
          size="lg"
          className="text-white shadow-lg hover:shadow-xl transition-all duration-200 text-base md:text-lg px-6 md:px-8 py-4 md:py-6 rounded-2xl h-auto border-0"
          style={{ background: '#2C5282' }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#3D68A0'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#2C5282'}
        >
          <Mic className="mr-2 md:mr-3 h-5 w-5 md:h-6 md:w-6 flex-shrink-0" />
          <span>Record Your Answer</span>
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
      className="group relative rounded-2xl bg-white p-4 shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-100"
    >
      {/* Icon or category indicator */}
      {Icon && (
        <div className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color || 'from-gray-400 to-gray-500'} text-white shadow-md`}>
          <Icon className="h-6 w-6" />
        </div>
      )}

      {/* Question text */}
      <p className="mb-4 text-lg font-medium text-gray-900 leading-relaxed">
        {prompt.prompt_text}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        {onSave && (
          <Button
            onClick={() => onSave(prompt.id, prompt.prompt_text, prompt.source || 'catalog')}
            size="lg"
            variant="outline"
            className={`flex-shrink-0 w-12 h-12 p-0 flex items-center justify-center ${isSaved ? 'border-2' : ''}`}
            style={isSaved ? { backgroundColor: '#FFF4E6', borderColor: '#ED8936' } : { borderColor: '#E2E8F0' }}
          >
            <Bookmark className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} style={isSaved ? { color: '#ED8936' } : { color: '#718096' }} />
          </Button>
        )}

        <Button
          onClick={() => onRecord(prompt.id, prompt.prompt_text, prompt.source || 'catalog')}
          size="lg"
          className="flex-1 text-white text-lg md:text-xl py-4 md:py-5 px-6 md:px-8 h-auto font-medium rounded-full border-0"
          style={{ background: '#2C5282' }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#3D68A0'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#2C5282'}
        >
          <Mic className="mr-2 md:mr-2.5 h-5 md:h-6 w-5 md:w-6 flex-shrink-0" />
          <span className="whitespace-nowrap">Record</span>
        </Button>
      </div>
    </motion.div>
  );
}

// Family prompt card with special styling
function FamilyPromptCard({
  prompt,
  onRecord,
  onDismiss
}: {
  prompt: FamilyPrompt;
  onRecord: (id: string, text: string, source: string) => void;
  onDismiss: (id: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className="group relative rounded-2xl p-6 border-2 shadow-md overflow-visible"
      style={{ background: 'linear-gradient(135deg, #EBF4FF 0%, #FFFDF7 100%)', borderColor: '#203954' }}
    >
      {/* Dismiss button - Fixed positioning */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDismiss(prompt.id);
        }}
        className="absolute -top-2 -right-2 z-10 w-8 h-8 flex items-center justify-center rounded-full transition-all shadow-md hover:shadow-lg"
        style={{ backgroundColor: '#203954', color: 'white' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#3E6A5A';
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#203954';
          e.currentTarget.style.transform = 'scale(1)';
        }}
        aria-label="Dismiss question"
        type="button"
      >
        <X className="h-4 w-4" />
      </button>

      {/* From badge - Enhanced visibility */}
      <div className="mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border-2" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderColor: '#CBA46A' }}>
          <Heart className="h-4 w-4 fill-current" style={{ color: '#CBA46A' }} />
          <span className="text-sm font-semibold" style={{ color: '#1F1F1F' }}>
            From {prompt.submittedBy.name}
            {prompt.submittedBy.relationship && ` • ${prompt.submittedBy.relationship}`}
          </span>
        </div>
      </div>

      {/* Question */}
      <p className="mb-6 text-xl font-medium leading-relaxed" style={{ color: '#1F1F1F' }}>
        {prompt.prompt_text}
      </p>

      {/* Action */}
      <Button
        onClick={() => onRecord(prompt.id, prompt.prompt_text, 'family')}
        size="lg"
        className="w-full text-white text-base py-3 md:py-4 px-4 md:px-6 h-auto border-0 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
        style={{ background: '#CBA46A' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#3E6A5A';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#CBA46A';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <MessageCircle className="mr-1.5 md:mr-2 h-4 md:h-5 w-4 md:w-5 flex-shrink-0" />
        <span>Answer {prompt.submittedBy.name.split(' ')[0]}'s Question</span>
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
  const [showSubmitQuestionDialog, setShowSubmitQuestionDialog] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [promptToDismiss, setPromptToDismiss] = useState<FamilyPrompt | null>(null);

  // V3: Get active storyteller context for family sharing
  const rawContext = useAccountContext() as AccountContextExtended;
  const { activeContext, isOwnAccount, canInvite, permissionLevel } = rawContext;
  const storytellerId = activeContext?.storytellerId || user?.id;

  // Fetch data (same queries as before)
  const { data: queuedData, isLoading: queuedLoading } = useQuery<{ prompts: QueuedPrompt[] }>({
    queryKey: ["/api/prompts/queued", storytellerId],
    queryFn: async () => {
      const url = storytellerId
        ? `/api/prompts/queued?storyteller_id=${storytellerId}`
        : "/api/prompts/queued";
      const res = await apiRequest("GET", url);
      return res.json();
    },
    enabled: !!user && !!storytellerId,
  });

  const { data: activeData, isLoading: activeLoading } = useQuery<{ prompts: ActivePrompt[] }>({
    queryKey: ["/api/prompts/active", storytellerId],
    queryFn: async () => {
      const url = storytellerId
        ? `/api/prompts/active?storyteller_id=${storytellerId}`
        : "/api/prompts/active";
      const res = await apiRequest("GET", url);
      return res.json();
    },
    enabled: !!user && !!storytellerId,
  });

  const { data: familyData } = useQuery<{ prompts: FamilyPrompt[] }>({
    queryKey: ["/api/prompts/family-submitted", storytellerId],
    queryFn: async () => {
      const url = storytellerId
        ? `/api/prompts/family-submitted?storyteller_id=${storytellerId}`
        : "/api/prompts/family-submitted";
      const res = await apiRequest("GET", url);
      return res.json();
    },
    enabled: !!user && !!storytellerId,
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
  const u = user as unknown as UserWithMetadata;
  const firstName = userProfile?.user?.name?.split(' ')[0]
    || u?.user_metadata?.name?.split(' ')[0]
    || u?.user_metadata?.full_name?.split(' ')[0]
    || u?.email?.split('@')[0]
    || 'You';

  // Mutations
  const queueMutation = useMutation({
    mutationFn: ({ promptId, source, text }: any) =>
      apiRequest("POST", `/api/prompts/queue`, {
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

  const submitQuestionMutation = useMutation({
    mutationFn: async ({
      storyteller_id,
      prompt_text,
    }: {
      storyteller_id: string;
      prompt_text: string;
    }) => {
      return apiRequest("POST", "/api/prompts/family-submit", {
        storyteller_id,
        prompt_text,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["/api/prompts/family-submitted", storytellerId],
      });
      toast({
        title: "Question submitted!",
        description: `Your question has been sent to ${activeContext?.storytellerName}`,
      });
      setShowSubmitQuestionDialog(false);
      setQuestionText("");
    },
    onError: (error: any) => {
      toast({
        title: "Unable to submit question",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const dismissFamilyPromptMutation = useMutation({
    mutationFn: async (promptId: string) => {
      console.log("Dismissing family prompt:", promptId);
      const response = await apiRequest("DELETE", `/api/prompts/family-submitted?id=${promptId}`);
      if (!response.ok) {
        const error = await response.json();
        console.error("Error dismissing prompt:", error);
        throw new Error(error.error || "Failed to dismiss prompt");
      }
      const result = await response.json();
      console.log("Successfully dismissed prompt:", result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/prompts/family-submitted", storytellerId],
      });
      toast({
        title: "Question dismissed",
        description: "The question has been removed from your list",
      });
    },
    onError: (error: any) => {
      console.error("Mutation error:", error);
      toast({
        title: "Unable to dismiss question",
        description: error?.message || "Please try again",
        variant: "destructive",
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

  const handleDismissFamilyPrompt = (promptId: string) => {
    console.log("handleDismissFamilyPrompt called with promptId:", promptId);
    const prompt = familyPrompts.find(p => p.id === promptId);
    console.log("Found prompt:", prompt);
    if (prompt) {
      setPromptToDismiss(prompt);
    } else {
      console.error("Prompt not found in familyPrompts array");
    }
  };

  const confirmDismiss = () => {
    console.log("confirmDismiss called, promptToDismiss:", promptToDismiss);
    if (promptToDismiss) {
      dismissFamilyPromptMutation.mutate(promptToDismiss.id);
      setPromptToDismiss(null);
    } else {
      console.error("No prompt to dismiss");
    }
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
    <div className="min-h-screen" style={{ background: '#F7F2EC' }}>
      {/* Desktop Header */}
      <DesktopPageHeader
        icon={Lightbulb}
        title="Story Ideas"
        showAccountSwitcher={true}
        rightContent={
          !isOwnAccount && permissionLevel === 'contributor' ? (
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowSubmitQuestionDialog(true)}
              className="text-white flex-shrink-0 border-0 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
              style={{ backgroundColor: '#203954' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3E6A5A'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#203954'}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Submit Question
            </Button>
          ) : undefined
        }
      />
      
      {/* Mobile Header */}
      <MobilePageHeader
        icon={Lightbulb}
        title="Story Ideas"
        rightContent={
          !isOwnAccount && permissionLevel === 'contributor' ? (
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowSubmitQuestionDialog(true)}
              className="text-white text-xs px-2 py-1 border-0 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
              style={{ backgroundColor: '#203954' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3E6A5A'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#203954'}
            >
              <MessageCircle className="h-3 w-3 mr-1" />
              Submit
            </Button>
          ) : undefined
        }
      />

      <div className="flex justify-center">
        {/* Main content */}
        <main className="w-full pb-24 md:pb-0 px-4 md:px-6">

        {/* Help overlay */}
        <AnimatePresence>
          {showHelp && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="border-b px-6 py-4"
              style={{ backgroundColor: '#F7F2EC', borderColor: '#203954' }}
            >
              <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
                <h3 className="font-semibold mb-2 text-lg" style={{ color: '#203954' }}>How to use this page:</h3>
                <ul className="space-y-1 text-base" style={{ color: '#1F1F1F' }}>
                  <li>• Click "Record" on any question to start recording your story</li>
                  <li>• Click the bookmark icon to save a question for later</li>
                  <li>• Questions from family members appear with special styling</li>
                  <li>• Browse categories at the bottom to find more topics</li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="py-8 max-w-7xl mx-auto">
          {/* Featured Prompt */}
          <section className="mb-12">
            <FeaturedPromptCard prompt={featuredPrompt} onRecord={handleRecord} />
          </section>

          {/* Family Questions (if any) */}
          {familyPrompts.length > 0 && (
            <section className="mb-12">
              <div className="mb-6 flex items-center gap-3">
                <Heart className="h-7 w-7 fill-current" style={{ color: '#CBA46A' }} />
                <h2 className="text-3xl font-bold" style={{ color: '#1F1F1F' }}>
                  Your Family Wants to Know
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {familyPrompts.map((prompt) => (
                  <FamilyPromptCard
                    key={prompt.id}
                    prompt={prompt}
                    onRecord={handleRecord}
                    onDismiss={handleDismissFamilyPrompt}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Quick Start */}
          {quickStartPrompts.length > 0 && (
            <section className="mb-12">
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2" style={{ color: '#1F1F1F' }}>
                  Quick Start
                </h2>
                <p className="text-lg" style={{ color: '#1F1F1F' }}>
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
                <Bookmark className="h-7 w-7 fill-current" style={{ color: '#CBA46A' }} />
                <h2 className="text-3xl font-bold" style={{ color: '#1F1F1F' }}>
                  Saved for Later
                </h2>
              </div>

              <div className="rounded-2xl p-6 border-2 shadow-sm" style={{ backgroundColor: '#FFFDF7', borderColor: '#CBA46A' }}>
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
              <h2 className="text-3xl font-bold mb-2" style={{ color: '#1F1F1F' }}>
                Browse Topics
              </h2>
              <p className="text-lg" style={{ color: '#1F1F1F' }}>
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
                    className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col items-center justify-center text-center"
                  >
                    <div
                      className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-xl text-white shadow-lg transition-all duration-300 border border-white/20"
                      style={{ backgroundColor: category.color }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = category.hoverColor;
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = category.color;
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)';
                      }}
                    >
                      <Icon className="h-7 w-7" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {category.label}
                    </h3>
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
              <DialogTitle className="text-3xl">
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

        {/* Dismiss Family Prompt Confirmation */}
        <ConfirmModal
          isOpen={!!promptToDismiss}
          title="Dismiss Question?"
          message={`Are you sure you want to dismiss this question from ${promptToDismiss?.submittedBy.name}?\n\n"${promptToDismiss?.prompt_text}"\n\nYou can always ask them to submit it again if you change your mind.`}
          confirmText="Dismiss"
          cancelText="Keep It"
          onConfirm={confirmDismiss}
          onCancel={() => setPromptToDismiss(null)}
          variant="danger"
        />

        {/* Submit Question Dialog */}
        <Dialog open={showSubmitQuestionDialog} onOpenChange={setShowSubmitQuestionDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                Submit a Question for {activeContext?.storytellerName}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="question" className="text-base font-medium">
                  Your Question <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="question"
                  placeholder="What question would you like them to answer?"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="min-h-[120px] text-base"
                  maxLength={500}
                />
                <p className="text-sm text-gray-500">
                  {questionText.length}/500 characters
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowSubmitQuestionDialog(false);
                  setQuestionText("");
                }}
                disabled={submitQuestionMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (questionText.trim().length < 10) {
                    toast({
                      title: "Question too short",
                      description: "Please write at least 10 characters",
                      variant: "destructive",
                    });
                    return;
                  }
                  if (!storytellerId) {
                    toast({
                      title: "Error",
                      description: "No storyteller selected",
                      variant: "destructive",
                    });
                    return;
                  }
                  submitQuestionMutation.mutate({
                    storyteller_id: storytellerId,
                    prompt_text: questionText,
                  });
                }}
                disabled={submitQuestionMutation.isPending}
                className="border-0 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                style={{ backgroundColor: '#203954', color: 'white' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3E6A5A'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#203954'}
              >
                {submitQuestionMutation.isPending ? "Submitting..." : "Submit Question"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
      </div>
    </div>
  );
}