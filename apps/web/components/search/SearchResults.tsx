'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import type { SearchResult } from '@/types/search';

interface SearchResultsProps {
  results: SearchResult[];
  isLoading?: boolean;
}

export function SearchResults({ results, isLoading = false }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 h-64 rounded-2xl mb-4" />
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <svg
            className="mx-auto h-24 w-24 text-gray-300 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <h3 className="text-2xl font-semibold text-gray-anthracite mb-2">
            No results found
          </h3>
          <p className="text-gray-600">
            Try adjusting your search criteria or filters to find more options.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {results.map((lot) => (
        <LotCard key={lot.id} lot={lot} />
      ))}
    </div>
  );
}

interface LotCardProps {
  lot: SearchResult;
}

function LotCard({ lot }: LotCardProps) {
  const imageUrl = lot.primary_image_url || '/placeholder-property.jpg';

  return (
    <Link href={`/lots/${lot.id}`} className="block group">
      <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
        {/* Image */}
        <div className="relative h-64 overflow-hidden">
          <Image
            src={imageUrl}
            alt={lot.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {lot.is_available === false && (
            <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              Not Available
            </div>
          )}
          {lot.is_available === true && (
            <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              Available
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Property Name & City */}
          <div className="text-sm text-gray-600 mb-1">
            {lot.property.name} • {lot.property.city}, {lot.property.country}
          </div>

          {/* Lot Title */}
          <h3 className="text-lg font-semibold text-gray-anthracite mb-2 line-clamp-1">
            {lot.title}
          </h3>

          {/* Features */}
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
            <div className="flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span>{lot.bedrooms} bed</span>
            </div>
            <div className="flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <span>{lot.max_guests} guests</span>
            </div>
            {lot.pets_allowed && (
              <div className="flex items-center gap-1 text-primary">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 12a6 6 0 100-12 6 6 0 000 12z" />
                </svg>
                <span>Pets OK</span>
              </div>
            )}
          </div>

          {/* Amenities Preview */}
          {lot.amenities.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-1">
                {lot.amenities.slice(0, 4).map((amenity) => (
                  <span
                    key={amenity.id}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                  >
                    {amenity.name}
                  </span>
                ))}
                {lot.amenity_count > 4 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                    +{lot.amenity_count - 4} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-2 pt-3 border-t">
            <span className="text-2xl font-bold text-primary">
              €{lot.base_price}
            </span>
            <span className="text-sm text-gray-600">/ night</span>
          </div>
          {(lot.cleaning_fee > 0 || lot.tourist_tax > 0) && (
            <div className="text-xs text-gray-500 mt-1">
              {lot.cleaning_fee > 0 && `+€${lot.cleaning_fee} cleaning`}
              {lot.cleaning_fee > 0 && lot.tourist_tax > 0 && ', '}
              {lot.tourist_tax > 0 && `€${lot.tourist_tax} tax`}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  hasMore,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | string)[] = [];
  const maxPagesToShow = 7;

  if (totalPages <= maxPagesToShow) {
    // Show all pages
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Show first page, last page, current page and neighbors
    pages.push(1);

    if (currentPage > 3) {
      pages.push('...');
    }

    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('...');
    }

    pages.push(totalPages);
  }

  return (
    <div className="flex justify-center items-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        Previous
      </button>

      <div className="flex gap-1">
        {pages.map((page, index) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${index}`} className="px-3 py-2">
                ...
              </span>
            );
          }

          return (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={`px-4 py-2 rounded-lg ${
                currentPage === page
                  ? 'bg-primary text-white'
                  : 'border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasMore}
        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        Next
      </button>
    </div>
  );
}
