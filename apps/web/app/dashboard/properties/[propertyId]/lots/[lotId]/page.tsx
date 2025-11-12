import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LotHeader } from '@/components/lots/lot-header';
import { LotDetails } from '@/components/lots/lot-details';

interface PageProps {
  params: {
    propertyId: string;
    lotId: string;
  };
}

// This will be replaced once Agent 2 creates the lot actions
async function getLotById(lotId: string, propertyId: string) {
  // Temporary mock - Agent 2 will create the actual action
  // Import dynamically to avoid build errors
  try {
    const { getLotWithDetails } = await import('@/lib/actions/lots');
    return await getLotWithDetails(lotId);
  } catch (error) {
    // If the action doesn't exist yet, return a mock error
    return {
      success: false,
      error: 'Lot actions not yet implemented by Agent 2',
    };
  }
}

async function getPropertyById(propertyId: string) {
  const { getPropertyWithLotsById } = await import('@/lib/actions/properties');
  return await getPropertyWithLotsById(propertyId);
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const lotResult = await getLotById(params.lotId, params.propertyId);

  if (!lotResult.success) {
    return {
      title: 'Lot Not Found | Hoostn',
    };
  }

  return {
    title: `${lotResult.data.title} | Lots | Hoostn`,
    description: lotResult.data.description || `Lot details for ${lotResult.data.title}`,
  };
}

export default async function LotDetailPage({ params }: PageProps) {
  // Fetch lot with all details
  const lotResult = await getLotById(params.lotId, params.propertyId);

  // Fetch property info
  const propertyResult = await getPropertyById(params.propertyId);

  // Handle not found
  if (!lotResult.success || !propertyResult.success) {
    notFound();
  }

  const lotData = lotResult.data;
  const propertyData = propertyResult.data;

  // Extract lot details (structure will depend on Agent 2's implementation)
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
    created_at: lotData.created_at,
    updated_at: lotData.updated_at,
  };

  const property = {
    id: propertyData.id,
    name: propertyData.name,
    address: propertyData.address,
    city: propertyData.city,
  };

  // Extract related data
  const images = lotData.lot_images || [];
  const lotAmenities = lotData.lot_amenities || [];
  const pricingSeasons = lotData.pricing_seasons || [];
  const availabilityRules = lotData.availability_rules || [];

  return (
    <div className="max-w-7xl mx-auto">
      <LotHeader lot={lot} property={property} />
      <LotDetails
        lot={lot}
        property={property}
        images={images}
        lotAmenities={lotAmenities}
        pricingSeasons={pricingSeasons}
        availabilityRules={availabilityRules}
      />
    </div>
  );
}
