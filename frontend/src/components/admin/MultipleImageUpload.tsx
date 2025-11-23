import { useState, useRef } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import api from '../../lib/api';

interface ImageItem {
  id: string;
  url: string;
  isPrimary?: boolean;
  altText?: string;
}

interface MultipleImageUploadProps {
  label: string;
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  error?: string;
  accept?: string;
  maxSizeMB?: number;
  uploadEndpoint?: string;
  maxImages?: number;
  productId?: string; // For updating primary status on backend
  onPrimaryChange?: (imageId: string) => Promise<void>; // Callback for primary change
  onImageDelete?: (imageId: string) => Promise<void>; // Callback for image deletion
}

export function MultipleImageUpload({
  label,
  images,
  onChange,
  error,
  accept = 'image/*',
  maxSizeMB = 10,
  uploadEndpoint = '/upload/product-image',
  maxImages = 10,
  productId,
  onPrimaryChange,
  onImageDelete,
}: MultipleImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [_uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check if adding these files would exceed max
    if (images.length + files.length > maxImages) {
      alert(`Maximum ${maxImages} images allowed. You can add ${maxImages - images.length} more.`);
      return;
    }

    // Validate and upload each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        alert(`${file.name}: File size must be less than ${maxSizeMB}MB`);
        continue;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert(`${file.name}: Please select an image file`);
        continue;
      }

      // Upload file
      setUploading(true);
      setUploadingIndex(i);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post(uploadEndpoint, formData);
        const imageUrl = response.data.url;

        // Add to images list
        const newImage: ImageItem = {
          id: Date.now().toString() + i,
          url: imageUrl,
          isPrimary: images.length === 0, // First image is primary by default
        };

        onChange([...images, newImage]);
      } catch (err: any) {
        console.error('Upload error:', err);
        alert(`${file.name}: ${err.response?.data?.detail || 'Failed to upload image'}`);
      } finally {
        setUploading(false);
        setUploadingIndex(null);
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = async (imageId: string) => {
    // If we have a productId and onImageDelete callback, delete from backend first
    if (productId && onImageDelete) {
      try {
        await onImageDelete(imageId);
      } catch (err) {
        console.error('Failed to delete image from backend:', err);
        // Still remove from UI even if backend deletion fails
      }
    }
    
    // Remove from local state
    const updatedImages = images.filter((img) => img.id !== imageId);
    // If we removed the primary image, make the first remaining image primary
    if (updatedImages.length > 0 && images.find((img) => img.id === imageId)?.isPrimary) {
      updatedImages[0].isPrimary = true;
    }
    onChange(updatedImages);
  };

  const handleSetPrimary = async (imageId: string) => {
    const updatedImages = images.map((img) => ({
      ...img,
      isPrimary: img.id === imageId,
    }));
    onChange(updatedImages);
    
    // Update backend if productId and onPrimaryChange are provided
    if (productId && onPrimaryChange) {
      try {
        await onPrimaryChange(imageId);
      } catch (err) {
        console.error('Failed to update primary image:', err);
        // Revert on error
        const revertedImages = images.map((img) => ({
          ...img,
          isPrimary: img.isPrimary, // Keep original
        }));
        onChange(revertedImages);
      }
    }
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="space-y-4">
        {/* Image Grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((image, index) => {
              // Format image URL - same logic as ProductDetail
              const getImageUrl = (url: string | undefined | null): string => {
                if (!url) return '';
                // S3 URLs and other full URLs should already start with http/https
                if (url.startsWith('http')) return url;
                // Relative paths need base URL
                return `http://localhost:8000${url}`;
              };

              const imageUrl = getImageUrl(image.url);
              
              return (
                <div key={image.id} className="relative group">
                  <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-300 bg-white">
                    {image.url ? (
                      <img
                        src={imageUrl}
                        alt={image.altText || `Image ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                        <span className="text-xs">No image</span>
                      </div>
                    )}
                    {image.isPrimary && (
                      <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded z-20">
                        Primary
                      </div>
                    )}
                    {/* Overlay - only visible on hover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center space-x-2 pointer-events-none">
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(image.id)}
                        className={`opacity-0 group-hover:opacity-100 px-3 py-1.5 text-xs rounded text-white transition-opacity z-30 pointer-events-auto ${
                          image.isPrimary
                            ? 'bg-green-500'
                            : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                        title={image.isPrimary ? 'Primary image' : 'Set as primary'}
                      >
                        {image.isPrimary ? 'Primary' : 'Set Primary'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(image.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-opacity z-30 pointer-events-auto"
                        title="Remove image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Upload Button */}
        {canAddMore && (
          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              error
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300 bg-gray-50 hover:border-purple-400 hover:bg-purple-50'
            } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {uploading ? (
              <div className="flex flex-col items-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <p className="text-sm text-gray-600">Uploading...</p>
              </div>
            ) : (
              <>
                <Plus className="w-8 h-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  Click to upload images or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  JPG, PNG, WEBP, GIF, SVG, BMP, TIFF, AVIF up to {maxSizeMB}MB
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {images.length}/{maxImages} images
                </p>
              </>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading || !canAddMore}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

