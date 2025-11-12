'use client';

import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  amenitiesPricingSchema,
  type AmenitiesPricingFormData,
} from '@/lib/validations/lot';
import { Button } from '@/components/ui/button';
import { AmenitySelector } from '@/components/forms/AmenitySelector';
import { PricingConfiguration } from '@/components/forms/PricingConfiguration';
import { useDebounce } from '@/hooks/use-debounce';

interface SeasonalPricing {
  id?: string;
  name: string;
  start_date: string;
  end_date: string;
  price_per_night: number;
  min_nights: number;
}

interface AmenitiesPricingStepProps {
  initialData?: Partial<AmenitiesPricingFormData>;
  onNext: (data: AmenitiesPricingFormData) => void;
  onBack: () => void;
  onAutoSave?: (data: Partial<AmenitiesPricingFormData>) => void;
}

export function AmenitiesPricingStep({
  initialData,
  onNext,
  onBack,
  onAutoSave,
}: AmenitiesPricingStepProps) {
  const [seasonalPricing, setSeasonalPricing] = useState<SeasonalPricing[]>([]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AmenitiesPricingFormData>({
    resolver: zodResolver(amenitiesPricingSchema),
    defaultValues: {
      amenity_ids: initialData?.amenity_ids || [],
      base_price: initialData?.base_price || null,
      cleaning_fee: initialData?.cleaning_fee || 0,
      tourist_tax: initialData?.tourist_tax || 0,
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

  const onSubmit = (data: AmenitiesPricingFormData) => {
    onNext(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Amenities Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-anthracite mb-4">
          Select Amenities
        </h3>
        <Controller
          name="amenity_ids"
          control={control}
          render={({ field }) => (
            <AmenitySelector
              selectedAmenities={field.value || []}
              onChange={field.onChange}
            />
          )}
        />
      </div>

      {/* Pricing Configuration Section */}
      <div>
        <Controller
          name="base_price"
          control={control}
          render={({ field }) => (
            <PricingConfiguration
              basePrice={field.value}
              cleaningFee={watch('cleaning_fee')}
              touristTax={watch('tourist_tax')}
              seasonalPricing={seasonalPricing}
              onBasePriceChange={field.onChange}
              onCleaningFeeChange={(value) => setValue('cleaning_fee', value)}
              onTouristTaxChange={(value) => setValue('tourist_tax', value)}
              onSeasonalPricingChange={setSeasonalPricing}
              errors={errors}
            />
          )}
        />
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onBack}
        >
          Back
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isSubmitting}
        >
          Next: Images & Availability
        </Button>
      </div>
    </form>
  );
}
