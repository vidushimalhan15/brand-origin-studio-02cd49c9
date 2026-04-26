import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileDropzoneProps {
  value?: File | string | null;
  onChange: (file: File | null) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  className?: string;
  id?: string;
  disabled?: boolean;
}

export const FileDropzone = ({
  value,
  onChange,
  accept = { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
  maxSize = 10 * 1024 * 1024, // 10MB
  className,
  id,
  disabled = false
}: FileDropzoneProps) => {
  const [preview, setPreview] = useState<string | null>(
    typeof value === 'string' ? value : null
  );

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      onChange(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
    disabled
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setPreview(null);
  };

  const hasFile = value || preview;

  return (
    <div className={cn('space-y-2', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer',
          isDragActive && 'border-blue-500 bg-blue-50',
          !isDragActive && !hasFile && 'border-gray-300 hover:border-gray-400',
          hasFile && 'border-green-300 bg-green-50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} id={id} data-testid="file-dropzone-input" />

        {hasFile ? (
          <div className="flex items-center gap-4">
            {preview && (
              <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {value instanceof File ? value.name : 'Image uploaded'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Click or drag to replace
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={disabled}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <Upload className="h-10 w-10 text-gray-400 mb-3" />
            <p className="text-sm font-medium text-gray-700">
              {isDragActive ? 'Drop image here' : 'Drag & drop image here'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              or click to browse (max 10MB)
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
