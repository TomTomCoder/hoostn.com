import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AmenitiesList } from '@/components/lots/amenities-list';
import { PricingDisplay } from '@/components/lots/pricing-display';
import { AvailabilityCalendar } from '@/components/lots/availability-calendar';

interface PageProps {
  params: {
    lotId: string;
  };
}

// This will be replaced once Agent 2 creates the public lot action
async function getPublicLotById(lotId: string) {
  // Temporary mock - Agent 2 will create the actual action
  try {
    const { getPublicLotWithDetails } = await import('@/lib/actions/lots');
    return await getPublicLotWithDetails(lotId);
  } catch (error) {
    // If the action doesn't exist yet, return a mock error
    return {
      success: false,
      error: 'Public lot actions not yet implemented by Agent 2',
    };
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const result = await getPublicLotById(params.lotId);

  if (!result.success) {
    return {
      title: 'Lot Not Found | Hoostn',
    };
  }

  return {
    title: `${result.data.title} | Hoostn`,
    description: result.data.description || `Book ${result.data.title}`,
  };
}

export default async function PublicLotPage({ params }: PageProps) {
  const result = await getPublicLotById(params.lotId);

  // Handle not found
  if (!result.success) {
    notFound();
  }

  const lotData = result.data;

  // Extract lot details
  const lot = {
    id: lotData.id,
    property_id: lotData.property_id,
    title: lotData.title,
    description: lotData.description,
    bedrooms: lotData.bedrooms,
    bathrooms: lotData.bathrooms,
    max_guests: lotData.max_guests,
    base_price: lotData.base_price,
    cleaning_fee: lotData.cleaning_fee,
    tourist_tax: lotData.tourist_tax,
    pets_allowed: lotData.pets_allowed,
    status: lotData.status,
  };

  const property = lotData.property || {
    id: lotData.property_id,
    name: 'Property',
    address: '',
    city: '',
  };

  const images = lotData.lot_images || [];
  const lotAmenities = lotData.lot_amenities || [];
  const pricingSeasons = lotData.pricing_seasons || [];
  const availabilityRules = lotData.availability_rules || [];

  // Sort images by display order
  const sortedImages = [...images].sort((a: any, b: any) => a.display_order - b.display_order);
  const primaryImage = sortedImages.find((img: any) => img.is_primary) || sortedImages[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="text-2xl font-bold text-primary">
            Hoostn
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
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
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {sortedImages.slice(0, 6).map((image: any) => (
                          <div
                            key={image.id}
                            className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent"
                          >
                            <img
                              src={`/api/images/${image.storage_path}`}
                              alt={image.filename}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Title and Basic Info */}
            <div>
              <h1 className="text-4xl font-bold text-gray-anthracite mb-4">
                {lot.title}
              </h1>

              {/* Quick Stats */}
              <div className="flex items-center gap-6 text-gray-600 flex-wrap mb-4">
                {lot.bedrooms > 0 && (
                  <div className="flex items-center">
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
                    <span>{lot.bedrooms} bedroom{lot.bedrooms !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {lot.bathrooms > 0 && (
                  <div className="flex items-center">
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
                        d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                      />
                    </svg>
                    <span>{lot.bathrooms} bathroom{lot.bathrooms !== 1 ? 's' : ''}</span>
                  </div>
                )}
                <div className="flex items-center">
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
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <span>Up to {lot.max_guests} guest{lot.max_guests !== 1 ? 's' : ''}</span>
                </div>
                {lot.pets_allowed && (
                  <div className="flex items-center text-accent">
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Pets allowed</span>
                  </div>
                )}
              </div>

              {/* Property Info */}
              <div className="flex items-start text-gray-600 mb-6">
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
                <span>
                  {property.name}
                  {property.address && property.city && (
                    <> - {property.address}, {property.city}</>
                  )}
                </span>
              </div>
            </div>

            {/* Description */}
            {lot.description && (
              <Card>
                <CardHeader>
                  <CardTitle>About this space</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 whitespace-pre-wrap">
                    {lot.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Amenities */}
            <Card>
              <CardHeader>
                <CardTitle>What this place offers</CardTitle>
              </CardHeader>
              <CardContent>
                <AmenitiesList lotAmenities={lotAmenities} expandedByDefault={true} />
              </CardContent>
            </Card>

            {/* Availability */}
            <Card>
              <CardHeader>
                <CardTitle>Availability</CardTitle>
              </CardHeader>
              <CardContent>
                <AvailabilityCalendar
                  availabilityRules={availabilityRules}
                  readOnly={true}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <PricingDisplay
                    basePrice={lot.base_price}
                    cleaningFee={lot.cleaning_fee}
                    touristTax={lot.tourist_tax}
                    pricingSeasons={pricingSeasons}
                  />

                  <div className="mt-6">
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full"
                      disabled={lot.status !== 'active'}
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
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      Book Now
                    </Button>
                    {lot.status !== 'active' && (
                      <p className="text-sm text-gray-500 text-center mt-2">
                        This lot is currently not available for booking
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-anthracite text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-sm">
              &copy; {new Date().getFullYear()} Hoostn. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
