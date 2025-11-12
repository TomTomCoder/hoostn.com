'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Calendar, DollarSign, Clock, AlertCircle } from 'lucide-react';
import type { ReservationStats } from '@/types/booking';

interface ReservationStatsProps {
  stats: ReservationStats;
}

/**
 * Reservation statistics KPI cards
 * Displays key metrics for the dashboard
 */
export function ReservationStatsCards({ stats }: ReservationStatsProps) {
  const statCards = [
    {
      label: 'Total Bookings',
      value: stats.totalReservations,
      subtext: 'This month',
      icon: Calendar,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      label: 'Upcoming Check-ins',
      value: stats.upcomingCheckIns,
      subtext: 'Next 7 days',
      icon: Clock,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Pending Payments',
      value: stats.pendingPayments,
      subtext: `$${stats.pendingPaymentsAmount.toLocaleString()}`,
      icon: AlertCircle,
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
    },
    {
      label: 'Revenue',
      value: `$${stats.monthRevenue.toLocaleString()}`,
      subtext: 'This month',
      icon: DollarSign,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-anthracite mt-2">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{stat.subtext}</p>
                </div>
                <div
                  className={`w-12 h-12 ${stat.iconBg} rounded-lg flex items-center justify-center`}
                >
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
