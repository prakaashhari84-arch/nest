/**
 * Storage Abstraction Layer (Prompt 13)
 * 
 * Provides a unified interface for storing and retrieving therapy exercise videos.
 * Allows swapping between Local/Object-URL storage, S3 buckets, Vercel Blob,
 * or Neon Object Storage without changing calling application code.
 */

export interface UploadResult {
  url: string;
  key: string;
  fileName: string;
  sizeBytes: number;
  mimeType: string;
  uploadedAt: string;
}

export interface StorageValidationResult {
  valid: boolean;
  error?: string;
}

export const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB max

export const ACCEPTED_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-matroska',
  'video/avi',
  'video/mov',
];

export function validateVideoFile(file: File | Blob): StorageValidationResult {
  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }

  // Check file size
  if (file.size > MAX_VIDEO_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeMb} MB) exceeds maximum allowed size of 100 MB.`,
    };
  }

  // Check mime type (fallback to video/ prefix if specific type is missing in some OS filepickers)
  const type = file.type || '';
  const isVideo = type.startsWith('video/') || ACCEPTED_VIDEO_MIME_TYPES.includes(type);
  if (!isVideo) {
    return {
      valid: false,
      error: 'Invalid file format. Please upload a standard video file (MP4, WebM, MOV, etc.).',
    };
  }

  return { valid: true };
}

export interface IStorageService {
  uploadVideo(file: File | Blob, customFileName?: string): Promise<UploadResult>;
  getVideoUrl(keyOrUrl: string): string;
}

class LocalBlobStorageService implements IStorageService {
  async uploadVideo(file: File | Blob, customFileName?: string): Promise<UploadResult> {
    const validation = validateVideoFile(file);
    if (!validation.valid) {
      throw new Error(validation.error || 'Video validation failed.');
    }

    const fileName =
      customFileName || (file instanceof File ? file.name : `session_${Date.now()}.mp4`);
    const key = `videos/${Date.now()}_${fileName.replace(/\s+/g, '_')}`;

    // Create a local blob object URL for playback
    let url: string;
    if (typeof window !== 'undefined' && typeof URL !== 'undefined') {
      url = URL.createObjectURL(file);
    } else {
      url = `https://storage.nest-therapy.local/${key}`;
    }

    const result: UploadResult = {
      url,
      key,
      fileName,
      sizeBytes: file.size,
      mimeType: file.type || 'video/mp4',
      uploadedAt: new Date().toISOString(),
    };

    return result;
  }

  getVideoUrl(keyOrUrl: string): string {
    return keyOrUrl;
  }
}

// Export singleton instance of StorageService
export const storageService: IStorageService = new LocalBlobStorageService();
