"use client";

import { useState, useEffect, Suspense } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ArrowLeft,
  Camera,
  Trash2,
  Calendar,
  Mic,
  Sparkles,
  Upload,
  X,
  Square,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle
} from "lucide-react";
import { MultiPhotoUploader, type StoryPhoto } from "@/components/MultiPhotoUploader";
import { AudioRecorder } from "@/components/AudioRecorder";
import { Badge } from "@/components/ui/badge";
import { navCache } from "@/lib/navCache";

function ReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const [title, setTitle] = useState("");
  const [transcription, setTranscription] = useState("");
  const [formattedContent, setFormattedContent] = useState<any>(null);
  const [storyYear, setStoryYear] = useState("");
  const [storyDate, setStoryDate] = useState("");
  const [photos, setPhotos] = useState<StoryPhoto[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [wisdomQuote, setWisdomQuote] = useState<string | null>(null);

  // Wisdom recording state
  const [wisdomMode, setWisdomMode] = useState<'suggestion' | 'recording' | 'recorded' | 'text' | null>(null);
  const [wisdomAudioBlob, setWisdomAudioBlob] = useState<Blob | null>(null);
  const [wisdomAudioUrl, setWisdomAudioUrl] = useState<string | null>(null);
  const [wisdomText, setWisdomText] = useState<string>('');
  const [isRecordingWisdom, setIsRecordingWisdom] = useState(false);
  const [wisdomRecordingDuration, setWisdomRecordingDuration] = useState(0);
  const [wisdomMediaRecorder, setWisdomMediaRecorder] = useState<MediaRecorder | null>(null);
  const [wisdomChunks, setWisdomChunks] = useState<Blob[]>([]);
  const [suggestedWisdom, setSuggestedWisdom] = useState<string>("");
  const [isWisdomCollapsed, setIsWisdomCollapsed] = useState<boolean>(false);

  const { toast } = useToast();
  const { user } = useAuth();
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [uploadedAudioFile, setUploadedAudioFile] = useState<File | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  // Store audio blobs temporarily for upload
  const [mainAudioBlob, setMainAudioBlob] = useState<Blob | null>(null);
  const [titlePlaceholder, setTitlePlaceholder] = useState("Give your memory a title...");
  const [photosInitialized, setPhotosInitialized] = useState(false);

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

  // This is the create route, not edit mode
  const storyId = undefined;
  const isEditMode = false;

  // Fetch existing story data if in edit mode
  const { data: existingStory } = useQuery({
    queryKey: [`/api/stories/${storyId}`],
    enabled: isEditMode && !!storyId,
  });

  // Fetch story photos if in edit mode
  const { data: storyPhotosData } = useQuery({
    queryKey: [`/api/stories/${storyId}/photos`],
    enabled: isEditMode && !!storyId,
  });

  // Load existing story data into form when editing
  useEffect(() => {
    if (existingStory && typeof existingStory === 'object' && existingStory !== null && isEditMode) {
      const story = (existingStory as any)?.story;
      if (!story) return;
      setTitle(story.title || "");
      setTranscription(story.transcription || "");
      setStoryYear(story.storyYear?.toString() || "");
      setStoryDate(story.storyDate || "");
      setAudioUrl(story.audioUrl || null);
      setAudioDuration(story.durationSeconds || 0);
      setWisdomQuote(story.wisdomQuote || null);

      // Load wisdom clip data
      if (story.wisdomClipUrl) {
        setWisdomAudioUrl(story.wisdomClipUrl);
        setWisdomRecordingDuration(story.wisdomClipDuration || 0);
        setWisdomMode('recorded');
      } else if (story.wisdomClipText) {
        setWisdomText(story.wisdomClipText);
        setWisdomMode('text');
      }

      // Try to get wisdom suggestion from formatted content
      if (story.formattedContent?.wisdomSuggestion) {
        setSuggestedWisdom(story.formattedContent.wisdomSuggestion);
      } else {
        setSuggestedWisdom("What's the most important lesson from this experience?");
      }
    }
  }, [existingStory, isEditMode]);

  // Load photos from separate endpoint - only on initial load
  useEffect(() => {
    if (!photosInitialized && storyPhotosData && typeof storyPhotosData === 'object' && storyPhotosData !== null) {
      const photosArray = (storyPhotosData as any)?.photos;
      if (photosArray) {
        setPhotos(photosArray);
        setPhotosInitialized(true);
      }
    }
  }, [storyPhotosData, photosInitialized]);

  // Base64 encoding/decoding functions
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]); // Remove data:type;base64, prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const base64ToBlob = (base64: string, type: string): Blob => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type });
  };

  // Clear navigation data on unmount
  useEffect(() => {
    const navId = searchParams.get('nav');

    return () => {
      if (navId) {
        navCache.remove(navId);
      }
    };
  }, [searchParams]);

  // Check for navigation data when component mounts
  useEffect(() => {
    console.log('Review page loading - checking for navigation data...');
    const navId = searchParams.get('nav');

    if (navId) {
      console.log('Found navigation ID:', navId);
      const data = navCache.get(navId);
      if (data) {
        console.log('[Review] Retrieved navigation data:', {
          hasTranscription: !!data.transcription,
          hasMainAudioBase64: !!data.mainAudioBase64,
          mainAudioBase64Length: data.mainAudioBase64?.length,
          mainAudioType: data.mainAudioType,
          hasWisdomClip: !!data.wisdomClipBase64,
          keys: Object.keys(data),
        });

        // Clear the data immediately after retrieving it
        navCache.remove(navId);

        // Handle recording data
        if (data.transcription) {
          console.log('[Review] Loading transcription from navigation data:', data.transcription.substring(0, 100) + '...');
          setTranscription(data.transcription);
        } else {
          console.log('[Review] No transcription found in navigation data');
          if (data.mainAudioBase64) {
            console.log('[Review] Audio base64 found, will transcribe after converting to blob');
            setIsTranscribing(true);
          }
        }

        // Handle formatted content from comprehensive processing
        if (data.formattedContent) {
          console.log('[Review] Formatted content available from comprehensive processing');
          setFormattedContent(data.formattedContent);
          // Extract wisdom quote if available
          if (data.formattedContent.wisdomQuote) {
            setWisdomQuote(data.formattedContent.wisdomQuote);
          }
          // Extract wisdom suggestion for the UI prompt
          if (data.formattedContent.wisdomSuggestion) {
            setSuggestedWisdom(data.formattedContent.wisdomSuggestion);
            console.log('[Review] Wisdom suggestion loaded:', data.formattedContent.wisdomSuggestion);
          } else {
            setSuggestedWisdom("What's the most important lesson from this experience?");
            console.log('[Review] No wisdom suggestion in formatted content, using fallback');
          }
        } else {
          setSuggestedWisdom("What's the most important lesson from this experience?");
        }

        if (data.audioDuration) {
          setAudioDuration(data.audioDuration);
        }

        // Handle ghost prompt
        if (data.prompt) {
          console.log('Setting title from ghost prompt:', data.prompt.title);
          if (data.prompt.title) {
            setTitlePlaceholder(data.prompt.title);
          }

          // Extract year from decade or use current year minus average age for that decade
          if (data.prompt.decade) {
            console.log('Raw decade value from prompt:', data.prompt.decade, 'Type:', typeof data.prompt.decade);
            const decadeYear = parseInt(data.prompt.decade as string);
            console.log('Parsed decade year:', decadeYear);

            // Special handling for birth year stories
            if (data.prompt.title && data.prompt.title.toLowerCase().includes('born')) {
              // For birth year stories, use the birth year directly
              console.log('Birth year story detected, using birth year:', user?.birthYear);
              const birthYearStr = user?.birthYear?.toString() || '';
              console.log('Setting storyYear for birth year story:', birthYearStr);
              setStoryYear(birthYearStr);
            } else if (!isNaN(decadeYear)) {
              // Check if this is actually a year (4 digits) rather than a decade
              if (decadeYear >= 1900 && decadeYear <= 2100) {
                console.log('Decade value appears to be a year, using directly:', decadeYear);
                setStoryYear(decadeYear.toString());
              } else {
                // Handle malformed decade values
                if (decadeYear >= 190 && decadeYear <= 210) {
                  const correctedYear = decadeYear * 10 + 5;
                  console.log('Correcting 3-digit decade:', decadeYear, '->', correctedYear);
                  setStoryYear(correctedYear.toString());
                } else if (user?.birthYear) {
                  const middleYear = decadeYear + 5;
                  console.log('Setting story year to decade + 5:', decadeYear, '+5 =', middleYear);
                  setStoryYear(middleYear.toString());
                }
              }
            }
          }
        }

        // Handle audio blobs - convert from base64
        if (data.mainAudioBase64) {
          console.log('Converting main audio from base64...');
          const blob = base64ToBlob(data.mainAudioBase64, data.mainAudioType || 'audio/webm');
          setMainAudioBlob(blob);

          // Create temporary URL for playback (will be replaced with permanent URL after upload)
          const tempUrl = URL.createObjectURL(blob);
          setAudioUrl(tempUrl);

          // If transcription wasn't done yet, do it now
          if (!data.transcription && blob && blob.size > 0) {
            console.log('[Review] Starting transcription of audio blob...');
            transcribeAudio(blob).then(text => {
              console.log('[Review] Transcription complete:', text.substring(0, 100) + '...');
              setTranscription(text);
              setIsTranscribing(false);
            }).catch(error => {
              console.error('[Review] Transcription failed:', error);
              setIsTranscribing(false);
              toast({
                title: "Transcription failed",
                description: "Please add your story text manually.",
                variant: "destructive",
              });
            });
          }
        }

        // Handle wisdom audio
        if (data.wisdomClipBase64) {
          const wisdomBlob = base64ToBlob(data.wisdomClipBase64, data.wisdomClipType || 'audio/webm');
          setWisdomAudioBlob(wisdomBlob);
          const wisdomUrl = URL.createObjectURL(wisdomBlob);
          setWisdomAudioUrl(wisdomUrl);
          setWisdomMode('recorded');
          if (data.wisdomTranscription) {
            setWisdomText(data.wisdomTranscription);
          }
        }
      }
    } else {
      console.log('No navigation ID found in URL params');
    }
  }, [user, searchParams, toast]);

  const saveStoryMutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEditMode && storyId) {
        console.log('Updating story with ID:', storyId, 'Data:', data);
        const response = await apiRequest("PUT", `/api/stories/${storyId}`, data);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/stories", data);
        return response.json();
      }
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Story saved!",
        description: "Your memory has been added to your timeline.",
      });

      // Get the story ID for redirect with highlight
      const highlightStoryId = isEditMode ? storyId : data?.story?.id;
      if (highlightStoryId) {
        router.push(`/timeline?highlight=${highlightStoryId}`);
      } else {
        router.push("/timeline");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error saving story",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteStoryMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/stories/${storyId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Story deleted",
        description: "Your memory has been removed.",
      });
      router.push("/timeline");
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting story",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutations for photo management
  const addPhotoMutation = useMutation({
    mutationFn: async ({ storyId, file, slotIndex }: { storyId: string, file: File, slotIndex: number }) => {
      // Upload to storage first
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const uploadUrlResponse = await apiRequest('POST', '/api/objects/upload', {
        fileType: 'photo',
        storyId: storyId,
        fileExtension: fileExtension
      });

      if (!uploadUrlResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadURL, filePath } = await uploadUrlResponse.json();

      // Upload file to storage using signed URL
      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'application/octet-stream'
        }
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Upload failed:', errorText);
        throw new Error(`Failed to upload photo: ${uploadResponse.status} ${errorText}`);
      }

      // Check if any photo is already marked as hero
      const hasHeroPhoto = photos.some(p => p.isHero);

      // Add photo to story
      const response = await apiRequest('POST', `/api/stories/${storyId}/photos`, {
        filePath,
        isHero: !hasHeroPhoto && photos.length === 0
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add photo to story: ${errorText}`);
      }

      const photoData = await response.json();
      return { photoData, filePath, slotIndex, isHero: !hasHeroPhoto && photos.length === 0 };
    },
    onSuccess: (data) => {
      if (data?.photoData?.photo) {
        setPhotos(prevPhotos => {
          const newPhotos = [...prevPhotos];
          while (newPhotos.length <= data.slotIndex) {
            newPhotos.push(null as any);
          }
          newPhotos[data.slotIndex] = data.photoData.photo;
          const filteredPhotos = newPhotos.filter(p => p !== null);
          return filteredPhotos;
        });

        if (storyId) {
          queryClient.invalidateQueries({ queryKey: [`/api/stories/${storyId}/photos`] });
        }
      }
      toast({ title: "Photo uploaded successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add photo",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const updatePhotoMutation = useMutation({
    mutationFn: async ({ photoId, updates }: { photoId: string, updates: Partial<StoryPhoto> }) => {
      if (!storyId) return;
      const response = await apiRequest('PATCH', `/api/stories/${storyId}/photos/${photoId}`, updates);
      return response.json();
    },
    onSuccess: (_, variables) => {
      setPhotos(prevPhotos => prevPhotos.map(p =>
        p.id === variables.photoId ? { ...p, ...variables.updates } : p
      ));
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update photo",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const removePhotoMutation = useMutation({
    mutationFn: async (photoId: string) => {
      if (!storyId) return;
      const response = await apiRequest('DELETE', `/api/stories/${storyId}/photos/${photoId}`);
      return response.json();
    },
    onSuccess: (_, photoId) => {
      toast({ title: "Photo removed" });
      queryClient.setQueryData([`/api/stories/${storyId}/photos`], (oldData: any) => {
        if (!oldData?.photos) return oldData;
        return {
          ...oldData,
          photos: oldData.photos.filter((p: any) => p.id !== photoId)
        };
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove photo",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handlePhotoUpload = async (file: File, slotIndex: number) => {
    if (storyId) {
      try {
        await addPhotoMutation.mutateAsync({ storyId, file, slotIndex });
      } catch (error) {
        console.error('Photo upload failed:', error);
      }
    } else {
      console.log('Storing photo for later upload:', file.name);
      (window as any)[`__pendingPhotoFile_${slotIndex}`] = file;
    }
  };

  const handlePhotoRemove = async (photoId: string) => {
    if (storyId && !photoId.startsWith('temp-')) {
      await removePhotoMutation.mutateAsync(photoId);
    }
    setPhotos(prevPhotos => prevPhotos.filter(p => p.id !== photoId));
  };

  const handlePhotoUpdate = async (photoId: string, updates: Partial<StoryPhoto>) => {
    if (storyId && !photoId.startsWith('temp-')) {
      await updatePhotoMutation.mutateAsync({ photoId, updates });
    }
  };

  // Helper function to transcribe audio
  const transcribeAudio = async (file: File | Blob): Promise<string> => {
    console.log('Transcribing uploaded audio:', file.type, 'Size:', file.size);

    if (file.size > 25 * 1024 * 1024) {
      throw new Error('Audio file is too large. Please upload a file smaller than 25MB.');
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      let binary = '';
      const chunkSize = 8192;

      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
        for (let j = 0; j < chunk.length; j++) {
          binary += String.fromCharCode(chunk[j]);
        }
      }

      const base64 = btoa(binary);

      const response = await apiRequest('POST', '/api/transcribe', {
        audioBase64: base64,
        mimeType: file.type || 'audio/webm',
        title: title || undefined
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Transcription failed:', errorText);
        throw new Error('Failed to transcribe audio');
      }

      const data = await response.json();
      return data.transcription || data.text || '';
    } catch (error) {
      console.error('Transcription error details:', error);
      throw error;
    }
  };

  const handleAudioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('Starting audio upload for file:', file.name, file.type, file.size);
      setUploadedAudioFile(file);

      let correctedType = file.type;
      if (file.type === 'video/webm' || file.type === 'video/ogg') {
        correctedType = file.type.replace('video/', 'audio/');
        console.log('Correcting MIME type from', file.type, 'to', correctedType);
      }

      const arrayBuffer = await file.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: correctedType });
      setMainAudioBlob(blob);

      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      const audio = new Audio(url);
      audio.addEventListener('loadedmetadata', () => {
        setAudioDuration(Math.round(audio.duration));
      });

      setIsTranscribing(true);
      try {
        const text = await transcribeAudio(file);
        setTranscription(text);
        setFormattedContent(null);
      } catch (error) {
        console.error('Transcription failed:', error);

        let errorMessage = "Please add your story text manually.";
        if (error instanceof Error) {
          if (error.message.includes('Authentication')) {
            errorMessage = "Please sign in again to transcribe audio.";
          } else if (error.message.includes('too large')) {
            errorMessage = error.message;
          }
        }

        toast({
          title: "Transcription failed",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsTranscribing(false);
      }

      setShowUploadDialog(false);
    }
  };

  const handleAudioRemove = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAudioDuration(0);
    setUploadedAudioFile(null);
    setMainAudioBlob(null);
  };

  // Wisdom recording handlers
  const startWisdomRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/ogg'
      ];

      let mimeType = 'audio/webm';
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        setWisdomAudioBlob(blob);

        const url = URL.createObjectURL(blob);
        setWisdomAudioUrl(url);
        setWisdomMode('recorded');

        stream.getTracks().forEach(track => track.stop());
      };

      setWisdomMediaRecorder(recorder);
      setWisdomChunks(chunks);
      recorder.start();
      setIsRecordingWisdom(true);

      let duration = 0;
      const interval = setInterval(() => {
        duration++;
        setWisdomRecordingDuration(duration);

        if (duration >= 10) {
          clearInterval(interval);
          stopWisdomRecording();
        }
      }, 1000);

      (recorder as any).durationInterval = interval;
    } catch (error) {
      console.error('Failed to start wisdom recording:', error);
      toast({
        title: "Recording failed",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopWisdomRecording = async () => {
    if (wisdomMediaRecorder && wisdomMediaRecorder.state !== 'inactive') {
      if ((wisdomMediaRecorder as any).durationInterval) {
        clearInterval((wisdomMediaRecorder as any).durationInterval);
      }

      wisdomMediaRecorder.stop();
      setIsRecordingWisdom(false);
      setWisdomMediaRecorder(null);

      setTimeout(async () => {
        if (wisdomAudioBlob) {
          try {
            const reader = new FileReader();
            reader.onloadend = async () => {
              const base64 = reader.result as string;
              const base64Data = base64.split(',')[1];

              const response = await apiRequest('POST', '/api/transcribe', {
                audioBase64: base64Data,
                mimeType: wisdomAudioBlob.type,
                title: title || undefined
              });

              if (response.ok) {
                const data = await response.json();
                setWisdomText(data.transcription || '');
                console.log('Wisdom audio transcribed:', data.transcription);
              }
            };
            reader.readAsDataURL(wisdomAudioBlob);
          } catch (error) {
            console.error('Failed to transcribe wisdom audio:', error);
            toast({
              title: "Transcription note",
              description: "Audio saved but transcription unavailable. You can still save the audio.",
            });
          }
        }
      }, 500);
    }
  };

  const handleGoToRecording = async () => {
    try {
      const navData: any = {
        title,
        transcription,
        storyYear,
        storyDate,
        wisdomQuote,
        timestamp: Date.now(),
        isReRecording: true,
        storyId: storyId || null,
        returnToEdit: isEditMode
      };

      if (mainAudioBlob) {
        navData.mainAudioBase64 = await blobToBase64(mainAudioBlob);
        navData.mainAudioType = mainAudioBlob.type;
      }

      const navId = navCache.store(navData);
      router.push(`/recording?nav=${navId}&edit=${isEditMode ? '1' : '0'}`);
    } catch (error) {
      console.error('Error preparing navigation data:', error);
      router.push('/recording');
    }
  };

  const handleSave = async () => {
    if (!user) return;

    console.log('Attempting to save story with data:', {
      title,
      storyYear,
      transcription: transcription?.substring(0, 100) + '...',
      audioUrl,
      hasTranscription: !!transcription,
      transcriptionLength: transcription?.length || 0,
      isEditMode
    });

    if (!title || !storyYear) {
      toast({
        title: "Missing required fields",
        description: "Please provide a title and year.",
        variant: "destructive",
      });
      return;
    }

    if (!transcription || transcription.trim() === '') {
      toast({
        title: "Missing story content",
        description: "Please add your story by recording or typing it.",
        variant: "destructive",
      });
      return;
    }

    const lifeAge = parseInt(storyYear) - (user.birthYear || 0);

    const storyData = {
      title,
      audioUrl: audioUrl && !audioUrl.startsWith('blob:') ? audioUrl : null,
      transcription,
      formattedContent,
      storyYear: parseInt(storyYear),
      storyDate: storyDate || null,
      lifeAge,
      emotions: [],
      durationSeconds: audioDuration || 0,
      wisdomQuote: wisdomQuote || null,
      wisdomClipUrl: wisdomAudioUrl && !wisdomAudioUrl.startsWith('blob:') ? wisdomAudioUrl : null,
      wisdomClipText: wisdomMode === 'text' ? wisdomText : null,
      wisdomClipDuration: wisdomAudioUrl ? wisdomRecordingDuration : null,
    };

    console.log('Final save data:', {
      ...storyData,
      transcriptionLength: storyData.transcription?.length,
      isEditMode
    });

    saveStoryMutation.mutate(storyData);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this story?")) {
      if (isEditMode) {
        deleteStoryMutation.mutate();
      } else {
        router.push("/timeline");
      }
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background album-texture pb-20 md:pb-0 md:pl-20">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            {!isEditMode && (
              <Button
                variant="ghost"
                onClick={() => router.push("/timeline")}
                className="p-2"
                data-testid="button-back-to-timeline"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {isEditMode ? "Edit Your Memory" : "Review Your Memory"}
              </h1>
              <p className="text-muted-foreground">
                {isEditMode ? "Make changes to your story" : "Add details to make this story shine"}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Title */}
          <Card>
            <CardHeader>
              <CardTitle>Story Title</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder={titlePlaceholder}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg"
                data-testid="input-story-title"
              />
            </CardContent>
          </Card>

          {/* Recording Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="w-5 h-5" />
                Story Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Audio player if audio exists */}
              {audioUrl && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Your Recording</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleAudioRemove}
                      data-testid="button-remove-audio"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                  <Card>
                    <CardContent className="pt-4 pb-4">
                      <audio
                        controls
                        src={audioUrl}
                        className="w-full"
                        data-testid="audio-player"
                      >
                        Your browser does not support the audio element.
                      </audio>
                      {audioDuration > 0 && (
                        <p className="text-sm text-muted-foreground mt-2 text-center">
                          Duration: {Math.floor(audioDuration / 60)}:{(audioDuration % 60).toString().padStart(2, '0')}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Options to add audio */}
              {!audioUrl && (
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button
                    variant="outline"
                    onClick={handleGoToRecording}
                    data-testid="button-record-story"
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    Record Story
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowUploadDialog(true)}
                    data-testid="button-upload-audio"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Audio
                  </Button>
                </div>
              )}

              {/* Transcription text area */}
              <div className="space-y-2">
                <Label htmlFor="transcription">
                  {isTranscribing ? "Transcribing..." : "Story Text"}
                </Label>
                <Textarea
                  id="transcription"
                  placeholder={isTranscribing ? "Transcribing your audio..." : "Type or edit your story here..."}
                  value={transcription}
                  onChange={(e) => setTranscription(e.target.value)}
                  className="min-h-[200px] font-serif text-base leading-relaxed"
                  disabled={isTranscribing}
                  data-testid="textarea-transcription"
                />
                {transcription && (
                  <p className="text-sm text-muted-foreground text-right">
                    {transcription.split(' ').length} words
                  </p>
                )}
              </div>

              {/* Option to re-record */}
              {audioUrl && (
                <Button
                  variant="outline"
                  onClick={handleGoToRecording}
                  className="w-full"
                  data-testid="button-rerecord"
                >
                  <Mic className="w-4 h-4 mr-2" />
                  Re-record Story
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Wisdom Clip Section */}
          <Card>
            <CardHeader
              className={`cursor-pointer transition-colors ${isWisdomCollapsed ? 'hover:bg-gray-50' : ''}`}
              onClick={() => isWisdomCollapsed && setIsWisdomCollapsed(false)}
            >
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>Leave a Lesson</span>
                  <Badge variant="secondary" className="ml-2">Optional</Badge>
                </div>
                {isWisdomCollapsed && (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </CardTitle>
            </CardHeader>

            {!isWisdomCollapsed && (
              <CardContent className="space-y-4">
              {/* Default State: Show Suggestion */}
              {wisdomMode === null && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-6 border border-amber-200">
                    <p className="text-sm font-medium text-amber-700 mb-3">
                      Based on your story, here is a suggested lesson:
                    </p>
                    <p className="text-lg text-gray-900 font-medium italic leading-relaxed">
                      &ldquo;{suggestedWisdom}&rdquo;
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        type="button"
                        onClick={() => setWisdomMode('recording')}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-rose-500 text-white rounded-lg font-medium hover:bg-rose-600 transition-all text-lg shadow-lg hover:shadow-xl"
                      >
                        <Mic className="w-6 h-6" />
                        Record My Version
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          setWisdomMode('text');
                          setWisdomText(suggestedWisdom);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white text-gray-700 border-2 border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-all text-lg"
                      >
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        Use This Text
                      </Button>
                    </div>

                    <Button
                      type="button"
                      onClick={() => setIsWisdomCollapsed(true)}
                      variant="ghost"
                      className="w-full flex items-center justify-center gap-2 py-3 text-gray-500 hover:text-gray-700"
                    >
                      <Clock className="w-5 h-5" />
                      Maybe Later
                    </Button>
                  </div>
                </div>
              )}

              {/* Recording State */}
              {wisdomMode === 'recording' && (
                <div className="border-2 border-rose-500 rounded-lg p-8 bg-white">
                  <div className="text-center space-y-4">
                    {!isRecordingWisdom ? (
                      <>
                        <div className="w-20 h-20 mx-auto bg-rose-100 rounded-full flex items-center justify-center">
                          <Mic className="w-10 h-10 text-rose-500" />
                        </div>
                        <p className="text-sm text-gray-500 mb-2">
                          You might say: &ldquo;{suggestedWisdom}&rdquo;
                        </p>
                        <Button
                          type="button"
                          onClick={startWisdomRecording}
                          className="px-6 py-3 bg-rose-500 text-white rounded-lg font-medium hover:bg-rose-600"
                        >
                          Start Recording
                        </Button>
                        <button
                          type="button"
                          onClick={() => setWisdomMode(null)}
                          className="block mx-auto text-sm text-gray-500 hover:text-gray-700"
                        >
                          Back to options
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="w-20 h-20 mx-auto bg-rose-500 rounded-full flex items-center justify-center animate-pulse">
                          <Square className="w-8 h-8 text-white" />
                        </div>
                        <p className="text-2xl font-semibold text-rose-500">
                          {wisdomRecordingDuration}s / 10s
                        </p>
                        <Button
                          type="button"
                          onClick={stopWisdomRecording}
                          className="px-8 py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900"
                        >
                          Stop Recording
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Recorded Audio State */}
              {wisdomMode === 'recorded' && wisdomAudioUrl && (
                <div className="border-2 border-green-500 rounded-lg p-6 bg-white">
                  <p className="text-sm font-medium text-gray-700 mb-3">Your Wisdom Recording</p>
                  <audio
                    controls
                    src={wisdomAudioUrl}
                    className="w-full mb-4"
                  />
                  {wisdomText && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Transcribed text:</p>
                      <p className="text-gray-900 italic">{wisdomText}</p>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      onClick={() => {
                        setWisdomMode('recording');
                        setWisdomAudioBlob(null);
                        setWisdomAudioUrl(null);
                        setWisdomRecordingDuration(0);
                      }}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Mic className="w-4 h-4" />
                      Re-record
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setWisdomMode(null);
                        setWisdomAudioBlob(null);
                        if (wisdomAudioUrl) URL.revokeObjectURL(wisdomAudioUrl);
                        setWisdomAudioUrl(null);
                        setWisdomRecordingDuration(0);
                      }}
                      variant="ghost"
                      className="flex items-center gap-2 text-rose-500 hover:text-rose-700"
                    >
                      <X className="w-4 h-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              )}

              {/* Text State */}
              {wisdomMode === 'text' && (
                <div className="space-y-3">
                  <Label htmlFor="wisdomText">Your Wisdom</Label>
                  <Textarea
                    id="wisdomText"
                    value={wisdomText}
                    onChange={(e) => setWisdomText(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-rose-500 focus:ring-2 focus:ring-rose-200 resize-none"
                    placeholder="Share a key insight from this memory..."
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      setWisdomMode(null);
                      setWisdomText('');
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                </div>
              )}
              </CardContent>
            )}
          </Card>

          {/* Year and Date */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                When Did This Happen?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Year *</Label>
                  <Input
                    id="year"
                    type="number"
                    placeholder="e.g., 1985"
                    value={storyYear}
                    onChange={(e) => setStoryYear(e.target.value)}
                    max={new Date().getFullYear()}
                    data-testid="input-story-year"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Specific Date (Optional)</Label>
                  <Input
                    id="date"
                    type="text"
                    placeholder="mm/dd/yyyy"
                    value={storyDate}
                    onChange={(e) => setStoryDate(e.target.value)}
                    data-testid="input-story-date"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Photo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Add Photos (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {photos.length === 0 && (
                <p className="text-sm text-muted-foreground mb-4 text-center">
                  Add up to 3 photos to your story. Click or drag to add images.
                </p>
              )}
              <MultiPhotoUploader
                storyId={storyId || undefined}
                photos={photos}
                onPhotosChange={setPhotos}
                onPhotoUpload={isEditMode ? handlePhotoUpload : undefined}
                onPhotoRemove={isEditMode ? handlePhotoRemove : undefined}
                onPhotoUpdate={isEditMode ? handlePhotoUpdate : undefined}
                disabled={saveStoryMutation.isPending}
                loading={addPhotoMutation.isPending || removePhotoMutation.isPending || updatePhotoMutation.isPending}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 pb-8">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveStoryMutation.isPending}
              className="flex-1"
              data-testid="button-save-story"
            >
              {saveStoryMutation.isPending ? "Saving..." : "Save Story"}
            </Button>
          </div>

          {/* Delete Button - Only show in edit mode */}
          {isEditMode && (
            <div className="flex justify-center pb-24 md:pb-12">
              <Button
                onClick={handleDelete}
                variant="destructive"
                size="lg"
                className="flex items-center gap-3 px-8 py-6"
                data-testid="button-delete-story"
              >
                <Trash2 className="w-5 h-5 md:w-8 md:h-8" />
                <span className="text-base md:text-lg">Delete This Memory</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Upload Audio Dialog */}
      {showUploadDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Upload Audio File</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isTranscribing ? (
                <div className="py-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-sm text-muted-foreground">Transcribing your audio...</p>
                  <p className="text-xs text-muted-foreground mt-2">This may take a moment</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Select an audio file from your device. We will transcribe it for you.
                  </p>
                  <Input
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioUpload}
                    data-testid="input-audio-file-upload"
                  />
                  <Button
                    variant="outline"
                    onClick={() => setShowUploadDialog(false)}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function Review() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background album-texture pb-20 md:pb-0 md:pl-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading review...</p>
        </div>
      </div>
    }>
      <ReviewContent />
    </Suspense>
  );
}
