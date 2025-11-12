import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function PropertiesPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-anthracite">Properties</h2>
        <p className="text-gray-600 mt-1">Manage your rental properties</p>
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
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-anthracite mb-2">
              Properties page coming soon
            </h3>
            <p className="text-gray-600">
              This page will allow you to manage all your rental properties.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
