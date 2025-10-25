"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Calendar,
  Users,
  FileText,
  User,
  Mic,
  Plus,
  BookOpen,
  Box,
} from "lucide-react";
import RecordModal from "./RecordModal";
import designSystem from "@/lib/designSystem";
import { useAuth } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import { navCache } from "@/lib/navCache";

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  isActive?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({
  icon: Icon,
  label,
  href,
  isActive,
  onClick,
}) => {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(href);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="flex flex-col items-center justify-center py-2 px-3 flex-1 transition-all"
      style={{
        color: isActive
          ? designSystem.colors.primary.coral
          : designSystem.colors.text.secondary,
      }}
    >
      <Icon
        className={`w-5 h-5 mb-1 transition-transform ${isActive ? "scale-110" : ""}`}
      />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
};

export default function BottomNavigation() {
  const router = useRouter();
  const currentPath = usePathname();
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [pulseRecord, setPulseRecord] = useState(true);
  const { user } = useAuth();

  // Check if we should show the navigation (only on main app pages)
  const shouldShow =
    user && !["/login", "/onboarding", "/"].includes(currentPath);

  // Determine if it's been > 24hrs since last recording (would check actual data in production)
  const hasRecentRecording = false; // This would check user's last recording timestamp

  const handleRecordSave = async (recording: any) => {
    console.log("[BottomNavigation] handleRecordSave called with:", {
      hasAudioBlob: !!recording.audioBlob,
      audioBlobSize: recording.audioBlob?.size,
      audioBlobType: recording.audioBlob?.type,
      hasTranscription: !!recording.transcription,
      transcriptionLength: recording.transcription?.length,
    });

    // Convert audio blob to base64 for storage in navCache
    let mainAudioBase64: string | undefined;
    let mainAudioType: string | undefined;

    if (recording.audioBlob) {
      console.log("[BottomNavigation] Converting audio blob to base64...");

      try {
        mainAudioBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();

          reader.onloadend = () => {
            try {
              const base64 = reader.result as string;

              const base64Data = base64.split(",")[1]; // Remove data:type;base64, prefix
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

        mainAudioType = recording.audioBlob.type || "audio/webm";
        console.log("[BottomNavigation] Audio conversion successful:", {
          base64Length: mainAudioBase64.length,
          audioType: mainAudioType,
        });
      } catch (error) {
        console.error(
          "[BottomNavigation] Failed to convert audio blob:",
          error,
        );
        // Failed to convert audio blob - continue without it
      }
    } else {
      console.warn(
        "[BottomNavigation] No audio blob provided in recording object",
      );
    }

    // Navigate to the review page with the recording data
    // Store recording data in navCache for the review page
    const navData = {
      mainAudioBase64,
      mainAudioType,
      transcription: recording.transcription,
      wisdomClip: recording.wisdomClip,
      followUpQuestions: recording.followUpQuestions,
      title: recording.title,
      storyYear: recording.year,
    };

    console.log("[BottomNavigation] Storing in NavCache:", {
      hasBase64: !!navData.mainAudioBase64,
      base64Length: navData.mainAudioBase64?.length,
      hasTranscription: !!navData.transcription,
      hasTitle: !!navData.title,
      hasYear: !!navData.storyYear,
    });

    const navId = navCache.store(navData);
    console.log("[BottomNavigation] NavCache ID:", navId);

    setPulseRecord(false);
    setRecordModalOpen(false);

    // Navigate to review page for editing
    const reviewUrl = `/review?nav=${navId}`;
    console.log("[BottomNavigation] Navigating to:", reviewUrl);
    router.push(reviewUrl);
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
        transition={{ type: "spring", damping: 20 }}
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t md:hidden"
        style={{
          borderTopColor: designSystem.colors.background.creamDark,
          paddingBottom: "env(safe-area-inset-bottom)", // iOS safe area
        }}
      >
        <div className="flex items-center justify-around h-20 relative">
          {/* Timeline */}
          <NavItem
            icon={Calendar}
            label="Timeline"
            href="/timeline"
            isActive={currentPath === "/timeline"}
          />

          {/* Book View */}
          <NavItem
            icon={BookOpen}
            label="Book"
            href="/book"
            isActive={currentPath.startsWith("/book")}
          />

          {/* Record Button - Hero Center Element */}
          <div className="relative">
            <button
              onClick={() => setRecordModalOpen(true)}
              className="absolute left-1/2 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-110 active:scale-95"
              style={{
                top: '-42px',
                transform: 'translateX(-50%)',
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
            isActive={currentPath === "/memory-box"}
          />

          {/* Profile */}
          <NavItem
            icon={User}
            label="Profile"
            href="/profile"
            isActive={currentPath === "/profile"}
          />
        </div>
      </motion.nav>

      {/* Desktop Navigation - Side Rail */}
      <motion.nav
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className="hidden md:flex fixed left-0 top-0 h-full w-20 bg-white/95 backdrop-blur-md border-r flex-col items-center py-8 z-40"
        style={{ borderRightColor: designSystem.colors.background.creamDark }}
      >
        {/* Logo/Home */}
        <div className="mb-8 p-1">
          <img
            src="/Logo Icon hw.svg"
            alt="HeritageWhisper"
            className="w-24 h-24 object-contain"
            style={{ filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))" }}
          />
        </div>

        {/* Navigation Items */}
        <div className="flex-1 flex flex-col items-center space-y-6">
          <DesktopNavItem
            icon={Calendar}
            label="Timeline"
            href="/timeline"
            isActive={currentPath === "/timeline"}
          />

          <DesktopNavItem
            icon={BookOpen}
            label="Book"
            href="/book"
            isActive={currentPath.startsWith("/book")}
          />

          <DesktopNavItem
            icon={Users}
            label="Family"
            href="/family"
            isActive={currentPath === "/family"}
          />

          <DesktopNavItem
            icon={Box}
            label="Memory Box"
            href="/memory-box"
            isActive={currentPath === "/memory-box"}
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
          isActive={currentPath === "/profile"}
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
  const router = useRouter();
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => router.push(href)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="p-3 rounded-xl transition-all hover:bg-gray-100"
        style={{
          color: isActive
            ? designSystem.colors.primary.coral
            : designSystem.colors.text.secondary,
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
