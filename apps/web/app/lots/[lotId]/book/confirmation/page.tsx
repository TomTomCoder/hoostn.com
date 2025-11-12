import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PageProps {
  params: {
    lotId: string;
  };
  searchParams: {
    reservationId?: string;
  };
}

/**
 * Get reservation details (public - using reservation ID)
 */
async function getReservationById(reservationId: string) {
  const supabase = await createClient();

  const { data: reservation, error } = await supabase
    .from('reservations')
    .select(
      `
      id,
      lot_id,
      guest_name,
      guest_email,
      guest_phone,
      check_in,
      check_out,
      guests_count,
      total_price,
      status,
      payment_status,
      created_at,
      lot:lots (
        id,
        title,
        lot_images (
          storage_path,
          is_primary,
          display_order
        )
      )
    `
    )
    .eq('id', reservationId)
    .single();

  if (error || !reservation) {
    return null;
  }

  // Find primary image
  const images = Array.isArray(reservation.lot?.lot_images)
    ? reservation.lot.lot_images
    : [];
  const sortedImages = images.sort((a: any, b: any) => a.display_order - b.display_order);
  const primaryImage = sortedImages.find((img: any) => img.is_primary) || sortedImages[0];

  return {
    ...reservation,
    lot: {
      ...reservation.lot,
      primary_image_path: primaryImage?.storage_path || null,
    },
  };
}

export const metadata: Metadata = {
  title: 'Booking Confirmed | Hoostn',
  description: 'Your reservation has been confirmed',
};

export default async function ConfirmationPage({ params, searchParams }: PageProps) {
  const { reservationId } = searchParams;

  // Redirect if no reservation ID
  if (!reservationId) {
    redirect(`/lots/${params.lotId}`);
  }

  const reservation = await getReservationById(reservationId);

  // Handle reservation not found
  if (!reservation) {
    notFound();
  }

  // Verify lot ID matches
  if (reservation.lot_id !== params.lotId) {
    notFound();
  }

  // Format dates for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // Calculate nights
  const checkInDate = new Date(reservation.check_in);
  const checkOutDate = new Date(reservation.check_out);
  const nights = Math.ceil(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
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
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-accent rounded-full mb-4">
            <svg
              className="w-10 h-10 text-white"
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
          </div>
          <h1 className="text-4xl font-bold text-gray-anthracite mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-lg text-gray-600">
            Your reservation has been successfully created
          </p>
        </div>

        {/* Reservation Details Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Reservation Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Reservation ID */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Reservation ID</div>
              <div className="font-mono font-bold text-gray-anthracite">
                {reservation.id}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Save this ID for your records
              </div>
            </div>

            {/* Lot Details */}
            <div className="flex items-start gap-4">
              {reservation.lot.primary_image_path && (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={`/api/images/${reservation.lot.primary_image_path}`}
                    alt={reservation.lot.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg text-gray-anthracite mb-1">
                  {reservation.lot.title}
                </h3>
                <div className="text-gray-600">
                  {nights} night{nights !== 1 ? 's' : ''} • {reservation.guests_count}{' '}
                  guest{reservation.guests_count !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Check-in</div>
                <div className="font-medium text-gray-anthracite">
                  {formatDate(reservation.check_in)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Check-out</div>
                <div className="font-medium text-gray-anthracite">
                  {formatDate(reservation.check_out)}
                </div>
              </div>
            </div>

            {/* Guest Info */}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="font-bold text-gray-anthracite mb-3">Guest Information</h4>
              <div className="space-y-2 text-gray-600">
                <div className="flex justify-between">
                  <span>Name:</span>
                  <span className="font-medium text-gray-anthracite">
                    {reservation.guest_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Email:</span>
                  <span className="font-medium text-gray-anthracite">
                    {reservation.guest_email}
                  </span>
                </div>
                {reservation.guest_phone && (
                  <div className="flex justify-between">
                    <span>Phone:</span>
                    <span className="font-medium text-gray-anthracite">
                      {reservation.guest_phone}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Total Price */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-anthracite">
                  Total Price
                </span>
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(reservation.total_price)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>What Happens Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-anthracite mb-1">
                    Check Your Email
                  </h4>
                  <p className="text-gray-600 text-sm">
                    We've sent a confirmation email to <strong>{reservation.guest_email}</strong> with all your reservation details.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-anthracite mb-1">
                    Complete Payment
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Payment instructions will be sent to your email shortly. Your reservation
                    will be confirmed once payment is received.
                  </p>
                  <div className="mt-2 bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded-lg text-sm">
                    <strong>Status:</strong> Payment Pending
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-anthracite mb-1">
                    Prepare for Your Stay
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Once payment is confirmed, you'll receive check-in instructions and
                    contact information for the property.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Card */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="text-center">
              <h4 className="font-bold text-gray-anthracite mb-2">Need Help?</h4>
              <p className="text-gray-600 text-sm mb-4">
                If you have any questions about your reservation, please contact us.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href={`mailto:reservations@hoostn.com?subject=Reservation ${reservation.id}`}
                >
                  <Button variant="outline">
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
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    Email Support
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href={`/lots/${params.lotId}`} className="flex-1">
            <Button variant="outline" className="w-full">
              View Lot Details
            </Button>
          </Link>
          <Link href="/" className="flex-1">
            <Button variant="primary" className="w-full">
              Browse More Lots
            </Button>
          </Link>
        </div>
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
