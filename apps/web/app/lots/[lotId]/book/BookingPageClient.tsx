'use client';

import { useRouter } from 'next/navigation';
import { BookingForm } from '@/components/booking/BookingForm';
import { BookingSummary } from '@/components/booking/BookingSummary';

interface BookingPageClientProps {
  lotId: string;
  lot: {
    id: string;
    title: string;
    primary_image_path: string | null;
  };
  checkIn: string;
  checkOut: string;
  guests: number;
  priceBreakdown: {
    nights: number;
    nightlyRate: number;
    accommodationTotal: number;
    cleaningFee: number;
    touristTax: number;
    total: number;
  };
}

export function BookingPageClient({
  lotId,
  lot,
  checkIn,
  checkOut,
  guests,
  priceBreakdown,
}: BookingPageClientProps) {
  const router = useRouter();

  const handleBookingSuccess = (reservationId: string) => {
    // Redirect to confirmation page
    router.push(`/lots/${lotId}/book/confirmation?reservationId=${reservationId}`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column - Booking Form */}
      <div className="lg:col-span-2">
        <BookingForm
          lotId={lotId}
          checkIn={checkIn}
          checkOut={checkOut}
          guests={guests}
          onSuccess={handleBookingSuccess}
        />
      </div>

      {/* Right Column - Booking Summary */}
      <div className="lg:col-span-1">
        <BookingSummary
          lot={lot}
          checkIn={checkIn}
          checkOut={checkOut}
          guests={guests}
          priceBreakdown={priceBreakdown}
        />
      </div>
    </div>
  );
}
