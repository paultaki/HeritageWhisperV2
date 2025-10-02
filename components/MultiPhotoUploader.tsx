import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, X, Star, Plus, MoreVertical, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { getApiUrl } from "@/lib/config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface StoryPhoto {
  id: string;
  url: string;
  transform?: { zoom: number; position: { x: number; y: number } };
  caption?: string;
  isHero?: boolean;
}

interface MultiPhotoUploaderProps {
  storyId?: string;
  photos: StoryPhoto[];
  onPhotosChange: (photos: StoryPhoto[]) => void;
  onPhotoUpload?: (file: File, slotIndex: number) => Promise<void>;
  onPhotoRemove?: (photoId: string) => Promise<void>;
  onPhotoUpdate?: (photoId: string, updates: Partial<StoryPhoto>) => Promise<void>;
  disabled?: boolean;
  loading?: boolean;
}

// Normalize photo URL to handle Supabase storage paths
const normalizePhotoUrl = (url: string) => {
  if (!url) return url;

  // Handle blob URLs (for temporary local previews)
  if (url.startsWith('blob:')) return url;

  // If it's already a full URL (signed URL from server), use it as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // For paths starting with /objects/, fetch through our API proxy
  if (url.startsWith('/objects/')) {
    return `${getApiUrl()}${url}`;
  }

  // For storage paths without /objects/ prefix, add it and fetch through API
  // This handles photos stored without the prefix
  return `${getApiUrl()}/objects/${url}`;
};

