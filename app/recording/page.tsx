"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Camera, X, CheckCircle, Mic } from "lucide-react";
import { CameraCapture } from "@/components/recording/CameraCapture";
import { AudioRecordingWithPhoto } from "@/components/recording/AudioRecordingWithPhoto";
import { PhotoFirstReview } from "@/components/recording/PhotoFirstReview";
import PreRecordHints from "@/components/recording/PreRecordHints";
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

            <PreRecordHints />

            <div className="mx-auto w-full max-w-sm md:max-w-lg px-4 space-y-6 md:space-y-8 mt-4">
              {/* Mobile: Single "Add a Photo" button */}
              <div className="md:hidden">
                <Button
                  onClick={() => setCurrentScreen('capture')}
                  className="w-full h-[64px] bg-gradient-to-r from-[#8b6b7a] to-[#9d6b7c] text-white rounded-2xl text-lg font-bold tracking-tight flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300"
                >
                  <Camera className="w-6 h-6" />
                  Add a Photo
                </Button>
              </div>

              {/* Desktop: Two photo options side-by-side */}
              <div className="hidden md:grid md:grid-cols-2 gap-4">
                <Button
                  onClick={() => {
                    // Trigger file input
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          handlePhotoCapture(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    };
                    input.click();
                  }}
                  className="w-full h-[72px] bg-gradient-to-r from-[#8b6b7a] to-[#9d6b7c] text-white rounded-2xl text-lg font-bold tracking-tight flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl hover:scale-105 hover:-translate-y-0.5 active:scale-95 transition-all duration-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Choose from Files
                </Button>
                <Button
                  onClick={() => setCurrentScreen('capture')}
                  variant="outline"
                  className="w-full h-[72px] rounded-2xl text-lg font-bold tracking-tight flex items-center justify-center gap-3 border-2 border-[#e8ddd5] text-[#2d2520] hover:border-[#c9a78a] hover:bg-white hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-300"
                >
                  <Camera className="w-6 h-6" />
                  Use Camera
                </Button>
              </div>

              <div>
                <Button
                  onClick={() => setCurrentScreen('recording')}
                  variant="outline"
                  className="w-full h-[64px] md:h-[72px] rounded-2xl text-lg font-bold tracking-tight flex items-center justify-center gap-3 border-2 border-[#e8ddd5] text-[#2d2520] hover:border-[#c9a78a] hover:bg-white hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-300"
                >
                  <Mic className="w-6 h-6" />
                  Record Story Now
                </Button>
                <p className="text-base text-[#6b7280] text-center mt-3">
                  Add photo later
                </p>
              </div>
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

      {/* Fixed Cancel Button at Bottom - Only on home screen */}
      {currentScreen === 'home' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-[#e8ddd5] p-4 max-w-md md:max-w-3xl mx-auto shadow-lg">
          <Button
            variant="outline"
            className="w-full h-[56px] text-lg font-semibold border-2 border-[#e8ddd5] text-[#5a4a3a] hover:border-[#c9a78a] hover:bg-white transition-all duration-200"
            onClick={() => router.push('/timeline')}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
