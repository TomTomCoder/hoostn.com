import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function CalendarPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-anthracite">Calendar</h2>
        <p className="text-gray-600 mt-1">View and manage your property availability</p>
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-anthracite mb-2">
              Calendar page coming soon
            </h3>
            <p className="text-gray-600">
              This page will display a calendar view of all your reservations and availability.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
