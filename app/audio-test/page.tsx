"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import {
  PathResult,
  formatDuration,
  formatCost,
  calculateTextDifference,
  findDifferentWords,
} from "@/lib/audioTestUtils";

export default function AudioTestPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [testResults, setTestResults] = useState<{
    pathA: PathResult | null;
    pathC: PathResult | null;
    testTotalTimeMs: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
      setTestResults(null);
    } catch (err) {
      setError("Failed to access microphone. Please grant permission.");
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const runTest = async () => {
    if (!audioBlob) {
      setError("No audio to test");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setTestResults(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("Please sign in to run tests");
        return;
      }

      const formData = new FormData();
      formData.append("audio", audioBlob, "test-audio.webm");

      const response = await fetch("/api/test-audio-processing", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Test failed");
      }

      const data = await response.json();
      setTestResults({
        pathA: data.results.pathA,
        pathC: data.results.pathC,
        testTotalTimeMs: data.testTotalTimeMs,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test failed");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const uploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioBlob(file);
      setAudioUrl(URL.createObjectURL(file));
      setError(null);
      setTestResults(null);
    }
  };

  const renderPathResult = (result: PathResult | null, label: string) => {
    if (!result) return null;

    const statusColor =
      result.status === "success"
        ? "text-green-600"
        : result.status === "timeout"
          ? "text-yellow-600"
          : "text-red-600";

    const statusIcon =
      result.status === "success"
        ? "✓"
        : result.status === "timeout"
          ? "⏱"
          : "✗";

    return (
      <div className="flex-1 border border-[#E8DDD3] rounded-xl p-6 bg-[#FAF8F6]">
        <h3 className="text-lg font-semibold text-[#4A3428] mb-4 flex items-center gap-2">
          <span className={statusColor}>{statusIcon}</span>
          {label}
        </h3>

        {result.error ? (
          <div className="text-red-600 text-sm mb-4 p-3 bg-red-50 rounded-lg">
            <strong>Error:</strong> {result.error}
          </div>
        ) : (
          <>
            {/* Timing Card */}
            <div className="mb-4 p-4 bg-white rounded-lg border border-[#E8DDD3]">
              <div className="text-sm font-medium text-[#8B7355] mb-2">
                ⏱ Timing
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6B5744]">Transcription:</span>
                  <span className="font-mono text-[#4A3428]">
                    {formatDuration(result.timing.transcriptionMs)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B5744]">Formatting:</span>
                  <span className="font-mono text-[#4A3428]">
                    {formatDuration(result.timing.formattingMs)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#E8DDD3] font-semibold">
                  <span className="text-[#4A3428]">Total:</span>
                  <span className="font-mono text-[#4A3428]">
                    {formatDuration(result.timing.totalMs)}
                  </span>
                </div>
              </div>
            </div>

            {/* Cost Card */}
            <div className="mb-4 p-4 bg-white rounded-lg border border-[#E8DDD3]">
              <div className="text-sm font-medium text-[#8B7355] mb-2">
                💰 Cost
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6B5744]">Transcription:</span>
                  <span className="font-mono text-[#4A3428]">
                    {formatCost(result.cost.transcription)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B5744]">Formatting:</span>
                  <span className="font-mono text-[#4A3428]">
                    {formatCost(result.cost.formatting)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#E8DDD3] font-semibold">
                  <span className="text-[#4A3428]">Total:</span>
                  <span className="font-mono text-[#4A3428]">
                    {formatCost(result.cost.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quality Card */}
            <div className="mb-4 p-4 bg-white rounded-lg border border-[#E8DDD3]">
              <div className="text-sm font-medium text-[#8B7355] mb-2">
                📊 Quality
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6B5744]">Word Count:</span>
                  <span className="font-mono text-[#4A3428]">
                    {result.quality.wordCount}
                  </span>
                </div>
                {result.quality.confidence && (
                  <div className="flex justify-between">
                    <span className="text-[#6B5744]">Confidence:</span>
                    <span className="font-mono text-[#4A3428]">
                      {(result.quality.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Transcription */}
            <div className="mb-4">
              <div className="text-sm font-medium text-[#8B7355] mb-2">
                📝 Transcription
              </div>
              <div className="p-3 bg-white rounded-lg border border-[#E8DDD3] text-sm text-[#4A3428] max-h-40 overflow-y-auto">
                {result.quality.transcription || "(empty)"}
              </div>
            </div>

            {/* Lessons */}
            <div>
              <div className="text-sm font-medium text-[#8B7355] mb-2">
                💡 Extracted Lessons
              </div>
              <div className="space-y-2">
                <div className="p-3 bg-white rounded-lg border border-[#E8DDD3]">
                  <div className="text-xs font-medium text-[#8B7355] mb-1">
                    Practical:
                  </div>
                  <div className="text-sm text-[#4A3428]">
                    {result.quality.lessons.practical}
                  </div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#E8DDD3]">
                  <div className="text-xs font-medium text-[#8B7355] mb-1">
                    Emotional:
                  </div>
                  <div className="text-sm text-[#4A3428]">
                    {result.quality.lessons.emotional}
                  </div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#E8DDD3]">
                  <div className="text-xs font-medium text-[#8B7355] mb-1">
                    Character:
                  </div>
                  <div className="text-sm text-[#4A3428]">
                    {result.quality.lessons.character}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderComparison = () => {
    if (!testResults?.pathA || !testResults?.pathC) return null;

    const { pathA, pathC } = testResults;

    const speedWinner =
      pathA.timing.totalMs < pathC.timing.totalMs ? "Path A" : "Path C";
    const speedDiff = Math.abs(pathA.timing.totalMs - pathC.timing.totalMs);

    const costWinner = pathA.cost.total < pathC.cost.total ? "Path A" : "Path C";
    const costDiff = Math.abs(pathA.cost.total - pathC.cost.total);

    const textDiff = calculateTextDifference(
      pathA.quality.transcription,
      pathC.quality.transcription
    );

    const wordDiff = findDifferentWords(
      pathA.quality.transcription,
      pathC.quality.transcription
    );

    return (
      <div className="mt-6 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
        <h3 className="text-lg font-semibold text-[#4A3428] mb-4">
          📊 Comparison Summary
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="p-4 bg-white rounded-lg border border-purple-200">
            <div className="text-sm font-medium text-purple-700 mb-2">
              ⚡ Speed Winner
            </div>
            <div className="text-lg font-bold text-[#4A3428]">{speedWinner}</div>
            <div className="text-xs text-[#6B5744] mt-1">
              {formatDuration(speedDiff)} faster
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg border border-purple-200">
            <div className="text-sm font-medium text-purple-700 mb-2">
              💰 Cost Winner
            </div>
            <div className="text-lg font-bold text-[#4A3428]">{costWinner}</div>
            <div className="text-xs text-[#6B5744] mt-1">
              {formatCost(costDiff)} cheaper
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg border border-purple-200">
            <div className="text-sm font-medium text-purple-700 mb-2">
              📝 Text Difference
            </div>
            <div className="text-lg font-bold text-[#4A3428]">{textDiff}%</div>
            <div className="text-xs text-[#6B5744] mt-1">
              {textDiff < 10 ? "Very similar" : textDiff < 25 ? "Somewhat different" : "Quite different"}
            </div>
          </div>
        </div>

        {wordDiff.onlyInFirst.length > 0 || wordDiff.onlyInSecond.length > 0 ? (
          <div className="p-4 bg-white rounded-lg border border-purple-200">
            <div className="text-sm font-medium text-purple-700 mb-2">
              📖 Word Differences
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {wordDiff.onlyInFirst.length > 0 && (
                <div>
                  <div className="font-medium text-[#8B7355] mb-1">
                    Only in AssemblyAI:
                  </div>
                  <div className="text-[#6B5744]">
                    {wordDiff.onlyInFirst.slice(0, 10).join(", ")}
                    {wordDiff.onlyInFirst.length > 10 && "..."}
                  </div>
                </div>
              )}
              {wordDiff.onlyInSecond.length > 0 && (
                <div>
                  <div className="font-medium text-[#8B7355] mb-1">
                    Only in Whisper:
                  </div>
                  <div className="text-[#6B5744]">
                    {wordDiff.onlyInSecond.slice(0, 10).join(", ")}
                    {wordDiff.onlyInSecond.length > 10 && "..."}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF8F6] to-[#F5EDE4]">
      {/* Header */}
      <div className="border-b border-[#E8DDD3] bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Image
              src="/logo circle.svg"
              alt="Heritage Whisper"
              width={48}
              height={48}
              className="rounded-full"
            />
            <div>
              <h1 className="text-2xl font-bold text-[#4A3428]">
                Audio Processing Test Lab
              </h1>
              <p className="text-sm text-[#8B7355]">
                Compare AssemblyAI vs Whisper transcription quality
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload/Record Section */}
        <div className="mb-8 p-6 bg-white rounded-xl border border-[#E8DDD3] shadow-sm">
          <h2 className="text-lg font-semibold text-[#4A3428] mb-4">
            1. Record or Upload Audio
          </h2>

          <div className="flex flex-wrap gap-4 mb-4">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="px-6 py-3 bg-gradient-to-r from-[#8b6b7a] to-[#a07d8f] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                🎤 Start Recording
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors animate-pulse"
              >
                ⏹ Stop Recording
              </button>
            )}

            <label className="px-6 py-3 bg-[#E8DDD3] text-[#4A3428] rounded-xl font-medium hover:bg-[#DCC9BA] transition-colors cursor-pointer">
              📁 Upload File
              <input
                type="file"
                accept="audio/*"
                onChange={uploadFile}
                className="hidden"
              />
            </label>
          </div>

          {audioUrl && (
            <div className="mb-4">
              <audio src={audioUrl} controls className="w-full" />
            </div>
          )}

          {audioBlob && !isProcessing && (
            <button
              onClick={runTest}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity shadow-lg"
            >
              🚀 Run Parallel Test (AssemblyAI vs Whisper)
            </button>
          )}

          {isProcessing && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-600 border-t-transparent"></div>
              <div className="mt-2 text-[#8B7355]">
                Testing both paths in parallel...
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Results Section */}
        {testResults && (
          <>
            <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
              <div className="text-center">
                <div className="text-sm font-medium text-green-700 mb-1">
                  Test Completed
                </div>
                <div className="text-2xl font-bold text-[#4A3428]">
                  {formatDuration(testResults.testTotalTimeMs)}
                </div>
                <div className="text-xs text-[#6B5744] mt-1">
                  Total parallel execution time
                </div>
              </div>
            </div>

            <h2 className="text-lg font-semibold text-[#4A3428] mb-4">
              2. Compare Results
            </h2>

            <div className="flex flex-col lg:flex-row gap-6 mb-6">
              {renderPathResult(testResults.pathA, "Path A: AssemblyAI")}
              {renderPathResult(testResults.pathC, "Path C: Whisper")}
            </div>

            {renderComparison()}
          </>
        )}
      </div>
    </div>
  );
}
