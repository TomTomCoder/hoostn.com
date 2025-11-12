import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

interface LotDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata: Metadata = {
  title: 'Lot Details | Hoostn',
  description: 'View lot details and book your stay.',
};

export default async function LotDetailPage({ params }: LotDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch lot details (public access via RLS policies)
  const { data: lot, error } = await supabase
    .from('lots')
    .select(
      `
      *,
      properties (
        id,
        name,
        city,
        country,
        address,
        description
      ),
      lot_images (
        id,
        storage_path,
        is_primary,
        alt_text,
        display_order
      ),
      lot_amenities (
        amenities (
          id,
          name,
          category,
          icon
        )
      )
    `
    )
    .eq('id', id)
    .eq('status', 'active')
    .single();

  if (error || !lot) {
    notFound();
  }

  const property = Array.isArray(lot.properties) ? lot.properties[0] : lot.properties;
  const images = Array.isArray(lot.lot_images)
    ? lot.lot_images.sort((a: { display_order: number }, b: { display_order: number }) =>
        a.display_order - b.display_order
      )
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="text-2xl font-bold text-primary">
              Hoostn
            </a>
            <nav className="flex gap-4">
              <a
                href="/search"
                className="px-4 py-2 text-gray-anthracite hover:text-primary transition-colors"
              >
                Search
              </a>
              <a
                href="/login"
                className="px-4 py-2 text-gray-anthracite hover:text-primary transition-colors"
              >
                Sign In
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <a
            href="/search"
            className="inline-flex items-center gap-2 text-primary hover:text-primary-dark mb-6"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to search
          </a>

          {/* Lot Title */}
          <h1 className="text-4xl font-bold text-gray-anthracite mb-2">
            {lot.title}
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            {property.name} • {property.city}, {property.country}
          </p>

          {/* Images */}
          {images.length > 0 && (
            <div className="mb-8 rounded-2xl overflow-hidden">
              <img
                src={
                  images.find((img: { is_primary: boolean }) => img.is_primary)
                    ?.storage_path || images[0]?.storage_path
                }
                alt={lot.title}
                className="w-full h-96 object-cover"
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Key Features */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-anthracite mb-4">
                  Features
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🛏️</span>
                    <div>
                      <p className="font-semibold">{lot.bedrooms} Bedrooms</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🚿</span>
                    <div>
                      <p className="font-semibold">{lot.bathrooms} Bathrooms</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">👥</span>
                    <div>
                      <p className="font-semibold">Up to {lot.max_guests} Guests</p>
                    </div>
                  </div>
                  {lot.pets_allowed && (
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🐾</span>
                      <div>
                        <p className="font-semibold">Pets Allowed</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {lot.description && (
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <h2 className="text-2xl font-bold text-gray-anthracite mb-4">
                    About this place
                  </h2>
                  <p className="text-gray-600 whitespace-pre-line">
                    {lot.description}
                  </p>
                </div>
              )}

              {/* Amenities */}
              {Array.isArray(lot.lot_amenities) && lot.lot_amenities.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <h2 className="text-2xl font-bold text-gray-anthracite mb-4">
                    Amenities
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {lot.lot_amenities.map((la: { amenities: { id: string; name: string } }) => (
                      <div key={la.amenities.id} className="flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-primary"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-gray-700">{la.amenities.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Booking Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-4">
                <div className="mb-6">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-bold text-primary">
                      €{lot.base_price}
                    </span>
                    <span className="text-gray-600">/ night</span>
                  </div>
                  {(lot.cleaning_fee > 0 || lot.tourist_tax > 0) && (
                    <div className="text-sm text-gray-600">
                      {lot.cleaning_fee > 0 && `+€${lot.cleaning_fee} cleaning fee`}
                      {lot.cleaning_fee > 0 && lot.tourist_tax > 0 && ' • '}
                      {lot.tourist_tax > 0 && `€${lot.tourist_tax} tourist tax`}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <p className="text-gray-600 text-sm">
                    To book this property, please sign in or create an account.
                  </p>
                  <a
                    href="/login"
                    className="block w-full px-6 py-3 bg-primary text-white text-center rounded-2xl hover:bg-primary-dark transition-colors font-medium"
                  >
                    Sign In to Book
                  </a>
                  <a
                    href="/signup"
                    className="block w-full px-6 py-3 bg-white text-primary border-2 border-primary text-center rounded-2xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Create Account
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
