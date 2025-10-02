"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { BookStyleReview } from "@/components/BookStyleReview";
import { type StoryPhoto } from "@/components/MultiPhotoUploader";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

function BookStyleReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  // Check if we're editing an existing story
  const editId = searchParams.get("edit");
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
        const response = await apiRequest('GET', `/api/stories/${editId}`);
        if (response.ok) {
          const { story } = await response.json();

          // Populate form with existing story data
          setTitle(story.title || '');
          setTranscription(story.transcription || story.content || '');
          setStoryYear(story.storyYear?.toString() || story.year?.toString() || '');
          setWisdomText(story.wisdomClipText || story.wisdomTranscription || '');
          setAudioUrl(story.audioUrl || null);

          // Handle photos
          if (story.photos && Array.isArray(story.photos)) {
            setPhotos(story.photos);
          } else if (story.photoUrl) {
            setPhotos([{
              id: 'legacy',
              url: story.photoUrl,
              transform: story.photoTransform
            }]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch story:', error);
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
      // Load data from search params or session storage for new stories
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

      // Try to retrieve audio blob from session storage
      const storedAudioData = sessionStorage.getItem("recordedAudio");
      if (storedAudioData) {
        fetch(storedAudioData)
          .then(res => res.blob())
          .then(blob => setMainAudioBlob(blob))
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
      const age = user?.birthYear && storyYear
        ? parseInt(storyYear) - user.birthYear
        : null;

      // Upload audio if we have a blob
      let finalAudioUrl = audioUrl;
      if (mainAudioBlob && audioUrl?.startsWith("blob:")) {
        console.log("Uploading audio blob...");
        try {
          const formData = new FormData();
          formData.append("audio", mainAudioBlob, "recording.webm");

          const uploadResponse = await apiRequest('POST', '/api/upload/audio', formData);
          if (uploadResponse.ok) {
            const { url } = await uploadResponse.json();
            finalAudioUrl = url;
            console.log("Audio uploaded successfully:", url);
          } else {
            console.error("Audio upload failed:", uploadResponse.status);
          }
        } catch (error) {
          console.error("Failed to upload audio:", error);
        }
      }

      // Prepare story data - matching the database schema
      const storyData = {
        title: title || `Memory from ${storyYear || 'the past'}`,
        transcription, // This is the main text content
        storyYear: parseInt(storyYear) || new Date().getFullYear(),
        lifeAge: age, // Use lifeAge instead of age
        includeInTimeline: true,
        includeInBook: true,
        isFavorite: false,
        photos: photos.length > 0 ? photos : null,
        audioUrl: finalAudioUrl,
        wisdomClipText: wisdomText,
        durationSeconds: 0, // Add duration
      };

      console.log("Saving story with data:", storyData);

      // Use PUT for update, POST for create
      const url = isEditing ? `/api/stories/${editId}` : '/api/stories';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await apiRequest(method, url, storyData);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${isEditing ? 'update' : 'save'} story`);
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: `Story ${isEditing ? 'updated' : 'saved'} successfully!`,
        description: `Your memory has been ${isEditing ? 'updated' : 'added to your timeline'}.`,
      });

      // Clear session storage
      sessionStorage.removeItem("recordedAudio");
      sessionStorage.removeItem("recordingTranscription");

      // Navigate to timeline
      router.push("/timeline");
    },
    onError: (error: any) => {
      console.error("Save error:", error);
      toast({
        title: "Failed to save story",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSave = async () => {
    console.log("Save button clicked!");
    console.log("Current data:", { title, storyYear, transcription: transcription?.substring(0, 50) });

    // Check for authentication first
    const { supabase } = await import("@/lib/supabase");
    const { data: { session } } = await supabase.auth.getSession();

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
      const confirmed = confirm("Are you sure you want to cancel? Your changes will be lost.");
      if (!confirmed) return;
    }

    // Clear session storage
    sessionStorage.removeItem("recordedAudio");
    sessionStorage.removeItem("recordingTranscription");

    // Go back to recording page
    router.push("/recording");
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
      isSaving={saveMutation.isPending}
      userBirthYear={user.birthYear}
    />
  );
}

export default function BookStyleReviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading book view...</p>
        </div>
      </div>
    }>
      <BookStyleReviewContent />
    </Suspense>
  );
}