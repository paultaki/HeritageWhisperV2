"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, Play, Pause, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ReviewScreenProps {
  audioUrl: string;
  duration: number;
  prompt?: string;
  transcription?: string;
  lessonOptions?: {
    practical?: string;
    emotional?: string;
    character?: string;
  };
  isTranscribing: boolean;
  onSave: (data: {
    title: string;
    storyYear?: number;
    transcription?: string;
    lessonLearned?: string;
  }) => void;
  onBack: () => void;
}

export function ReviewScreen({
  audioUrl,
  duration,
  prompt,
  transcription,
  lessonOptions,
  isTranscribing,
  onSave,
  onBack,
}: ReviewScreenProps) {
  const [title, setTitle] = useState("Untitled Memory");
  const [year, setYear] = useState("");
  const [story, setStory] = useState(transcription || "");
  const [selectedLesson, setSelectedLesson] = useState("");

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Update story when transcription completes
  useEffect(() => {
    if (transcription && !story) {
      setStory(transcription);
    }
  }, [transcription]);

  // Auto-select first lesson option when available
  useEffect(() => {
    if (lessonOptions && !selectedLesson) {
      setSelectedLesson(
        lessonOptions.emotional || lessonOptions.practical || lessonOptions.character || ""
      );
    }
  }, [lessonOptions]);

  // Audio player setup
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTime = () => setCurrentTime(audio.currentTime || 0);
    const onEnd = () => {
      setPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnd);
    };
  }, [audioUrl]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const handleSave = () => {
    onSave({
      title: title.trim() || "Untitled Memory",
      storyYear: year ? parseInt(year) : undefined,
      transcription: story,
      lessonLearned: selectedLesson,
    });
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const wordCount = story
    ? story.trim().split(/\s+/).filter(Boolean).length
    : 0;

  // Generate year options (130 years back from current year)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 130 }, (_, i) =>
    String(currentYear - i)
  );

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-gray-200">
        <div className="max-w-md mx-auto px-5 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 rounded-lg px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-[#2C5282]"
            aria-label="Go back"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="text-center">
            <h1 className="text-lg font-semibold tracking-tight text-gray-900">
              Review Memory
            </h1>
          </div>

          <div className="w-[60px]"></div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-6 pb-10 pt-6">
        {/* Prompt display */}
        {prompt && (
          <div className="bg-blue-50 border-l-4 border-[#2C5282] rounded-r-lg p-4 mb-6">
            <p className="text-sm text-blue-700 font-medium mb-1">
              You answered:
            </p>
            <p className="text-base text-gray-900">{prompt}</p>
          </div>
        )}

        {/* Audio player */}
        <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500">Your Recording</span>
            <span className="text-sm text-gray-900 font-mono tabular-nums">
              {formatDuration(duration)}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlayPause}
              className="w-12 h-12 bg-[#2C5282] rounded-full flex items-center justify-center hover:brightness-110 active:brightness-90 outline-none focus-visible:ring-4 focus-visible:ring-[#2C5282]/30"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white ml-0.5" />
              )}
            </button>
            <div className="flex-1">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-2 bg-[#2C5282] rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500 tabular-nums font-mono">
                <span>{formatDuration(currentTime)}</span>
                <span>{formatDuration(duration)}</span>
              </div>
            </div>
          </div>
          <audio
            ref={audioRef}
            src={audioUrl}
            className="hidden"
            preload="metadata"
          />
        </div>

        {/* Collapsed sections */}
        <div className="bg-white border-y border-gray-200">
          {/* Story Title */}
          <details className="bg-white border-b border-gray-200">
            <summary className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50">
              <span className="font-medium text-gray-900">Story Title</span>
              <span className="text-gray-500 text-sm">
                {title || "Untitled memory"}
              </span>
            </summary>
            <div className="px-6 pb-4">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full"
                placeholder="Give your memory a title..."
              />
            </div>
          </details>

          {/* When did this happen? */}
          <details className="bg-white border-b border-gray-200">
            <summary className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50">
              <span className="font-medium text-gray-900">
                When did this happen?
              </span>
              <span className="text-gray-500 text-sm">
                {year || "Add year"}
              </span>
            </summary>
            <div className="px-6 pb-4">
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-[#2C5282] focus:ring-4 focus:ring-[#2C5282]/20 outline-none text-[15px] bg-white"
              >
                <option value="">Select year</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-2">
                Optional: add a year for it to appear in your book and timeline.
              </p>
            </div>
          </details>

          {/* Your Story */}
          <details open className="bg-white border-b border-gray-200">
            <summary className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50">
              <span className="font-medium text-gray-900">Your Story</span>
              <span className="text-blue-600 text-sm">
                {isTranscribing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Transcribing...
                  </span>
                ) : (
                  `${wordCount} words`
                )}
              </span>
            </summary>
            <div className="px-6 pb-5">
              {isTranscribing ? (
                <div className="flex items-center justify-center py-8 text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span>Transcribing your recording...</span>
                </div>
              ) : (
                <Textarea
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  className="w-full min-h-[200px] p-4 bg-gray-50 rounded-xl border border-gray-200 focus:border-[#2C5282] focus:ring-4 focus:ring-[#2C5282]/20 outline-none text-[15px]"
                  placeholder="Add or edit the transcription of your story..."
                />
              )}
            </div>
          </details>

          {/* Wisdom Captured (Lesson) */}
          {selectedLesson && (
            <details className="bg-white border-b border-gray-200">
              <summary className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50">
                <span className="font-medium text-gray-900 inline-flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#ED8936]" />
                  Wisdom Captured
                </span>
              </summary>
              <div className="px-6 pb-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-base text-gray-900 italic">
                    "{selectedLesson}"
                  </p>
                </div>
                {lessonOptions && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-gray-600">
                      Choose a different lesson:
                    </p>
                    {lessonOptions.emotional && (
                      <button
                        onClick={() =>
                          setSelectedLesson(lessonOptions.emotional!)
                        }
                        className={`w-full text-left px-3 py-2 rounded-lg border ${
                          selectedLesson === lessonOptions.emotional
                            ? "border-[#2C5282] bg-blue-50"
                            : "border-gray-200 hover:bg-gray-50"
                        } text-sm`}
                      >
                        {lessonOptions.emotional}
                      </button>
                    )}
                    {lessonOptions.practical && (
                      <button
                        onClick={() =>
                          setSelectedLesson(lessonOptions.practical!)
                        }
                        className={`w-full text-left px-3 py-2 rounded-lg border ${
                          selectedLesson === lessonOptions.practical
                            ? "border-[#2C5282] bg-blue-50"
                            : "border-gray-200 hover:bg-gray-50"
                        } text-sm`}
                      >
                        {lessonOptions.practical}
                      </button>
                    )}
                    {lessonOptions.character && (
                      <button
                        onClick={() =>
                          setSelectedLesson(lessonOptions.character!)
                        }
                        className={`w-full text-left px-3 py-2 rounded-lg border ${
                          selectedLesson === lessonOptions.character
                            ? "border-[#2C5282] bg-blue-50"
                            : "border-gray-200 hover:bg-gray-50"
                        } text-sm`}
                      >
                        {lessonOptions.character}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </details>
          )}
        </div>

        {/* Save button */}
        <div className="mt-6">
          <Button
            onClick={handleSave}
            disabled={isTranscribing}
            className="w-full px-6 py-4 bg-[#2C5282] text-white rounded-xl font-semibold tracking-tight hover:brightness-110 active:brightness-90 h-auto text-lg"
          >
            {isTranscribing ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Transcribing...
              </span>
            ) : (
              "Save Memory"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
