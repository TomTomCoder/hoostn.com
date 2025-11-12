'use client';

import React from 'react';
import { clsx } from 'clsx';
import type { FormStep } from '@/lib/stores/propertyFormStore';

interface FormStepIndicatorProps {
  currentStep: FormStep;
  completedSteps: FormStep[];
  onStepClick: (step: FormStep) => void;
}

const steps = [
  { number: 1, title: 'Basic Info', description: 'Property details' },
  { number: 2, title: 'Location', description: 'Address & map' },
  { number: 3, title: 'Contact & Settings', description: 'Final details' },
] as const;

export function FormStepIndicator({
  currentStep,
  completedSteps,
  onStepClick,
}: FormStepIndicatorProps) {
  return (
    <div className="w-full">
      {/* Desktop: Horizontal layout */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(step.number as FormStep);
            const isCurrent = currentStep === step.number;
            const isClickable = isCompleted && !isCurrent;

            return (
              <React.Fragment key={step.number}>
                {/* Step Circle */}
                <button
                  type="button"
                  onClick={() => isClickable && onStepClick(step.number as FormStep)}
                  disabled={!isClickable}
                  className={clsx(
                    'flex flex-col items-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg p-2 transition-all',
                    {
                      'cursor-pointer hover:scale-105': isClickable,
                      'cursor-default': !isClickable,
                    }
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={`${step.title}: ${
                    isCompleted ? 'completed' : isCurrent ? 'current' : 'upcoming'
                  }`}
                >
                  <div
                    className={clsx(
                      'w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg transition-colors mb-2',
                      {
                        'bg-primary text-white': isCurrent,
                        'bg-accent text-white': isCompleted && !isCurrent,
                        'bg-gray-200 text-gray-500': !isCompleted && !isCurrent,
                      }
                    )}
                  >
                    {isCompleted && !isCurrent ? (
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      step.number
                    )}
                  </div>
                  <div className="text-center">
                    <div
                      className={clsx('text-sm font-medium', {
                        'text-gray-anthracite': isCurrent || isCompleted,
                        'text-gray-500': !isCurrent && !isCompleted,
                      })}
                    >
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-500">{step.description}</div>
                  </div>
                </button>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className={clsx('flex-1 h-1 mx-4 rounded transition-colors', {
                      'bg-accent': completedSteps.includes(step.number as FormStep),
                      'bg-gray-200': !completedSteps.includes(step.number as FormStep),
                    })}
                    aria-hidden="true"
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Mobile: Vertical layout */}
      <div className="md:hidden space-y-4">
        {steps.map((step) => {
          const isCompleted = completedSteps.includes(step.number as FormStep);
          const isCurrent = currentStep === step.number;
          const isClickable = isCompleted && !isCurrent;

          return (
            <button
              key={step.number}
              type="button"
              onClick={() => isClickable && onStepClick(step.number as FormStep)}
              disabled={!isClickable}
              className={clsx(
                'w-full flex items-start p-4 rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                {
                  'border-primary bg-primary/5': isCurrent,
                  'border-accent bg-accent/5': isCompleted && !isCurrent,
                  'border-gray-200 bg-white': !isCompleted && !isCurrent,
                  'cursor-pointer': isClickable,
                  'cursor-default': !isClickable,
                }
              )}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <div
                className={clsx(
                  'w-10 h-10 rounded-full flex items-center justify-center font-semibold flex-shrink-0 transition-colors',
                  {
                    'bg-primary text-white': isCurrent,
                    'bg-accent text-white': isCompleted && !isCurrent,
                    'bg-gray-200 text-gray-500': !isCompleted && !isCurrent,
                  }
                )}
              >
                {isCompleted && !isCurrent ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              <div className="ml-4 text-left">
                <div
                  className={clsx('text-base font-medium', {
                    'text-gray-anthracite': isCurrent || isCompleted,
                    'text-gray-500': !isCurrent && !isCompleted,
                  })}
                >
                  {step.title}
                </div>
                <div className="text-sm text-gray-500">{step.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
