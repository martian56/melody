import { useState, useRef, useEffect } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import api from '../../lib/api';

interface ImageUploadProps {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  error?: string;
  accept?: string;
  maxSizeMB?: number;
  uploadEndpoint?: string;
}

export function ImageUpload({
  label,
  value,
  onChange,
  error,
  accept = 'image/*',
  maxSizeMB = 10,
  uploadEndpoint = '/upload/product-image',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync preview with value prop
  useEffect(() => {
    if (value) {
      setPreview(value);
    } else {
      setPreview(null);
    }
  }, [value]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('Uploading to endpoint:', uploadEndpoint);
      console.log('File:', file.name, file.type, file.size);
      
      // Don't set Content-Type header - let axios interceptor handle it for FormData
      const response = await api.post(uploadEndpoint, formData);
      
      console.log('Upload response:', response.data);
      const imageUrl = response.data.url;
      
      if (!imageUrl) {
        throw new Error('No URL returned from server');
      }
      
      // Update preview with the actual URL (for S3, this will be a full URL)
      setPreview(imageUrl);
      
      // Notify parent component - this will update the form value
      console.log('Calling onChange with URL:', imageUrl);
      onChange(imageUrl);
    } catch (err: any) {
      console.error('Upload error:', err);
      console.error('Error response:', err.response?.data);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to upload image';
      alert(errorMessage);
      // Reset preview to previous value on error
      if (value) {
        setPreview(value);
      } else {
        setPreview(null);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Format image URL - same logic as ProductDetail
  const getImageUrl = (url: string | undefined | null): string => {
    if (!url) return '';
    // S3 URLs and other full URLs should already start with http/https
    if (url.startsWith('http')) return url;
    // Relative paths need base URL
    return `http://localhost:8000${url}`;
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="space-y-2">
        {preview ? (
          <div className="relative inline-block">
            <img
              src={getImageUrl(preview)}
              alt="Preview"
              className="h-32 w-32 object-cover rounded-lg border border-gray-300"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
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
                <ImageIcon className="w-8 h-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  JPG, PNG, WEBP, GIF, SVG, BMP, TIFF, AVIF up to {maxSizeMB}MB
                </p>
              </>
            )}
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

