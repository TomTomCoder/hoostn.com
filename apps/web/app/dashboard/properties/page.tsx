import { Suspense } from 'react';
import { Metadata } from 'next';
import { getPropertiesWithLots, getPropertyCities } from '@/lib/actions/properties';
import { PropertiesHeader } from '@/components/properties/properties-header';
import { PropertiesList } from '@/components/properties/properties-list';
import { PropertiesLoading } from '@/components/properties/properties-loading';

export const metadata: Metadata = {
  title: 'Properties | Hoostn',
  description: 'Manage your rental properties',
};

interface PageProps {
  searchParams: {
    view?: 'grid' | 'list';
    search?: string;
    city?: string;
  };
}

export default async function PropertiesPage({ searchParams }: PageProps) {
  const view = searchParams.view || 'grid';
  const search = searchParams.search;
  const city = searchParams.city;

  // Fetch properties with filters
  const propertiesResult = await getPropertiesWithLots({
    search,
    city,
  });

  // Fetch available cities for filter
  const citiesResult = await getPropertyCities();

  // Handle error state
  if (!propertiesResult.success) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-anthracite">
            Properties
          </h1>
          <p className="text-gray-600 mt-1">Manage your rental properties</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start">
            <svg
              className="w-6 h-6 text-error mr-3 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-error mb-1">
                Error loading properties
              </h3>
              <p className="text-sm text-gray-600">{propertiesResult.error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const propertiesList = propertiesResult.data;
  const cities = citiesResult.success ? citiesResult.data : [];
  const hasFilters = Boolean(search || city);

  return (
    <div className="max-w-7xl mx-auto">
      <PropertiesHeader
        propertyCount={propertiesList.length}
        cities={cities}
      />

      <Suspense fallback={<PropertiesLoading view={view} />}>
        <PropertiesList
          properties={propertiesList}
          view={view}
          hasFilters={hasFilters}
        />
      </Suspense>
    </div>
  );
}
