/**
 * Property Form Store - Zustand store with localStorage persistence
 *
 * Manages multi-step property form state including:
 * - Current step (1-3)
 * - Form data across all steps
 * - Draft ID for auto-save
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PropertyFormData } from '@/lib/validations/property';

export type FormStep = 1 | 2 | 3;

interface PropertyFormState {
  // State
  currentStep: FormStep;
  formData: Partial<PropertyFormData>;
  draftId: string | null;

  // Actions
  setCurrentStep: (step: FormStep) => void;
  nextStep: () => void;
  previousStep: () => void;
  updateFormData: (data: Partial<PropertyFormData>) => void;
  setDraftId: (id: string | null) => void;
  resetForm: () => void;
}

const initialState = {
  currentStep: 1 as FormStep,
  formData: {},
  draftId: null,
};

export const usePropertyFormStore = create<PropertyFormState>()(
  persist(
    (set) => ({
      ...initialState,

      setCurrentStep: (step) => set({ currentStep: step }),

      nextStep: () =>
        set((state) => ({
          currentStep: Math.min(state.currentStep + 1, 3) as FormStep,
        })),

      previousStep: () =>
        set((state) => ({
          currentStep: Math.max(state.currentStep - 1, 1) as FormStep,
        })),

      updateFormData: (data) =>
        set((state) => ({
          formData: { ...state.formData, ...data },
        })),

      setDraftId: (id) => set({ draftId: id }),

      resetForm: () => set(initialState),
    }),
    {
      name: 'property-form-storage',
      // Only persist formData and draftId, not currentStep
      partialize: (state) => ({
        formData: state.formData,
        draftId: state.draftId,
      }),
    }
  )
);
