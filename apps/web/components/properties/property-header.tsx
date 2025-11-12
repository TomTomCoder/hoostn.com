'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DeletePropertyModal } from './delete-property-modal';
import type { PropertyWithLots } from '@/lib/actions/properties';

interface PropertyHeaderProps {
  property: PropertyWithLots;
}

export function PropertyHeader({ property }: PropertyHeaderProps) {
  const router = useRouter();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const lotCount = property.lots?.length || 0;

  return (
    <>
      <div className="mb-6">
        {/* Breadcrumb */}
        <nav className="mb-4" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <Link
                href="/dashboard/properties"
                className="text-gray-600 hover:text-primary transition-colors"
              >
                Properties
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-anthracite font-medium truncate max-w-[200px] sm:max-w-none">
              {property.name}
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-anthracite mb-2 break-words">
              {property.name}
            </h1>
            <div className="flex items-start text-gray-600">
              <svg
                className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="break-words">
                {property.address}, {property.city}
                {property.country && property.country !== 'FR'
                  ? `, ${property.country}`
                  : ''}
              </span>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
            <Button
              variant="outline"
              size="md"
              onClick={() => router.push(`/dashboard/properties/${property.id}/edit`)}
              aria-label="Edit property"
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
              aria-label="Delete property"
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
                      router.push(`/dashboard/properties/${property.id}/edit`);
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
                    Edit Property
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
                    Delete Property
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <DeletePropertyModal
        propertyId={property.id}
        propertyName={property.name}
        lotCount={lotCount}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </>
  );
}
