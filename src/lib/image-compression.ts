import imageCompression from 'browser-image-compression';

const MAX_FILE_SIZE_MB = 7;
const COMPRESSION_OPTIONS = {
  maxSizeMB: 2, // Compress to max 2MB
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: 'image/jpeg',
  initialQuality: 0.8,
};

export interface CompressionResult {
  success: boolean;
  file?: File;
  error?: string;
  originalSize?: number;
  compressedSize?: number;
}

export const compressImage = async (file: File): Promise<CompressionResult> => {
  try {
    // Check if file is too large
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return {
        success: false,
        error: `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds the maximum allowed size of ${MAX_FILE_SIZE_MB}MB`,
        originalSize: file.size,
      };
    }

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      return {
        success: false,
        error: 'Please select an image file',
        originalSize: file.size,
      };
    }

    const originalSize = file.size;
    
    // Compress the image
    const compressedFile = await imageCompression(file, COMPRESSION_OPTIONS);
    
    return {
      success: true,
      file: compressedFile,
      originalSize,
      compressedSize: compressedFile.size,
    };
  } catch (error) {
    console.error('Image compression error:', error);
    return {
      success: false,
      error: 'Failed to compress image. Please try a different file.',
      originalSize: file.size,
    };
  }
};

export const compressMultipleImages = async (files: File[]): Promise<CompressionResult[]> => {
  const results: CompressionResult[] = [];
  
  for (const file of files) {
    const result = await compressImage(file);
    results.push(result);
  }
  
  return results;
};

export const getFileSizeString = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};
