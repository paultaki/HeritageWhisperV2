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
          <div className="absolute inset-0 flex flex-col items-center justify-between p-6 py-12">
            <div className="text-center text-white max-w-md">
              <Camera className="w-20 h-20 mx-auto mb-8 opacity-90" />
              <p className="text-xl md:text-2xl text-white/90 font-medium">
                Choose from your library or take a new photo
              </p>
            </div>

            {/* Photo source options */}
            <div className="w-full max-w-sm space-y-5">
              {/* Choose from Photos - Primary option */}
              <label className="block">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div
                  className="w-full min-h-[72px] py-5 px-6 rounded-2xl cursor-pointer active:scale-[0.98] transition-all shadow-lg hover:shadow-xl"
                  style={{ background: 'var(--hw-primary)' }}
                >
                  <div className="flex items-center gap-4">
                    <ImageIcon className="w-8 h-8 text-[var(--hw-text-on-dark)] flex-shrink-0" />
                    <div className="flex-1 text-left">
                      <div className="text-xl font-semibold text-[var(--hw-text-on-dark)]">
                        Choose from Photos
                      </div>
                      <div className="text-base text-[var(--hw-text-on-dark)]/80">
                        Select from your gallery or files
                      </div>
                    </div>
                  </div>
                </div>
              </label>

              {/* Take Photo - Secondary option */}
              <button
                onClick={() => setShowCamera(true)}
                className="w-full min-h-[60px] py-5 px-6 bg-[var(--hw-surface)] border-2 border-[var(--hw-border-strong)] hover:bg-[var(--hw-section-bg)] rounded-2xl active:scale-[0.98] transition-all shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <Camera className="w-8 h-8 text-[var(--hw-text-primary)] flex-shrink-0" />
                  <div className="flex-1 text-left">
                    <div className="text-xl font-semibold text-[var(--hw-text-primary)]">
                      Take Photo
                    </div>
                    <div className="text-base text-[var(--hw-text-secondary)]">
                      Use your camera
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* Cancel button */}
            <button
              onClick={onCancel}
              className="text-white hover:bg-white/10 text-base min-h-[48px] px-6 py-3 rounded-xl transition-all"
            >
              Cancel
            </button>
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
                  <p className="text-xl font-semibold mb-4">Camera not available</p>
                  <p className="text-base text-white/80 mb-6">
                    Please go back and choose a photo from your gallery
                  </p>
                  <button
                    onClick={() => setShowCamera(false)}
                    className="bg-[var(--hw-surface)]/90 hover:bg-[var(--hw-surface)] text-[var(--hw-text-primary)] text-base px-6 py-3 min-h-[60px] rounded-xl font-semibold transition-all shadow-lg"
                  >
                    Back to Photo Picker
                  </button>
                </div>
              </div>
            )}

            {/* Helper text */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
              <div className="bg-black/60 text-white text-base px-4 py-2 rounded-lg max-w-[70%]">
                Frame your photo and tap the capture button
              </div>
              <button
                onClick={() => {
                  stopCamera();
                  setShowCamera(false);
                }}
                className="bg-[var(--hw-surface)]/90 hover:bg-[var(--hw-surface)] text-[var(--hw-text-primary)] text-base px-4 py-2 rounded-lg min-h-[48px] font-medium transition-all shadow-sm"
              >
                Back
              </button>
            </div>

            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-8 px-5 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
              <div className="relative flex items-center justify-center">
                {/* Capture button - Center with camera icon (Primary action: 72px+) */}
                <button
                  onClick={handleCapture}
                  disabled={cameraError}
                  className="min-h-[80px] min-w-[80px] rounded-full bg-[var(--hw-surface)] border-4 border-white/40 shadow-2xl active:scale-95 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center focus-visible:ring-4 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  aria-label="Capture photo"
                >
                  <Camera className="w-10 h-10 text-[var(--hw-primary)]" />
                </button>

                {/* Flip camera - Absolute right */}
                <button
                  onClick={handleFlipCamera}
                  disabled={cameraError}
                  className="absolute right-8 text-white flex items-center justify-center min-h-[68px] min-w-[68px] rounded-full bg-white/10 border border-white/20 hover:bg-white/20 active:scale-95 transition-all disabled:opacity-50 focus-visible:ring-4 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  aria-label="Switch camera"
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
            <p className="text-white text-center text-base md:text-lg font-medium">
              Drag to reposition, use slider to zoom
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
          <div className="flex-shrink-0 px-6 pb-8 pt-4 grid grid-cols-2 gap-3 relative z-[110]">
            <button
              onClick={handleRetake}
              className="min-h-[60px] rounded-xl bg-[var(--hw-surface)] text-[var(--hw-text-primary)] border-2 border-[var(--hw-border-strong)] hover:bg-[var(--hw-section-bg)] text-base md:text-lg font-semibold transition-all active:scale-[0.98] focus-visible:ring-4 focus-visible:ring-[var(--hw-primary)] focus-visible:ring-offset-2"
            >
              Start Over
            </button>
            <button
              onClick={handleUsePhoto}
              className="min-h-[60px] rounded-xl text-[var(--hw-text-on-dark)] text-base md:text-lg font-semibold hover:shadow-xl transition-all active:scale-[0.98] focus-visible:ring-4 focus-visible:ring-[var(--hw-primary)] focus-visible:ring-offset-2"
              style={{ background: 'var(--hw-primary)' }}
            >
              Use This Photo
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
