'use client';

import { useState } from 'react';
import { LotCard } from './lot-card';
import { LotsEmpty } from './lots-empty';
import { DeleteLotModal } from './delete-lot-modal';

interface LotImage {
  id: string;
  storage_path: string;
  is_primary: boolean;
}

interface Lot {
  id: string;
  property_id: string;
  title: string;
  description?: string | null;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  base_price?: number | null;
  status?: string;
  lot_images?: LotImage[];
}

interface LotListProps {
  lots: Lot[];
  propertyId: string;
  propertyName?: string;
  view?: 'grid' | 'list';
}

export function LotList({
  lots,
  propertyId,
  propertyName,
  view = 'grid',
}: LotListProps) {
  const [deletingLotId, setDeletingLotId] = useState<string | null>(null);
  const [deletingLotTitle, setDeletingLotTitle] = useState<string>('');

  const handleDeleteClick = (lotId: string) => {
    const lot = lots.find(l => l.id === lotId);
    if (lot) {
      setDeletingLotId(lotId);
      setDeletingLotTitle(lot.title);
    }
  };

  const handleDeleteClose = () => {
    setDeletingLotId(null);
    setDeletingLotTitle('');
  };

  // Show empty state if no lots
  if (!lots || lots.length === 0) {
    return <LotsEmpty propertyId={propertyId} />;
  }

  return (
    <>
      <div
        className={
          view === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }
      >
        {lots.map((lot) => (
          <LotCard
            key={lot.id}
            lot={lot}
            propertyName={propertyName}
            onDelete={handleDeleteClick}
          />
        ))}
      </div>

      {/* Delete Modal */}
      {deletingLotId && (
        <DeleteLotModal
          lotId={deletingLotId}
          lotTitle={deletingLotTitle}
          propertyId={propertyId}
          isOpen={true}
          onClose={handleDeleteClose}
        />
      )}
    </>
  );
}
