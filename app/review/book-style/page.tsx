"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { BookStyleReview } from "@/components/BookStyleReview";
import { type StoryPhoto } from "@/components/MultiPhotoUploader";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { navCache } from "@/lib/navCache";
import { supabase } from "@/lib/supabase";

function BookStyleReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if we're editing an existing story
  // Support both 'edit' and 'id' parameters for compatibility
  const editId = searchParams.get("edit") || searchParams.get("id");
  const isEditing = !!editId;

  // Get data from URL params (passed from recording page)
  const [title, setTitle] = useState("");
  const [storyYear, setStoryYear] = useState("");
  const [transcription, setTranscription] = useState("");
  const [photos, setPhotos] = useState<StoryPhoto[]>([]);
  const [wisdomText, setWisdomText] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [mainAudioBlob, setMainAudioBlob] = useState<Blob | null>(null);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [returnPath, setReturnPath] = useState<string | null>(null);

  const handleAudioChange = (url: string | null, blob?: Blob | null) => {
    setAudioUrl(url);
    if (blob) {
      setMainAudioBlob(blob);
    }
  };

  useEffect(() => {
    const fetchStoryData = async () => {
      if (!editId) return;

      setIsLoading(true);
      try {
        console.log("[Edit Mode] Fetching story data for ID:", editId);
        const response = await apiRequest("GET", `/api/stories/${editId}`);
        if (response.ok) {
          const { story } = await response.json();
          console.log("[Edit Mode] Received story data:", story);

          // Populate form with existing story data
          setTitle(story.title || "");
          setTranscription(story.transcription || story.content || "");
          setStoryYear(
            story.storyYear?.toString() || story.year?.toString() || "",
          );
          setWisdomText(
            story.wisdomClipText || story.wisdomTranscription || "",
          );
          setAudioUrl(story.audioUrl || null);

          // Handle photos
          if (story.photos && Array.isArray(story.photos)) {
            console.log("[Edit Mode] Setting photos from API:", story.photos);
            setPhotos(story.photos);
          } else if (story.photoUrl) {
            console.log("[Edit Mode] Setting legacy photo:", story.photoUrl);
            setPhotos([
              {
                id: "legacy",
                url: story.photoUrl,
                transform: story.photoTransform,
              },
            ]);
          } else {
            console.log("[Edit Mode] No photos found in story");
          }
        }
      } catch (error) {
        console.error("Failed to fetch story:", error);
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
    } else {
      // PRIORITY 1: Check NavCache first (most reliable for new recordings)
      const navId = searchParams.get("nav");
      if (navId) {
        console.log("[Review] Loading from NavCache with ID:", navId);
        const cachedData = navCache.consume(navId);

        if (cachedData) {
          console.log("[Review] NavCache data retrieved:", {
            hasTranscription: !!cachedData.transcription,
            transcriptionLength: cachedData.transcription?.length,
            hasMainAudioBase64: !!cachedData.mainAudioBase64,
            base64Length: cachedData.mainAudioBase64?.length,
            hasTitle: !!cachedData.title,
            hasYear: !!cachedData.storyYear,
            returnPath: cachedData.returnPath,
            allKeys: Object.keys(cachedData),
          });

          if (cachedData.transcription) {
            setTranscription(cachedData.transcription);
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
            console.log("[Review] Setting wisdom text from NavCache:", wisdom);
            setWisdomText(wisdom);
          } else {
            console.log("[Review] No wisdom text found in NavCache");
          }
          if (cachedData.returnPath) {
            setReturnPath(cachedData.returnPath);
          }

          // Handle audio - convert base64 back to blob if available
          if (cachedData.mainAudioBase64 && cachedData.mainAudioType) {
            console.log("[Review] Converting base64 audio to blob");
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
              console.log("[Review] Audio blob created, size:", blob.size);
            } catch (err) {
              console.error("[Review] Failed to convert base64 to blob:", err);
            }
          } else if (cachedData.audioUrl) {
            setAudioUrl(cachedData.audioUrl);
          }

          return; // Data loaded from cache, skip other sources
        } else {
          console.warn("[Review] No data found in NavCache for ID:", navId);
        }
      }

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
  }, [searchParams, editId, isEditing, toast]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to continue.",
        variant: "destructive",
      });
      router.push("/auth/login");
    }
  }, [user, router, toast]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      console.log("Starting save mutation...");

      // Calculate age at the time of the story
      const age =
        user?.birthYear && storyYear
          ? parseInt(storyYear) - user.birthYear
          : null;

      // Get source prompt ID if this story was triggered by a prompt
      const sourcePromptId = sessionStorage.getItem("activePromptId");
      if (sourcePromptId) {
        console.log("Story triggered by prompt:", sourcePromptId);
      }

      // For NEW stories with blob photos or audio, we need to create the story first, then upload media
      const hasNewPhotos =
        !isEditing && photos.some((p) => p.url.startsWith("blob:"));
      const hasNewAudio = mainAudioBlob && audioUrl?.startsWith("blob:");

      if (!isEditing && (hasNewPhotos || hasNewAudio)) {
        console.log("=== NEW STORY WITH MEDIA ===");
        console.log(
          "Photos with blob URLs:",
          photos.filter((p) => p.url.startsWith("blob:")).length,
        );
        console.log("Has audio blob:", !!hasNewAudio);

        // Step 1: Create the story WITHOUT media to get an ID
        const tempStoryData = {
          title: title || `Memory from ${storyYear || "the past"}`,
          transcription,
          storyYear: parseInt(storyYear) || new Date().getFullYear(),
          lifeAge: age,
          includeInTimeline: true,
          includeInBook: true,
          isFavorite: false,
          audioUrl: null, // Will be set after upload
          wisdomClipText: wisdomText,
          durationSeconds: 0,
          sourcePromptId: sourcePromptId || null, // Track which prompt generated this story
        };

        console.log("Creating story first...");
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
        console.log("Story created with ID:", newStoryId);

        let finalAudioUrl = null;

        // Step 2: Upload audio if available
        if (hasNewAudio) {
          console.log("Uploading audio...", {
            isFile: mainAudioBlob instanceof File,
            type: mainAudioBlob?.type,
            size: mainAudioBlob?.size,
          });
          try {
            const formData = new FormData();

            // Debug logging
            console.log("Creating FormData for audio upload:", {
              isFile: mainAudioBlob instanceof File,
              isBlob: mainAudioBlob instanceof Blob,
              type: mainAudioBlob?.type,
              size: mainAudioBlob?.size,
              name: mainAudioBlob instanceof File ? mainAudioBlob.name : "N/A",
            });

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
              console.log("✅ Audio uploaded successfully:", url);
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
        console.log("=== PHOTO UPLOAD DEBUG ===");
        console.log("Total photos in array:", photos.length);

        for (let i = 0; i < photos.length; i++) {
          const photo = photos[i];
          const pendingFile = (window as any)[`__pendingPhotoFile_${i}`];

          console.log(`Photo ${i}:`, {
            hasPhoto: !!photo,
            photoUrl: photo?.url,
            hasPendingFile: !!pendingFile,
            isBlobUrl: photo?.url?.startsWith("blob:"),
            pendingFileName: pendingFile?.name,
          });

          if (pendingFile && photo.url.startsWith("blob:")) {
            try {
              console.log(`✅ Uploading photo ${i} to permanent storage...`);
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
              console.log(`Got upload URL for photo ${i}:`, {
                uploadURL,
                filePath,
              });

              // Upload file to storage
              const uploadResponse = await fetch(uploadURL, {
                method: "PUT",
                body: pendingFile,
                headers: {
                  "Content-Type":
                    pendingFile.type || "application/octet-stream",
                },
              });

              console.log(
                `Upload response for photo ${i}:`,
                uploadResponse.status,
                uploadResponse.statusText,
              );

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

              console.log(
                `Photo ${i} uploaded to storage successfully, now adding to story metadata...`,
              );

              // Add photo to story using the API
              const addPhotoResponse = await apiRequest(
                "POST",
                `/api/stories/${newStoryId}/photos`,
                {
                  filePath,
                  isHero: photo.isHero,
                  transform: photo.transform,
                },
              );

              if (addPhotoResponse.ok) {
                const photoResult = await addPhotoResponse.json();
                console.log(
                  `✅ Photo ${i} added successfully to story metadata:`,
                  photoResult,
                );
              } else {
                const errorText = await addPhotoResponse.text();
                console.error(
                  `Failed to add photo ${i} to story:`,
                  addPhotoResponse.status,
                  errorText,
                );
              }

              // Clean up
              URL.revokeObjectURL(photo.url);
              delete (window as any)[`__pendingPhotoFile_${i}`];
            } catch (error) {
              console.error(`Photo ${i} upload failed:`, error);
            }
          }
        }

        // Step 4: Update story with audio URL if uploaded
        if (finalAudioUrl) {
          console.log("Updating story with audio URL:", finalAudioUrl);
          // IMPORTANT: Only update the audioUrl field, don't overwrite entire metadata
          const updateResponse = await apiRequest(
            "GET",
            `/api/stories/${newStoryId}`,
          );
          if (updateResponse.ok) {
            const { story: currentStory } = await updateResponse.json();
            console.log(
              "[Audio Update] Current story before audio update:",
              currentStory,
            );

            // Use current story data and only update the audioUrl
            await apiRequest("PUT", `/api/stories/${newStoryId}`, {
              title: currentStory.title,
              transcription: currentStory.transcription,
              storyYear: currentStory.storyYear,
              lifeAge: currentStory.lifeAge,
              includeInTimeline: currentStory.includeInTimeline,
              includeInBook: currentStory.includeInBook,
              isFavorite: currentStory.isFavorite,
              wisdomClipText: currentStory.wisdomClipText,
              durationSeconds: currentStory.durationSeconds,
              audioUrl: finalAudioUrl, // THIS is the only field we're updating
              photos: currentStory.photos || [],
            });
            console.log(
              "[Audio Update] Story updated with audio URL, photos preserved",
            );
          }
        }

        return { story: { id: newStoryId } };
      }

      // For EDITING or stories without new media, use standard save
      let finalAudioUrl = audioUrl;
      if (mainAudioBlob && audioUrl?.startsWith("blob:")) {
        console.log("Uploading audio blob...", {
          isFile: mainAudioBlob instanceof File,
          type: mainAudioBlob.type,
          size: mainAudioBlob.size,
        });
        try {
          const formData = new FormData();

          // Debug logging
          console.log("Creating FormData for audio upload (edit mode):", {
            isFile: mainAudioBlob instanceof File,
            isBlob: mainAudioBlob instanceof Blob,
            type: mainAudioBlob.type,
            size: mainAudioBlob.size,
            name: mainAudioBlob instanceof File ? mainAudioBlob.name : "N/A",
          });

          // CRITICAL FIX: Ensure the blob has a proper MIME type
          let audioToUpload = mainAudioBlob;

          // If the blob doesn't have a type or it's text/plain, we need to fix it
          if (!mainAudioBlob.type || mainAudioBlob.type.startsWith("text/")) {
            console.warn(
              "Audio blob has invalid MIME type, attempting to fix:",
              mainAudioBlob.type,
            );

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
            console.log("Fixed audio blob MIME type to:", mimeType);
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
            console.log("Audio uploaded successfully:", url);
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
      console.log("=== EDIT MODE PHOTO UPLOAD ===");
      const finalPhotos = [];

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        const pendingFile = (window as any)[`__pendingPhotoFile_${i}`];

        console.log(`Photo ${i}:`, {
          hasPhoto: !!photo,
          photoUrl: photo?.url,
          isBlobUrl: photo?.url?.startsWith("blob:"),
          hasPendingFile: !!pendingFile,
        });

        // If it's a blob URL, upload it first
        if (photo.url.startsWith("blob:") && pendingFile) {
          try {
            console.log(`Uploading blob photo ${i} to storage...`);
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

            console.log(`Photo ${i} uploaded successfully, adding to story...`);

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
              },
            );

            if (photoResponse.ok) {
              const { photo: savedPhoto } = await photoResponse.json();
              finalPhotos.push(savedPhoto);
              console.log(`Photo ${i} saved to story metadata`);
            }
          } catch (error) {
            console.error(`Failed to upload photo ${i}:`, error);
          }
        } else if (!photo.url.startsWith("blob:")) {
          // Keep existing photos that are not blob URLs
          finalPhotos.push(photo);
        }
      }

      const storyData = {
        title: title || `Memory from ${storyYear || "the past"}`,
        transcription,
        storyYear: parseInt(storyYear) || new Date().getFullYear(),
        lifeAge: age,
        includeInTimeline: true,
        includeInBook: true,
        isFavorite: false,
        photos: finalPhotos,
        audioUrl: finalAudioUrl,
        wisdomClipText: wisdomText,
        durationSeconds: 0,
        sourcePromptId: sourcePromptId || null, // Track which prompt generated this story
      };

      console.log("Saving story with data:", storyData);

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

      // Invalidate prompts query to fetch next prompt
      queryClient.invalidateQueries({ queryKey: ["/api/prompts/next"] });

      // Navigate to timeline and scroll to top where new prompt awaits
      router.push("/timeline");
      // Scroll to top after navigation
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
    },
    onError: (error: any) => {
      console.error("Save error:", error);
      toast({
        title: "Failed to save story",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = async () => {
    console.log("Save button clicked!");
    console.log("Current data:", {
      title,
      storyYear,
      transcription: transcription?.substring(0, 50),
    });

    // Check for authentication first
    const { supabase } = await import("@/lib/supabase");
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      toast({
        title: "Authentication required",
        description: "Please log in to save your story.",
        variant: "destructive",
      });
      router.push("/auth/login");
      return;
    }

    if (!transcription?.trim()) {
      toast({
        title: "Story content required",
        description: "Please add some content to your story before saving.",
        variant: "destructive",
      });
      return;
    }

    console.log("Calling saveMutation.mutate()");
    saveMutation.mutate();
  };

  const handleCancel = () => {
    // Ask for confirmation if there's content
    if (transcription || title || photos.length > 0) {
      const confirmed = confirm(
        "Are you sure you want to cancel? Your changes will be lost.",
      );
      if (!confirmed) return;
    }

    // Clear session storage
    sessionStorage.removeItem("recordedAudio");
    sessionStorage.removeItem("recordingTranscription");

    // If editing an existing story, go back to timeline
    // If creating a new story, go back to where we came from (or timeline as fallback)
    if (isEditing) {
      router.push("/timeline");
    } else {
      router.push(returnPath || "/timeline");
    }
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

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading memory...</p>
        </div>
      </div>
    );
  }

  return (
    <BookStyleReview
      title={title}
      storyYear={storyYear}
      transcription={transcription}
      photos={photos}
      wisdomText={wisdomText}
      audioUrl={audioUrl}
      onTitleChange={setTitle}
      onYearChange={setStoryYear}
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
  );
}

export default function BookStyleReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center">
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
