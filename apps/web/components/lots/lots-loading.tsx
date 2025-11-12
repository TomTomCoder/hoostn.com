import { Card } from '@/components/ui/card';

interface LotsLoadingProps {
  view?: 'grid' | 'list';
}

export function LotsLoading({ view = 'grid' }: LotsLoadingProps) {
  return (
    <div
      className={
        view === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
      }
    >
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          {/* Image skeleton */}
          <div className="relative w-full h-48 bg-gray-200 rounded-lg mb-4" />

          {/* Title skeleton */}
          <div className="space-y-3">
            <div className="h-6 bg-gray-200 rounded w-3/4" />

            {/* Stats skeleton */}
            <div className="flex flex-wrap gap-4">
              <div className="h-4 bg-gray-200 rounded w-20" />
              <div className="h-4 bg-gray-200 rounded w-20" />
              <div className="h-4 bg-gray-200 rounded w-24" />
            </div>

            {/* Price skeleton */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="h-6 bg-gray-200 rounded w-24" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
