import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { apiRequest, getApiUrl } from '../lib/queryClient';

export function usePhotoUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadPhoto = async (
    file: File,
    storyId: string,
    onSuccess?: (filePath: string) => void,
    onError?: (error: Error) => void
  ) => {
    setUploading(true);
    setProgress(0);

    try {
      // Step 1: Get signed upload URL from backend
      console.log('🔗 Getting signed upload URL...');
      const uploadUrlResponse = await apiRequest('POST', '/api/objects/upload', {
        type: 'photo',
        storyId,
        mimeType: file.type
      });

      if (!uploadUrlResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadURL, filePath } = await uploadUrlResponse.json();
      console.log('✅ Got upload URL for path:', filePath);

      // Step 2: Upload file to signed URL
      console.log('📤 Uploading file to Supabase...');
      setProgress(25);

      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
          'Cache-Control': 'public, max-age=3600'
        }
      });

      setProgress(50);

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('❌ Upload failed:', uploadResponse.status, errorText);
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }

      console.log('✅ File uploaded to Supabase');
      setProgress(75);

      // Step 3: CRITICAL - Verify file exists before marking as successful
      console.log('🔍 Verifying upload...');
      const verifyResponse = await apiRequest('POST', '/api/verify-upload', {
        filePath,
        expectedSize: file.size
      });

      if (!verifyResponse.ok) {
        console.error('❌ Verification failed - file may not have been saved');
        throw new Error('Upload verification failed');
      }

      const { exists, size } = await verifyResponse.json();

      if (!exists) {
        console.error('❌ File not found after upload!');
        throw new Error('File upload incomplete - please try again');
      }

      if (size !== file.size) {
        console.warn(`⚠️ File size mismatch: expected ${file.size}, got ${size}`);
      }

      console.log('✅ Upload verified successfully');
      setProgress(100);

      if (onSuccess) {
        onSuccess(filePath);
      }

      return filePath;
    } catch (error) {
      console.error('Upload error:', error);
      setProgress(0);

      if (onError) {
        onError(error as Error);
      }

      throw error;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadPhoto,
    uploading,
    progress
  };
}