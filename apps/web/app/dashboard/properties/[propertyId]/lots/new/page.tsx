'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { useLotFormStore, type FormStep } from '@/lib/stores/lotFormStore';
import { FormStepIndicator } from './components/FormStepIndicator';
import { BasicInfoStep } from './components/steps/BasicInfoStep';
import { AmenitiesPricingStep } from './components/steps/AmenitiesPricingStep';
import { ImagesAvailabilityStep } from './components/steps/ImagesAvailabilityStep';
import type {
  BasicInfoFormData,
  AmenitiesPricingFormData,
  ImagesAvailabilityFormData,
  LotFormData,
} from '@/lib/validations/lot';

export default function NewLotPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.propertyId as string;

  const {
    currentStep,
    formData,
    draftId,
    setPropertyId,
    setCurrentStep,
    nextStep,
    previousStep,
    updateFormData,
    setDraftId,
    resetForm,
  } = useLotFormStore();

  const [completedSteps, setCompletedSteps] = useState<FormStep[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Set property ID on mount
  useEffect(() => {
    if (propertyId) {
      setPropertyId(propertyId);
    }
  }, [propertyId, setPropertyId]);

  // Auto-save handler (for draft functionality - placeholder)
  const handleAutoSave = useCallback(
    async (data: Partial<LotFormData>) => {
      try {
        updateFormData(data);
        // TODO: Implement draft saving when backend is ready
        // const result = await saveLotDraft(propertyId, data);
        // if (result.success && result.data.draftId) {
        //   setDraftId(result.data.draftId);
        // }
      } catch (err) {
        console.error('Auto-save failed:', err);
      }
    },
    [updateFormData]
  );

  // Handle Step 1 completion
  const handleBasicInfoNext = useCallback(
    (data: BasicInfoFormData) => {
      updateFormData(data);
      if (!completedSteps.includes(1)) {
        setCompletedSteps((prev) => [...prev, 1]);
      }
      nextStep();
    },
    [updateFormData, nextStep, completedSteps]
  );

  // Handle Step 2 completion
  const handleAmenitiesPricingNext = useCallback(
    (data: AmenitiesPricingFormData) => {
      updateFormData(data);
      if (!completedSteps.includes(2)) {
        setCompletedSteps((prev) => [...prev, 2]);
      }
      nextStep();
    },
    [updateFormData, nextStep, completedSteps]
  );

  // Handle Step 2 back
  const handleAmenitiesPricingBack = useCallback(() => {
    previousStep();
  }, [previousStep]);

  // Handle Step 3 back
  const handleImagesAvailabilityBack = useCallback(() => {
    previousStep();
  }, [previousStep]);

  // Handle final submission
  const handleFinalSubmit = useCallback(
    async (data: ImagesAvailabilityFormData) => {
      setIsLoading(true);
      setError('');

      try {
        // Combine all form data
        const completeFormData = {
          ...formData,
          ...data,
        };

        // TODO: Implement lot creation when backend is ready
        console.log('Creating lot with data:', completeFormData);

        // Placeholder success - replace with actual API call
        // const result = await createLot(propertyId, completeFormData);
        // if (result.success && result.data?.id) {
        //   resetForm();
        //   router.push(`/dashboard/properties/${propertyId}/lots/${result.data.id}`);
        // } else {
        //   setError(result.error || 'Failed to create lot');
        // }

        // Temporary success simulation
        setTimeout(() => {
          resetForm();
          alert('Lot created successfully! (Backend integration pending)');
          router.push(`/dashboard/properties/${propertyId}`);
        }, 1000);
      } catch (err) {
        console.error('Lot creation error:', err);
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [formData, propertyId, resetForm, router]
  );

  // Handle step indicator clicks
  const handleStepClick = useCallback(
    (step: FormStep) => {
      setCurrentStep(step);
    },
    [setCurrentStep]
  );

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push(`/dashboard/properties/${propertyId}`)}
          className="text-sm text-gray-600 hover:text-gray-anthracite mb-4 flex items-center"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Property
        </button>
        <h1 className="text-3xl font-bold text-gray-anthracite mb-2">
          Add New Lot
        </h1>
        <p className="text-gray-600">
          Create a bookable unit within this property
        </p>
      </div>

      {/* Global Error Message */}
      {error && (
        <div
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-error mr-2 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-error font-medium">{error}</p>
          </div>
        </div>
      )}

      <Card className="p-6 md:p-8">
        {/* Step Indicator */}
        <div className="mb-8">
          <FormStepIndicator
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={handleStepClick}
          />
        </div>

        {/* Step Content */}
        <div className="mt-8">
          {currentStep === 1 && (
            <BasicInfoStep
              initialData={formData}
              onNext={handleBasicInfoNext}
              onAutoSave={handleAutoSave}
            />
          )}

          {currentStep === 2 && (
            <AmenitiesPricingStep
              initialData={formData}
              onNext={handleAmenitiesPricingNext}
              onBack={handleAmenitiesPricingBack}
              onAutoSave={handleAutoSave}
            />
          )}

          {currentStep === 3 && (
            <ImagesAvailabilityStep
              initialData={formData}
              onSubmit={handleFinalSubmit}
              onBack={handleImagesAvailabilityBack}
              onAutoSave={handleAutoSave}
              isLoading={isLoading}
            />
          )}
        </div>

        {/* Draft Indicator */}
        {draftId && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 flex items-center">
              <svg
                className="w-4 h-4 mr-1 text-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Draft auto-saved
            </p>
          </div>
        )}
      </Card>

      {/* Help Text */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Your progress is automatically saved as you fill out the form.
        </p>
      </div>
    </div>
  );
}
