'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Mail,
  Phone,
  Users,
  Calendar,
  MapPin,
  DollarSign,
  CheckCircle,
  XCircle,
  Printer,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ReservationStatusBadge,
  PaymentStatusBadge,
} from '@/components/reservations/ReservationStatusBadge';
import {
  updateReservationStatus,
  updatePaymentStatus,
  cancelReservation,
} from '@/lib/actions/reservations';
import type {
  ReservationWithDetails,
  ReservationStatus,
  PaymentStatus,
} from '@/types/booking';

interface ReservationDetailProps {
  reservation: ReservationWithDetails;
}

export function ReservationDetail({ reservation: initialReservation }: ReservationDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [reservation, setReservation] = useState(initialReservation);
  const [error, setError] = useState<string | null>(null);

  // Calculate nights
  const checkIn = new Date(reservation.check_in);
  const checkOut = new Date(reservation.check_out);
  const nights = Math.ceil(
    (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Handle status change
  const handleStatusChange = async (newStatus: ReservationStatus) => {
    setError(null);
    startTransition(async () => {
      const result = await updateReservationStatus(reservation.id, newStatus);
      if (result.success) {
        setReservation({ ...reservation, ...result.data });
      } else {
        setError(result.error);
        alert(result.error);
      }
    });
  };

  // Handle payment status change
  const handlePaymentStatusChange = async (newStatus: PaymentStatus) => {
    setError(null);
    startTransition(async () => {
      const result = await updatePaymentStatus(reservation.id, newStatus);
      if (result.success) {
        setReservation({ ...reservation, ...result.data });
      } else {
        setError(result.error);
        alert(result.error);
      }
    });
  };

  // Handle cancel
  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this reservation? This action cannot be undone.')) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await cancelReservation(reservation.id);
      if (result.success) {
        setReservation({ ...reservation, ...result.data });
      } else {
        setError(result.error);
        alert(result.error);
      }
    });
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Get valid status transitions
  const getValidStatusTransitions = (): ReservationStatus[] => {
    const transitions: Record<ReservationStatus, ReservationStatus[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['checked_in', 'cancelled'],
      checked_in: ['checked_out'],
      checked_out: [],
      cancelled: [],
    };
    return transitions[reservation.status];
  };

  const validTransitions = getValidStatusTransitions();
  const canCancel = !['cancelled', 'checked_out'].includes(reservation.status);

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/reservations">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold text-gray-anthracite">
              Reservation Details
            </h2>
            <p className="text-gray-600 mt-1">
              ID: {reservation.id.substring(0, 8)}...
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-start">
              <XCircle className="w-5 h-5 text-error mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-error mb-1">Error</h3>
                <p className="text-sm text-gray-600">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Guest Information */}
          <Card>
            <CardHeader>
              <CardTitle>Guest Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Name
                  </label>
                  <div className="text-base font-medium text-gray-900">
                    {reservation.guest_name}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Email
                  </label>
                  <a
                    href={`mailto:${reservation.guest_email}`}
                    className="text-base text-primary hover:underline flex items-center"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    {reservation.guest_email}
                  </a>
                </div>
                {reservation.guest_phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Phone
                    </label>
                    <a
                      href={`tel:${reservation.guest_phone}`}
                      className="text-base text-primary hover:underline flex items-center"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      {reservation.guest_phone}
                    </a>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Number of Guests
                  </label>
                  <div className="text-base font-medium text-gray-900 flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    {reservation.guests_count}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reservation Details */}
          <Card>
            <CardHeader>
              <CardTitle>Reservation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Check-in
                  </label>
                  <div className="text-base font-medium text-gray-900 flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {format(checkIn, 'EEEE, MMMM d, yyyy')}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Check-out
                  </label>
                  <div className="text-base font-medium text-gray-900 flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {format(checkOut, 'EEEE, MMMM d, yyyy')}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Number of Nights
                  </label>
                  <div className="text-base font-medium text-gray-900">{nights}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Created
                  </label>
                  <div className="text-base font-medium text-gray-900">
                    {format(new Date(reservation.created_at), 'MMM d, yyyy')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Property & Lot Information */}
          <Card>
            <CardHeader>
              <CardTitle>Property & Lot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Property
                </label>
                <div className="text-base font-medium text-gray-900">
                  {reservation.property.name}
                </div>
                <div className="text-sm text-gray-600 flex items-center mt-1">
                  <MapPin className="w-4 h-4 mr-2" />
                  {reservation.property.address}, {reservation.property.city}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Lot
                </label>
                <div className="text-base font-medium text-gray-900">
                  {reservation.lot.title}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {reservation.lot.bedrooms} bed • {reservation.lot.bathrooms} bath •
                  Max {reservation.lot.max_guests} guests
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Price Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Price Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-base">
                  <span className="text-gray-600">Total Amount</span>
                  <span className="font-semibold text-gray-900 flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    {reservation.total_price.toLocaleString()}
                  </span>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">
                      ${reservation.total_price.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Reservation Status
                </label>
                <ReservationStatusBadge status={reservation.status} size="md" />
                {validTransitions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <label className="block text-xs font-medium text-gray-600">
                      Update to:
                    </label>
                    {validTransitions.map((status) => (
                      <Button
                        key={status}
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(status)}
                        disabled={isPending}
                        className="w-full"
                      >
                        {status === 'confirmed' && 'Confirm Reservation'}
                        {status === 'checked_in' && 'Check In'}
                        {status === 'checked_out' && 'Check Out'}
                        {status === 'cancelled' && 'Cancel'}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Payment Status
                </label>
                <PaymentStatusBadge status={reservation.payment_status} size="md" />
                {reservation.payment_status === 'pending' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handlePaymentStatusChange('paid')}
                    disabled={isPending}
                    className="w-full mt-3"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Paid
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions Card */}
          {canCancel && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-error">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Cancel this reservation. This action cannot be undone.
                </p>
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleCancel}
                  disabled={isPending}
                  className="w-full border-error text-error hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Reservation
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Booking Channel */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Channel
                </label>
                <div className="text-base font-medium text-gray-900 capitalize">
                  {reservation.channel}
                </div>
              </div>
              {reservation.external_id && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    External ID
                  </label>
                  <div className="text-base font-medium text-gray-900">
                    {reservation.external_id}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
