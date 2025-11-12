import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPropertyWithLotsById } from '@/lib/actions/properties';
import { Button } from '@/components/ui/button';
import { LotList } from '@/components/lots/lot-list';
import { LotsLoading } from '@/components/lots/lots-loading';

interface PageProps {
  params: {
    propertyId: string;
  };
  searchParams: {
    view?: 'grid' | 'list';
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const result = await getPropertyWithLotsById(params.propertyId);

  if (!result.success) {
    return {
      title: 'Lots | Hoostn',
    };
  }

  return {
    title: `Lots - ${result.data.name} | Hoostn`,
    description: `Manage lots for ${result.data.name}`,
  };
}

export default async function LotsPage({ params, searchParams }: PageProps) {
  const view = searchParams.view || 'grid';

  // Fetch property with its lots
  const result = await getPropertyWithLotsById(params.propertyId);

  // Handle not found
  if (!result.success) {
    notFound();
  }

  const property = result.data;
  const lots = property.lots || [];

  return (
    <div className="max-w-7xl mx-auto">
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
          <li>
            <Link
              href={`/dashboard/properties/${property.id}`}
              className="text-gray-600 hover:text-primary transition-colors"
            >
              {property.name}
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-anthracite font-medium">Lots</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-anthracite mb-2">
            Lots
          </h1>
          <div className="flex items-center text-gray-600">
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
          </div>
          {lots.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {lots.length} {lots.length === 1 ? 'lot' : 'lots'}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/properties/${property.id}`}>
            <Button variant="outline" size="md">
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
              Back to Property
            </Button>
          </Link>
          <Link href={`/dashboard/properties/${property.id}/lots/new`}>
            <Button variant="primary" size="md">
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Lot
            </Button>
          </Link>
        </div>
      </div>

      {/* Property Context Card */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-semibold text-gray-anthracite mb-1">
              {property.name}
            </h2>
            <p className="text-sm text-gray-600">
              {property.address}, {property.city}
              {property.country && property.country !== 'FR'
                ? `, ${property.country}`
                : ''}
            </p>
            {property.description && (
              <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                {property.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Lots List */}
      <Suspense fallback={<LotsLoading view={view} />}>
        <LotList
          lots={lots}
          propertyId={property.id}
          propertyName={property.name}
          view={view}
        />
      </Suspense>
    </div>
  );
}
