"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Play, Pause, Mic, ImagePlus, AlignLeft } from "lucide-react";

type PhotoFirstReviewProps = {
  photoDataURL: string | null;
  photoTransform?: { zoom: number; position: { x: number; y: number } };
  audioBlob: Blob;
  audioDuration: number;
  transcription?: string;
  suggestedTitle?: string;
  lessonOptions?: {
    practical: string;
    emotional: string;
    character: string;
  };
  onSave: (data: {
    title: string;
    year: string;
    month: string;
    day: string;
    decade: string;
    transcription: string;
    lessonLearned: string;
    photoDataURL: string | null;
    audioBlob: Blob;
  }) => void;
  onReRecord: () => void;
  onChangePhoto: () => void;
};

export function PhotoFirstReview({
  photoDataURL,
  photoTransform,
  audioBlob,
  audioDuration,
  transcription = '',
  suggestedTitle = '',
  lessonOptions,
  onSave,
  onReRecord,
  onChangePhoto
}: PhotoFirstReviewProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [title, setTitle] = useState(suggestedTitle);
  const [decade, setDecade] = useState('');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [transcriptionText, setTranscriptionText] = useState(transcription);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [lessonLearned, setLessonLearned] = useState(lessonOptions?.practical || '');

  useEffect(() => {
    // Create audio URL from blob
    if (audioRef.current && audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      audioRef.current.src = url;

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [audioBlob]);

  useEffect(() => {
    // Update state when props change
    setTranscriptionText(transcription);
    if (suggestedTitle) {
      setTitle(suggestedTitle);
    }
    if (lessonOptions?.practical) {
      setLessonLearned(lessonOptions.practical);
    }
  }, [transcription, suggestedTitle, lessonOptions]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickedPercent = x / rect.width;
    const newTime = clickedPercent * audioRef.current.duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert('Please add a title for your memory');
      return;
    }

    onSave({
      title: title.trim(),
      year,
      month,
      day,
      decade,
      transcription: transcriptionText,
      lessonLearned,
      photoDataURL,
      audioBlob
    });
  };

  // Generate decade options (1920s to current decade)
  const currentYear = new Date().getFullYear();
  const currentDecade = Math.floor(currentYear / 10) * 10;
  const decades = [];
  for (let d = currentDecade; d >= 1920; d -= 10) {
    decades.push(d);
  }

  const progressPercent = audioRef.current?.duration
    ? (currentTime / audioRef.current.duration) * 100
    : 0;

  return (
    <section className="hw-page bg-gray-50 pb-32">
      {/* Photo Hero */}
      <div className="relative h-56 bg-black">
        {photoDataURL ? (
          <img
            src={photoDataURL}
            className="w-full h-full object-contain opacity-90"
            alt="Photo"
            style={
              photoTransform
                ? {
                    transform: `scale(${photoTransform.zoom}) translate(${photoTransform.position.x}%, ${photoTransform.position.y}%)`,
                    transformOrigin: "center center",
                  }
                : undefined
            }
          />
        ) : (
          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
            <p className="text-white/50">No photo</p>
          </div>
        )}
        <Button
          onClick={onChangePhoto}
          size="sm"
          variant="secondary"
          className="absolute bottom-3 right-3 bg-white/90 hover:bg-white text-xs h-8 px-2"
        >
          <ImagePlus className="w-3 h-3 mr-1" />
          Change
        </Button>
      </div>

      {/* Audio Player */}
      <div className="bg-white p-4 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={handlePlayPause}
            className="shrink-0 w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 active:bg-blue-800 transition shadow-md"
          >
            {isPlaying ? (
              <Pause className="text-white w-6 h-6" />
            ) : (
              <Play className="text-white w-6 h-6 ml-0.5" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div
              onClick={handleProgressClick}
              className="h-2.5 bg-gray-200 rounded-full overflow-hidden cursor-pointer mb-1.5"
            >
              <div
                className="h-2.5 bg-blue-600 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(audioDuration)}</span>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onReRecord}
          className="w-full border-red-200 text-red-600 hover:bg-red-50 h-10"
        >
          <Mic className="w-4 h-4 mr-2" />
          Re-record
        </Button>

        <audio ref={audioRef} className="hidden" preload="metadata" />
      </div>

      {/* Simple Details */}
      <div className="bg-white p-4 space-y-4">
        <div>
          <label className="text-sm text-gray-600 font-medium">Title *</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1.5 text-base h-11"
            placeholder="Give this memory a title..."
          />
        </div>

        <div>
          <label className="text-sm text-gray-600 font-medium">Exact date (optional)</label>
          <div className="flex gap-2 mt-1.5">
            <Input
              type="number"
              inputMode="numeric"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="Year"
              className="w-24 text-sm"
            />
            <Input
              type="number"
              inputMode="numeric"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              placeholder="Month"
              min="1"
              max="12"
              className="w-24 text-sm"
            />
            <Input
              type="number"
              inputMode="numeric"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              placeholder="Day"
              min="1"
              max="31"
              className="w-20 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-600 font-medium">Or choose a decade</label>
          <select
            value={decade}
            onChange={(e) => setDecade(e.target.value)}
            className="w-full p-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white mt-1.5"
          >
            <option value="">Select decade...</option>
            {decades.map(d => (
              <option key={d} value={d}>{d}s</option>
            ))}
          </select>
        </div>

        <details className="group" open={!!transcriptionText}>
          <summary className="text-sm text-gray-600 font-medium cursor-pointer flex items-center gap-2 select-none py-2">
            <AlignLeft className="w-4 h-4 text-gray-500 group-open:rotate-90 transition" />
            View & edit transcription (optional)
          </summary>
          <Textarea
            value={transcriptionText}
            onChange={(e) => setTranscriptionText(e.target.value)}
            className="w-full mt-2 p-3 border border-gray-200 rounded-lg h-32 text-sm text-gray-700"
            placeholder="Transcription will appear here if available"
          />
        </details>

        <details className="group" open={!!lessonOptions}>
          <summary className="text-sm text-gray-600 font-medium cursor-pointer flex items-center gap-2 select-none py-2">
            <AlignLeft className="w-4 h-4 text-gray-500 group-open:rotate-90 transition" />
            Lesson learned (optional)
          </summary>
          <div className="mt-2 space-y-2">
            {lessonOptions && (
              <div className="space-y-2 mb-3">
                <p className="text-xs text-gray-500">Choose a suggested lesson or write your own:</p>
                {Object.entries(lessonOptions).map(([type, text]) => (
                  <button
                    key={type}
                    onClick={() => setLessonLearned(text)}
                    className={`w-full text-left p-2.5 border rounded-lg text-sm transition ${
                      lessonLearned === text
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-xs font-medium text-gray-500 uppercase block mb-0.5">
                      {type}
                    </span>
                    {text}
                  </button>
                ))}
              </div>
            )}
            <Textarea
              value={lessonLearned}
              onChange={(e) => setLessonLearned(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg h-24 text-sm text-gray-700"
              placeholder="Or write your own lesson..."
            />
          </div>
        </details>
      </div>

      {/* Save Button (Fixed) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 max-w-md mx-auto">
        <Button
          onClick={handleSave}
          className="w-full h-14 bg-blue-600 text-white rounded-xl text-base font-semibold hover:bg-blue-700 shadow-lg"
        >
          Save to Timeline
        </Button>
      </div>
    </section>
  );
}
