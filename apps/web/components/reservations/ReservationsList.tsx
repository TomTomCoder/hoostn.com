'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Eye, X, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ReservationStatusBadge,
  PaymentStatusBadge,
} from './ReservationStatusBadge';
import type { ReservationWithLot } from '@/types/booking';

interface ReservationsListProps {
  reservations: ReservationWithLot[];
  onCancel?: (id: string) => void;
}

/**
 * Reservations list component
 * Displays reservations in a table format with actions
 */
export function ReservationsList({
  reservations,
  onCancel,
}: ReservationsListProps) {
  const [sortField, setSortField] = useState<'check_in' | 'created_at'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Sort reservations
  const sortedReservations = [...reservations].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    return aValue < bValue ? -1 * multiplier : 1 * multiplier;
  });

  // Toggle sort
  const handleSort = (field: 'check_in' | 'created_at') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Empty state
  if (reservations.length === 0) {
    return (
      <Card className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-anthracite mb-2">
            No reservations found
          </h3>
          <p className="text-gray-600">
            No reservations match your current filters. Try adjusting your search criteria.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Guest
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lot
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('check_in')}
              >
                Dates
                {sortField === 'check_in' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Guests
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedReservations.map((reservation) => (
              <tr
                key={reservation.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => (window.location.href = `/dashboard/reservations/${reservation.id}`)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {reservation.guest_name}
                    </div>
                    <div className="text-sm text-gray-500">{reservation.guest_email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{reservation.lot.title}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {format(new Date(reservation.check_in), 'MMM d, yyyy')}
                  </div>
                  <div className="text-sm text-gray-500">
                    to {format(new Date(reservation.check_out), 'MMM d, yyyy')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-900">
                    <Users className="w-4 h-4 mr-1 text-gray-400" />
                    {reservation.guests_count}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900">
                    ${reservation.total_price.toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <ReservationStatusBadge status={reservation.status} size="sm" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <PaymentStatusBadge status={reservation.payment_status} size="sm" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <Link
                      href={`/dashboard/reservations/${reservation.id}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                    {onCancel &&
                      !['cancelled', 'checked_out'].includes(reservation.status) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCancel(reservation.id);
                          }}
                        >
                          <X className="w-4 h-4 text-error" />
                        </Button>
                      )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-gray-200">
        {sortedReservations.map((reservation) => (
          <Link
            key={reservation.id}
            href={`/dashboard/reservations/${reservation.id}`}
            className="block p-4 hover:bg-gray-50"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-medium text-gray-900">
                  {reservation.guest_name}
                </div>
                <div className="text-sm text-gray-500">{reservation.lot.title}</div>
              </div>
              <div className="flex flex-col items-end space-y-1">
                <ReservationStatusBadge status={reservation.status} size="sm" />
                <PaymentStatusBadge status={reservation.payment_status} size="sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Check-in:</span>
                <div className="font-medium">
                  {format(new Date(reservation.check_in), 'MMM d, yyyy')}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Check-out:</span>
                <div className="font-medium">
                  {format(new Date(reservation.check_out), 'MMM d, yyyy')}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Guests:</span>
                <div className="font-medium">{reservation.guests_count}</div>
              </div>
              <div>
                <span className="text-gray-500">Total:</span>
                <div className="font-semibold">
                  ${reservation.total_price.toLocaleString()}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
