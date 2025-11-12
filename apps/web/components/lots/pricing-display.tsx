'use client';

interface PricingSeason {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  price_per_night: number;
  min_nights: number;
}

interface PricingDisplayProps {
  basePrice: number;
  cleaningFee?: number | null;
  touristTax?: number | null;
  pricingSeasons?: PricingSeason[];
}

export function PricingDisplay({
  basePrice,
  cleaningFee = 0,
  touristTax = 0,
  pricingSeasons = [],
}: PricingDisplayProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  // Calculate example total for 3 nights
  const exampleNights = 3;
  const exampleSubtotal = basePrice * exampleNights;
  const exampleCleaning = cleaningFee || 0;
  const exampleTax = (touristTax || 0) * exampleNights;
  const exampleTotal = exampleSubtotal + exampleCleaning + exampleTax;

  return (
    <div className="space-y-6">
      {/* Base Price - Prominent */}
      <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg p-6 border border-primary/10">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Base Price</p>
            <div className="flex items-baseline">
              <span className="text-4xl font-bold text-primary">
                {formatPrice(basePrice)}
              </span>
              <span className="text-lg text-gray-500 ml-2">/night</span>
            </div>
          </div>
          <div className="text-right">
            <svg
              className="w-12 h-12 text-primary/20"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Additional Fees */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-anthracite">Additional Fees</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
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
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <span>Cleaning Fee</span>
            </div>
            <span className="font-medium text-gray-anthracite">
              {cleaningFee ? formatPrice(cleaningFee) : 'Free'}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-gray-100">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>Tourist Tax</span>
            </div>
            <span className="font-medium text-gray-anthracite">
              {touristTax ? `${formatPrice(touristTax)}/night` : 'None'}
            </span>
          </div>
        </div>
      </div>

      {/* Seasonal Pricing */}
      {pricingSeasons && pricingSeasons.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-anthracite flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-accent"
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
            Seasonal Pricing
          </h3>
          <div className="space-y-2">
            {pricingSeasons.map((season) => (
              <div
                key={season.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-anthracite">
                    {season.name}
                  </h4>
                  <span className="text-lg font-bold text-accent">
                    {formatPrice(season.price_per_night)}/night
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
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
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>
                    {formatDate(season.start_date)} - {formatDate(season.end_date)}
                  </span>
                  {season.min_nights > 1 && (
                    <span className="ml-4 px-2 py-0.5 bg-white rounded text-xs">
                      Min {season.min_nights} nights
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Price Calculation Example */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h4 className="font-semibold text-gray-anthracite mb-3">
          Price Calculation Example ({exampleNights} nights)
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>
              {formatPrice(basePrice)} × {exampleNights} nights
            </span>
            <span>{formatPrice(exampleSubtotal)}</span>
          </div>
          {cleaningFee && cleaningFee > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Cleaning fee</span>
              <span>{formatPrice(exampleCleaning)}</span>
            </div>
          )}
          {touristTax && touristTax > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>
                Tourist tax ({formatPrice(touristTax)} × {exampleNights} nights)
              </span>
              <span>{formatPrice(exampleTax)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-gray-anthracite pt-2 border-t border-gray-300">
            <span>Total</span>
            <span>{formatPrice(exampleTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
