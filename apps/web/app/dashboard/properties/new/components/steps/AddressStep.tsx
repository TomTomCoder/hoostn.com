'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clsx } from 'clsx';
import {
  addressSchema,
  type AddressFormData,
} from '@/lib/validations/property';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/use-debounce';

interface AddressStepProps {
  initialData?: Partial<AddressFormData>;
  onNext: (data: AddressFormData) => void;
  onBack: () => void;
  onAutoSave?: (data: Partial<AddressFormData>) => void;
}

const countries = [
  { code: 'FR', name: 'France' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'PT', name: 'Portugal' },
] as const;

export function AddressStep({
  initialData,
  onNext,
  onBack,
  onAutoSave,
}: AddressStepProps) {
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      street: initialData?.street || '',
      city: initialData?.city || '',
      state: initialData?.state || '',
      postalCode: initialData?.postalCode || '',
      country: initialData?.country || 'FR',
      latitude: initialData?.latitude || null,
      longitude: initialData?.longitude || null,
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

  const handleAutoDetectCoordinates = async () => {
    setIsGeocodingLoading(true);

    try {
      // TODO: Agent 2 will provide geocoding action
      // For now, just show a placeholder message
      console.log('Geocoding not yet implemented by Agent 2');
      alert(
        'Geocoding functionality will be implemented by Agent 2. For now, you can manually enter coordinates if needed.'
      );
    } catch (error) {
      console.error('Geocoding error:', error);
    } finally {
      setIsGeocodingLoading(false);
    }
  };

  const onSubmit = (data: AddressFormData) => {
    onNext(data);
  };

  const hasCoordinates = formData.latitude && formData.longitude;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Street Address */}
      <div>
        <label
          htmlFor="street"
          className="block text-sm font-medium text-gray-anthracite mb-2"
        >
          Street Address <span className="text-error">*</span>
        </label>
        <input
          id="street"
          type="text"
          {...register('street')}
          className={clsx(
            'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors',
            errors.street
              ? 'border-error focus:ring-error'
              : 'border-gray-300'
          )}
          placeholder="123 Main Street"
          aria-invalid={errors.street ? 'true' : 'false'}
          aria-describedby={errors.street ? 'street-error' : undefined}
        />
        {errors.street && (
          <p
            id="street-error"
            className="mt-1 text-sm text-error"
            role="alert"
          >
            {errors.street.message}
          </p>
        )}
      </div>

      {/* City and State - Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* City */}
        <div>
          <label
            htmlFor="city"
            className="block text-sm font-medium text-gray-anthracite mb-2"
          >
            City <span className="text-error">*</span>
          </label>
          <input
            id="city"
            type="text"
            {...register('city')}
            className={clsx(
              'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors',
              errors.city
                ? 'border-error focus:ring-error'
                : 'border-gray-300'
            )}
            placeholder="Paris"
            aria-invalid={errors.city ? 'true' : 'false'}
            aria-describedby={errors.city ? 'city-error' : undefined}
          />
          {errors.city && (
            <p
              id="city-error"
              className="mt-1 text-sm text-error"
              role="alert"
            >
              {errors.city.message}
            </p>
          )}
        </div>

        {/* State/Province */}
        <div>
          <label
            htmlFor="state"
            className="block text-sm font-medium text-gray-anthracite mb-2"
          >
            State/Province
          </label>
          <input
            id="state"
            type="text"
            {...register('state')}
            className={clsx(
              'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors',
              errors.state
                ? 'border-error focus:ring-error'
                : 'border-gray-300'
            )}
            placeholder="Île-de-France"
            aria-invalid={errors.state ? 'true' : 'false'}
            aria-describedby={errors.state ? 'state-error' : undefined}
          />
          {errors.state && (
            <p
              id="state-error"
              className="mt-1 text-sm text-error"
              role="alert"
            >
              {errors.state.message}
            </p>
          )}
        </div>
      </div>

      {/* Postal Code and Country - Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Postal Code */}
        <div>
          <label
            htmlFor="postalCode"
            className="block text-sm font-medium text-gray-anthracite mb-2"
          >
            Postal Code
          </label>
          <input
            id="postalCode"
            type="text"
            {...register('postalCode')}
            className={clsx(
              'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors',
              errors.postalCode
                ? 'border-error focus:ring-error'
                : 'border-gray-300'
            )}
            placeholder="75001"
            aria-invalid={errors.postalCode ? 'true' : 'false'}
            aria-describedby={errors.postalCode ? 'postalCode-error' : undefined}
          />
          {errors.postalCode && (
            <p
              id="postalCode-error"
              className="mt-1 text-sm text-error"
              role="alert"
            >
              {errors.postalCode.message}
            </p>
          )}
        </div>

        {/* Country */}
        <div>
          <label
            htmlFor="country"
            className="block text-sm font-medium text-gray-anthracite mb-2"
          >
            Country <span className="text-error">*</span>
          </label>
          <select
            id="country"
            {...register('country')}
            className={clsx(
              'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors',
              errors.country
                ? 'border-error focus:ring-error'
                : 'border-gray-300'
            )}
            aria-invalid={errors.country ? 'true' : 'false'}
            aria-describedby={errors.country ? 'country-error' : undefined}
          >
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
          {errors.country && (
            <p
              id="country-error"
              className="mt-1 text-sm text-error"
              role="alert"
            >
              {errors.country.message}
            </p>
          )}
        </div>
      </div>

      {/* Coordinates Section */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-gray-anthracite">
              Coordinates (Optional)
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Auto-detect coordinates from the address above
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAutoDetectCoordinates}
            disabled={isGeocodingLoading}
          >
            {isGeocodingLoading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4"
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
                Detecting...
              </span>
            ) : (
              'Auto-detect'
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Latitude */}
          <div>
            <label
              htmlFor="latitude"
              className="block text-sm font-medium text-gray-anthracite mb-2"
            >
              Latitude
            </label>
            <input
              id="latitude"
              type="number"
              step="any"
              {...register('latitude', { valueAsNumber: true })}
              className={clsx(
                'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors',
                errors.latitude
                  ? 'border-error focus:ring-error'
                  : 'border-gray-300'
              )}
              placeholder="48.8566"
              aria-invalid={errors.latitude ? 'true' : 'false'}
              aria-describedby={errors.latitude ? 'latitude-error' : undefined}
            />
            {errors.latitude && (
              <p
                id="latitude-error"
                className="mt-1 text-sm text-error"
                role="alert"
              >
                {errors.latitude.message}
              </p>
            )}
          </div>

          {/* Longitude */}
          <div>
            <label
              htmlFor="longitude"
              className="block text-sm font-medium text-gray-anthracite mb-2"
            >
              Longitude
            </label>
            <input
              id="longitude"
              type="number"
              step="any"
              {...register('longitude', { valueAsNumber: true })}
              className={clsx(
                'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors',
                errors.longitude
                  ? 'border-error focus:ring-error'
                  : 'border-gray-300'
              )}
              placeholder="2.3522"
              aria-invalid={errors.longitude ? 'true' : 'false'}
              aria-describedby={errors.longitude ? 'longitude-error' : undefined}
            />
            {errors.longitude && (
              <p
                id="longitude-error"
                className="mt-1 text-sm text-error"
                role="alert"
              >
                {errors.longitude.message}
              </p>
            )}
          </div>
        </div>

        {/* Map Preview Placeholder */}
        {hasCoordinates && (
          <div className="mt-4 p-6 bg-gray-100 rounded-lg border border-gray-200 text-center">
            <svg
              className="w-12 h-12 text-gray-400 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
            <p className="text-sm text-gray-600">
              Map preview will be shown here
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Agent 5 will provide the PropertyMap component
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" size="lg" onClick={onBack}>
          Back
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isSubmitting}
        >
          Next: Contact & Settings
        </Button>
      </div>
    </form>
  );
}
