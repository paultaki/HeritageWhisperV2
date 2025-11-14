"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, Image as ImageIcon, X, ZoomIn, ZoomOut } from "lucide-react";
import * as Slider from "@radix-ui/react-slider";

type CameraCaptureProps = {
  onCapture: (dataURL: string, transform?: { zoom: number; position: { x: number; y: number } }) => void;
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
  const [showCamera, setShowCamera] = useState(false); // NEW: Control camera visibility

  // Photo editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editTransform, setEditTransform] = useState({ zoom: 1, position: { x: 0, y: 0 } });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);

  // Only start camera when user explicitly requests it
  useEffect(() => {
    if (showCamera) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [facingMode, showCamera]);

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

    // Save full video frame without pre-cropping
    // User can crop/zoom in the edit screen
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw full video frame to canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataURL = canvas.toDataURL('image/jpeg', 0.95);
      setCapturedImage(dataURL);
      setIsEditing(true); // Go to edit mode after capture
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
      setIsEditing(true); // Go to edit mode after file selection
    };
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setIsEditing(false);
    setEditTransform({ zoom: 1, position: { x: 0, y: 0 } });
    setShowCamera(false); // Return to picker screen
    stopCamera(); // Clean up camera stream
  };

  const handleUsePhoto = () => {
    if (capturedImage) {
      stopCamera();
      onCapture(capturedImage, editTransform);
    }
  };

  // Zoom/Pan handlers
  const handleZoomChange = (value: number[]) => {
    setEditTransform(prev => ({ ...prev, zoom: value[0] }));
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !imageRef.current) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    const rect = imageRef.current.getBoundingClientRect();
    const percentX = (deltaX / rect.width) * 100;
    const percentY = (deltaY / rect.height) * 100;

    // Calculate max offset based on zoom
    const maxPercent = (editTransform.zoom - 1) * 50;

    setEditTransform(prev => ({
      ...prev,
      position: {
        x: Math.max(-maxPercent, Math.min(maxPercent, prev.position.x + percentX)),
        y: Math.max(-maxPercent, Math.min(maxPercent, prev.position.y + percentY))
      }
    }));

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch drag handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !imageRef.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStart.x;
    const deltaY = touch.clientY - dragStart.y;

    const rect = imageRef.current.getBoundingClientRect();
    const percentX = (deltaX / rect.width) * 100;
    const percentY = (deltaY / rect.height) * 100;

    // Calculate max offset based on zoom
    const maxPercent = (editTransform.zoom - 1) * 50;

    setEditTransform(prev => ({
      ...prev,
      position: {
        x: Math.max(-maxPercent, Math.min(maxPercent, prev.position.x + percentX)),
        y: Math.max(-maxPercent, Math.min(maxPercent, prev.position.y + percentY))
      }
    }));

    setDragStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <section className="relative w-full h-screen bg-black overflow-hidden flex items-center justify-center">
      {/* Photo picker or editing view */}
      {!capturedImage ? (
        !showCamera ? (
          /* Initial picker screen - Choose photo source */
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
            <div className="text-center text-white max-w-md mb-8">
              <Camera className="w-20 h-20 mx-auto mb-6 opacity-90" />
              <h2 className="text-2xl font-semibold mb-3">Add a Photo</h2>
              <p className="text-lg text-white/80">
                Choose from your library or take a new photo
              </p>
            </div>

            {/* Photo source options */}
            <div className="w-full max-w-sm space-y-4">
              {/* Choose from Photos - Primary option */}
              <label className="block">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="w-full py-6 px-6 bg-white hover:bg-gray-50 rounded-2xl cursor-pointer active:scale-95 transition-all shadow-lg">
                  <div className="flex items-center gap-4">
                    <ImageIcon className="w-8 h-8 text-purple-700 flex-shrink-0" />
                    <div className="flex-1 text-left">
                      <div className="text-xl font-semibold text-gray-900">
                        Choose from Photos
                      </div>
                      <div className="text-base text-gray-600">
                        Select from your gallery or files
                      </div>
                    </div>
                  </div>
                </div>
              </label>

              {/* Take Photo - Secondary option */}
              <button
                onClick={() => setShowCamera(true)}
                className="w-full py-6 px-6 bg-white/10 border-2 border-white/30 hover:bg-white/20 rounded-2xl active:scale-95 transition-all"
              >
                <div className="flex items-center gap-4">
                  <Camera className="w-8 h-8 text-white flex-shrink-0" />
                  <div className="flex-1 text-left">
                    <div className="text-xl font-semibold text-white">
                      Take Photo
                    </div>
                    <div className="text-base text-white/80">
                      Use your camera
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* Cancel button */}
            <Button
              variant="ghost"
              onClick={onCancel}
              className="mt-8 text-white hover:bg-white/10 text-lg px-6 py-3"
            >
              Cancel
            </Button>
          </div>
        ) : (
          /* Camera view - only shown when user clicks "Take Photo" */
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
                    Please go back and choose a photo from your gallery
                  </p>
                  <Button
                    variant="secondary"
                    onClick={() => setShowCamera(false)}
                    className="bg-white/90 hover:bg-white text-base px-6"
                  >
                    Back to Photo Picker
                  </Button>
                </div>
              </div>
            )}

            {/* Helper text */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
              <div className="bg-black/60 text-white text-[16px] px-3 py-2 rounded-md max-w-[70%]">
                Frame your photo and tap the capture button
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  stopCamera();
                  setShowCamera(false);
                }}
                className="bg-white/90 hover:bg-white text-base px-4"
              >
                Back
              </Button>
            </div>

            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-8 px-5 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
              <div className="relative flex items-center justify-center">
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
        )
      ) : isEditing ? (
        /* Photo editing screen with zoom/pan */
        <div className="absolute inset-0 bg-black flex flex-col">
          {/* Header with instructions */}
          <div className="flex-shrink-0 px-6 py-4 bg-black/90">
            <p className="text-white text-center text-base">
              Pinch or drag to zoom and position your photo
            </p>
          </div>

          {/* 16:10 aspect ratio editing frame */}
          <div className="flex-1 flex items-center justify-center px-4">
            <div
              className="relative w-full max-w-4xl bg-black rounded-lg overflow-hidden border-2 border-white/30"
              style={{ aspectRatio: '16/10' }}
            >
              <div
                ref={imageRef}
                className="absolute inset-0 touch-none select-none"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                  cursor: isDragging ? 'grabbing' : 'grab',
                  overflow: 'hidden'
                }}
              >
                <img
                  src={capturedImage}
                  className="absolute inset-0 w-full h-full object-contain"
                  style={{
                    transform: `scale(${editTransform.zoom}) translate(${editTransform.position.x}%, ${editTransform.position.y}%)`,
                    transformOrigin: 'center center',
                  }}
                  alt="Editing"
                  draggable={false}
                />
              </div>
            </div>
          </div>

          {/* Zoom slider */}
          <div className="flex-shrink-0 px-8 py-6 bg-black/90">
            <div className="flex items-center gap-4 max-w-md mx-auto">
              <ZoomOut className="w-5 h-5 text-white flex-shrink-0" />
              <Slider.Root
                className="relative flex items-center select-none touch-none flex-1 h-5"
                value={[editTransform.zoom]}
                onValueChange={handleZoomChange}
                min={1}
                max={3}
                step={0.1}
              >
                <Slider.Track className="bg-white/20 relative grow rounded-full h-[3px]">
                  <Slider.Range className="absolute bg-white rounded-full h-full" />
                </Slider.Track>
                <Slider.Thumb
                  className="block w-6 h-6 bg-white rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white"
                  aria-label="Zoom"
                />
              </Slider.Root>
              <ZoomIn className="w-5 h-5 text-white flex-shrink-0" />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex-shrink-0 px-6 pb-8 pt-4 grid grid-cols-2 gap-3">
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
      ) : null}
    </section>
  );
}
