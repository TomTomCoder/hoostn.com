'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createReservation } from '@/lib/actions/reservations';
import { guestInfoSchema } from '@/lib/validations/reservation';

// Form schema combines guest info with special requests
const bookingFormSchema = guestInfoSchema.extend({
  terms_accepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
});

type BookingFormData = z.infer<typeof bookingFormSchema>;

interface BookingFormProps {
  lotId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  onSuccess: (reservationId: string) => void;
}

export function BookingForm({
  lotId,
  checkIn,
  checkOut,
  guests,
  onSuccess,
}: BookingFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    mode: 'onBlur',
    defaultValues: {
      guest_name: '',
      guest_email: '',
      guest_phone: '',
      special_requests: '',
      terms_accepted: false,
    },
  });

  const formData = watch();

  const onSubmit = async (data: BookingFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await createReservation({
        lot_id: lotId,
        guest_name: data.guest_name,
        guest_email: data.guest_email,
        guest_phone: data.guest_phone,
        check_in: checkIn,
        check_out: checkOut,
        guests_count: guests,
        special_requests: data.special_requests || undefined,
      });

      if (result.success) {
        onSuccess(result.data.id);
      } else {
        setSubmitError(result.error);
        // If there are field errors, show them
        if (result.fieldErrors) {
          console.error('Field errors:', result.fieldErrors);
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-colors ${
                s === step
                  ? 'bg-primary text-white'
                  : s < step
                  ? 'bg-accent text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {s < step ? (
                <svg
                  className="w-6 h-6"
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
              ) : (
                s
              )}
            </div>
            {s < 3 && (
              <div
                className={`w-12 h-1 rounded transition-colors ${
                  s < step ? 'bg-accent' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1: Guest Information */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Guest Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Full Name"
                {...register('guest_name')}
                error={errors.guest_name?.message}
                placeholder="John Doe"
                required
              />

              <Input
                label="Email Address"
                type="email"
                {...register('guest_email')}
                error={errors.guest_email?.message}
                placeholder="john.doe@example.com"
                required
              />

              <Input
                label="Phone Number"
                type="tel"
                {...register('guest_phone')}
                error={errors.guest_phone?.message}
                placeholder="+1234567890"
                helperText="Include country code (e.g., +1 for US, +33 for France)"
                required
              />

              <Textarea
                label="Special Requests"
                {...register('special_requests')}
                error={errors.special_requests?.message}
                placeholder="Any special requests or requirements? (optional)"
                rows={4}
              />

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={
                    !formData.guest_name || !formData.guest_email || !formData.guest_phone
                  }
                >
                  Continue to Review
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Review Booking */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Review Your Booking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-bold text-gray-anthracite mb-4">Guest Details</h4>
                <div className="space-y-3 text-gray-600">
                  <div className="flex justify-between">
                    <span>Name:</span>
                    <span className="font-medium text-gray-anthracite">
                      {formData.guest_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Email:</span>
                    <span className="font-medium text-gray-anthracite">
                      {formData.guest_email}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phone:</span>
                    <span className="font-medium text-gray-anthracite">
                      {formData.guest_phone}
                    </span>
                  </div>
                  {formData.special_requests && (
                    <div>
                      <div className="text-gray-600 mb-1">Special Requests:</div>
                      <div className="font-medium text-gray-anthracite bg-gray-50 p-3 rounded-lg">
                        {formData.special_requests}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="button" onClick={() => setStep(3)} className="flex-1">
                  Continue to Terms
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Terms and Conditions */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Terms and Conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
                <h4 className="font-bold text-gray-anthracite mb-3">
                  Booking Terms & Conditions
                </h4>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>
                    <strong>1. Payment:</strong> Payment will be required to confirm your
                    reservation. You will receive payment instructions via email after
                    submitting this booking.
                  </p>
                  <p>
                    <strong>2. Cancellation:</strong> Cancellation policies vary by
                    property. Please contact us for details about cancellation terms.
                  </p>
                  <p>
                    <strong>3. Check-in/Check-out:</strong> Standard check-in time is 3:00
                    PM and check-out time is 11:00 AM unless otherwise specified.
                  </p>
                  <p>
                    <strong>4. House Rules:</strong> You agree to comply with all house
                    rules and local regulations during your stay.
                  </p>
                  <p>
                    <strong>5. Liability:</strong> The property owner is not responsible
                    for loss or damage to personal belongings.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  {...register('terms_accepted')}
                  id="terms_accepted"
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="terms_accepted" className="text-sm text-gray-600 flex-1">
                  I have read and agree to the terms and conditions
                  <span className="text-red-500 ml-1">*</span>
                </label>
              </div>
              {errors.terms_accepted && (
                <p className="text-sm text-red-600 -mt-3">
                  {errors.terms_accepted.message}
                </p>
              )}

              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                  <p className="font-medium">Error</p>
                  <p className="text-sm">{submitError}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting || !formData.terms_accepted}
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-5 w-5"
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
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Confirm Booking'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  );
}
