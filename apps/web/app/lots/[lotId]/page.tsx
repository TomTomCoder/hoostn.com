import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  MapPin,
  Bed,
  Bath,
  Users,
  PawPrint,
  Star,
  DollarSign,
  Wifi,
  Tv,
  Wind,
  UtensilsCrossed,
  Droplet,
  TreePine,
} from 'lucide-react';
import { getPublicLotById } from '@/lib/actions/availability';
import { PublicLotGallery } from '@/components/lots/PublicLotGallery';
import { BookingWidget } from '@/components/booking/BookingWidget';
import type { AmenityCategory } from '@/types/amenity';

interface PageProps {
  params: {
    lotId: string;
  };
}

// Category icons mapping
const categoryIcons: Record<AmenityCategory, any> = {
  essential: Wifi,
  kitchen: UtensilsCrossed,
  bathroom: Droplet,
  entertainment: Tv,
  outdoor: TreePine,
};

// Category display names
const categoryNames: Record<AmenityCategory, string> = {
  essential: 'Essentials',
  kitchen: 'Kitchen & Dining',
  bathroom: 'Bathroom',
  entertainment: 'Entertainment',
  outdoor: 'Outdoor',
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const lotResult = await getPublicLotById(params.lotId);

  if (!lotResult.success) {
    return {
      title: 'Lot Not Found | Hoostn',
    };
  }

  const { data: lot } = lotResult;

  return {
    title: `${lot.title} - ${lot.property.name} | Hoostn`,
    description:
      lot.description ||
      `Book ${lot.title} in ${lot.property.city}, ${lot.property.state}. ${lot.bedrooms} bedroom${lot.bedrooms > 1 ? 's' : ''}, ${lot.bathrooms} bathroom${lot.bathrooms > 1 ? 's' : ''}, sleeps ${lot.max_guests}.`,
    openGraph: {
      title: lot.title,
      description: lot.description || undefined,
      images: lot.primary_image_path
        ? [
            {
              url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/lot-images/${lot.primary_image_path}`,
              width: 1200,
              height: 630,
              alt: lot.title,
            },
          ]
        : [],
    },
  };
}

export default async function PublicLotDetailPage({ params }: PageProps) {
  // Fetch lot with all details
  const lotResult = await getPublicLotById(params.lotId);

  // Handle not found
  if (!lotResult.success) {
    notFound();
  }

  const lot = lotResult.data;

  // Group amenities by category
  const amenitiesByCategory = lot.amenities.reduce(
    (acc, lotAmenity) => {
      const category = lotAmenity.amenity.category as AmenityCategory;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(lotAmenity);
      return acc;
    },
    {} as Record<AmenityCategory, typeof lot.amenities>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Gallery Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <PublicLotGallery images={lot.images} lotTitle={lot.title} />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {lot.title}
              </h1>

              {/* Property Info */}
              <div className="flex items-center gap-4 text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <Bed className="h-4 w-4" />
                  <span className="text-sm">
                    {lot.bedrooms} {lot.bedrooms === 1 ? 'bedroom' : 'bedrooms'}
                  </span>
                </div>
                <span className="text-gray-300">·</span>
                <div className="flex items-center gap-1">
                  <Bath className="h-4 w-4" />
                  <span className="text-sm">
                    {lot.bathrooms} {lot.bathrooms === 1 ? 'bath' : 'baths'}
                  </span>
                </div>
                <span className="text-gray-300">·</span>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">Up to {lot.max_guests} guests</span>
                </div>
                {lot.pets_allowed && (
                  <>
                    <span className="text-gray-300">·</span>
                    <div className="flex items-center gap-1 text-green-600">
                      <PawPrint className="h-4 w-4" />
                      <span className="text-sm">Pet friendly</span>
                    </div>
                  </>
                )}
              </div>

              {/* Location */}
              <div className="flex items-start gap-2 text-gray-700">
                <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{lot.property.name}</p>
                  <p className="text-sm">
                    {lot.property.address}, {lot.property.city},{' '}
                    {lot.property.state} {lot.property.zip_code}
                  </p>
                </div>
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Description */}
            {lot.description && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  About this space
                </h2>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {lot.description}
                </p>
              </div>
            )}

            <hr className="border-gray-200" />

            {/* Amenities */}
            {Object.keys(amenitiesByCategory).length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                  What this place offers
                </h2>

                <div className="space-y-6">
                  {(Object.entries(amenitiesByCategory) as [AmenityCategory, typeof lot.amenities][]).map(
                    ([category, amenities]) => {
                      const Icon = categoryIcons[category];
                      return (
                        <div key={category}>
                          <div className="flex items-center gap-2 mb-3">
                            <Icon className="h-5 w-5 text-gray-700" />
                            <h3 className="font-semibold text-gray-900">
                              {categoryNames[category]}
                            </h3>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-7">
                            {amenities.map((lotAmenity) => (
                              <div
                                key={lotAmenity.id}
                                className="flex items-start gap-2"
                              >
                                <div className="flex-1">
                                  <p className="text-gray-700">
                                    {lotAmenity.amenity.name}
                                    {lotAmenity.quantity > 1 && (
                                      <span className="text-gray-500 text-sm ml-1">
                                        × {lotAmenity.quantity}
                                      </span>
                                    )}
                                  </p>
                                  {lotAmenity.notes && (
                                    <p className="text-sm text-gray-500">
                                      {lotAmenity.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}

            <hr className="border-gray-200" />

            {/* Pricing Info */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Pricing
              </h2>
              <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                {lot.base_price !== null && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base price per night</span>
                    <span className="font-semibold">${lot.base_price}</span>
                  </div>
                )}
                {lot.cleaning_fee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cleaning fee</span>
                    <span className="font-semibold">${lot.cleaning_fee}</span>
                  </div>
                )}
                {lot.tourist_tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Tourist tax (per guest per night)
                    </span>
                    <span className="font-semibold">${lot.tourist_tax}</span>
                  </div>
                )}

                {/* Seasonal Pricing */}
                {lot.pricing_seasons.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-900 mb-2">
                      Seasonal pricing available:
                    </p>
                    <div className="space-y-2">
                      {lot.pricing_seasons.map((season) => (
                        <div
                          key={season.id}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-gray-600">{season.name}</span>
                          <span className="text-gray-900">
                            ${season.price_per_night}/night
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* House Rules */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                House rules
              </h2>
              <div className="space-y-2 text-gray-700">
                <p>• Check-in: After 3:00 PM</p>
                <p>• Check-out: Before 11:00 AM</p>
                {lot.pets_allowed ? (
                  <p>• Pets allowed</p>
                ) : (
                  <p>• No pets allowed</p>
                )}
                <p>• No smoking</p>
                <p>• No parties or events</p>
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Location Map */}
            {lot.property.latitude && lot.property.longitude && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Location
                </h2>
                <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MapPin className="h-12 w-12 mx-auto mb-2" />
                    <p>Map integration coming soon</p>
                    <p className="text-sm mt-1">
                      {lot.property.city}, {lot.property.state}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <hr className="border-gray-200" />

            {/* Reviews Placeholder */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Guest reviews
              </h2>
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <Star className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No reviews yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Be the first to review this property
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Booking Widget (Sticky) */}
          <div className="lg:col-span-1">
            <BookingWidget
              lotId={lot.id}
              basePrice={lot.base_price}
              cleaningFee={lot.cleaning_fee}
              maxGuests={lot.max_guests}
            />
          </div>
        </div>
      </div>

      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LodgingBusiness',
            name: lot.title,
            description: lot.description,
            address: {
              '@type': 'PostalAddress',
              streetAddress: lot.property.address,
              addressLocality: lot.property.city,
              addressRegion: lot.property.state,
              postalCode: lot.property.zip_code,
              addressCountry: lot.property.country,
            },
            numberOfRooms: lot.bedrooms,
            petsAllowed: lot.pets_allowed,
            ...(lot.base_price !== null && {
              priceRange: `$${lot.base_price}`,
            }),
            ...(lot.property.latitude &&
              lot.property.longitude && {
                geo: {
                  '@type': 'GeoCoordinates',
                  latitude: lot.property.latitude,
                  longitude: lot.property.longitude,
                },
              }),
          }),
        }}
      />
    </div>
  );
}
