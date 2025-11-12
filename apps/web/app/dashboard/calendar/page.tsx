/**
 * Calendar Page
 * Multi-lot calendar view for managing reservations and availability
 */

import { CalendarContainer } from '@/components/calendar/CalendarContainer';
import { getPropertiesWithLots } from '@/lib/actions/calendar';
import { redirect } from 'next/navigation';

export default async function CalendarPage() {
  // Fetch properties with lots
  const result = await getPropertiesWithLots();

  if (!result.success) {
    // Handle auth error - redirect to login
    if (result.error === 'Not authenticated') {
      redirect('/login');
    }

    // Show error state
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Calendar</h2>
          <p className="text-gray-600 mt-1">View and manage your lot availability</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700">Failed to load calendar: {result.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <CalendarContainer initialProperties={result.data} />
    </div>
  );
}
