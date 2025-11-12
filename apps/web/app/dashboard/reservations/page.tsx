import { Suspense } from 'react';
import { Metadata } from 'next';
import { ReservationsContent } from './ReservationsContent';

export const metadata: Metadata = {
  title: 'Reservations | Hoostn',
  description: 'Manage your property reservations',
};

interface PageProps {
  searchParams: {
    view?: 'list' | 'calendar';
    status?: string;
    paymentStatus?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    propertyId?: string;
    lotId?: string;
  };
}

export default async function ReservationsPage({ searchParams }: PageProps) {
  const view = searchParams.view || 'list';
  const filters = {
    status: searchParams.status,
    paymentStatus: searchParams.paymentStatus,
    search: searchParams.search,
    dateFrom: searchParams.dateFrom,
    dateTo: searchParams.dateTo,
    propertyId: searchParams.propertyId,
    lotId: searchParams.lotId,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Suspense fallback={<div>Loading...</div>}>
        <ReservationsContent view={view} filters={filters} />
      </Suspense>
    </div>
  );
}
