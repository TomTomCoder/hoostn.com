'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { List, Calendar, Search, Filter, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ReservationStatsCards } from '@/components/reservations/ReservationStats';
import { ReservationsList } from '@/components/reservations/ReservationsList';
import { ReservationsCalendar } from '@/components/reservations/ReservationsCalendar';
import {
  getReservations,
  getReservationStats,
  getPropertiesForFilter,
  cancelReservation,
} from '@/lib/actions/reservations';
import type {
  ReservationWithLot,
  ReservationStats,
  ReservationFilters,
  ReservationStatus,
  PaymentStatus,
} from '@/types/booking';

interface ReservationsContentProps {
  view: 'list' | 'calendar';
  filters: ReservationFilters;
}

export function ReservationsContent({ view, filters }: ReservationsContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // State
  const [reservations, setReservations] = useState<ReservationWithLot[]>([]);
  const [stats, setStats] = useState<ReservationStats>({
    totalReservations: 0,
    upcomingCheckIns: 0,
    pendingPayments: 0,
    pendingPaymentsAmount: 0,
    monthRevenue: 0,
  });
  const [properties, setProperties] = useState<
    Array<{ id: string; name: string; lots: Array<{ id: string; title: string }> }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Local filter state for form
  const [localFilters, setLocalFilters] = useState(filters);

  // Load data
  useEffect(() => {
    loadData();
  }, [JSON.stringify(filters)]);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      // Load reservations with filters
      const reservationsResult = await getReservations(filters);
      if (!reservationsResult.success) {
        setError(reservationsResult.error);
        return;
      }
      setReservations(reservationsResult.data);

      // Load stats
      const statsResult = await getReservationStats();
      if (statsResult.success) {
        setStats(statsResult.data);
      }

      // Load properties for filter
      const propertiesResult = await getPropertiesForFilter();
      if (propertiesResult.success) {
        setProperties(propertiesResult.data);
      }
    } catch (err) {
      setError('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  }

  // Handle view change
  const handleViewChange = (newView: 'list' | 'calendar') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', newView);
    router.push(`/dashboard/reservations?${params.toString()}`);
  };

  // Handle filter change
  const handleFilterChange = (key: string, value: string) => {
    setLocalFilters({ ...localFilters, [key]: value });
  };

  // Apply filters
  const applyFilters = () => {
    const params = new URLSearchParams();
    params.set('view', view);

    Object.entries(localFilters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.set(key, value);
      }
    });

    startTransition(() => {
      router.push(`/dashboard/reservations?${params.toString()}`);
    });
  };

  // Clear filters
  const clearFilters = () => {
    setLocalFilters({});
    router.push(`/dashboard/reservations?view=${view}`);
  };

  // Handle cancel reservation
  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }

    const result = await cancelReservation(id);
    if (result.success) {
      await loadData();
    } else {
      alert(result.error);
    }
  };

  const hasActiveFilters =
    filters.status ||
    filters.paymentStatus ||
    filters.search ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.propertyId ||
    filters.lotId;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-anthracite">Reservations</h2>
          <p className="text-gray-600 mt-1">Manage your property reservations</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={view === 'list' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => handleViewChange('list')}
          >
            <List className="w-4 h-4 mr-2" />
            List
          </Button>
          <Button
            variant={view === 'calendar' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => handleViewChange('calendar')}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Calendar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <ReservationStatsCards stats={stats} />

      {/* Filters */}
      <Card>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 bg-primary text-white text-xs rounded-full px-2 py-0.5">
                  Active
                </span>
              )}
            </button>
            {hasActiveFilters && (
              <button
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
                onClick={clearFilters}
              >
                <X className="w-4 h-4 mr-1" />
                Clear filters
              </button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Guest name or email..."
                    value={localFilters.search || ''}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={localFilters.status || 'all'}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="checked_in">Checked In</option>
                  <option value="checked_out">Checked Out</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Payment Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment
                </label>
                <select
                  value={localFilters.paymentStatus || 'all'}
                  onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Payments</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              {/* Property */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property
                </label>
                <select
                  value={localFilters.propertyId || 'all'}
                  onChange={(e) => handleFilterChange('propertyId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Properties</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date From */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={localFilters.dateFrom || ''}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={localFilters.dateTo || ''}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Apply Button */}
              <div className="flex items-end">
                <Button
                  variant="primary"
                  size="md"
                  onClick={applyFilters}
                  disabled={isPending}
                  className="w-full"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <div className="p-6">
            <div className="flex items-start">
              <svg
                className="w-6 h-6 text-error mr-3 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-error mb-1">
                  Error loading reservations
                </h3>
                <p className="text-sm text-gray-600">{error}</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-gray-600">Loading reservations...</p>
          </div>
        </Card>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {view === 'list' ? (
            <ReservationsList reservations={reservations} onCancel={handleCancel} />
          ) : (
            <ReservationsCalendar reservations={reservations} />
          )}
        </>
      )}
    </>
  );
}
