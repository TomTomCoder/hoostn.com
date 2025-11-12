'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { usePropertyFormStore, type FormStep } from '@/lib/stores/propertyFormStore';
import { FormStepIndicator } from './components/FormStepIndicator';
import { BasicInfoStep } from './components/steps/BasicInfoStep';
import { AddressStep } from './components/steps/AddressStep';
import { ContactSettingsStep } from './components/steps/ContactSettingsStep';
import { createProperty } from '@/lib/actions/properties';
import { saveDraft } from '@/lib/actions/property-drafts';
import type {
  BasicInfoFormData,
  AddressFormData,
  ContactSettingsFormData,
  PropertyFormData,
} from '@/lib/validations/property';

export default function NewPropertyPage() {
  const router = useRouter();
  const {
    currentStep,
    formData,
    draftId,
    setCurrentStep,
    nextStep,
    previousStep,
    updateFormData,
    setDraftId,
    resetForm,
  } = usePropertyFormStore();

  const [completedSteps, setCompletedSteps] = useState<FormStep[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Auto-save handler (debounced in each step component)
  const handleAutoSave = useCallback(
    async (data: Partial<PropertyFormData>) => {
      try {
        // Save to store first
        updateFormData(data);

        // Then save to database
        const result = await saveDraft(data);

        if (result.success && result.data.draftId) {
          setDraftId(result.data.draftId);
        }
      } catch (err) {
        // Silent fail for auto-save to not disrupt user experience
        console.error('Auto-save failed:', err);
      }
    },
    [updateFormData, setDraftId]
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
  const handleAddressNext = useCallback(
    (data: AddressFormData) => {
      updateFormData(data);
      if (!completedSteps.includes(2)) {
        setCompletedSteps((prev) => [...prev, 2]);
      }
      nextStep();
    },
    [updateFormData, nextStep, completedSteps]
  );

  // Handle Step 2 back
  const handleAddressBack = useCallback(() => {
    previousStep();
  }, [previousStep]);

  // Handle Step 3 back
  const handleContactSettingsBack = useCallback(() => {
    previousStep();
  }, [previousStep]);

  // Handle final submission
  const handleFinalSubmit = useCallback(
    async (data: ContactSettingsFormData & { images: File[] }) => {
      setIsLoading(true);
      setError('');

      try {
        // Combine all form data
        const completeFormData = {
          ...formData,
          ...data,
        };

        // Create property
        const result = await createProperty(completeFormData);

        if (result.success && result.data?.id) {
          // Success - reset form and navigate
          resetForm();

          // Show success toast (placeholder - Agent 3 might provide toast component)
          console.log('Property created successfully!', result.data.id);

          // Navigate to property details page
          router.push(`/dashboard/properties/${result.data.id}`);
        } else {
          setError(result.error || 'Failed to create property');
        }
      } catch (err) {
        console.error('Property creation error:', err);
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [formData, resetForm, router]
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
        <h1 className="text-3xl font-bold text-gray-anthracite mb-2">
          Add New Property
        </h1>
        <p className="text-gray-600">
          Fill in the details below to add a new property to your listings
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
            <AddressStep
              initialData={formData}
              onNext={handleAddressNext}
              onBack={handleAddressBack}
              onAutoSave={handleAutoSave}
            />
          )}

          {currentStep === 3 && (
            <ContactSettingsStep
              initialData={formData}
              onSubmit={handleFinalSubmit}
              onBack={handleContactSettingsBack}
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
