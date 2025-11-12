'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { usePropertyFormStore, type FormStep } from '@/lib/stores/propertyFormStore';
import { FormStepIndicator } from '../../new/components/FormStepIndicator';
import { BasicInfoStep } from '../../new/components/steps/BasicInfoStep';
import { AddressStep } from '../../new/components/steps/AddressStep';
import { ContactSettingsStep } from '../../new/components/steps/ContactSettingsStep';
import { updateProperty, getProperty } from '@/lib/actions/properties';
import type {
  BasicInfoFormData,
  AddressFormData,
  ContactSettingsFormData,
  PropertyFormData,
} from '@/lib/validations/property';

export default function EditPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;

  const {
    currentStep,
    formData,
    setCurrentStep,
    nextStep,
    previousStep,
    updateFormData,
    resetForm,
  } = usePropertyFormStore();

  const [completedSteps, setCompletedSteps] = useState<FormStep[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string>('');

  // Fetch existing property data on mount
  useEffect(() => {
    const fetchProperty = async () => {
      setIsFetching(true);
      setError('');

      try {
        const result = await getProperty(propertyId);

        if (result.success && result.data) {
          // Pre-fill the form with existing data
          updateFormData(result.data);
        } else {
          setError(result.error || 'Failed to load property');
        }
      } catch (err) {
        console.error('Error fetching property:', err);
        setError('An unexpected error occurred while loading the property');
      } finally {
        setIsFetching(false);
      }
    };

    if (propertyId) {
      fetchProperty();
    }

    // Cleanup on unmount
    return () => {
      resetForm();
    };
  }, [propertyId, updateFormData, resetForm]);

  // Auto-save is disabled for edit mode to prevent accidental overwrites
  const handleAutoSave = useCallback(() => {
    // Disabled for edit mode
  }, []);

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

        // Update property
        const result = await updateProperty(propertyId, completeFormData);

        if (result.success && result.data?.id) {
          // Success - reset form and navigate
          resetForm();

          // Show success toast (placeholder - Agent 3 might provide toast component)
          console.log('Property updated successfully!', result.data.id);

          // Navigate back to property details page
          router.push(`/dashboard/properties/${propertyId}`);
        } else {
          setError(result.error || 'Failed to update property');
        }
      } catch (err) {
        console.error('Property update error:', err);
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

  // Loading state
  if (isFetching) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center py-12">
            <svg
              className="animate-spin h-12 w-12 text-primary mb-4"
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
            <p className="text-gray-600">Loading property...</p>
          </div>
        </Card>
      </div>
    );
  }

  // Error state
  if (error && !formData.name) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center py-12">
            <svg
              className="w-16 h-16 text-error mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-xl font-semibold text-gray-anthracite mb-2">
              Failed to Load Property
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/dashboard/properties')}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              Back to Properties
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-anthracite mb-2">
          Edit Property
        </h1>
        <p className="text-gray-600">
          Update the details of your property listing
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
              submitButtonText="Update Property"
            />
          )}
        </div>
      </Card>

      {/* Cancel Button */}
      <div className="mt-6 text-center">
        <button
          onClick={() => router.push(`/dashboard/properties/${propertyId}`)}
          className="text-sm text-gray-600 hover:text-gray-anthracite transition-colors"
        >
          Cancel and return to property details
        </button>
      </div>
    </div>
  );
}
