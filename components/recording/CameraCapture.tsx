"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, Image as ImageIcon, X } from "lucide-react";

type CameraCaptureProps = {
  onCapture: (dataURL: string) => void;
  onCancel: () => void;
};

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      stopCamera();
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraError(false);
    } catch (error) {
      console.error('Camera access error:', error);
      setCameraError(true);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Calculate 16:10 aspect ratio crop
    const videoAspect = video.videoWidth / video.videoHeight;
    const targetAspect = 16 / 10;

    let sourceWidth = video.videoWidth;
    let sourceHeight = video.videoHeight;
    let sourceX = 0;
    let sourceY = 0;

    if (videoAspect > targetAspect) {
      // Video is wider than 16:10, crop sides
      sourceWidth = video.videoHeight * targetAspect;
      sourceX = (video.videoWidth - sourceWidth) / 2;
    } else {
      // Video is taller than 16:10, crop top/bottom
      sourceHeight = video.videoWidth / targetAspect;
      sourceY = (video.videoHeight - sourceHeight) / 2;
    }

    // Set canvas to 16:10 aspect ratio
    canvas.width = sourceWidth;
    canvas.height = sourceHeight;

    // Draw cropped video frame to canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(
        video,
        sourceX, sourceY, sourceWidth, sourceHeight,
        0, 0, canvas.width, canvas.height
      );
      const dataURL = canvas.toDataURL('image/jpeg', 0.95);
      setCapturedImage(dataURL);
    }
  };

  const handleFlipCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataURL = event.target?.result as string;
      setCapturedImage(dataURL);
    };
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleUsePhoto = () => {
    if (capturedImage) {
      stopCamera();
      onCapture(capturedImage);
    }
  };

  return (
    <section className="relative w-full h-[calc(100vh-56px)] bg-black overflow-hidden flex items-center justify-center">
      {/* Video preview or gallery preview */}
      {!capturedImage ? (
        <>
          {/* 16:10 aspect ratio preview frame */}
          <div className="relative w-full max-w-4xl mx-auto" style={{ aspectRatio: '16/10' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover rounded-lg ${cameraError ? 'hidden' : ''}`}
            />
            {/* Frame border to show capture area */}
            <div className="absolute inset-0 border-2 border-white/30 rounded-lg pointer-events-none" />
          </div>
          <canvas ref={canvasRef} className="hidden" />

          {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="text-center text-white">
                <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-4">Camera not available</p>
                <p className="text-sm text-white/70 mb-4">
                  Please use the gallery button below to select a photo
                </p>
              </div>
            </div>
          )}

          {/* Helper text */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            <div className="bg-black/60 text-white text-[16px] px-3 py-2 rounded-md max-w-[70%]">
              Capture a picture from your physical album, or choose from your gallery
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={onCancel}
              className="bg-white/90 hover:bg-white text-base px-4"
            >
              Cancel
            </Button>
          </div>

          {/* Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/60 to-transparent">
            <div className="relative flex items-center justify-center">
              {/* Gallery picker - Absolute left */}
              <label className="absolute left-8 text-white flex items-center justify-center h-[68px] w-[68px] rounded-full bg-white/10 border border-white/20 hover:bg-white/20 active:scale-95 transition cursor-pointer">
                <ImageIcon className="w-8 h-8" />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>

              {/* Capture button - Center with camera icon */}
              <button
                onClick={handleCapture}
                disabled={cameraError}
                className="h-20 w-20 rounded-full bg-white border-4 border-white/40 shadow-lg active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                aria-label="Capture"
              >
                <Camera className="w-8 h-8 text-gray-800" />
              </button>

              {/* Flip camera - Absolute right */}
              <button
                onClick={handleFlipCamera}
                disabled={cameraError}
                className="absolute right-8 text-white flex items-center justify-center h-[68px] w-[68px] rounded-full bg-white/10 border border-white/20 hover:bg-white/20 active:scale-95 transition disabled:opacity-50"
              >
                <RefreshCw className="w-8 h-8" />
              </button>
            </div>
          </div>
        </>
      ) : (
        /* Post-capture preview */
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm p-5 flex flex-col">
          <div className="relative w-full flex-1 rounded-xl overflow-hidden border border-white/10">
            <img
              src={capturedImage}
              className="w-full h-full object-contain"
              alt="Captured"
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleRetake}
              className="h-[60px] rounded-xl bg-white text-gray-900 border-gray-200 hover:bg-gray-100"
            >
              Retake
            </Button>
            <Button
              onClick={handleUsePhoto}
              className="h-[60px] rounded-xl bg-blue-600 text-white hover:bg-blue-700"
            >
              Use This Photo
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
