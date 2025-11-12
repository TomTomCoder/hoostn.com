'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clsx } from 'clsx';
import {
  contactSettingsSchema,
  type ContactSettingsFormData,
} from '@/lib/validations/property';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/use-debounce';

interface ContactSettingsStepProps {
  initialData?: Partial<ContactSettingsFormData>;
  onSubmit: (
    data: ContactSettingsFormData & { images: File[] }
  ) => Promise<void>;
  onBack: () => void;
  onAutoSave?: (data: Partial<ContactSettingsFormData>) => void;
  isLoading?: boolean;
  submitButtonText?: string;
}

const currencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
] as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 10;
const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

export function ContactSettingsStep({
  initialData,
  onSubmit,
  onBack,
  onAutoSave,
  isLoading = false,
  submitButtonText = 'Create Property',
}: ContactSettingsStepProps) {
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageError, setImageError] = useState<string>('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ContactSettingsFormData>({
    resolver: zodResolver(contactSettingsSchema),
    defaultValues: {
      contactEmail: initialData?.contactEmail || '',
      contactPhone: initialData?.contactPhone || '',
      checkInTime: initialData?.checkInTime || '15:00',
      checkOutTime: initialData?.checkOutTime || '11:00',
      currency: initialData?.currency || 'EUR',
      instantBooking: initialData?.instantBooking || false,
    },
  });

  // Watch form values for auto-save (excluding images)
  const formData = watch();
  const debouncedFormData = useDebounce(formData, 2000);

  // Auto-save on debounced changes
  useEffect(() => {
    if (onAutoSave && debouncedFormData) {
      onAutoSave(debouncedFormData);
    }
  }, [debouncedFormData, onAutoSave]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError('');

    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    const totalFiles = imageFiles.length + files.length;

    // Validate number of files
    if (totalFiles > MAX_FILES) {
      setImageError(`Maximum ${MAX_FILES} images allowed`);
      return;
    }

    // Validate each file
    const validFiles: File[] = [];
    for (const file of files) {
      // Check file type
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        setImageError(`${file.name} is not a valid image type`);
        return;
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        setImageError(`${file.name} exceeds maximum size of 10MB`);
        return;
      }

      validFiles.push(file);
    }

    // Create preview URLs
    const newPreviews = validFiles.map((file) => URL.createObjectURL(file));

    setImageFiles((prev) => [...prev, ...validFiles]);
    setImagePreviews((prev) => [...prev, ...newPreviews]);

    // Reset input
    e.target.value = '';
  };

  // Remove image
  const handleRemoveImage = (index: number) => {
    // Revoke object URL to free memory
    URL.revokeObjectURL(imagePreviews[index]);

    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setImageError('');
  };

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  const handleFormSubmit = async (data: ContactSettingsFormData) => {
    // Validate images
    if (imageFiles.length === 0) {
      setImageError('At least one image is required');
      return;
    }

    await onSubmit({ ...data, images: imageFiles });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Contact Email */}
      <div>
        <label
          htmlFor="contactEmail"
          className="block text-sm font-medium text-gray-anthracite mb-2"
        >
          Contact Email <span className="text-error">*</span>
        </label>
        <input
          id="contactEmail"
          type="email"
          {...register('contactEmail')}
          className={clsx(
            'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors',
            errors.contactEmail
              ? 'border-error focus:ring-error'
              : 'border-gray-300'
          )}
          placeholder="contact@example.com"
          aria-invalid={errors.contactEmail ? 'true' : 'false'}
          aria-describedby={
            errors.contactEmail ? 'contactEmail-error' : undefined
          }
        />
        {errors.contactEmail && (
          <p
            id="contactEmail-error"
            className="mt-1 text-sm text-error"
            role="alert"
          >
            {errors.contactEmail.message}
          </p>
        )}
      </div>

      {/* Contact Phone */}
      <div>
        <label
          htmlFor="contactPhone"
          className="block text-sm font-medium text-gray-anthracite mb-2"
        >
          Contact Phone
        </label>
        <input
          id="contactPhone"
          type="tel"
          {...register('contactPhone')}
          className={clsx(
            'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors',
            errors.contactPhone
              ? 'border-error focus:ring-error'
              : 'border-gray-300'
          )}
          placeholder="+33 1 23 45 67 89"
          aria-invalid={errors.contactPhone ? 'true' : 'false'}
          aria-describedby={
            errors.contactPhone ? 'contactPhone-error' : undefined
          }
        />
        {errors.contactPhone && (
          <p
            id="contactPhone-error"
            className="mt-1 text-sm text-error"
            role="alert"
          >
            {errors.contactPhone.message}
          </p>
        )}
      </div>

      {/* Check-in and Check-out Times - Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Check-in Time */}
        <div>
          <label
            htmlFor="checkInTime"
            className="block text-sm font-medium text-gray-anthracite mb-2"
          >
            Check-in Time <span className="text-error">*</span>
          </label>
          <input
            id="checkInTime"
            type="time"
            {...register('checkInTime')}
            className={clsx(
              'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors',
              errors.checkInTime
                ? 'border-error focus:ring-error'
                : 'border-gray-300'
            )}
            aria-invalid={errors.checkInTime ? 'true' : 'false'}
            aria-describedby={
              errors.checkInTime ? 'checkInTime-error' : undefined
            }
          />
          {errors.checkInTime && (
            <p
              id="checkInTime-error"
              className="mt-1 text-sm text-error"
              role="alert"
            >
              {errors.checkInTime.message}
            </p>
          )}
        </div>

        {/* Check-out Time */}
        <div>
          <label
            htmlFor="checkOutTime"
            className="block text-sm font-medium text-gray-anthracite mb-2"
          >
            Check-out Time <span className="text-error">*</span>
          </label>
          <input
            id="checkOutTime"
            type="time"
            {...register('checkOutTime')}
            className={clsx(
              'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors',
              errors.checkOutTime
                ? 'border-error focus:ring-error'
                : 'border-gray-300'
            )}
            aria-invalid={errors.checkOutTime ? 'true' : 'false'}
            aria-describedby={
              errors.checkOutTime ? 'checkOutTime-error' : undefined
            }
          />
          {errors.checkOutTime && (
            <p
              id="checkOutTime-error"
              className="mt-1 text-sm text-error"
              role="alert"
            >
              {errors.checkOutTime.message}
            </p>
          )}
        </div>
      </div>

      {/* Currency */}
      <div>
        <label
          htmlFor="currency"
          className="block text-sm font-medium text-gray-anthracite mb-2"
        >
          Currency <span className="text-error">*</span>
        </label>
        <select
          id="currency"
          {...register('currency')}
          className={clsx(
            'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors',
            errors.currency
              ? 'border-error focus:ring-error'
              : 'border-gray-300'
          )}
          aria-invalid={errors.currency ? 'true' : 'false'}
          aria-describedby={errors.currency ? 'currency-error' : undefined}
        >
          {currencies.map((currency) => (
            <option key={currency.code} value={currency.code}>
              {currency.name} ({currency.symbol})
            </option>
          ))}
        </select>
        {errors.currency && (
          <p
            id="currency-error"
            className="mt-1 text-sm text-error"
            role="alert"
          >
            {errors.currency.message}
          </p>
        )}
      </div>

      {/* Instant Booking Toggle */}
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id="instantBooking"
            type="checkbox"
            {...register('instantBooking')}
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="ml-3">
          <label
            htmlFor="instantBooking"
            className="text-sm font-medium text-gray-anthracite"
          >
            Enable Instant Booking
          </label>
          <p className="text-xs text-gray-500 mt-1">
            Allow guests to book immediately without your approval
          </p>
        </div>
      </div>

      {/* Image Upload */}
      <div className="border-t border-gray-200 pt-6">
        <label className="block text-sm font-medium text-gray-anthracite mb-2">
          Property Images <span className="text-error">*</span>
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Upload 1-10 images (max 10MB each). JPEG, PNG, or WebP format.
        </p>

        {/* File Input */}
        <div className="mb-4">
          <label
            htmlFor="images"
            className={clsx(
              'flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
              imageError
                ? 'border-error bg-red-50 hover:bg-red-100'
                : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
            )}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg
                className={clsx(
                  'w-8 h-8 mb-2',
                  imageError ? 'text-error' : 'text-gray-400'
                )}
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
              <p className="text-sm text-gray-600">
                <span className="font-medium">Click to upload</span> or drag
                and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {imageFiles.length}/{MAX_FILES} images
              </p>
            </div>
            <input
              id="images"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              onChange={handleFileChange}
              className="hidden"
              disabled={imageFiles.length >= MAX_FILES || isSubmitting || isLoading}
            />
          </label>
        </div>

        {/* Image Error */}
        {imageError && (
          <p className="text-sm text-error mb-3" role="alert">
            {imageError}
          </p>
        )}

        {/* Image Previews */}
        {imagePreviews.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative group">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-2 right-2 p-1 bg-error text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                  aria-label={`Remove image ${index + 1}`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black bg-opacity-60 text-white text-xs rounded">
                  {(imageFiles[index].size / 1024 / 1024).toFixed(1)} MB
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Note about Agent 5 */}
        {imagePreviews.length === 0 && (
          <p className="text-xs text-gray-500 italic">
            Note: Agent 5 will provide an enhanced ImageUploader component with
            drag-and-drop
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onBack}
          disabled={isSubmitting || isLoading}
        >
          Back
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isSubmitting || isLoading || imageFiles.length === 0}
        >
          {isSubmitting || isLoading ? (
            <span className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {submitButtonText === 'Update Property' ? 'Updating...' : 'Creating...'}
            </span>
          ) : (
            submitButtonText
          )}
        </Button>
      </div>
    </form>
  );
}
