"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Camera, X, CheckCircle, Mic } from "lucide-react";
import { CameraCapture } from "@/components/recording/CameraCapture";
import { AudioRecordingWithPhoto } from "@/components/recording/AudioRecordingWithPhoto";
import { PhotoFirstReview } from "@/components/recording/PhotoFirstReview";
import { navCache } from "@/lib/navCache";
import { useToast } from "@/hooks/use-toast";

type Screen = 'home' | 'capture' | 'recording' | 'review' | 'success';

export default function PhotoFirstRecordingPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [photoDataURL, setPhotoDataURL] = useState<string | null>(null);
  const [photoTransform, setPhotoTransform] = useState<{ zoom: number; position: { x: number; y: number } } | undefined>();
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [transcription, setTranscription] = useState('');
  const [suggestedTitle, setSuggestedTitle] = useState('');
  const [lessonOptions, setLessonOptions] = useState<{
    practical: string;
    emotional: string;
    character: string;
  } | undefined>();
  const [isStarting, setIsStarting] = useState(false);

  const handlePhotoCapture = (dataURL: string, transform?: { zoom: number; position: { x: number; y: number } }) => {
    setPhotoDataURL(dataURL);
    setPhotoTransform(transform);
    setCurrentScreen('recording');
  };

  const handleCancelCapture = () => {
    setCurrentScreen('home');
  };

  const handleRecordingComplete = async (
    blob: Blob,
    duration: number,
    updatedPhotoTransform: { zoom: number; position: { x: number; y: number } },
    data?: {
      transcription: string;
      title: string;
      lessonOptions: {
        practical: string;
        emotional: string;
        character: string;
      };
    }
  ) => {
    console.log('[PhotoFirst] Recording complete, received data:', {
      hasData: !!data,
      transcription: data?.transcription?.substring(0, 50),
      title: data?.title,
      hasLessonOptions: !!data?.lessonOptions,
      duration,
      blobSize: blob.size
    });

    // Skip the PhotoFirstReview screen and go directly to book-style review
    if (data) {
      // Convert audio blob to base64 for NavCache
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64Audio = reader.result as string;
        const audioType = blob.type;

        // Prepare NavCache data for book-style review
        const navId = `photo-first-${Date.now()}`;

        // Prepare photo data with updated transform from recording
        const photoData = photoDataURL ? [{
          id: `photo-${Date.now()}`,
          url: photoDataURL,
          transform: updatedPhotoTransform, // Use updated zoom/pan transform
          isHero: true // Mark as hero image
        }] : [];

        const cacheData = {
          mode: 'edit',
          title: data.title,
          transcription: data.transcription,
          lessonLearned: data.lessonOptions.practical, // Default to practical lesson
          mainAudioBase64: base64Audio.split(',')[1], // Remove data:audio/webm;base64, prefix
          mainAudioType: audioType,
          audioDuration: duration,
          audioBlob: blob,
          duration: duration,
          photos: photoData, // Include photo array with transform
          timestamp: new Date().toISOString(),
          returnPath: '/timeline',
        };

        console.log('[PhotoFirst] ========== STORING IN NAVCACHE ==========');
        console.log('[PhotoFirst] NavCache data:', {
          navId,
          title: cacheData.title,
          transcriptionLength: cacheData.transcription?.length,
          transcriptionPreview: cacheData.transcription?.substring(0, 100),
          hasPhotos: !!cacheData.photos,
          photoCount: cacheData.photos?.length,
          hasLessonLearned: !!cacheData.lessonLearned,
          lessonPreview: cacheData.lessonLearned?.substring(0, 50),
        });

        // Store in NavCache
        navCache.set(navId, cacheData);

        // Verify it was stored
        const verify = navCache.get(navId);
        console.log('[PhotoFirst] Verification - data retrieved:', {
          found: !!verify,
          hasTranscription: !!verify?.transcription,
          hasTitle: !!verify?.title,
        });

        // Small delay to ensure cache is written, then navigate
        setTimeout(() => {
          console.log('[PhotoFirst] Navigating to book-style review...');
          router.push(`/review/book-style?nav=${navId}&mode=edit`);
        }, 50);
      };

      reader.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to process audio. Please try again.",
          variant: "destructive",
        });
      };
    } else {
      // Fallback if no data - shouldn't happen but just in case
      setAudioBlob(blob);
      setAudioDuration(duration);
      setCurrentScreen('review');
    }
  };

  const handleCancelRecording = () => {
    setCurrentScreen('home');
    setPhotoDataURL(null);
  };

  const handleReRecord = () => {
    setCurrentScreen('recording');
    setAudioBlob(null);
  };

  const handleChangePhoto = () => {
    setCurrentScreen('capture');
  };

  const handleSave = async (data: {
    title: string;
    year: string;
    month: string;
    day: string;
    decade: string;
    transcription: string;
    lessonLearned: string;
    photoDataURL: string | null;
    audioBlob: Blob;
  }) => {
    try {
      // Prepare data for NavCache to pass to book-style review
      const navId = `photo-first-${Date.now()}`;

      // Convert audio blob to base64 for NavCache
      const reader = new FileReader();
      reader.readAsDataURL(data.audioBlob);
      reader.onloadend = () => {
        const base64Audio = reader.result as string;
        const audioType = data.audioBlob.type;

        // Prepare NavCache data
        const cacheData = {
          mode: 'quick',
          title: data.title,
          storyYear: data.year || data.decade,
          transcription: data.transcription,
          mainAudioBase64: base64Audio.split(',')[1], // Remove data:audio/webm;base64, prefix
          mainAudioType: audioType,
          audioDuration: audioDuration,
          audioBlob: data.audioBlob,
          duration: audioDuration,
          timestamp: new Date().toISOString(),
          returnPath: '/timeline',
        };

        // Store in NavCache
        navCache.set(navId, cacheData);

        // Show success screen briefly
        setCurrentScreen('success');

        // Navigate to book-style review after short delay
        setTimeout(() => {
          router.push(`/review/book-style?nav=${navId}&mode=edit`);
        }, 1500);
      };

      reader.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to process audio. Please try again.",
          variant: "destructive",
        });
      };

    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Error",
        description: "Failed to save memory. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mx-auto max-w-md md:max-w-3xl min-h-screen relative flex flex-col bg-gradient-to-b from-[#faf8f5] via-[#f5f0eb] to-[#f0ebe6]">
      <main className="flex-1 flex flex-col pb-20 md:pb-24">
        {/* Screen 1: Home */}
        {currentScreen === 'home' && (
          <section className="flex-1 flex flex-col px-6 md:px-12 pt-4 md:pt-12">
            <div className="text-center mb-8 md:mb-12">
              <h1 className="text-4xl md:text-5xl leading-tight font-bold text-[#2d2520] mb-6">
                Every memory matters. Start with your voice.
              </h1>
            </div>

            {/* Button Section - Premium Senior-Optimized Design */}
            <div
              className="space-y-5 px-6 pb-6 md:max-w-2xl md:mx-auto"
              style={{
                paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))'
              }}
            >
              {/* Primary CTA - Record with Photo (Recommended Path) */}
              <div className="space-y-2">
                <button
                  onClick={async () => {
                    if (isStarting) return;
                    setIsStarting(true);
                    // Haptic feedback on supported devices
                    if ('vibrate' in navigator) {
                      navigator.vibrate(10);
                    }
                    // Brief delay for visual feedback
                    await new Promise(r => setTimeout(r, 100));
                    setCurrentScreen('capture');
                    setIsStarting(false);
                  }}
                  disabled={isStarting}
                  className="w-full py-5 px-6 bg-purple-700 hover:bg-purple-800
                             active:bg-purple-900 text-white rounded-2xl
                             flex items-center justify-center gap-4
                             text-xl font-semibold shadow-lg hover:shadow-xl
                             transition-all duration-200 min-h-[64px]
                             focus-visible:ring-4 focus-visible:ring-purple-300
                             focus-visible:ring-offset-2
                             active:scale-[0.98] group
                             disabled:opacity-50 disabled:cursor-not-allowed
                             md:py-6 md:text-2xl md:max-w-xl md:mx-auto md:min-h-[72px]
                             motion-reduce:transition-none motion-reduce:hover:scale-100"
                  aria-label="Add a photo before recording to see it while you speak"
                  data-analytics="recording-start-with-photo"
                >
                  <Camera className="w-7 h-7 group-hover:scale-110 transition-transform motion-reduce:group-hover:scale-100" />
                  <span>Record with Photo</span>
                </button>
                <p className="text-center text-gray-600 text-base px-2">
                  One extra step helps you remember more details
                </p>
              </div>

              {/* Divider with "OR" */}
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="flex-shrink mx-4 text-gray-500 font-medium text-sm tracking-wide">
                  OR SKIP THE PHOTO
                </span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>

              {/* Secondary Option - Audio Only */}
              <div className="space-y-2">
                <button
                  onClick={async () => {
                    if (isStarting) return;
                    setIsStarting(true);
                    // Haptic feedback on supported devices
                    if ('vibrate' in navigator) {
                      navigator.vibrate(10);
                    }
                    // Brief delay for visual feedback
                    await new Promise(r => setTimeout(r, 100));
                    setCurrentScreen('recording');
                    setIsStarting(false);
                  }}
                  disabled={isStarting}
                  className="w-full py-5 px-6 bg-white border-2 border-gray-300
                             hover:border-gray-400 hover:bg-gray-50
                             rounded-2xl transition-all duration-200 min-h-[64px]
                             shadow-sm hover:shadow-md
                             focus-visible:ring-4 focus-visible:ring-gray-300
                             focus-visible:ring-offset-2
                             active:scale-[0.98] group
                             disabled:opacity-50 disabled:cursor-not-allowed
                             md:py-6 md:max-w-xl md:mx-auto md:min-h-[72px]
                             motion-reduce:transition-none motion-reduce:hover:scale-100"
                  aria-label="Start recording your story now without a photo"
                  data-analytics="recording-start-no-photo"
                >
                  <div className="flex items-center justify-center gap-3">
                    <Mic className="w-6 h-6 text-gray-600 group-hover:scale-110 transition-transform motion-reduce:group-hover:scale-100" />
                    <span className="font-semibold text-gray-900 text-lg">
                      Start Recording (no photo)
                    </span>
                  </div>
                </button>
                <p className="text-center text-sm text-gray-500 px-2">
                  Record now, add photos anytime later
                </p>
              </div>

              {/* Keyboard Navigation Hint - Desktop Only */}
              <p className="hidden md:block text-center text-sm text-gray-400 mt-4">
                Press <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Tab</kbd> to navigate
              </p>
            </div>
          </section>
        )}

        {/* Screen 2: Photo Capture */}
        {currentScreen === 'capture' && (
          <CameraCapture
            onCapture={handlePhotoCapture}
            onCancel={handleCancelCapture}
          />
        )}

        {/* Screen 3: Recording */}
        {currentScreen === 'recording' && (
          <AudioRecordingWithPhoto
            photoDataURL={photoDataURL}
            photoTransform={photoTransform}
            onComplete={handleRecordingComplete}
            onCancel={handleCancelRecording}
          />
        )}

        {/* Screen 4: Review */}
        {currentScreen === 'review' && audioBlob && (
          <PhotoFirstReview
            photoDataURL={photoDataURL}
            audioBlob={audioBlob}
            audioDuration={audioDuration}
            transcription={transcription}
            suggestedTitle={suggestedTitle}
            lessonOptions={lessonOptions}
            onSave={handleSave}
            onReRecord={handleReRecord}
            onChangePhoto={handleChangePhoto}
          />
        )}

        {/* Screen 5: Success */}
        {currentScreen === 'success' && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
            <div className="bg-white rounded-2xl p-8 text-center w-full max-w-sm border border-gray-200">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <h2 className="text-[20px] tracking-tight font-semibold mt-4">
                Memory Saved!
              </h2>
              <p className="text-[16px] text-gray-600 mt-2">
                Your photo's story is being processed...
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