export function MultiPhotoUploader({
  storyId,
  photos,
  onPhotosChange,
  onPhotoUpload,
  onPhotoRemove,
  onPhotoUpdate,
  disabled = false,
  loading = false
}: MultiPhotoUploaderProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null]);
  const { toast } = useToast();

  // Transform state for selected photo editing
  const selectedPhoto = selectedPhotoIndex !== null ? photos[selectedPhotoIndex] : null;
  const [editingTransform, setEditingTransform] = useState<{ zoom: number; position: { x: number; y: number } } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Initialize editing transform when selecting a photo
  useEffect(() => {
    if (selectedPhoto) {
      setEditingTransform(selectedPhoto.transform || { zoom: 1, position: { x: 0, y: 0 } });
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      setEditingTransform(null);
      // Re-enable body scroll when modal closes
      document.body.style.overflow = '';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedPhoto]);

  const validateFile = (file: File): string | null => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (!supportedTypes.includes(file.type)) {
      return "Please upload a JPG, PNG, or WEBP image";
    }
    if (file.size > maxSize) {
      return "Image size must be less than 5MB";
    }
    return null;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, slotIndex: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      toast({ title: "Invalid file", description: error, variant: "destructive" });
      event.target.value = '';
      return;
    }

    setUploadingIndex(slotIndex);
    try {
      if (onPhotoUpload) {
        await onPhotoUpload(file, slotIndex);
      } else {
        // Create a local preview for new stories (not yet saved)
        const url = URL.createObjectURL(file);
        const newPhoto: StoryPhoto = {
          id: `temp-${Date.now()}`,
          url,
          isHero: photos.length === 0, // First photo becomes hero
          transform: { zoom: 1, position: { x: 0, y: 0 } }
        };
        
        // Store file for later upload
        (window as any)[`__pendingPhotoFile_${slotIndex}`] = file;
        
        const newPhotos = [...photos];
        if (photos[slotIndex]) {
          // Replace existing photo
          newPhotos[slotIndex] = newPhoto;
        } else {
          // Add new photo
          newPhotos.push(newPhoto);
        }
        onPhotosChange(newPhotos);
      }
    } catch (error) {
      toast({ 
        title: "Upload failed", 
        description: "Failed to upload photo. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setUploadingIndex(null);
      event.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || photos.length >= 3) return;
    setDragOverIndex(index);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(null);
    
    if (disabled || photos.length >= 3) return;
    
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const error = validateFile(file);
    if (error) {
      toast({ title: "Invalid file", description: error, variant: "destructive" });
      return;
    }

    setUploadingIndex(slotIndex);
    try {
      if (onPhotoUpload) {
        await onPhotoUpload(file, slotIndex);
      } else {
        const url = URL.createObjectURL(file);
        const newPhoto: StoryPhoto = {
          id: `temp-${Date.now()}`,
          url,
          isHero: photos.length === 0,
          transform: { zoom: 1, position: { x: 0, y: 0 } }
        };
        
        (window as any)[`__pendingPhotoFile_${slotIndex}`] = file;
        
        const newPhotos = [...photos];
        newPhotos.push(newPhoto);
        onPhotosChange(newPhotos);
      }
    } catch (error) {
      toast({ 
        title: "Upload failed", 
        description: "Failed to upload photo. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleSetHero = async (photoId: string) => {
    if (onPhotoUpdate) {
      // When in edit mode, we need to update all photos to ensure only one is hero
      // First, unset any existing hero photos
      for (const photo of photos) {
        if (photo.isHero && photo.id !== photoId) {
          await onPhotoUpdate(photo.id, { isHero: false });
        }
      }
      // Then set the selected photo as hero
      await onPhotoUpdate(photoId, { isHero: true });
    } else {
      // When not in edit mode, just update local state
      const newPhotos = photos.map(p => ({
        ...p,
        isHero: p.id === photoId
      }));
      onPhotosChange(newPhotos);
    }
  };

  const handleRemovePhoto = async (photoId: string) => {
    if (onPhotoRemove) {
      await onPhotoRemove(photoId);
    } else {
      const photoToRemove = photos.find(p => p.id === photoId);
      if (photoToRemove?.url.startsWith('blob:')) {
        URL.revokeObjectURL(photoToRemove.url);
      }
      
      const photoIndex = photos.findIndex(p => p.id === photoId);
      delete (window as any)[`__pendingPhotoFile_${photoIndex}`];
      
      const newPhotos = photos.filter(p => p.id !== photoId);
      
      // If we removed the hero and there are still photos, make the first one hero
      if (photoToRemove?.isHero && newPhotos.length > 0) {
        newPhotos[0].isHero = true;
      }
      
      onPhotosChange(newPhotos);
    }
  };

  const handleTransformSave = async () => {
    if (selectedPhotoIndex === null || !editingTransform) return;
    
    const photo = photos[selectedPhotoIndex];
    if (onPhotoUpdate) {
      await onPhotoUpdate(photo.id, { transform: editingTransform });
    } else {
      const newPhotos = [...photos];
      newPhotos[selectedPhotoIndex] = { ...photo, transform: editingTransform };
      onPhotosChange(newPhotos);
    }
    setSelectedPhotoIndex(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!editingTransform) return;
    setIsDragging(true);
    setDragStart({ 
      x: e.clientX - editingTransform.position.x, 
      y: e.clientY - editingTransform.position.y 
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !editingTransform) return;
    const newPosition = {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    };
    setEditingTransform({ ...editingTransform, position: newPosition });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Create array with 3 slots, filling with photos or nulls
  const photoSlots: (StoryPhoto | null)[] = [...photos];
  while (photoSlots.length < 3) {
    photoSlots.push(null);
  }

  return (
    <div className="space-y-4">
      {/* Thumbnail Strip with Legend */}
      <div>
        <div className="grid grid-cols-3 gap-2 md:gap-4">
        {photoSlots.map((photo, index) => (
          <div key={index} className="relative">
            <input
              ref={el => fileInputRefs.current[index] = el}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileSelect(e, index)}
              className="hidden"
              disabled={disabled || loading || !!photo || photos.length >= 3}
              data-testid={`input-photo-file-${index}`}
            />
            
            <Card
              className={`
                group relative aspect-[3/2] overflow-hidden rounded-lg transition-all cursor-pointer
                ${!photo ? 'border-2 border-dashed hover:border-primary/50' : 'border-0'}
                ${dragOverIndex === index ? 'border-primary bg-primary/5' : ''}
                ${uploadingIndex === index ? 'opacity-50' : ''}
              `}
              onClick={() => {
                if (photo) {
                  setSelectedPhotoIndex(index);
                } else if (!disabled && photos.length < 3) {
                  fileInputRefs.current[index]?.click();
                }
              }}
              onDragOver={(e) => !photo && handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => !photo && handleDrop(e, index)}
              data-testid={`photo-slot-${index}`}
            >
              {photo ? (
                <>
                  {/* Image container with consistent aspect ratio */}
                  <div className="absolute inset-0 overflow-hidden">
                    <img
                      src={normalizePhotoUrl(photo.url)}
                      alt={`Photo ${index + 1}`}
                      className="absolute inset-0 w-full h-full"
                      style={
                        photo.transform
                          ? {
                              transform: `scale(${photo.transform.zoom}) translate(${photo.transform.position.x / photo.transform.zoom}px, ${photo.transform.position.y / photo.transform.zoom}px)`,
                              transformOrigin: 'center center',
                              objectFit: 'cover',
                            }
                          : { objectFit: 'cover' }
                      }
                    />
                  </div>
                  
                  {/* Hero Star Overlay - Shows when photo is marked as hero */}
                  {photo.isHero && (
                    <div className="absolute top-2 left-2 pointer-events-none">
                      <Star className="w-5 h-5 fill-yellow-500 text-yellow-500 drop-shadow-md" />
                    </div>
                  )}

                  {/* Three Dots Menu - Always visible on mobile, hover on desktop */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="absolute w-10 h-10 flex items-center justify-center bg-white/95 backdrop-blur-sm rounded-full shadow-lg hover:bg-white hover:scale-105 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200 ease-out border border-gray-200"
                        style={{ top: '12px', right: '12px', zIndex: 20 }}
                        disabled={disabled || loading}
                        data-testid={`button-menu-${index}`}
                        aria-label="Photo options menu"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-700" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPhotoIndex(index);
                        }}
                        className="cursor-pointer"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Photo
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetHero(photo.id);
                        }}
                        className="cursor-pointer"
                      >
                        <Star className={`w-4 h-4 mr-2 ${photo.isHero ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                        {photo.isHero ? 'Hero Photo (Selected)' : 'Set as Hero Photo'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePhoto(photo.id);
                        }}
                        className="cursor-pointer text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Photo
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  {uploadingIndex === index && (
                    <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                      <div className="text-sm font-medium">Uploading...</div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-4">
                  {photos.length >= 3 ? (
                    <div className="text-center text-muted-foreground text-sm">
                      <div className="mb-2">Max 3 photos</div>
                    </div>
                  ) : (
                    <>
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-100 flex items-center justify-center mb-1">
                        <Plus className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                      </div>
                      <span className="text-xs md:text-sm text-muted-foreground text-center">Add<br/>Photo</span>
                    </>
                  )}
                </div>
              )}
            </Card>
          </div>
        ))}
        </div>

        {/* Star Legend */}
        {photos.length > 0 && (
          <div className="flex items-center justify-center mt-2 gap-2 text-xs text-gray-500">
            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
            <span>Hero photo - displays first in timeline</span>
          </div>
        )}
      </div>

      {/* Photo Editor Modal */}
      {selectedPhotoIndex !== null && selectedPhoto && editingTransform && (
        <>
          {/* Overlay backdrop - prevent background scroll */}
          <div
            className="fixed inset-0 bg-black/50 z-40 overflow-hidden"
            onClick={() => setSelectedPhotoIndex(null)}
            style={{ touchAction: 'none' }}
          />
          
          {/* Modal */}
          <Card className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-2xl p-6 space-y-4 bg-background overflow-auto max-h-[90vh]">
          <div className="flex justify-between items-center mb-2 gap-4">
            <h3 className="text-lg font-semibold whitespace-nowrap">Edit Photo</h3>
            <button
              onClick={() => setSelectedPhotoIndex(null)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              data-testid="button-close-editor"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Photo preview container - shows exactly what will be visible */}
          <div className="relative w-full">
            {/* Outer container for context */}
            <div className="relative w-full bg-gray-200 p-4 rounded-lg">
              {/* The actual crop frame that matches thumbnail aspect ratio */}
              <div className="relative w-full aspect-[3/2] rounded-lg overflow-hidden bg-white shadow-lg">
                {/* Image container */}
                <div
                  className="relative w-full h-full overflow-hidden select-none"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  style={{ touchAction: 'none' }}
                >
                  <img
                    src={normalizePhotoUrl(selectedPhoto.url)}
                    alt="Edit photo"
                    className="absolute inset-0 w-full h-full object-cover transition-transform cursor-move"
                    style={{
                      transform: `scale(${editingTransform.zoom}) translate(${editingTransform.position.x / editingTransform.zoom}px, ${editingTransform.position.y / editingTransform.zoom}px)`,
                      transformOrigin: 'center center',
                    }}
                    draggable={false}
                  />
                </div>

                {/* Strong visual frame overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Thick border to show crop bounds */}
                  <div className="absolute inset-0 border-4 border-blue-500 rounded-lg shadow-inner" />
                  {/* Corner markers for extra clarity */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-600 rounded-tl" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-600 rounded-tr" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-600 rounded-bl" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-600 rounded-br" />
                  {/* Optional: Grid lines to help with composition */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-2">
                    <div className="border-r border-b border-blue-200 opacity-30" />
                    <div className="border-r border-b border-blue-200 opacity-30" />
                    <div className="border-b border-blue-200 opacity-30" />
                    <div className="border-r border-blue-200 opacity-30" />
                    <div className="border-r border-blue-200 opacity-30" />
                    <div className="border-blue-200 opacity-30" />
                  </div>
                </div>
              </div>

              {/* Label outside the frame */}
              <div className="absolute -top-2 left-4 bg-white px-2 py-1 rounded text-xs font-medium text-blue-600">
                Crop Frame - Content inside will be saved
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Zoom</label>
            <SliderPrimitive.Root
              value={[editingTransform.zoom]}
              onValueChange={(newZoom) => {
                setEditingTransform({ ...editingTransform, zoom: newZoom[0] });
              }}
              min={0.5}
              max={3}
              step={0.1}
              className="relative flex items-center select-none touch-none w-full h-5"
              data-testid="slider-photo-zoom"
            >
              <SliderPrimitive.Track className="bg-secondary relative grow rounded-full h-[3px]">
                <SliderPrimitive.Range className="absolute bg-primary rounded-full h-full" />
              </SliderPrimitive.Track>
              <SliderPrimitive.Thumb className="block w-5 h-5 bg-background shadow-lg border-2 border-primary rounded-full hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
            </SliderPrimitive.Root>
            <p className="text-xs text-muted-foreground text-center">
              Drag the photo to reposition • Use slider to zoom • Content inside the frame will be saved
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleTransformSave}
              disabled={disabled || loading}
              className="flex-1"
              data-testid="button-save-transform"
            >
              Save
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedPhotoIndex(null)}
              disabled={disabled || loading}
              data-testid="button-cancel-transform"
            >
              Cancel
            </Button>
          </div>
        </Card>
        </>
      )}
      
      {/* Help Text */}
      {photos.length === 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Add up to 3 photos to your story. The first photo will be set as the hero image.
        </p>
      )}
    </div>
  );
}