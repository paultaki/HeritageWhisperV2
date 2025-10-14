"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Volume2, Loader2 } from "lucide-react";

interface AudioState {
  fullBlob: Blob | null;           // Complete audio so far
  lastBytePosition: number;        // Where we left off
  fullTranscript: string;          // All text processed
  qaHistory: Array<{              // Questions and answers
    question: string;
    answer: string;
  }>;
}

export default function InterviewTestPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [followUpCount, setFollowUpCount] = useState(0);
  const [currentFollowUp, setCurrentFollowUp] = useState<string>("");
  const [samplePrompts] = useState([
    "Tell me about a time when you had to make a difficult choice",
    "What's a lesson you learned the hard way?",
    "Describe a moment that changed your perspective"
  ]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStateRef = useRef<AudioState>({
    fullBlob: null,
    lastBytePosition: 0,
    fullTranscript: "",
    qaHistory: []
  });
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;

      // Try to use webm with opus codec
      let mimeType = "";
      const supportedTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/ogg",
        "audio/mp4",
      ];

      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      const mediaRecorderOptions = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, mediaRecorderOptions);
      mediaRecorderRef.current = mediaRecorder;

      // Collect audio chunks
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Start recording with 1-second timeslices
      mediaRecorder.start(1000);
      setIsRecording(true);
      setFollowUpCount(0);
      setCurrentFollowUp("");

      // Reset audio state
      audioStateRef.current = {
        fullBlob: null,
        lastBytePosition: 0,
        fullTranscript: "",
        qaHistory: []
      };

    } catch (error) {
      console.error("Failed to start recording:", error);
      alert("Failed to access microphone. Please check permissions.");
    }
  }, []);

  // Stop recording and cleanup
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && (mediaRecorderRef.current.state === "recording" || mediaRecorderRef.current.state === "paused")) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
    }

    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  }, []);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  }, []);

  // Get new audio chunk (only what hasn't been transcribed)
  const getNewAudioChunk = useCallback(() => {
    if (audioChunksRef.current.length === 0) return null;

    // Create current full blob
    const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
    const currentBlob = new Blob(audioChunksRef.current, { type: mimeType });

    // Get only the NEW portion
    const newChunk = currentBlob.slice(audioStateRef.current.lastBytePosition, currentBlob.size);

    // Update state
    audioStateRef.current.lastBytePosition = currentBlob.size;
    audioStateRef.current.fullBlob = currentBlob;

    console.log("[Interview] New chunk size:", newChunk.size, "Total size:", currentBlob.size);
    return newChunk;
  }, []);

  // Get follow-up question using incremental transcription
  const getFollowUp = useCallback(async () => {
    if (!isRecording || followUpCount >= 3) {
      alert("Please start recording first, or you've reached the maximum of 3 follow-ups.");
      return;
    }

    setIsProcessing(true);

    try {
      // STEP 1: Get NEW audio chunk (not re-processing old audio)
      const newAudioChunk = getNewAudioChunk();

      if (!newAudioChunk || newAudioChunk.size === 0) {
        alert("No new audio to process. Please speak first.");
        setIsProcessing(false);
        return;
      }

      // STEP 2: Transcribe ONLY the new chunk via Whisper
      const formData = new FormData();
      formData.append("audio", newAudioChunk, "chunk.webm");

      const transcribeResponse = await fetch("/api/interview-test/transcribe-chunk", {
        method: "POST",
        body: formData,
      });

      if (!transcribeResponse.ok) {
        throw new Error("Transcription failed");
      }

      const { transcription } = await transcribeResponse.json();

      // Append to full transcript (context for GPT)
      audioStateRef.current.fullTranscript += " " + transcription;

      console.log("[Interview] New transcription:", transcription);
      console.log("[Interview] Full transcript:", audioStateRef.current.fullTranscript);

      // STEP 3: Generate follow-up using GPT-5 with full TEXT context
      const followUpResponse = await fetch("/api/interview-test/follow-up", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullTranscript: audioStateRef.current.fullTranscript,
          followUpNumber: followUpCount + 1,
        }),
      });

      if (!followUpResponse.ok) {
        throw new Error("Follow-up generation failed");
      }

      const { followUp } = await followUpResponse.json();

      setCurrentFollowUp(followUp);
      setFollowUpCount(prev => prev + 1);

      // Store in Q&A history
      audioStateRef.current.qaHistory.push({
        question: followUp,
        answer: transcription,
      });

    } catch (error) {
      console.error("Error getting follow-up:", error);
      alert("Failed to generate follow-up question. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [isRecording, followUpCount, getNewAudioChunk]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Guided Interview Test
          </h1>
          <p className="text-gray-600">
            Incremental audio processing with GPT-5 follow-ups
          </p>
        </div>

        {/* Sample Prompts */}
        {!isRecording && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Sample Prompts
            </h2>
            <div className="space-y-3">
              {samplePrompts.map((prompt, index) => (
                <div
                  key={index}
                  className="p-4 bg-amber-50 border border-amber-200 rounded-lg"
                >
                  <p className="text-gray-800">{prompt}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recording Controls */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="flex flex-col items-center space-y-6">
            {/* Recording Button */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-32 h-32 rounded-full text-xl relative ${
                isRecording
                  ? "bg-gradient-to-b from-red-500 to-red-600 text-white shadow-lg border-4 border-red-700"
                  : "bg-gradient-to-b from-amber-500 to-rose-500 text-white shadow-lg border-4 border-amber-600 hover:from-amber-600 hover:to-rose-600"
              } transition-all duration-150`}
            >
              <div className="flex flex-col items-center gap-2 justify-center">
                {isRecording ? (
                  <>
                    <Square className="w-12 h-12 fill-white" />
                    <span className="text-xl font-bold">STOP</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-16 h-16" />
                    <span className="text-xl font-bold">START</span>
                  </>
                )}
              </div>
            </button>

            {/* Pause/Resume */}
            {isRecording && (
              <Button
                onClick={isPaused ? resumeRecording : pauseRecording}
                variant="outline"
                size="lg"
              >
                {isPaused ? "Resume" : "Pause"}
              </Button>
            )}

            {/* Status */}
            <p className="text-gray-600 text-lg">
              {!isRecording && "Tap to start recording"}
              {isRecording && !isPaused && "Recording... Speak naturally"}
              {isRecording && isPaused && "Paused"}
            </p>
          </div>
        </div>

        {/* Follow-up Section */}
        {isRecording && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Follow-up Questions
              </h2>
              <span className="text-sm text-gray-500">
                {followUpCount} of 3
              </span>
            </div>

            {/* Current Follow-up */}
            {currentFollowUp && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-gray-800 font-medium">{currentFollowUp}</p>
              </div>
            )}

            {/* Get Follow-up Button */}
            <Button
              onClick={getFollowUp}
              disabled={isProcessing || followUpCount >= 3}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : followUpCount >= 3 ? (
                "Maximum follow-ups reached"
              ) : (
                "Get Follow-up"
              )}
            </Button>

            {/* Progress Indicator */}
            <div className="mt-4">
              <div className="flex gap-2">
                {[1, 2, 3].map((num) => (
                  <div
                    key={num}
                    className={`flex-1 h-2 rounded-full ${
                      num <= followUpCount
                        ? "bg-amber-500"
                        : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Cost Efficiency Info */}
        <div className="bg-gray-100 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600">
            Cost efficient: ~$0.035 per 5-minute interview with 3 follow-ups
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Only new audio chunks are transcribed • Full text sent to GPT-5
          </p>
        </div>
      </div>
    </div>
  );
}
