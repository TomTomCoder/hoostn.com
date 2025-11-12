import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { BookingPageClient } from './BookingPageClient';

interface PageProps {
  params: {
    lotId: string;
  };
  searchParams: {
    checkIn?: string;
    checkOut?: string;
    guests?: string;
  };
}

/**
 * Get public lot details (no authentication required)
 */
async function getPublicLot(lotId: string) {
  const supabase = await createClient();

  const { data: lot, error } = await supabase
    .from('lots')
    .select(
      `
      id,
      title,
      base_price,
      cleaning_fee,
      tourist_tax,
      max_guests,
      status,
      lot_images (
        id,
        storage_path,
        is_primary,
        display_order
      )
    `
    )
    .eq('id', lotId)
    .eq('status', 'active')
    .single();

  if (error || !lot) {
    return null;
  }

  // Find primary image
  const images = Array.isArray(lot.lot_images) ? lot.lot_images : [];
  const sortedImages = images.sort(
    (a: any, b: any) => a.display_order - b.display_order
  );
  const primaryImage = sortedImages.find((img: any) => img.is_primary) || sortedImages[0];

  return {
    ...lot,
    primary_image_path: primaryImage?.storage_path || null,
  };
}

/**
 * Validate date format (YYYY-MM-DD)
 */
function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Calculate price breakdown
 */
function calculatePriceBreakdown(
  checkIn: string,
  checkOut: string,
  nightlyRate: number,
  cleaningFee: number,
  touristTax: number,
  guests: number
) {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const nights = Math.ceil(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const accommodationTotal = nights * nightlyRate;
  const totalTouristTax = touristTax * guests * nights;
  const total = accommodationTotal + cleaningFee + totalTouristTax;

  return {
    nights,
    nightlyRate,
    accommodationTotal: Math.round(accommodationTotal * 100) / 100,
    cleaningFee: Math.round(cleaningFee * 100) / 100,
    touristTax: Math.round(totalTouristTax * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const lot = await getPublicLot(params.lotId);

  if (!lot) {
    return {
      title: 'Lot Not Found | Hoostn',
    };
  }

  return {
    title: `Book ${lot.title} | Hoostn`,
    description: `Complete your booking for ${lot.title}`,
  };
}

export default async function BookingPage({ params, searchParams }: PageProps) {
  const lot = await getPublicLot(params.lotId);

  // Handle lot not found
  if (!lot) {
    notFound();
  }

  // Validate required query parameters
  const { checkIn, checkOut, guests: guestsParam } = searchParams;

  if (!checkIn || !checkOut || !guestsParam) {
    // Redirect back to lot page if parameters are missing
    redirect(`/lots/${params.lotId}`);
  }

  // Validate date formats
  if (!isValidDate(checkIn) || !isValidDate(checkOut)) {
    redirect(`/lots/${params.lotId}`);
  }

  // Validate dates
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (checkInDate < today) {
    redirect(`/lots/${params.lotId}`);
  }

  if (checkOutDate <= checkInDate) {
    redirect(`/lots/${params.lotId}`);
  }

  // Validate guests
  const guests = parseInt(guestsParam, 10);
  if (isNaN(guests) || guests < 1 || guests > lot.max_guests) {
    redirect(`/lots/${params.lotId}`);
  }

  // Validate pricing is configured
  if (!lot.base_price || lot.base_price <= 0) {
    redirect(`/lots/${params.lotId}`);
  }

  // Calculate price breakdown
  const priceBreakdown = calculatePriceBreakdown(
    checkIn,
    checkOut,
    lot.base_price,
    lot.cleaning_fee || 0,
    lot.tourist_tax || 0,
    guests
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="text-2xl font-bold text-primary">
            Hoostn
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href={`/lots/${params.lotId}`}
            className="inline-flex items-center text-gray-600 hover:text-gray-anthracite transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
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
            Back to lot details
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-anthracite mb-8">
          Complete Your Booking
        </h1>

        <BookingPageClient
          lotId={params.lotId}
          lot={{
            id: lot.id,
            title: lot.title,
            primary_image_path: lot.primary_image_path,
          }}
          checkIn={checkIn}
          checkOut={checkOut}
          guests={guests}
          priceBreakdown={priceBreakdown}
        />
      </main>

      {/* Footer */}
      <footer className="bg-gray-anthracite text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-sm">
              &copy; {new Date().getFullYear()} Hoostn. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
