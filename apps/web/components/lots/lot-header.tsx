'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DeleteLotModal } from './delete-lot-modal';

interface Property {
  id: string;
  name: string;
}

interface Lot {
  id: string;
  property_id: string;
  title: string;
  status?: string;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
}

interface LotHeaderProps {
  lot: Lot;
  property: Property;
}

export function LotHeader({ lot, property }: LotHeaderProps) {
  const router = useRouter();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Status badge color
  const statusColor =
    lot.status === 'active'
      ? 'bg-accent/10 text-accent'
      : lot.status === 'maintenance'
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-gray-200 text-gray-600';

  return (
    <>
      <div className="mb-6">
        {/* Breadcrumb */}
        <nav className="mb-4" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm flex-wrap">
            <li>
              <Link
                href="/dashboard/properties"
                className="text-gray-600 hover:text-primary transition-colors"
              >
                Properties
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li>
              <Link
                href={`/dashboard/properties/${property.id}`}
                className="text-gray-600 hover:text-primary transition-colors truncate max-w-[150px] inline-block"
              >
                {property.name}
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li>
              <Link
                href={`/dashboard/properties/${property.id}/lots`}
                className="text-gray-600 hover:text-primary transition-colors"
              >
                Lots
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-anthracite font-medium truncate max-w-[150px] inline-block">
              {lot.title}
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-3xl font-bold text-gray-anthracite break-words">
                {lot.title}
              </h1>
              {lot.status && (
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${statusColor}`}
                >
                  {lot.status}
                </span>
              )}
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-4 text-gray-600 flex-wrap">
              {lot.bedrooms > 0 && (
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  <span>{lot.bedrooms} bedroom{lot.bedrooms !== 1 ? 's' : ''}</span>
                </div>
              )}
              {lot.bathrooms > 0 && (
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                    />
                  </svg>
                  <span>{lot.bathrooms} bathroom{lot.bathrooms !== 1 ? 's' : ''}</span>
                </div>
              )}
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <span>Up to {lot.max_guests} guest{lot.max_guests !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
            <Link href={`/dashboard/properties/${lot.property_id}/lots`}>
              <Button
                variant="outline"
                size="md"
                aria-label="Back to lots"
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
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Lots
              </Button>
            </Link>
            <Button
              variant="outline"
              size="md"
              onClick={() =>
                router.push(`/dashboard/properties/${lot.property_id}/lots/${lot.id}/edit`)
              }
              aria-label="Edit lot"
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
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsDeleteModalOpen(true)}
              className="text-error hover:bg-red-50 border-error"
              aria-label="Delete lot"
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete
            </Button>
          </div>

          {/* Mobile Actions Menu */}
          <div className="sm:hidden relative">
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              aria-label="Open actions menu"
              aria-expanded={showMobileMenu}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </Button>

            {showMobileMenu && (
              <>
                {/* Overlay */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMobileMenu(false)}
                />

                {/* Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      router.push(`/dashboard/properties/${lot.property_id}/lots`);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center text-gray-anthracite rounded-t-lg"
                  >
                    <svg
                      className="w-5 h-5 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                      />
                    </svg>
                    Back to Lots
                  </button>
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      router.push(`/dashboard/properties/${lot.property_id}/lots/${lot.id}/edit`);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center text-gray-anthracite"
                  >
                    <svg
                      className="w-5 h-5 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Edit Lot
                  </button>
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      setIsDeleteModalOpen(true);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-red-50 flex items-center text-error rounded-b-lg"
                  >
                    <svg
                      className="w-5 h-5 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Delete Lot
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <DeleteLotModal
        lotId={lot.id}
        lotTitle={lot.title}
        propertyId={lot.property_id}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </>
  );
}
