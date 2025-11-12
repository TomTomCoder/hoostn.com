import React from 'react';
import { Metadata } from 'next';
import { SearchForm, SearchResults } from '@/components/search';
import {
  searchLots,
  getSearchFiltersSummary,
} from '@/lib/actions/search';
import type { SearchParams } from '@/types/search';
import { SortDropdown, PaginationWrapper } from './SearchPageClient';

export const metadata: Metadata = {
  title: 'Search Vacation Rentals | Hoostn',
  description: 'Find your perfect vacation rental with Hoostn. Search by location, dates, amenities, and more.',
};

interface SearchPageProps {
  searchParams: Promise<{
    city?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: string;
    minPrice?: string;
    maxPrice?: string;
    bedrooms?: string;
    bathrooms?: string;
    amenities?: string;
    petsAllowed?: string;
    page?: string;
    sortBy?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  // Await the searchParams
  const params = await searchParams;

  // Parse search parameters
  const searchParameters: SearchParams = {
    city: params.city,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    guests: params.guests ? parseInt(params.guests) : undefined,
    minPrice: params.minPrice ? parseFloat(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? parseFloat(params.maxPrice) : undefined,
    bedrooms: params.bedrooms ? parseInt(params.bedrooms) : undefined,
    bathrooms: params.bathrooms ? parseInt(params.bathrooms) : undefined,
    amenities: params.amenities?.split(',').filter(Boolean),
    petsAllowed: params.petsAllowed === 'true',
    page: params.page ? parseInt(params.page) : 1,
    sortBy: params.sortBy as SearchParams['sortBy'],
  };

  // Fetch search results
  const searchResult = await searchLots(searchParameters);

  // Fetch filter options for the form
  const filtersResult = await getSearchFiltersSummary();

  if (!searchResult.success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-anthracite mb-8">
            Search Vacation Rentals
          </h1>
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
            <p className="text-red-700">
              Failed to load search results. Please try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { results, total, page, total_pages, has_more } = searchResult.data;

  const availableCities = filtersResult.success
    ? filtersResult.data.available_cities.map((c) => c.city)
    : [];

  const availableAmenities = filtersResult.success
    ? filtersResult.data.available_amenities
    : [];

  const priceRange = filtersResult.success
    ? filtersResult.data.price_range
    : { min: 0, max: 1000 };

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
                href="/login"
                className="px-4 py-2 text-gray-anthracite hover:text-primary transition-colors"
              >
                Sign In
              </a>
              <a
                href="/signup"
                className="px-4 py-2 bg-primary text-white rounded-2xl hover:bg-primary-dark transition-colors"
              >
                Sign Up
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-anthracite mb-8">
          Find Your Perfect Vacation Rental
        </h1>

        {/* Search Form */}
        <div className="mb-8">
          <SearchForm
            availableCities={availableCities}
            availableAmenities={availableAmenities}
            priceRange={priceRange}
          />
        </div>

        {/* Results Count & Sort */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-anthracite">
              {total} {total === 1 ? 'property' : 'properties'} found
            </h2>
            {params.city && (
              <p className="text-gray-600 text-sm">
                in {params.city}
                {params.checkIn && params.checkOut && (
                  <>
                    {' '}
                    • {new Date(params.checkIn).toLocaleDateString()} -{' '}
                    {new Date(params.checkOut).toLocaleDateString()}
                  </>
                )}
              </p>
            )}
          </div>

          {/* Sort Dropdown - Client Component Wrapper Needed */}
          {results.length > 0 && (
            <SortDropdown defaultSort={params.sortBy || 'newest'} />
          )}
        </div>

        {/* Search Results */}
        <SearchResults results={results} />

        {/* Pagination */}
        {total_pages > 1 && (
          <PaginationWrapper
            currentPage={page}
            totalPages={total_pages}
            hasMore={has_more}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-anthracite text-white mt-16 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Hoostn</h3>
              <p className="text-gray-300">
                Your trusted platform for vacation rental management.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <a href="/about" className="hover:text-white">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="/contact" className="hover:text-white">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="/terms" className="hover:text-white">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <a href="/help" className="hover:text-white">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="/privacy" className="hover:text-white">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-300">
            <p>&copy; {new Date().getFullYear()} Hoostn. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
