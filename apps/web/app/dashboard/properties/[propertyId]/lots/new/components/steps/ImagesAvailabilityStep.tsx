'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clsx } from 'clsx';
import {
  imagesAvailabilitySchema,
  type ImagesAvailabilityFormData,
} from '@/lib/validations/lot';
import { Button } from '@/components/ui/button';
import { AvailabilityCalendar } from '@/components/calendar/AvailabilityCalendar';
import type { AvailabilityRule } from '@/components/calendar/DateBlockModal';
import { useDebounce } from '@/hooks/use-debounce';

interface ImagePreview {
  file: File;
  preview: string;
  isPrimary: boolean;
}

interface ImagesAvailabilityStepProps {
  initialData?: Partial<ImagesAvailabilityFormData>;
  onSubmit: (data: ImagesAvailabilityFormData) => void;
  onBack: () => void;
  onAutoSave?: (data: Partial<ImagesAvailabilityFormData>) => void;
  isLoading: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 20;

export function ImagesAvailabilityStep({
  initialData,
  onSubmit,
  onBack,
  onAutoSave,
  isLoading,
}: ImagesAvailabilityStepProps) {
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [availabilityRules, setAvailabilityRules] = useState<AvailabilityRule[]>([]);
  const [fileError, setFileError] = useState<string>('');

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ImagesAvailabilityFormData>({
    resolver: zodResolver(imagesAvailabilitySchema),
    defaultValues: {
      images: [],
      availabilityRules: [],
    },
  });

  // Watch for auto-save (rules only, not images)
  const formData = watch();
  const debouncedFormData = useDebounce(formData, 2000);

  useEffect(() => {
    if (onAutoSave && debouncedFormData) {
      // Only auto-save availability rules, not images
      onAutoSave({ availabilityRules: debouncedFormData.availabilityRules });
    }
  }, [debouncedFormData, onAutoSave]);

  // Handle file selection
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      setFileError('');

      if (imagePreviews.length + files.length > MAX_FILES) {
        setFileError(`Maximum ${MAX_FILES} images allowed`);
        return;
      }

      const validFiles: ImagePreview[] = [];

      for (const file of files) {
        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          setFileError(`${file.name} exceeds 10MB limit`);
          continue;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
          setFileError(`${file.name} is not a valid image file`);
          continue;
        }

        validFiles.push({
          file,
          preview: URL.createObjectURL(file),
          isPrimary: imagePreviews.length === 0 && validFiles.length === 0, // First image is primary
        });
      }

      if (validFiles.length > 0) {
        const newPreviews = [...imagePreviews, ...validFiles];
        setImagePreviews(newPreviews);

        // Update form value
        setValue(
          'images',
          newPreviews.map((img) => ({
            file: img.file,
            preview: img.preview,
            isPrimary: img.isPrimary,
          }))
        );
      }

      // Reset input
      e.target.value = '';
    },
    [imagePreviews, setValue]
  );

  // Remove image
  const handleRemoveImage = useCallback(
    (index: number) => {
      URL.revokeObjectURL(imagePreviews[index].preview);
      const newPreviews = imagePreviews.filter((_, i) => i !== index);

      // If removed image was primary, make first image primary
      if (imagePreviews[index].isPrimary && newPreviews.length > 0) {
        newPreviews[0].isPrimary = true;
      }

      setImagePreviews(newPreviews);
      setValue(
        'images',
        newPreviews.map((img) => ({
          file: img.file,
          preview: img.preview,
          isPrimary: img.isPrimary,
        }))
      );
    },
    [imagePreviews, setValue]
  );

  // Set primary image
  const handleSetPrimary = useCallback(
    (index: number) => {
      const newPreviews = imagePreviews.map((img, i) => ({
        ...img,
        isPrimary: i === index,
      }));
      setImagePreviews(newPreviews);
      setValue(
        'images',
        newPreviews.map((img) => ({
          file: img.file,
          preview: img.preview,
          isPrimary: img.isPrimary,
        }))
      );
    },
    [imagePreviews, setValue]
  );

  // Handle form submission
  const handleFormSubmit = (data: ImagesAvailabilityFormData) => {
    onSubmit({
      ...data,
      availabilityRules,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      {/* Images Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-anthracite mb-4">
          Lot Images <span className="text-error">*</span>
        </h3>

        {/* File Input */}
        <div className="mb-4">
          <label
            htmlFor="image-upload"
            className={clsx(
              'flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
              {
                'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100':
                  !errors.images,
                'border-error bg-error/5': errors.images,
              }
            )}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg
                className="w-10 h-10 mb-3 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="mb-2 text-sm text-gray-600">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                JPEG, PNG, WebP (max 10MB, up to {MAX_FILES} images)
              </p>
            </div>
            <input
              id="image-upload"
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
          {errors.images && (
            <p className="mt-2 text-sm text-error" role="alert">
              {errors.images.message}
            </p>
          )}
          {fileError && (
            <p className="mt-2 text-sm text-error" role="alert">
              {fileError}
            </p>
          )}
        </div>

        {/* Image Preview Grid */}
        {imagePreviews.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {imagePreviews.map((image, index) => (
              <div
                key={index}
                className={clsx(
                  'relative group border-2 rounded-lg overflow-hidden',
                  {
                    'border-primary ring-2 ring-primary ring-offset-2': image.isPrimary,
                    'border-gray-200': !image.isPrimary,
                  }
                )}
              >
                <img
                  src={image.preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover"
                />

                {/* Primary Badge */}
                {image.isPrimary && (
                  <div className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded">
                    Primary
                  </div>
                )}

                {/* Action Buttons */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                  {!image.isPrimary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(index)}
                      className="px-3 py-1 bg-white text-gray-anthracite text-xs rounded hover:bg-gray-100 transition-colors"
                    >
                      Set Primary
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="px-3 py-1 bg-error text-white text-xs rounded hover:bg-error/90 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-2 text-sm text-gray-500">
          {imagePreviews.length} of {MAX_FILES} images selected
        </p>
      </div>

      {/* Availability Calendar Section */}
      <div>
        <AvailabilityCalendar
          availabilityRules={availabilityRules}
          onRulesChange={setAvailabilityRules}
        />
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" size="lg" onClick={onBack}>
          Back
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isLoading || imagePreviews.length === 0}
        >
          {isLoading ? 'Creating Lot...' : 'Create Lot'}
        </Button>
      </div>
    </form>
  );
}
