"use client";

import { MultiPhotoUploader, type StoryPhoto } from "@/components/MultiPhotoUploader";

interface Step2_PhotosProps {
  photos: StoryPhoto[];
  onPhotosChange: (photos: StoryPhoto[]) => void;
}

/**
 * Step 2: Add Photos
 *
 * - Upload up to 3 photos (optional)
 * - Crop and position photos
 * - Select hero image
 */
export function Step2_Photos({ photos, onPhotosChange }: Step2_PhotosProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium mb-2">Add photos to your story</h3>
        <p className="text-gray-600 text-sm">
          Upload up to 3 photos. You can crop, position, and choose which one appears first.
        </p>
      </div>

      {/* Photo Uploader */}
      <MultiPhotoUploader photos={photos} onPhotosChange={onPhotosChange} />

      {/* Help Text */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Optional:</strong> Photos are optional but help bring your story to life. You can
          always add them later by editing your story.
        </p>
      </div>

      {/* Photo Tips */}
      {photos.length > 0 && (
        <div className="space-y-2 text-sm text-gray-600">
          <p className="font-medium">Tips:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Click a photo to crop and position it</li>
            <li>
              Click the star icon to set a photo as your hero image (appears first in your story)
            </li>
            <li>The order of photos matters - they'll appear in this order on your timeline</li>
          </ul>
        </div>
      )}
    </div>
  );
}
