import { supabase } from '@/integrations/supabase/client';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
];

export const validateFile = (file: File): { valid: boolean; error?: string } => {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Only PDF, PNG, and JPG files are allowed',
    };
  }

  return { valid: true };
};

export const generateUniqueFileName = (file: File, prefix: string = ''): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  const extension = file.name.split('.').pop();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  return prefix ? `${prefix}_${timestamp}_${random}_${safeName}` : `${timestamp}_${random}_${safeName}`;
};

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export const uploadFile = async (
  file: File,
  path: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<{ url: string; path: string }> => {
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const fileName = generateUniqueFileName(file);
  const fullPath = `${path}/${fileName}`;

  // Upload file to Supabase Storage
  const { data, error } = await supabase.storage
    .from('documents')
    .upload(fullPath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('documents')
    .getPublicUrl(fullPath);

  return { url: publicUrl, path: fullPath };
};

export const uploadMultipleFiles = async (
  files: File[],
  path: string,
  onProgress?: (fileIndex: number, progress: UploadProgress) => void
): Promise<Array<{ url: string; path: string; fileName: string }>> => {
  const uploadPromises = files.map(async (file, index) => {
    const result = await uploadFile(file, path, (progress) => {
      onProgress?.(index, progress);
    });
    return { ...result, fileName: file.name };
  });

  return Promise.all(uploadPromises);
};

export const deleteFile = async (path: string): Promise<void> => {
  const { error } = await supabase.storage
    .from('documents')
    .remove([path]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
};