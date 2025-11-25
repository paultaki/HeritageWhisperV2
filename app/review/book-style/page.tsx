"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { BookStyleReview } from "@/components/BookStyleReview";
import { PostRecordingWizard } from "@/components/post-recording/PostRecordingWizard";
import { TranscriptionSelectionScreen } from "@/components/recording/TranscriptionSelectionScreen";
import { type StoryPhoto } from "@/components/MultiPhotoUploader";
import { type PostRecordingData, type RecordingSession } from "@/types/recording";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { navCache } from "@/lib/navCache";
import { supabase } from "@/lib/supabase";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

// Local widened NavCache payload type
type NavPayloadExtended = {
  returnPath?: string;
  lessonLearned?: string;
  timestamp?: string | number;
  transcription?: string;
  textBody?: string; // Text-only story content
  recordingMode?: "audio" | "text" | "photo_audio"; // How the story was created
  title?: string;
  storyYear?: string;
  wisdomClipText?: string;
  wisdomTranscription?: string;
  mainAudioBase64?: string;
  mainAudioType?: string;
  audioUrl?: string;
  audioDuration?: number;
  mode?: string;
  audioBlob?: Blob;
  duration?: number;
  rawTranscript?: string;
  qaPairs?: any;
  enhancedTranscript?: string;
  photos?: StoryPhoto[];
  lessonOptions?: {
    practical?: string;
    emotional?: string;
    character?: string;
  };
  [k: string]: unknown;
};

// Local User type to guard birthYear access
type UserWithBirthYear = {
  birthYear?: number;
  [k: string]: unknown;
};

function BookStyleReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if we're editing an existing story
  // Support both 'edit' and 'id' parameters for compatibility
  const editId = searchParams.get("edit") || searchParams.get("id");
  const isEditing = !!editId;

  // Check what mode we're in
  const mode = searchParams.get("mode");
  const isWizardMode = mode === "wizard";
  const isTranscriptionSelectMode = mode === "transcription-select";
  const navId = searchParams.get("nav");

  // Get returnPath from URL parameters (where to go back after editing)
  const urlReturnPath = searchParams.get("returnPath");

  // Get data from URL params (passed from recording page)
  const [title, setTitle] = useState("");
  const [storyYear, setStoryYear] = useState("");
  const [storyMonth, setStoryMonth] = useState("");
  const [storyDay, setStoryDay] = useState("");
  const [transcription, setTranscription] = useState("");
  const [photos, setPhotos] = useState<StoryPhoto[]>([]);
  const [wisdomText, setWisdomText] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [mainAudioBlob, setMainAudioBlob] = useState<Blob | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [returnPath, setReturnPath] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [storyNotFound, setStoryNotFound] = useState(false);
  const [nextNavId, setNextNavId] = useState<string | null>(null);
  const [storyIndex, setStoryIndex] = useState<number | null>(null);
  const [totalStories, setTotalStories] = useState<number | null>(null);

  const handleAudioChange = (url: string | null, blob?: Blob | null) => {
    setAudioUrl(url);
    if (blob) {
      setMainAudioBlob(blob);
    }
  };

  useEffect(() => {
    const fetchStoryData = async () => {
      if (!editId) return;

      // Don't fetch if auth is still loading or user is not available
      if (isAuthLoading || !user) {
        return;
      }

      setIsLoading(true);
      try {
        // Set returnPath from URL if provided
        if (urlReturnPath) {
          setReturnPath(urlReturnPath);
        }

        const response = await apiRequest("GET", `/api/stories/${editId}`);
        const { story } = await response.json();

        // Populate form with existing story data
        setTitle(story.title || "");
        // For text-only stories, use textBody; otherwise use transcription
        setTranscription(story.textBody || story.transcription || story.content || "");
        setStoryYear(
          story.storyYear?.toString() || story.year?.toString() || "",
        );

        // Parse storyDate if available to extract month and day
        if (story.storyDate) {
          const date = new Date(story.storyDate);
          setStoryMonth((date.getMonth() + 1).toString()); // 0-indexed, so add 1
          setStoryDay(date.getDate().toString());
        }

        setWisdomText(
          story.wisdomClipText || story.wisdomTranscription || "",
        );
        setAudioUrl(story.audioUrl || null);

        // Handle photos
        if (story.photos && Array.isArray(story.photos)) {
          setPhotos(story.photos);
        } else if (story.photoUrl) {
          setPhotos([
            {
              id: "legacy",
              url: story.photoUrl,
              transform: story.photoTransform,
            },
          ]);
        }
      } catch (error) {
        console.error("Failed to fetch story:", error);

        // If story not found (404), redirect to timeline
        if (error instanceof Error &&
          (error.message.toLowerCase().includes("not found") ||
            error.message.toLowerCase().includes("unauthorized"))) {
          console.warn("[Edit Mode] Story not found or unauthorized, redirecting to timeline");
          setStoryNotFound(true);
          toast({
            title: "Story not found",
            description: "This story may have been deleted or you don't have access. Redirecting...",
            variant: "destructive",
          });
          // Redirect to timeline instead of staying on broken edit page
          setTimeout(() => {
            router.push("/timeline");
          }, 1000);
          return;
        }

        // For other errors, show generic error
        toast({
          title: "Error loading story",
          description: "Failed to load the story data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isEditing) {
      fetchStoryData();
    } else if (!isWizardMode && !isTranscriptionSelectMode) {
      // PRIORITY 1: Check NavCache first (most reliable for new recordings)
      // SKIP this if wizard mode OR transcription-select mode - they handle their own NavCache loading
      const navId = searchParams.get("nav");
      if (navId) {
        const rawCached = navCache.get(navId); // Use get instead of consume for now
        const cachedData = rawCached as NavPayloadExtended;

        if (cachedData) {

          // For edit mode coming from transcription selection, use the selected transcript
          if (mode === "edit") {
            const selectedTranscript = (cachedData.useEnhanced
              ? (cachedData.enhancedTranscript || cachedData.originalTranscript || cachedData.transcription || "")
              : (cachedData.originalTranscript || cachedData.transcription || "")) as string;

            setTranscription(selectedTranscript);

            // Load audio blob if available
            if (cachedData.audioBlob) {
              const url = URL.createObjectURL(cachedData.audioBlob);
              setMainAudioBlob(cachedData.audioBlob);
              setAudioUrl(url);
            }

            // Set duration
            if (cachedData.duration) {
              setAudioDuration(cachedData.duration);
            }

            // Load photos if available
            if (cachedData.photos && Array.isArray(cachedData.photos)) {
              setPhotos(cachedData.photos);
            }

            // Load lesson options if available
            if (cachedData.lessonLearned) {
              setWisdomText(cachedData.lessonLearned);
            } else if (cachedData.lessonOptions?.practical) {
              setWisdomText(cachedData.lessonOptions.practical);
            } else if (cachedData.wisdomClipText) {
              setWisdomText(cachedData.wisdomClipText);
            }

            // Load title if available
            if (cachedData.title) {
              setTitle(cachedData.title);
            }

            // Consume the cache now that we've loaded it
            navCache.consume(navId);

            // Skip further audio/wisdom processing since we handled it above
            return;
          } else if (cachedData.transcription) {
            // Legacy support for old flow
            setTranscription(cachedData.transcription as string);
          } else if (cachedData.originalTranscript) {
            setTranscription(cachedData.originalTranscript as string);
          } else if (cachedData.textBody) {
            // Text-only mode: use textBody as the transcription
            setTranscription(cachedData.textBody as string);
          }

          if (cachedData.title) {
            setTitle(cachedData.title);
          }
          if (cachedData.storyYear) {
            setStoryYear(cachedData.storyYear);
          }
          if (cachedData.wisdomClipText || cachedData.wisdomTranscription) {
            const wisdom =
              cachedData.wisdomClipText || cachedData.wisdomTranscription || "";
            setWisdomText(wisdom);
          }
          if (cachedData.returnPath) {
            setReturnPath(cachedData.returnPath);
          }

          // Handle photo from recording flow
          // Recording flow stores: photoUrl (blob URL) and photoFile (File object)
          // We need to convert to photos array format expected by the UI
          if (cachedData.photoUrl && cachedData.photoFile) {
            const photoFromRecording: StoryPhoto = {
              id: `recording-photo-${Date.now()}`,
              url: cachedData.photoUrl as string,
              // Note: photoFile is stored in cachedData but we use the blob URL for preview
              // The actual file will be uploaded when the story is saved
            };
            setPhotos([photoFromRecording]);
          }

          // Handle multi-story flow
          if (cachedData.nextNavId) {
            setNextNavId(cachedData.nextNavId as string);
          }
          if (cachedData.storyIndex) {
            setStoryIndex(cachedData.storyIndex as number);
          }
          if (cachedData.totalStories) {
            setTotalStories(cachedData.totalStories as number);
          }

          // Handle audio - convert base64 back to blob if available
          if (cachedData.mainAudioBase64 && cachedData.mainAudioType) {
            try {
              const binaryString = atob(cachedData.mainAudioBase64);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const blob = new Blob([bytes], {
                type: cachedData.mainAudioType,
              });
              const url = URL.createObjectURL(blob);
              setMainAudioBlob(blob);
              setAudioUrl(url);
            } catch (err) {
              console.error("[Review] Failed to convert base64 to blob:", err);
            }
          } else if (cachedData.audioUrl) {
            setAudioUrl(cachedData.audioUrl);
          }

          // Set audio duration from cache if available
          if (cachedData.audioDuration) {
            setAudioDuration(cachedData.audioDuration);
          }

          return; // Data loaded from cache, skip other sources
        } else {
          console.warn("[Review] No data found in NavCache for ID:", navId);
        }
      }
    }

    if (!isWizardMode && !isTranscriptionSelectMode && !navId) {

      // PRIORITY 2: Fall back to URL search params
      const urlTranscription = searchParams.get("transcription");
      const urlAudioUrl = searchParams.get("audioUrl");
      const urlTitle = searchParams.get("title");
      const urlYear = searchParams.get("year");
      const urlDuration = searchParams.get("duration");

      if (urlTranscription) {
        setTranscription(decodeURIComponent(urlTranscription));
      }
      if (urlAudioUrl) {
        setAudioUrl(decodeURIComponent(urlAudioUrl));
      }
      if (urlTitle) {
        setTitle(decodeURIComponent(urlTitle));
      }
      if (urlYear) {
        setStoryYear(urlYear);
      }

      // PRIORITY 3: Try to retrieve audio blob from session storage
      const storedAudioData = sessionStorage.getItem("recordedAudio");
      if (storedAudioData) {
        // When converting data URL to Blob, we need to preserve the MIME type
        fetch(storedAudioData)
          .then((res) => res.blob())
          .then((blob) => {
            // Extract MIME type from data URL if it's a data URL
            let mimeType = "audio/webm"; // default
            if (storedAudioData.startsWith("data:")) {
              const mimeMatch = storedAudioData.match(/data:([^;]+);/);
              if (mimeMatch) {
                mimeType = mimeMatch[1];
              }
            }
            // Create a new Blob with the correct MIME type
            const typedBlob = new Blob([blob], { type: mimeType });
            setMainAudioBlob(typedBlob);
          })
          .catch(console.error);
      }
    }
  }, [searchParams, editId, isEditing, toast, urlReturnPath, user, isAuthLoading, router]);

  // Handle NavCache errors in wizard mode
  useEffect(() => {
    if (isWizardMode && navId) {
      const cachedData = navCache.get(navId);
      if (!cachedData) {
        console.error("[Wizard Mode] No data found in NavCache");
        toast({
          title: "Error",
          description: "Recording data not found. Please try recording again.",
          variant: "destructive",
        });
        router.push("/timeline");
      }
    }
  }, [isWizardMode, navId, toast, router]);

  // Redirect to login if not authenticated (wait for auth to finish loading)
  useEffect(() => {
    if (!isAuthLoading && !user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to continue.",
        variant: "destructive",
      });
      router.push("/auth/login");
    }
  }, [user, isAuthLoading, router, toast]);

  const saveMutation = useMutation({
    mutationFn: async () => {

      // Calculate age at the time of the story
      const age =
        user?.birthYear && storyYear
          ? parseInt(storyYear) - user.birthYear
          : null;

      // Get source prompt ID if this story was triggered by a prompt
      const sourcePromptId = sessionStorage.getItem("activePromptId");

      // For NEW stories with blob photos or audio, we need to create the story first, then upload media
      const hasNewPhotos =
        !isEditing && photos.some((p) => p.url?.startsWith("blob:"));
      const hasNewAudio = mainAudioBlob && audioUrl?.startsWith("blob:");

      if (!isEditing && (hasNewPhotos || hasNewAudio)) {
        // Calculate actual audio duration from blob if needed
        let actualDuration = audioDuration;
        if (hasNewAudio && mainAudioBlob && (!actualDuration || actualDuration < 1)) {
          try {
            const audioBlobUrl = URL.createObjectURL(mainAudioBlob);
            const audio = new Audio(audioBlobUrl);

            // Wait for metadata to load to get duration
            await new Promise((resolve, reject) => {
              audio.addEventListener('loadedmetadata', () => {
                actualDuration = Math.round(audio.duration);
                URL.revokeObjectURL(audioBlobUrl);
                resolve(actualDuration);
              });
              audio.addEventListener('error', (e) => {
                console.error("Failed to load audio metadata:", e);
                URL.revokeObjectURL(audioBlobUrl);
                reject(e);
              });
              // Timeout after 5 seconds
              setTimeout(() => {
                URL.revokeObjectURL(audioBlobUrl);
                reject(new Error("Audio metadata loading timeout"));
              }, 5000);
            });
          } catch (err) {
            console.error("Error calculating audio duration:", err);
            // Keep the original audioDuration value or default to 0
          }
        }

        // Construct storyDate if we have year, month, and day
        let storyDate: string | undefined = undefined;
        if (storyYear && storyMonth && storyDay) {
          try {
            storyDate = new Date(parseInt(storyYear), parseInt(storyMonth) - 1, parseInt(storyDay)).toISOString();
          } catch (e) {
            console.error("Failed to construct storyDate:", e);
          }
        }

        // Step 1: Create the story WITHOUT media to get an ID
        const tempStoryData: any = {
          title: title || `Memory from ${storyYear || "the past"}`,
          transcription,
          storyYear: parseInt(storyYear) || new Date().getFullYear(),
          lifeAge: age,
          includeInTimeline: true,
          includeInBook: true,
          isFavorite: false,
          audioUrl: null, // Will be set after upload
          wisdomClipText: wisdomText || "", // Ensure it's always a string
          durationSeconds: actualDuration && actualDuration >= 1 ? Math.round(actualDuration) : 1, // Minimum 1 second (database constraint)
          sourcePromptId: sourcePromptId || null, // Track which prompt generated this story
        };

        // Only include storyDate if it's defined (not null)
        if (storyDate) {
          tempStoryData.storyDate = storyDate;
        }

        const createResponse = await apiRequest(
          "POST",
          "/api/stories",
          tempStoryData,
        );
        if (!createResponse.ok) {
          const error = await createResponse.json();
          throw new Error(error.error || "Failed to create story");
        }

        const { story: createdStory } = await createResponse.json();
        const newStoryId = createdStory.id;

        let finalAudioUrl = null;

        // Step 2: Upload audio if available
        if (hasNewAudio) {
          try {
            const formData = new FormData();

            // If it's a File object, it has its own name and type
            if (mainAudioBlob instanceof File) {
              // Directly append the file without wrapping it
              formData.append("audio", mainAudioBlob, mainAudioBlob.name);
            } else if (mainAudioBlob) {
              // For recorded audio (Blob), use default filename
              formData.append("audio", mainAudioBlob, "recording.webm");
            }

            // Get auth token
            const {
              data: { session },
            } = await supabase.auth.getSession();

            // Direct fetch to bypass potential apiRequest issues with FormData
            const uploadResponse = await fetch("/api/upload/audio", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${session?.access_token}`,
                // Do NOT set Content-Type - let browser set it for FormData
              },
              body: formData,
            });
            if (uploadResponse.ok) {
              const { url } = await uploadResponse.json();
              finalAudioUrl = url;
            } else {
              console.error("Audio upload failed:", uploadResponse.status);
              const error = await uploadResponse.text();
              console.error("Upload error:", error);
            }
          } catch (error) {
            console.error("Audio upload failed:", error);
          }
        }

        // Step 3: Upload photos if available
        for (let i = 0; i < photos.length; i++) {
          const photo = photos[i];
          const pendingFile = photo.file || (window as any)[`__pendingPhotoFile_${i}`];

          if (pendingFile && photo.url?.startsWith("blob:")) {
            try {
              const fileExtension = pendingFile.name.split(".").pop() || "jpg";

              // Get upload URL
              const uploadUrlResponse = await apiRequest(
                "POST",
                "/api/objects/upload",
                {
                  fileType: "photo",
                  storyId: newStoryId,
                  fileExtension: fileExtension,
                },
              );

              if (!uploadUrlResponse.ok) {
                throw new Error("Failed to get upload URL");
              }

              const { uploadURL, filePath } = await uploadUrlResponse.json();

              // Upload file to storage
              const uploadResponse = await fetch(uploadURL, {
                method: "PUT",
                body: pendingFile,
                headers: {
                  "Content-Type":
                    pendingFile.type || "application/octet-stream",
                },
              });

              if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                console.error(
                  `Photo upload failed with status ${uploadResponse.status}:`,
                  errorText,
                );
                throw new Error(
                  `Failed to upload photo: ${uploadResponse.status}`,
                );
              }

              // Add photo to story using the API
              const addPhotoResponse = await apiRequest(
                "POST",
                `/api/stories/${newStoryId}/photos`,
                {
                  filePath,
                  isHero: photo.isHero,
                  transform: photo.transform,
                  width: photo.width,
                  height: photo.height,
                },
              );

              if (!addPhotoResponse.ok) {
                const errorText = await addPhotoResponse.text();
                console.error(
                  `Failed to add photo ${i} to story:`,
                  addPhotoResponse.status,
                  errorText,
                );
              }

              // Clean up
              if (photo.url) URL.revokeObjectURL(photo.url);
              delete (window as any)[`__pendingPhotoFile_${i}`];
            } catch (error) {
              console.error(`Photo ${i} upload failed:`, error);
            }
          }
        }

        // Step 4: Update story with audio URL if uploaded
        if (finalAudioUrl) {
          // IMPORTANT: Only update the audioUrl field, don't overwrite entire metadata
          const updateResponse = await apiRequest(
            "GET",
            `/api/stories/${newStoryId}`,
          );
          if (updateResponse.ok) {
            const { story: currentStory } = await updateResponse.json();

            // Use current story data and only update the audioUrl
            await apiRequest("PUT", `/api/stories/${newStoryId}`, {
              title: currentStory.title,
              transcription: currentStory.transcription,
              storyYear: currentStory.storyYear,
              lifeAge: currentStory.lifeAge,
              includeInTimeline: currentStory.includeInTimeline,
              includeInBook: currentStory.includeInBook,
              isFavorite: currentStory.isFavorite,
              wisdomClipText: currentStory.wisdomClipText || "", // Ensure it's always a string
              durationSeconds: currentStory.durationSeconds,
              audioUrl: finalAudioUrl, // THIS is the only field we're updating
              photos: currentStory.photos || [],
            });
          }
        }

        return { story: { id: newStoryId } };
      }

      // For EDITING or stories without new media, use standard save
      let finalAudioUrl = audioUrl;
      if (mainAudioBlob && audioUrl?.startsWith("blob:")) {
        try {
          const formData = new FormData();

          // CRITICAL FIX: Ensure the blob has a proper MIME type
          let audioToUpload = mainAudioBlob;

          // If the blob doesn't have a type or it's text/plain, we need to fix it
          if (!mainAudioBlob.type || mainAudioBlob.type.startsWith("text/")) {
            // Try to determine the correct MIME type from the filename if it's a File
            let mimeType = "audio/webm"; // default fallback
            if (mainAudioBlob instanceof File) {
              const ext = mainAudioBlob.name.split(".").pop()?.toLowerCase();
              const mimeMap: Record<string, string> = {
                mp3: "audio/mpeg",
                wav: "audio/wav",
                webm: "audio/webm",
                m4a: "audio/mp4",
                ogg: "audio/ogg",
              };
              mimeType = mimeMap[ext || ""] || "audio/webm";
            }

            // Create a new blob with the correct MIME type
            audioToUpload = new Blob([mainAudioBlob], { type: mimeType });
          }

          // If it's a File object, it has its own name and type
          if (mainAudioBlob instanceof File) {
            // Use the original filename
            formData.append("audio", audioToUpload, mainAudioBlob.name);
          } else {
            // For recorded audio (Blob), use default filename
            formData.append("audio", audioToUpload, "recording.webm");
          }

          // Get auth token
          const {
            data: { session },
          } = await supabase.auth.getSession();

          // Direct fetch to bypass potential apiRequest issues with FormData
          const uploadResponse = await fetch("/api/upload/audio", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
              // Do NOT set Content-Type - let browser set it for FormData
            },
            body: formData,
          });
          if (uploadResponse.ok) {
            const { url } = await uploadResponse.json();
            finalAudioUrl = url;
          } else {
            console.error("Audio upload failed:", uploadResponse.status);
            const error = await uploadResponse.text();
            console.error("Upload error:", error);
          }
        } catch (error) {
          console.error("Failed to upload audio:", error);
        }
      }

      // Upload blob photos before saving
      const finalPhotos = [];

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        const pendingFile = photo.file || (window as any)[`__pendingPhotoFile_${i}`];

        // If it's a blob URL, upload it first
        if (photo.url?.startsWith("blob:") && pendingFile) {
          try {
            const fileExtension = pendingFile.name.split(".").pop() || "jpg";

            // Get upload URL
            const uploadUrlResponse = await apiRequest(
              "POST",
              "/api/objects/upload",
              {
                fileType: "photo",
                storyId: editId,
                fileExtension: fileExtension,
              },
            );

            if (!uploadUrlResponse.ok) {
              throw new Error("Failed to get upload URL");
            }

            const { uploadURL, filePath } = await uploadUrlResponse.json();

            // Upload file to storage
            const uploadResponse = await fetch(uploadURL, {
              method: "PUT",
              body: pendingFile,
              headers: {
                "Content-Type": pendingFile.type || "application/octet-stream",
              },
            });

            if (!uploadResponse.ok) {
              throw new Error(
                `Failed to upload photo: ${uploadResponse.status}`,
              );
            }

            // Add photo to story using the API
            const photoResponse = await apiRequest(
              "POST",
              `/api/stories/${editId}/photos`,
              {
                filePath: filePath, // Changed from 'url' to 'filePath'
                isHero: photo.isHero || false, // Changed from 'isPrimary' to 'isHero'
                transform: photo.transform || {
                  zoom: 1,
                  position: { x: 0, y: 0 },
                },
                width: photo.width,
                height: photo.height,
              },
            );

            if (photoResponse.ok) {
              const { photo: savedPhoto } = await photoResponse.json();
              finalPhotos.push(savedPhoto);
            }

            // Clean up
            if (photo.url) URL.revokeObjectURL(photo.url);
            delete (window as any)[`__pendingPhotoFile_${i}`];
          } catch (error) {
            console.error(`Failed to upload photo ${i}:`, error);
          }
        } else if (photo.url && !photo.url.startsWith("blob:")) {
          // Keep existing photos that are not blob URLs
          // Remove the file property if it exists (shouldn't be in DB)
          const { file, ...photoWithoutFile } = photo;
          finalPhotos.push(photoWithoutFile);
        }
      }

      // Construct storyDate if we have year, month, and day
      let storyDate: string | undefined = undefined;
      if (storyYear && storyMonth && storyDay) {
        try {
          storyDate = new Date(parseInt(storyYear), parseInt(storyMonth) - 1, parseInt(storyDay)).toISOString();
        } catch (e) {
          console.error("Failed to construct storyDate:", e);
        }
      }

      const storyData: any = {
        title: title || `Memory from ${storyYear || "the past"}`,
        transcription,
        storyYear: parseInt(storyYear) || new Date().getFullYear(),
        lifeAge: age,
        includeInTimeline: true,
        includeInBook: true,
        isFavorite: false,
        photos: finalPhotos,
        audioUrl: finalAudioUrl,
        wisdomClipText: wisdomText || "", // Ensure it's always a string
        durationSeconds: audioDuration && audioDuration >= 1 ? Math.round(audioDuration) : 1, // Minimum 1 second (database constraint)
        sourcePromptId: sourcePromptId || null, // Track which prompt generated this story
      };

      // Only include storyDate if it's defined (not null)
      if (storyDate) {
        storyData.storyDate = storyDate;
      }

      const url = isEditing ? `/api/stories/${editId}` : "/api/stories";
      const method = isEditing ? "PUT" : "POST";

      const response = await apiRequest(method, url, storyData);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || `Failed to ${isEditing ? "update" : "save"} story`,
        );
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: `Story ${isEditing ? "updated" : "saved"} successfully!`,
        description: `Your memory has been ${isEditing ? "updated" : "added to your timeline"}.`,
      });

      // Clear session storage
      sessionStorage.removeItem("recordedAudio");
      sessionStorage.removeItem("recordingTranscription");
      sessionStorage.removeItem("activePromptId"); // Clear prompt ID after save

      // Invalidate queries to fetch fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/prompts/next"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      queryClient.invalidateQueries({ queryKey: ["stories"] });

      // Check if we should return to book after recording from whisper
      const returnToBook = sessionStorage.getItem("returnToBook");
      const bookPageNumber = sessionStorage.getItem("bookPageNumber");

      if (returnToBook === "true" && bookPageNumber) {
        // Clean up session storage
        sessionStorage.removeItem("returnToBook");
        sessionStorage.removeItem("bookPageNumber");
        sessionStorage.removeItem("sourcePromptId");
        sessionStorage.removeItem("promptText");

        // Return to book page
        router.push(`/book?page=${bookPageNumber}`);
      } else if (nextNavId) {
        // Redirect to next story in the chain
        router.push(`/review/book-style?nav=${nextNavId}&mode=wizard`);
      } else if (returnPath || urlReturnPath) {
        // Use returnPath state or urlReturnPath directly (avoids stale closure issue)
        router.push(returnPath || urlReturnPath!);
      } else {
        // Default redirect to timeline
        router.push("/timeline");
      }
    },
    onError: (error: any) => {
      console.error("Save error:", error);

      // If story not found during save, redirect to timeline
      if (error.message &&
        (error.message.toLowerCase().includes("not found") ||
          error.message.toLowerCase().includes("unauthorized"))) {
        toast({
          title: "Story not found",
          description: "This story may have been deleted. Redirecting to timeline.",
          variant: "destructive",
        });
        setTimeout(() => router.push("/timeline"), 2000);
        return;
      }

      // Generic error message
      toast({
        title: "Failed to save story",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = async () => {
    // Validate content before attempting save
    if (!transcription?.trim()) {
      toast({
        title: "Story content required",
        description: "Please add some content to your story before saving.",
        variant: "destructive",
      });
      return;
    }

    // Note: Auth validation happens in the API route - it supports both JWT and passkey sessions
    // No need to check client-side since the API will handle both authentication methods
    saveMutation.mutate();
  };

  const handleCancel = () => {
    // Ask for confirmation if there's content
    if (transcription || title || photos.length > 0) {
      setShowCancelConfirm(true);
      return;
    }

    // Clear session storage
    sessionStorage.removeItem("recordedAudio");
    sessionStorage.removeItem("recordingTranscription");

    // Go back to where we came from (or timeline as fallback)
    router.push(returnPath || "/timeline");
  };

  const handleConfirmCancel = () => {
    // Clear session storage
    sessionStorage.removeItem("recordedAudio");
    sessionStorage.removeItem("recordingTranscription");

    // Go back to where we came from (or timeline as fallback)
    router.push(returnPath || "/timeline");
  };

  const handleDelete = async () => {
    if (!editId) return;

    try {
      const response = await apiRequest("DELETE", `/api/stories/${editId}`);
      if (response.ok) {
        toast({
          title: "Story deleted",
          description: "Your story has been deleted successfully.",
        });
        router.push("/timeline");
      } else {
        throw new Error("Failed to delete story");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Failed to delete story",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  // Show loading spinner while checking authentication
  if (isAuthLoading) {
    return (
      <div className="hw-page bg-gradient-to-b from-amber-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If story not found, show message and prevent interaction
  if (storyNotFound) {
    return (
      <div className="hw-page bg-gradient-to-b from-amber-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Story not found. Redirecting to timeline...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="hw-page bg-gradient-to-b from-amber-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading memory...</p>
        </div>
      </div>
    );
  }

  // Transcription Selection Mode: Choose original vs enhanced
  if (isTranscriptionSelectMode && navId) {
    const rawCached = navCache.get(navId);
    const cachedData = rawCached as NavPayloadExtended;

    if (!cachedData) {
      console.error("[Transcription Select Mode] No data found in NavCache");
      return (
        <div className="hw-page bg-gradient-to-b from-amber-50 to-white flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">Recording data not found</p>
            <Button onClick={() => router.push("/timeline")}>Go to Timeline</Button>
          </div>
        </div>
      );
    }

    const handleTranscriptionSelect = async (useEnhanced: boolean) => {
      // Get the actual transcription text (it should be in originalTranscript or rawTranscript)
      const transcriptionText = (cachedData.originalTranscript || cachedData.rawTranscript || "") as string;

      // Update cached data with selection and ensure transcription is set
      const updatedData = {
        ...cachedData,
        useEnhanced,
        originalTranscript: transcriptionText,
        enhancedTranscript: transcriptionText, // For now, both are the same
        selectedTranscript: transcriptionText,
      } as import('@/lib/navCache').NavPayload;

      // Save back to cache
      await navCache.set(navId, updatedData);

      // Navigate to edit memory screen (BookStyleReview) - NOT wizard
      router.push(`/review/book-style?nav=${navId}&mode=edit`);
    };

    const handleCancel = () => {
      // Clear cache and go back
      navCache.consume(navId);
      router.push("/timeline");
    };

    return (
      <div className="hw-page bg-gradient-to-b from-amber-50 to-white">
        <TranscriptionSelectionScreen
          originalTranscript={(cachedData.originalTranscript || cachedData.rawTranscript || "") as string}
          enhancedTranscript={(cachedData.enhancedTranscript || cachedData.originalTranscript || cachedData.rawTranscript || "") as string}
          isLoading={false}
          onSelect={handleTranscriptionSelect}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  // Edit Mode: Coming from transcription selection, show BookStyleReview with pre-filled data
  // Data loading will be handled by the useEffect that checks for NavCache
  // No early return needed here - let it fall through to the BookStyleReview component

  // Wizard Mode: New recording flow (DEPRECATED - keeping for backward compatibility)
  if (isWizardMode && navId) {
    const rawCached = navCache.get(navId);
    const cachedData = rawCached as NavPayloadExtended;

    if (!cachedData) {
      // Error handling moved to useEffect to avoid render-time state updates
      return null;
    }

    // Prepare RecordingSession from cached data
    const recording: RecordingSession = {
      mode: (cachedData.mode || "quick") as any,
      audioBlob: cachedData.audioBlob,
      duration: cachedData.duration || 0,
      timestamp: String(cachedData.timestamp ?? new Date().toISOString()),
      rawTranscript: cachedData.rawTranscript || "",
      qaPairs: cachedData.qaPairs,
    };

    // For conversation mode, automatically create enhanced version
    let enhancedTranscript = cachedData.enhancedTranscript || cachedData.rawTranscript || "";

    // If we have Q&A pairs and no enhanced transcript yet, we'll enhance it on the fly
    // This happens asynchronously in the wizard component
    if (cachedData.mode === "conversation" && cachedData.qaPairs && !cachedData.enhancedTranscript) {
      enhancedTranscript = cachedData.rawTranscript || ""; // Start with raw, will enhance in component
    }

    // Prepare initial wizard data
    const u = user as unknown as UserWithBirthYear;
    const initialData: Partial<PostRecordingData> = {
      title: cachedData.title || "",
      year: cachedData.storyYear ? parseInt(cachedData.storyYear, 10) : undefined,
      photos: [],
      originalTranscript: cachedData.rawTranscript || "",
      enhancedTranscript: enhancedTranscript,
      useEnhanced: true,
      lessonLearned: cachedData.lessonLearned || "",
      recording,
      userBirthYear: u?.birthYear,
    };

    const handleWizardComplete = () => {
      // NavCache will be consumed by the wizard's submitStory
      router.push("/timeline");
    };

    return (
      <div className="hw-page bg-gradient-to-b from-amber-50 to-white">
        <PostRecordingWizard initialData={initialData} onComplete={handleWizardComplete} />
      </div>
    );
  }

  return (
    <>
      <BookStyleReview
        title={title}
        storyYear={storyYear}
        storyMonth={storyMonth}
        storyDay={storyDay}
        transcription={transcription}
        photos={photos}
        wisdomText={wisdomText}
        audioUrl={audioUrl}
        audioDuration={audioDuration}
        onTitleChange={setTitle}
        onYearChange={setStoryYear}
        onMonthChange={setStoryMonth}
        onDayChange={setStoryDay}
        onTranscriptionChange={setTranscription}
        onPhotosChange={setPhotos}
        onWisdomChange={setWisdomText}
        onAudioChange={handleAudioChange}
        onSave={handleSave}
        onCancel={handleCancel}
        onDelete={handleDelete}
        isSaving={saveMutation.isPending}
        isEditing={isEditing}
        userBirthYear={user.birthYear}
      />

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={showCancelConfirm}
        title="Cancel Changes?"
        message="Are you sure you want to cancel? Your changes will be lost."
        confirmText="Yes, Cancel"
        cancelText="Keep Editing"
        onConfirm={handleConfirmCancel}
        onCancel={() => setShowCancelConfirm(false)}
        variant="danger"
      />
    </>
  );
}

export default function BookStyleReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="hw-page bg-gradient-to-b from-amber-50 to-white flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading book view...</p>
          </div>
        </div>
      }
    >
      <BookStyleReviewContent />
    </Suspense>
  );
}
