import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function ReservationsPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-anthracite">Reservations</h2>
        <p className="text-gray-600 mt-1">Manage your property reservations</p>
      </div>

      <Card>
        <CardContent className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-anthracite mb-2">
              Reservations page coming soon
            </h3>
            <p className="text-gray-600">
              This page will allow you to view and manage all your property reservations.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
