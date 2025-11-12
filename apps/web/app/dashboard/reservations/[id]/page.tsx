import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ReservationDetail } from './ReservationDetail';
import { getReservationById } from '@/lib/actions/reservations';

export const metadata: Metadata = {
  title: 'Reservation Details | Hoostn',
  description: 'View and manage reservation details',
};

interface PageProps {
  params: {
    id: string;
  };
}

export default async function ReservationDetailPage({ params }: PageProps) {
  const result = await getReservationById(params.id);

  if (!result.success) {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Suspense fallback={<div>Loading...</div>}>
        <ReservationDetail reservation={result.data} />
      </Suspense>
    </div>
  );
}
