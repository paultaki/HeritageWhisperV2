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

  const handleRecordingComplete = async (blob: Blob, duration: number, data?: {
    transcription: string;
    title: string;
    lessonOptions: {
      practical: string;
      emotional: string;
      character: string;
    };
  }) => {
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

        // Prepare photo data with transform if available
        const photoData = photoDataURL ? [{
          id: `photo-${Date.now()}`,
          url: photoDataURL,
          transform: photoTransform, // Include zoom/pan transform
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
    <div className="mx-auto max-w-md min-h-screen relative flex flex-col bg-white">
      <main className="flex-1 flex flex-col pb-24">
        {/* Screen 1: Home */}
        {currentScreen === 'home' && (
          <section className="flex-1 flex flex-col px-6 pt-8">
            <div className="text-center mb-8">
              <h1 className="text-[36px] leading-[1.2] tracking-tight font-semibold mb-6">
                Every memory matters. Start with your voice.
              </h1>
            </div>

            <PreRecordHints />

            <div className="mx-auto w-full max-w-sm px-4 space-y-6 mt-4">
              <Button
                onClick={() => setCurrentScreen('capture')}
                className="w-full h-[64px] bg-blue-600 text-white rounded-xl text-[19px] font-medium tracking-tight flex items-center justify-center gap-3 shadow-sm hover:bg-blue-700 active:bg-blue-800"
              >
                <Camera className="w-6 h-6" />
                Add a Photo
              </Button>

              <div>
                <Button
                  onClick={() => setCurrentScreen('recording')}
                  variant="outline"
                  className="w-full h-[64px] rounded-xl text-[19px] font-medium tracking-tight flex items-center justify-center gap-3 border-2"
                >
                  <Mic className="w-6 h-6" />
                  Record Story Now
                </Button>
                <p className="text-[17px] text-gray-500 text-center mt-3">
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
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-md mx-auto">
          <Button
            variant="outline"
            className="w-full h-[56px] text-[18px] font-medium"
            onClick={() => router.push('/timeline')}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
