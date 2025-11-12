import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getPropertyWithLotsById } from '@/lib/actions/properties';
import { PropertyHeader } from '@/components/properties/property-header';
import { PropertyDetails } from '@/components/properties/property-details';

interface PageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const result = await getPropertyWithLotsById(params.id);

  if (!result.success) {
    return {
      title: 'Property Not Found | Hoostn',
    };
  }

  return {
    title: `${result.data.name} | Properties | Hoostn`,
    description: result.data.description || `Property details for ${result.data.name}`,
  };
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const result = await getPropertyWithLotsById(params.id);

  // Handle not found
  if (!result.success) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto">
      <PropertyHeader property={result.data} />
      <PropertyDetails property={result.data} />
    </div>
  );
}
