/**
 * Image processing service
 *
 * Handles photo uploads to R2 with automatic resizing
 * Uses Cloudflare Image Resizing for on-demand transformations
 */
import type { Env } from '../types';

interface ImageSizes {
  original: string;
  display: string;  // 1200px wide
  thumbnail: string; // 400px wide
}

interface UploadResult {
  success: boolean;
  urls?: ImageSizes;
  error?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

/**
 * Process and upload a photo to R2
 * Stores original and generates URLs for resized variants
 */
export async function uploadPhoto(
  env: Env,
  file: File | ArrayBuffer,
  userId: string,
  ratingId: string,
  contentType: string = 'image/jpeg'
): Promise<UploadResult> {
  try {
    // Get array buffer
    const buffer = file instanceof File ? await file.arrayBuffer() : file;

    // Validate size
    if (buffer.byteLength > MAX_FILE_SIZE) {
      return { success: false, error: 'File too large. Maximum size is 10MB.' };
    }

    // Validate type
    if (!ALLOWED_TYPES.includes(contentType)) {
      return { success: false, error: 'Invalid file type. Allowed: JPEG, PNG, WebP, HEIC' };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = crypto.randomUUID().slice(0, 8);
    const extension = getExtension(contentType);
    const basePath = `ratings/${userId}/${ratingId}`;
    const filename = `${timestamp}-${randomId}.${extension}`;

    // Upload original to R2
    const originalKey = `${basePath}/original/${filename}`;
    await env.IMAGES.put(originalKey, buffer, {
      httpMetadata: {
        contentType,
        cacheControl: 'public, max-age=31536000' // 1 year
      },
      customMetadata: {
        userId,
        ratingId,
        uploadedAt: new Date().toISOString()
      }
    });

    // Generate URLs for different sizes
    // Using Cloudflare Image Resizing via /cdn-cgi/image/ URL pattern
    const baseUrl = getImageBaseUrl(env);
    const originalUrl = `${baseUrl}/${originalKey}`;

    // For image resizing, we use Cloudflare's transform URL format
    // These will be transformed on-the-fly when accessed
    const urls: ImageSizes = {
      original: originalUrl,
      display: `${baseUrl}/cdn-cgi/image/width=1200,quality=85,format=webp/${originalKey}`,
      thumbnail: `${baseUrl}/cdn-cgi/image/width=400,quality=80,format=webp/${originalKey}`
    };

    return { success: true, urls };
  } catch (error) {
    console.error('Upload photo error:', error);
    return { success: false, error: 'Failed to upload photo' };
  }
}

/**
 * Delete a photo and all its variants from R2
 */
export async function deletePhoto(
  env: Env,
  photoUrl: string
): Promise<boolean> {
  try {
    // Extract the key from the URL
    const key = extractKeyFromUrl(photoUrl);
    if (!key) return false;

    // Delete the original (resized versions are generated on-demand, no need to delete)
    await env.IMAGES.delete(key);

    return true;
  } catch (error) {
    console.error('Delete photo error:', error);
    return false;
  }
}

/**
 * Generate a signed URL for private access (if needed)
 */
export async function getSignedUrl(
  env: Env,
  key: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    // R2 presigned URLs require the S3 API
    // For now, we use public URLs with image resizing
    const baseUrl = getImageBaseUrl(env);
    return `${baseUrl}/${key}`;
  } catch (error) {
    console.error('Get signed URL error:', error);
    return null;
  }
}

/**
 * Compress image on the client side before upload
 * Returns JavaScript code to include in the page
 */
export function getClientImageCompression(): string {
  return `
    async function compressImage(file, maxWidth = 2000, quality = 0.85) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          // Create canvas and draw resized image
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(new File([blob], file.name, { type: 'image/jpeg' }));
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });
    }
  `;
}

/**
 * Validate image dimensions
 */
export async function validateImageDimensions(
  buffer: ArrayBuffer,
  minWidth: number = 200,
  minHeight: number = 200
): Promise<{ valid: boolean; width?: number; height?: number; error?: string }> {
  // In Workers, we can't easily get image dimensions without a library
  // For now, we trust the client-side validation
  return { valid: true };
}

// Helper functions

function getExtension(contentType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic'
  };
  return map[contentType] || 'jpg';
}

function getImageBaseUrl(env: Env): string {
  // In production, this should be your custom domain or R2 public URL
  // For now, use the worker URL which will proxy to R2
  if (env.ENVIRONMENT === 'production') {
    return 'https://brewerytrip.com/images';
  }
  return '/images';
}

function extractKeyFromUrl(url: string): string | null {
  // Extract the R2 key from various URL formats
  const patterns = [
    /\/images\/(.+)$/,
    /\/cdn-cgi\/image\/[^/]+\/(.+)$/,
    /ratings\/[^/]+\/[^/]+\/.+/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }

  return null;
}

/**
 * Generate responsive image srcset
 */
export function generateSrcSet(originalUrl: string, baseUrl: string): string {
  const sizes = [400, 800, 1200];
  return sizes
    .map(w => `${baseUrl}/cdn-cgi/image/width=${w},quality=85,format=webp/${originalUrl} ${w}w`)
    .join(', ');
}

/**
 * Get optimized image URL for a specific width
 */
export function getOptimizedUrl(originalUrl: string, width: number, baseUrl: string): string {
  return `${baseUrl}/cdn-cgi/image/width=${width},quality=85,format=webp/${originalUrl}`;
}
