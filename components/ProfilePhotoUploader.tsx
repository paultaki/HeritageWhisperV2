import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { apiRequest } from "@/lib/queryClient";

interface ProfilePhotoUploaderProps {
  currentPhotoUrl?: string;
  onPhotoUpdate: (photoUrl: string) => void;
  disabled?: boolean;
}

export function ProfilePhotoUploader({
  currentPhotoUrl,
  onPhotoUpdate,
  disabled = false,
}: ProfilePhotoUploaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [transform, setTransform] = useState({
    zoom: 1,
    position: { x: 0, y: 0 },
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
      setSelectedFile(file);
      setIsEditing(true);
      setTransform({ zoom: 1, position: { x: 0, y: 0 } });
    };
    reader.readAsDataURL(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    setTransform((prev) => ({
      ...prev,
      position: {
        x: prev.position.x + deltaX,
        y: prev.position.y + deltaY,
      },
    }));

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setPreviewImage(null);
    setSelectedFile(null);
    setTransform({ zoom: 1, position: { x: 0, y: 0 } });
  };

  const handleSave = async () => {
    if (!selectedFile || !previewImage) return;

    setUploading(true);
    try {
      // Create a canvas to crop and export the image
      const canvas = document.createElement("canvas");
      const size = 400; // Profile photo size
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      // Load the image
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = previewImage;
      });

      // Apply transforms and draw circular crop
      ctx.save();
      
      // Create circular clipping path
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Calculate dimensions to cover the canvas
      const imgAspect = img.width / img.height;
      let sourceWidth = img.width;
      let sourceHeight = img.height;
      let sourceX = 0;
      let sourceY = 0;

      // Make image cover the canvas (1:1 aspect ratio)
      if (imgAspect > 1) {
        // Image is wider - crop sides
        sourceWidth = img.height;
        sourceX = (img.width - img.height) / 2;
      } else {
        // Image is taller - crop top/bottom
        sourceHeight = img.width;
        sourceY = (img.height - img.width) / 2;
      }

      // Apply zoom and pan
      const scale = transform.zoom;
      const scaledWidth = size * scale;
      const scaledHeight = size * scale;
      const x = (size - scaledWidth) / 2 + transform.position.x;
      const y = (size - scaledHeight) / 2 + transform.position.y;

      // Draw the cropped and transformed image
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        x,
        y,
        scaledWidth,
        scaledHeight
      );
      
      ctx.restore();

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error("Failed to create blob"));
          },
          "image/jpeg",
          0.9,
        );
      });

      // Create FormData for upload
      const formData = new FormData();
      formData.append("file", blob, `profile-${Date.now()}.jpg`);

      // Upload to server
      const response = await apiRequest("POST", "/api/upload/profile-photo", formData);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload photo");
      }

      // Update profile with new photo URL
      onPhotoUpdate(data.url);

      toast({
        title: "Photo updated",
        description: "Your profile photo has been saved.",
      });

      handleCancel();
    } catch (error) {
      console.error("Photo upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Could not upload photo.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      {/* Profile Photo Display */}
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
          {currentPhotoUrl ? (
            <img
              src={currentPhotoUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
              <Camera className="w-12 h-12 text-blue-400" />
            </div>
          )}
        </div>

        {/* Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-12 h-12 flex items-center justify-center bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Camera className="w-5 h-5" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Edit Photo Modal */}
      {isEditing && previewImage && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={handleCancel}
          />

          {/* Modal */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ pointerEvents: "none" }}
          >
            <Card
              className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-background overflow-hidden"
              style={{ pointerEvents: "auto" }}
            >
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="flex justify-between items-center mb-2 gap-4">
                  <h3 className="text-lg font-semibold whitespace-nowrap">
                    Edit Profile Photo
                  </h3>
                  <button
                    onClick={handleCancel}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Photo preview container - circular crop */}
                <div className="relative w-full">
                  <div className="relative w-full bg-gray-200 p-8 rounded-lg">
                    {/* Circular crop frame */}
                    <div className="relative mx-auto aspect-square max-w-md rounded-full overflow-hidden bg-white shadow-lg">
                      <div
                        className="absolute inset-0 overflow-hidden select-none cursor-move"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        style={{ touchAction: "none" }}
                      >
                        <img
                          src={previewImage}
                          alt="Preview"
                          className="absolute inset-0 w-full h-full transition-transform"
                          style={{
                            transform: `scale(${transform.zoom}) translate(${transform.position.x / transform.zoom}px, ${transform.position.y / transform.zoom}px)`,
                            transformOrigin: "center center",
                            objectFit: "cover",
                          }}
                          draggable={false}
                        />
                      </div>

                      {/* Circular border overlay */}
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-0 border-4 border-blue-500 rounded-full shadow-inner" />
                      </div>
                    </div>

                    {/* Label */}
                    <div className="absolute -top-2 left-8 bg-white px-2 py-1 rounded text-xs font-medium text-blue-600">
                      Drag to reposition • Zoom to fit
                    </div>
                  </div>
                </div>

                {/* Zoom Slider */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Zoom</label>
                  <SliderPrimitive.Root
                    value={[transform.zoom]}
                    onValueChange={(newZoom) => {
                      setTransform({
                        ...transform,
                        zoom: newZoom[0],
                      });
                    }}
                    min={0.5}
                    max={3}
                    step={0.1}
                    className="relative flex items-center select-none touch-none w-full h-5"
                  >
                    <SliderPrimitive.Track className="bg-secondary relative grow rounded-full h-[3px]">
                      <SliderPrimitive.Range className="absolute bg-primary rounded-full h-full" />
                    </SliderPrimitive.Track>
                    <SliderPrimitive.Thumb className="block w-5 h-5 bg-background shadow-lg border-2 border-primary rounded-full hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
                  </SliderPrimitive.Root>
                  <p className="text-xs text-muted-foreground text-center">
                    Drag photo to reposition, use slider to zoom
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={uploading}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={uploading}>
                    {uploading ? "Uploading..." : "Save Photo"}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </>
  );
}
