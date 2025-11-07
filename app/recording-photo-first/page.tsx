"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Camera, X, CheckCircle } from "lucide-react";
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
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [transcription, setTranscription] = useState('');

  const handlePhotoCapture = (dataURL: string) => {
    setPhotoDataURL(dataURL);
    setCurrentScreen('recording');
  };

  const handleCancelCapture = () => {
    setCurrentScreen('home');
  };

  const handleRecordingComplete = (blob: Blob, duration: number, transcript?: string) => {
    setAudioBlob(blob);
    setAudioDuration(duration);
    setTranscription(transcript || '');
    setCurrentScreen('review');
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
      {/* Top Bar - Hidden during recording and review */}
      {currentScreen !== 'recording' && currentScreen !== 'review' && (
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b border-gray-200">
          <div className="px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-md bg-gray-900 text-white flex items-center justify-center text-[13px] font-semibold tracking-tight">
                HW
              </div>
              <div className="text-[18px] font-medium tracking-tight">HeritageWhisper</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-[15px]"
              onClick={() => router.push('/timeline')}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </header>
      )}

      <main className="flex-1">
        {/* Screen 1: Home */}
        {currentScreen === 'home' && (
          <section className="px-5 pt-10 pb-24">
            <div className="text-center">
              <h1 className="text-[28px] leading-9 tracking-tight font-semibold">
                Every memory matters. Start with your voice.
              </h1>
              <p className="text-[18px] text-gray-600 mt-4 leading-relaxed">
                Capture a photo and speak your memory—under two minutes.
              </p>
            </div>

            <div className="mt-10 space-y-4">
              <Button
                onClick={() => setCurrentScreen('capture')}
                className="w-full h-[60px] bg-blue-600 text-white rounded-xl text-[18px] font-medium tracking-tight flex items-center justify-center gap-3 shadow-sm hover:bg-blue-700 active:bg-blue-800"
              >
                <Camera className="w-6 h-6" />
                Add a Photo
              </Button>

              <div>
                <Button
                  onClick={() => setCurrentScreen('recording')}
                  variant="outline"
                  className="w-full h-[60px] rounded-xl text-[18px] font-medium tracking-tight flex items-center justify-center gap-3"
                >
                  Record Story Now
                </Button>
                <p className="text-[15px] text-gray-500 mt-3 text-center">
                  Add photo anytime
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
