'use client';

import { useRouter } from 'next/navigation';
import { Pagination } from '@/components/search';

interface SortDropdownProps {
  defaultSort: string;
}

export function SortDropdown({ defaultSort }: SortDropdownProps) {
  const router = useRouter();

  const handleSortChange = (value: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('sortBy', value);
    url.searchParams.delete('page'); // Reset to page 1 when sorting changes
    router.push(url.pathname + '?' + url.searchParams.toString());
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="text-sm text-gray-600">
        Sort by:
      </label>
      <select
        id="sort"
        defaultValue={defaultSort}
        onChange={(e) => handleSortChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
      >
        <option value="newest">Newest</option>
        <option value="price_low">Price: Low to High</option>
        <option value="price_high">Price: High to Low</option>
        <option value="bedrooms">Most Bedrooms</option>
        <option value="guests">Most Guests</option>
      </select>
    </div>
  );
}

interface PaginationWrapperProps {
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
}

export function PaginationWrapper({
  currentPage,
  totalPages,
  hasMore,
}: PaginationWrapperProps) {
  const router = useRouter();

  const handlePageChange = (newPage: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set('page', newPage.toString());
    router.push(url.pathname + '?' + url.searchParams.toString());
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      hasMore={hasMore}
      onPageChange={handlePageChange}
    />
  );
}
