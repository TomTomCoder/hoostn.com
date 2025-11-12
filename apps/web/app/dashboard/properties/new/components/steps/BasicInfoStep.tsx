'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clsx } from 'clsx';
import {
  basicInfoSchema,
  type BasicInfoFormData,
} from '@/lib/validations/property';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/use-debounce';

interface BasicInfoStepProps {
  initialData?: Partial<BasicInfoFormData>;
  onNext: (data: BasicInfoFormData) => void;
  onAutoSave?: (data: Partial<BasicInfoFormData>) => void;
}

const propertyTypes = [
  { value: 'house', label: 'House' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'villa', label: 'Villa' },
  { value: 'cabin', label: 'Cabin' },
  { value: 'cottage', label: 'Cottage' },
  { value: 'bungalow', label: 'Bungalow' },
  { value: 'chalet', label: 'Chalet' },
  { value: 'other', label: 'Other' },
] as const;

export function BasicInfoStep({
  initialData,
  onNext,
  onAutoSave,
}: BasicInfoStepProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BasicInfoFormData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      propertyType: initialData?.propertyType || 'house',
      bedrooms: initialData?.bedrooms || 0,
      bathrooms: initialData?.bathrooms || 0,
      maxGuests: initialData?.maxGuests || 2,
    },
  });

  // Watch all form values for auto-save
  const formData = watch();
  const debouncedFormData = useDebounce(formData, 2000);

  // Auto-save on debounced changes
  useEffect(() => {
    if (onAutoSave && debouncedFormData) {
      onAutoSave(debouncedFormData);
    }
  }, [debouncedFormData, onAutoSave]);

  const onSubmit = (data: BasicInfoFormData) => {
    onNext(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Property Name */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-anthracite mb-2"
        >
          Property Name <span className="text-error">*</span>
        </label>
        <input
          id="name"
          type="text"
          {...register('name')}
          className={clsx(
            'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors',
            errors.name
              ? 'border-error focus:ring-error'
              : 'border-gray-300'
          )}
          placeholder="e.g., Cozy Beach House"
          aria-invalid={errors.name ? 'true' : 'false'}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && (
          <p
            id="name-error"
            className="mt-1 text-sm text-error"
            role="alert"
          >
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Property Type */}
      <div>
        <label
          htmlFor="propertyType"
          className="block text-sm font-medium text-gray-anthracite mb-2"
        >
          Property Type <span className="text-error">*</span>
        </label>
        <select
          id="propertyType"
          {...register('propertyType')}
          className={clsx(
            'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors',
            errors.propertyType
              ? 'border-error focus:ring-error'
              : 'border-gray-300'
          )}
          aria-invalid={errors.propertyType ? 'true' : 'false'}
          aria-describedby={
            errors.propertyType ? 'propertyType-error' : undefined
          }
        >
          {propertyTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        {errors.propertyType && (
          <p
            id="propertyType-error"
            className="mt-1 text-sm text-error"
            role="alert"
          >
            {errors.propertyType.message}
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-anthracite mb-2"
        >
          Description
        </label>
        <textarea
          id="description"
          {...register('description')}
          rows={4}
          className={clsx(
            'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors resize-vertical',
            errors.description
              ? 'border-error focus:ring-error'
              : 'border-gray-300'
          )}
          placeholder="Describe your property, amenities, and what makes it special..."
          aria-invalid={errors.description ? 'true' : 'false'}
          aria-describedby={
            errors.description ? 'description-error' : undefined
          }
        />
        {errors.description && (
          <p
            id="description-error"
            className="mt-1 text-sm text-error"
            role="alert"
          >
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Bedrooms, Bathrooms, Max Guests - Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Bedrooms */}
        <div>
          <label
            htmlFor="bedrooms"
            className="block text-sm font-medium text-gray-anthracite mb-2"
          >
            Bedrooms <span className="text-error">*</span>
          </label>
          <input
            id="bedrooms"
            type="number"
            min="0"
            {...register('bedrooms', { valueAsNumber: true })}
            className={clsx(
              'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors',
              errors.bedrooms
                ? 'border-error focus:ring-error'
                : 'border-gray-300'
            )}
            aria-invalid={errors.bedrooms ? 'true' : 'false'}
            aria-describedby={errors.bedrooms ? 'bedrooms-error' : undefined}
          />
          {errors.bedrooms && (
            <p
              id="bedrooms-error"
              className="mt-1 text-sm text-error"
              role="alert"
            >
              {errors.bedrooms.message}
            </p>
          )}
        </div>

        {/* Bathrooms */}
        <div>
          <label
            htmlFor="bathrooms"
            className="block text-sm font-medium text-gray-anthracite mb-2"
          >
            Bathrooms <span className="text-error">*</span>
          </label>
          <input
            id="bathrooms"
            type="number"
            min="0"
            {...register('bathrooms', { valueAsNumber: true })}
            className={clsx(
              'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors',
              errors.bathrooms
                ? 'border-error focus:ring-error'
                : 'border-gray-300'
            )}
            aria-invalid={errors.bathrooms ? 'true' : 'false'}
            aria-describedby={errors.bathrooms ? 'bathrooms-error' : undefined}
          />
          {errors.bathrooms && (
            <p
              id="bathrooms-error"
              className="mt-1 text-sm text-error"
              role="alert"
            >
              {errors.bathrooms.message}
            </p>
          )}
        </div>

        {/* Max Guests */}
        <div>
          <label
            htmlFor="maxGuests"
            className="block text-sm font-medium text-gray-anthracite mb-2"
          >
            Max Guests <span className="text-error">*</span>
          </label>
          <input
            id="maxGuests"
            type="number"
            min="1"
            {...register('maxGuests', { valueAsNumber: true })}
            className={clsx(
              'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors',
              errors.maxGuests
                ? 'border-error focus:ring-error'
                : 'border-gray-300'
            )}
            aria-invalid={errors.maxGuests ? 'true' : 'false'}
            aria-describedby={errors.maxGuests ? 'maxGuests-error' : undefined}
          />
          {errors.maxGuests && (
            <p
              id="maxGuests-error"
              className="mt-1 text-sm text-error"
              role="alert"
            >
              {errors.maxGuests.message}
            </p>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isSubmitting}
        >
          Next: Location
        </Button>
      </div>
    </form>
  );
}
