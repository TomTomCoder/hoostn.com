'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clsx } from 'clsx';
import {
  basicInfoSchema,
  type BasicInfoFormData,
} from '@/lib/validations/lot';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/use-debounce';

interface BasicInfoStepProps {
  initialData?: Partial<BasicInfoFormData>;
  onNext: (data: BasicInfoFormData) => void;
  onAutoSave?: (data: Partial<BasicInfoFormData>) => void;
}

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'maintenance', label: 'Maintenance' },
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
      title: initialData?.title || '',
      description: initialData?.description || '',
      bedrooms: initialData?.bedrooms || 1,
      bathrooms: initialData?.bathrooms || 1,
      max_guests: initialData?.max_guests || 2,
      pets_allowed: initialData?.pets_allowed || false,
      status: initialData?.status || 'active',
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
      {/* Lot Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-anthracite mb-2"
        >
          Lot Title <span className="text-error">*</span>
        </label>
        <input
          id="title"
          type="text"
          {...register('title')}
          className={clsx(
            'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors',
            errors.title
              ? 'border-error focus:ring-error'
              : 'border-gray-300'
          )}
          placeholder="e.g., Apartment A, Studio 101, Beach House Unit 2"
          aria-invalid={errors.title ? 'true' : 'false'}
          aria-describedby={errors.title ? 'title-error' : undefined}
        />
        {errors.title && (
          <p
            id="title-error"
            className="mt-1 text-sm text-error"
            role="alert"
          >
            {errors.title.message}
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
          placeholder="Describe this lot, its unique features, and what makes it special..."
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
            min="1"
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
            min="1"
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
            htmlFor="max_guests"
            className="block text-sm font-medium text-gray-anthracite mb-2"
          >
            Max Guests <span className="text-error">*</span>
          </label>
          <input
            id="max_guests"
            type="number"
            min="1"
            {...register('max_guests', { valueAsNumber: true })}
            className={clsx(
              'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors',
              errors.max_guests
                ? 'border-error focus:ring-error'
                : 'border-gray-300'
            )}
            aria-invalid={errors.max_guests ? 'true' : 'false'}
            aria-describedby={errors.max_guests ? 'max_guests-error' : undefined}
          />
          {errors.max_guests && (
            <p
              id="max_guests-error"
              className="mt-1 text-sm text-error"
              role="alert"
            >
              {errors.max_guests.message}
            </p>
          )}
        </div>
      </div>

      {/* Pets Allowed Toggle */}
      <div className="flex items-center space-x-3">
        <input
          id="pets_allowed"
          type="checkbox"
          {...register('pets_allowed')}
          className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors cursor-pointer"
          aria-describedby="pets_allowed-description"
        />
        <div>
          <label
            htmlFor="pets_allowed"
            className="text-sm font-medium text-gray-anthracite cursor-pointer"
          >
            Pets Allowed
          </label>
          <p id="pets_allowed-description" className="text-xs text-gray-500">
            Allow guests to bring pets to this lot
          </p>
        </div>
      </div>

      {/* Status */}
      <div>
        <label
          htmlFor="status"
          className="block text-sm font-medium text-gray-anthracite mb-2"
        >
          Status <span className="text-error">*</span>
        </label>
        <select
          id="status"
          {...register('status')}
          className={clsx(
            'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors',
            errors.status
              ? 'border-error focus:ring-error'
              : 'border-gray-300'
          )}
          aria-invalid={errors.status ? 'true' : 'false'}
          aria-describedby={errors.status ? 'status-error' : undefined}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.status && (
          <p
            id="status-error"
            className="mt-1 text-sm text-error"
            role="alert"
          >
            {errors.status.message}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Active: Available for booking | Inactive: Hidden from guests | Maintenance: Temporarily unavailable
        </p>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isSubmitting}
        >
          Next: Amenities & Pricing
        </Button>
      </div>
    </form>
  );
}
