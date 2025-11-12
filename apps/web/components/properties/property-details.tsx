'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { PropertyWithLots } from '@/lib/actions/properties';

interface PropertyDetailsProps {
  property: PropertyWithLots;
}

export function PropertyDetails({ property }: PropertyDetailsProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 whitespace-pre-wrap">
            {property.description || 'No description provided'}
          </p>
        </CardContent>
      </Card>

      {/* Location Details */}
      <Card>
        <CardHeader>
          <CardTitle>Location</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Address
                </label>
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0 mt-0.5"
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
                  <p className="text-gray-anthracite">{property.address}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  City
                </label>
                <p className="text-gray-anthracite">{property.city}</p>
              </div>

              {property.postal_code && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Postal Code
                  </label>
                  <p className="text-gray-anthracite">{property.postal_code}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Country
                </label>
                <p className="text-gray-anthracite">
                  {property.country === 'FR' ? 'France' : property.country}
                </p>
              </div>
            </div>

            {property.latitude && property.longitude && (
              <div className="pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Coordinates
                </label>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Latitude:</span>{' '}
                    {property.latitude}
                  </div>
                  <div>
                    <span className="font-medium">Longitude:</span>{' '}
                    {property.longitude}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Units/Lots */}
      <Card>
        <CardHeader>
          <CardTitle>
            Units ({property.lots?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {property.lots && property.lots.length > 0 ? (
            <div className="space-y-3">
              {property.lots.map((lot: any) => (
                <div
                  key={lot.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-anthracite">
                      {lot.title}
                    </h4>
                    {lot.status && (
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          lot.status === 'active'
                            ? 'bg-accent/10 text-accent'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {lot.status}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    {lot.bedrooms !== undefined && (
                      <div className="flex items-center">
                        <svg
                          className="w-4 h-4 mr-1"
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
                        {lot.bedrooms} {lot.bedrooms === 1 ? 'bed' : 'beds'}
                      </div>
                    )}
                    {lot.bathrooms !== undefined && (
                      <div className="flex items-center">
                        <svg
                          className="w-4 h-4 mr-1"
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
                        {lot.bathrooms} {lot.bathrooms === 1 ? 'bath' : 'baths'}
                      </div>
                    )}
                    {lot.max_guests !== undefined && (
                      <div className="flex items-center">
                        <svg
                          className="w-4 h-4 mr-1"
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
                        Up to {lot.max_guests} guests
                      </div>
                    )}
                    {lot.base_price && (
                      <div className="flex items-center font-medium text-primary">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        €{lot.base_price}/night
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No units added yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Property Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-gray-600 mb-1">Created</label>
              <p className="text-gray-anthracite font-medium">
                {formatDate(property.created_at)}
              </p>
            </div>
            <div>
              <label className="block text-gray-600 mb-1">Last Updated</label>
              <p className="text-gray-anthracite font-medium">
                {formatDate(property.updated_at)}
              </p>
            </div>
            <div>
              <label className="block text-gray-600 mb-1">Property ID</label>
              <p className="text-gray-anthracite font-mono text-xs break-all">
                {property.id}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
