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
    pathB: PathResult | null;
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
        pathB: data.results.pathB,
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
                {result.timing.audioCleanMs !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-[#6B5744]">Audio Cleaning:</span>
                    <span className="font-mono text-[#4A3428]">
                      {formatDuration(result.timing.audioCleanMs)}
                    </span>
                  </div>
                )}
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
                {result.cost.audioCleaning !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-[#6B5744]">Audio Cleaning:</span>
                    <span className="font-mono text-[#4A3428]">
                      {formatCost(result.cost.audioCleaning)}
                      <span className="text-xs text-[#8B7355] ml-1">(free tier)</span>
                    </span>
                  </div>
                )}
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
    if (!testResults?.pathA || !testResults?.pathB || !testResults?.pathC) return null;

    const { pathA, pathB, pathC } = testResults;

    // Find fastest path
    const times = [
      { name: 'Path A', time: pathA.timing.totalMs },
      { name: 'Path B', time: pathB.timing.totalMs },
      { name: 'Path C', time: pathC.timing.totalMs },
    ];
    const fastestPath = times.reduce((prev, curr) => prev.time < curr.time ? prev : curr);
    const slowestPath = times.reduce((prev, curr) => prev.time > curr.time ? prev : curr);
    const speedDiff = slowestPath.time - fastestPath.time;

    // Find cheapest path
    const costs = [
      { name: 'Path A', cost: pathA.cost.total },
      { name: 'Path B', cost: pathB.cost.total },
      { name: 'Path C', cost: pathC.cost.total },
    ];
    const cheapestPath = costs.reduce((prev, curr) => prev.cost < curr.cost ? prev : curr);
    const costDiff = Math.max(...costs.map(c => c.cost)) - cheapestPath.cost;

    // Compare all transcriptions
    const diffAB = calculateTextDifference(pathA.quality.transcription, pathB.quality.transcription);
    const diffAC = calculateTextDifference(pathA.quality.transcription, pathC.quality.transcription);
    const diffBC = calculateTextDifference(pathB.quality.transcription, pathC.quality.transcription);
    const avgDiff = Math.round((diffAB + diffAC + diffBC) / 3);

    return (
      <div className="mt-6 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
        <h3 className="text-lg font-semibold text-[#4A3428] mb-4">
          📊 Comparison Summary
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="p-4 bg-white rounded-lg border border-purple-200">
            <div className="text-sm font-medium text-purple-700 mb-2">
              ⚡ Fastest
            </div>
            <div className="text-lg font-bold text-[#4A3428]">{fastestPath.name}</div>
            <div className="text-xs text-[#6B5744] mt-1">
              {formatDuration(fastestPath.time)}
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg border border-purple-200">
            <div className="text-sm font-medium text-purple-700 mb-2">
              🐢 Slowest
            </div>
            <div className="text-lg font-bold text-[#4A3428]">{slowestPath.name}</div>
            <div className="text-xs text-[#6B5744] mt-1">
              +{formatDuration(speedDiff)} slower
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg border border-purple-200">
            <div className="text-sm font-medium text-purple-700 mb-2">
              💰 Cheapest
            </div>
            <div className="text-lg font-bold text-[#4A3428]">{cheapestPath.name}</div>
            <div className="text-xs text-[#6B5744] mt-1">
              {formatCost(cheapestPath.cost)}
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg border border-purple-200">
            <div className="text-sm font-medium text-purple-700 mb-2">
              📝 Avg Difference
            </div>
            <div className="text-lg font-bold text-[#4A3428]">{avgDiff}%</div>
            <div className="text-xs text-[#6B5744] mt-1">
              A↔B: {diffAB}%, A↔C: {diffAC}%, B↔C: {diffBC}%
            </div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-lg border border-purple-200">
          <div className="text-sm font-medium text-purple-700 mb-2">
            📊 Detailed Comparison
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[#6B5744]">Path A Word Count:</span>
              <span className="font-mono text-[#4A3428]">{pathA.quality.wordCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B5744]">Path B Word Count:</span>
              <span className="font-mono text-[#4A3428]">{pathB.quality.wordCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B5744]">Path C Word Count:</span>
              <span className="font-mono text-[#4A3428]">{pathC.quality.wordCount}</span>
            </div>
            <div className="pt-2 border-t border-purple-100">
              <div className="font-medium text-[#8B7355] mb-1">Text Similarity:</div>
              <div className="text-[#6B5744]">
                A ↔ B: {diffAB < 10 ? "Very similar" : diffAB < 25 ? "Somewhat different" : "Quite different"} ({diffAB}%)<br />
                A ↔ C: {diffAC < 10 ? "Very similar" : diffAC < 25 ? "Somewhat different" : "Quite different"} ({diffAC}%)<br />
                B ↔ C: {diffBC < 10 ? "Very similar" : diffBC < 25 ? "Somewhat different" : "Quite different"} ({diffBC}%)
              </div>
            </div>
          </div>
        </div>
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
                Compare AssemblyAI vs 2 Auphonic presets (Cleaner vs Cutter)
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
              🚀 Run 3-Way Test (A vs B vs C)
            </button>
          )}

          {isProcessing && (
            <div className="text-center py-6">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-600 border-t-transparent"></div>
              <div className="mt-3 text-[#4A3428] font-semibold">
                Testing 3 paths in parallel...
              </div>
              <div className="mt-2 text-sm text-[#8B7355]">
                Path A: ~7-9 seconds
              </div>
              <div className="text-sm text-[#8B7355]">
                Path B & C: ~1-2 minutes (Auphonic processing)
              </div>
              <div className="mt-3 text-xs text-[#6B5744] italic">
                ⏳ Auphonic needs time to clean/cut audio - please be patient
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {renderPathResult(testResults.pathA, "Path A: AssemblyAI")}
              {renderPathResult(testResults.pathB, "Path B: Auphonic Cleaner")}
              {renderPathResult(testResults.pathC, "Path C: Auphonic Cutter")}
            </div>

            {renderComparison()}
          </>
        )}
      </div>
    </div>
  );
}
