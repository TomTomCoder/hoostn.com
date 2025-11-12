/**
 * Lot Form Store - Zustand store with localStorage persistence
 *
 * Manages multi-step lot form state including:
 * - Current step (1-3)
 * - Form data across all steps
 * - Draft ID for auto-save
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LotFormData } from '@/lib/validations/lot';

export type FormStep = 1 | 2 | 3;

interface LotFormState {
  // State
  currentStep: FormStep;
  formData: Partial<LotFormData>;
  draftId: string | null;
  propertyId: string | null;

  // Actions
  setPropertyId: (id: string) => void;
  setCurrentStep: (step: FormStep) => void;
  nextStep: () => void;
  previousStep: () => void;
  updateFormData: (data: Partial<LotFormData>) => void;
  setDraftId: (id: string | null) => void;
  resetForm: () => void;
}

const initialState = {
  currentStep: 1 as FormStep,
  formData: {},
  draftId: null,
  propertyId: null,
};

export const useLotFormStore = create<LotFormState>()(
  persist(
    (set) => ({
      ...initialState,

      setPropertyId: (id) => set({ propertyId: id }),

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
      name: 'lot-form-storage',
      // Only persist formData, draftId, and propertyId, not currentStep
      partialize: (state) => ({
        formData: state.formData,
        draftId: state.draftId,
        propertyId: state.propertyId,
      }),
    }
  )
);
