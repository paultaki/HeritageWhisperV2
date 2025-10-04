import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Calendar, Users, FileText, User, Mic, Plus, BookOpen, Box } from 'lucide-react';
import RecordModal from './RecordModal';
import designSystem from '@/lib/designSystem';
import { useAuth } from '@/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { navCache } from '@/lib/navCache';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  isActive?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, href, isActive, onClick }) => {
  const [, setLocation] = useLocation();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setLocation(href);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="flex flex-col items-center justify-center py-2 px-3 flex-1 transition-all"
      style={{
        color: isActive ? designSystem.colors.primary.coral : designSystem.colors.text.secondary,
      }}
    >
      <Icon className={`w-5 h-5 mb-1 transition-transform ${isActive ? 'scale-110' : ''}`} />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
};

export default function BottomNavigation() {
  const [currentPath, setLocation] = useLocation();
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [pulseRecord, setPulseRecord] = useState(true);
  const { user } = useAuth();

  // Check if we should show the navigation (only on main app pages)
  const shouldShow = user && !['/login', '/onboarding', '/'].includes(currentPath);

  // Determine if it's been > 24hrs since last recording (would check actual data in production)
  const hasRecentRecording = false; // This would check user's last recording timestamp

  const handleRecordSave = async (recording: any) => {
    // Convert audio blob to base64 for storage in navCache
    let mainAudioBase64: string | undefined;
    let mainAudioType: string | undefined;

    if (recording.audioBlob) {
      // Converting audio blob to base64 for storage

      try {
        mainAudioBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();

          reader.onloadend = () => {
            try {
              const base64 = reader.result as string;

              const base64Data = base64.split(',')[1]; // Remove data:type;base64, prefix
              resolve(base64Data);
            } catch (err) {
              reject(err);
            }
          };

          reader.onerror = (error) => {
            reject(error);
          };

          // Start reading the blob
          reader.readAsDataURL(recording.audioBlob);
        });

        mainAudioType = recording.audioBlob.type || 'audio/webm';
      } catch (error) {
        // Failed to convert audio blob - continue without it
      }
    }

    // Navigate to the review page with the recording data
    // Store recording data in navCache for the review page
    const navData = {
      mainAudioBase64,
      mainAudioType,
      transcription: recording.transcription,
      wisdomClip: recording.wisdomClip,
      followUpQuestions: recording.followUpQuestions,
    };

    const navId = navCache.store(navData);

    setPulseRecord(false);
    setRecordModalOpen(false);

    // Navigate to review page for editing
    setLocation(`/review?nav=${navId}`);
  };

  if (!shouldShow) {
    return null;
  }

  return (
    <>
      {/* Bottom Navigation Bar */}
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t md:hidden"
        style={{
          borderTopColor: designSystem.colors.background.creamDark,
          paddingBottom: 'env(safe-area-inset-bottom)', // iOS safe area
        }}
      >
        <div className="flex items-center justify-around h-20 relative">
          {/* Timeline */}
          <NavItem
            icon={Calendar}
            label="Timeline"
            href="/timeline"
            isActive={currentPath === '/timeline'}
          />

          {/* Book View */}
          <NavItem
            icon={BookOpen}
            label="Book"
            href="/book"
            isActive={currentPath.startsWith('/book')}
          />

          {/* Record Button - Hero Center Element */}
          <div className="relative">
            <button
              onClick={() => setRecordModalOpen(true)}
              className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-110 active:scale-95"
              style={{
                background: designSystem.colors.gradients.coral,
                boxShadow: designSystem.shadows.xl,
              }}
              onMouseEnter={() => setPulseRecord(false)}
              onMouseLeave={() => setPulseRecord(true)}
            >
              {/* Pulse animation when inactive */}
              {pulseRecord && !hasRecentRecording && (
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ background: designSystem.colors.gradients.coral }}
                  animate={{
                    scale: [1, 1.3, 1.3],
                    opacity: [0.5, 0, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 0.5,
                  }}
                />
              )}

              {/* Icon */}
              <Mic className="w-6 h-6 text-white z-10" />
            </button>

            {/* Placeholder for spacing */}
            <div className="w-14 h-8" />
          </div>

          {/* Memory Box */}
          <NavItem
            icon={Box}
            label="Memories"
            href="/memory-box"
            isActive={currentPath === '/memory-box'}
          />

          {/* Profile */}
          <NavItem
            icon={User}
            label="Profile"
            href="/profile"
            isActive={currentPath === '/profile'}
          />
        </div>
      </motion.nav>

      {/* Desktop Navigation - Side Rail */}
      <motion.nav
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        className="hidden md:flex fixed left-0 top-0 h-full w-20 bg-white/95 backdrop-blur-md border-r flex-col items-center py-8 z-40"
        style={{ borderRightColor: designSystem.colors.background.creamDark }}
      >
        {/* Logo/Home */}
        <div className="mb-8 p-1">
          <img
            src="/HW_logo_mic_clean.png"
            alt="HeritageWhisper"
            className="w-12 h-12 object-contain"
            style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))' }}
          />
        </div>

        {/* Navigation Items */}
        <div className="flex-1 flex flex-col items-center space-y-6">
          <DesktopNavItem
            icon={Calendar}
            label="Timeline"
            href="/timeline"
            isActive={currentPath === '/timeline'}
          />

          <DesktopNavItem
            icon={BookOpen}
            label="Book"
            href="/book"
            isActive={currentPath.startsWith('/book')}
          />

          <DesktopNavItem
            icon={Users}
            label="Family"
            href="/family"
            isActive={currentPath === '/family'}
          />

          <DesktopNavItem
            icon={Box}
            label="Memory Box"
            href="/memory-box"
            isActive={currentPath === '/memory-box'}
          />
        </div>

        {/* Record Button */}
        <button
          onClick={() => setRecordModalOpen(true)}
          className="mb-8 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
          style={{
            background: designSystem.colors.gradients.coral,
            boxShadow: designSystem.shadows.lg,
          }}
        >
          <Plus className="w-6 h-6 text-white" />
        </button>

        {/* Profile at Bottom */}
        <DesktopNavItem
          icon={User}
          label="Profile"
          href="/profile"
          isActive={currentPath === '/profile'}
        />
      </motion.nav>

      {/* Record Modal */}
      <RecordModal
        isOpen={recordModalOpen}
        onClose={() => setRecordModalOpen(false)}
        onSave={handleRecordSave}
      />
    </>
  );
}

// Desktop Navigation Item Component
function DesktopNavItem({ icon: Icon, label, href, isActive }: NavItemProps) {
  const [, setLocation] = useLocation();
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setLocation(href)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="p-3 rounded-xl transition-all hover:bg-gray-100"
        style={{
          color: isActive ? designSystem.colors.primary.coral : designSystem.colors.text.secondary,
          background: isActive ? designSystem.colors.primary.coralLight : 'transparent',
        }}
      >
        <Icon className="w-5 h-5" />
      </button>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-800 text-white text-sm rounded whitespace-nowrap pointer-events-none z-50"
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}