'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AmenitiesList } from './amenities-list';
import { PricingDisplay } from './pricing-display';
import { AvailabilityCalendar } from './availability-calendar';

interface LotImage {
  id: string;
  storage_path: string;
  filename: string;
  is_primary: boolean;
  display_order: number;
}

interface Amenity {
  id: string;
  name: string;
  category: string;
  icon?: string;
}

interface LotAmenity {
  amenity: Amenity;
  quantity: number;
  notes?: string | null;
}

interface PricingSeason {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  price_per_night: number;
  min_nights: number;
}

interface AvailabilityRule {
  id: string;
  start_date: string;
  end_date: string;
  rule_type: 'blocked' | 'price_override' | 'min_stay';
  price_per_night?: number | null;
  min_nights?: number | null;
  reason?: string | null;
}

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
}

interface Lot {
  id: string;
  property_id: string;
  title: string;
  description?: string | null;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  base_price: number;
  cleaning_fee?: number | null;
  tourist_tax?: number | null;
  pets_allowed: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

interface LotDetailsProps {
  lot: Lot;
  property: Property;
  images?: LotImage[];
  lotAmenities?: LotAmenity[];
  pricingSeasons?: PricingSeason[];
  availabilityRules?: AvailabilityRule[];
}

export function LotDetails({
  lot,
  property,
  images = [],
  lotAmenities = [],
  pricingSeasons = [],
  availabilityRules = [],
}: LotDetailsProps) {
  const [selectedImage, setSelectedImage] = useState<LotImage | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Sort images by display order
  const sortedImages = [...images].sort((a, b) => a.display_order - b.display_order);
  const primaryImage = sortedImages.find(img => img.is_primary) || sortedImages[0];

  return (
    <div className="space-y-6">
      {/* Image Gallery */}
      {sortedImages.length > 0 && (
        <Card>
          <CardContent className="p-0">
            {/* Main Image */}
            <div className="relative w-full h-96 bg-gray-200 rounded-t-lg overflow-hidden">
              <img
                src={`/api/images/${primaryImage.storage_path}`}
                alt={lot.title}
                className="w-full h-full object-cover"
              />
              {sortedImages.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                  {sortedImages.length} photo{sortedImages.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {sortedImages.length > 1 && (
              <div className="p-4">
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {sortedImages.map((image) => (
                    <button
                      key={image.id}
                      onClick={() => setSelectedImage(image)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        image.id === primaryImage.id
                          ? 'border-primary'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={`/api/images/${image.storage_path}`}
                        alt={image.filename}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 whitespace-pre-wrap">
            {lot.description || 'No description provided'}
          </p>
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Lot Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Property
              </label>
              <Link
                href={`/dashboard/properties/${property.id}`}
                className="flex items-center text-primary hover:underline"
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
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span>{property.name}</span>
              </Link>
              <p className="text-sm text-gray-500 mt-1">
                {property.address}, {property.city}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Status
              </label>
              <span
                className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                  lot.status === 'active'
                    ? 'bg-accent/10 text-accent'
                    : lot.status === 'maintenance'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {lot.status}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Bedrooms
              </label>
              <p className="text-gray-anthracite font-medium">{lot.bedrooms}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Bathrooms
              </label>
              <p className="text-gray-anthracite font-medium">{lot.bathrooms}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Maximum Guests
              </label>
              <p className="text-gray-anthracite font-medium">{lot.max_guests}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Pets Allowed
              </label>
              <div className="flex items-center">
                {lot.pets_allowed ? (
                  <svg
                    className="w-5 h-5 text-accent mr-2"
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
                ) : (
                  <svg
                    className="w-5 h-5 text-error mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
                <span className="text-gray-anthracite font-medium">
                  {lot.pets_allowed ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Amenities */}
      <Card>
        <CardHeader>
          <CardTitle>Amenities</CardTitle>
        </CardHeader>
        <CardContent>
          <AmenitiesList lotAmenities={lotAmenities} expandedByDefault={true} />
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <PricingDisplay
            basePrice={lot.base_price}
            cleaningFee={lot.cleaning_fee}
            touristTax={lot.tourist_tax}
            pricingSeasons={pricingSeasons}
          />
        </CardContent>
      </Card>

      {/* Availability */}
      <Card>
        <CardHeader>
          <CardTitle>Availability Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <AvailabilityCalendar
            availabilityRules={availabilityRules}
            readOnly={true}
          />
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-gray-600 mb-1">Created</label>
              <p className="text-gray-anthracite font-medium">
                {formatDate(lot.created_at)}
              </p>
            </div>
            <div>
              <label className="block text-gray-600 mb-1">Last Updated</label>
              <p className="text-gray-anthracite font-medium">
                {formatDate(lot.updated_at)}
              </p>
            </div>
            <div>
              <label className="block text-gray-600 mb-1">Lot ID</label>
              <p className="text-gray-anthracite font-mono text-xs break-all">
                {lot.id}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
