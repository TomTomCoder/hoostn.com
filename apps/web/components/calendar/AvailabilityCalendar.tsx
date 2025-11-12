'use client';

import React, { useState, useMemo } from 'react';
import { clsx } from 'clsx';
import { DateBlockModal, type AvailabilityRule } from './DateBlockModal';

interface AvailabilityCalendarProps {
  availabilityRules: AvailabilityRule[];
  onRulesChange: (rules: AvailabilityRule[]) => void;
  className?: string;
}

export function AvailabilityCalendar({
  availabilityRules,
  onRulesChange,
  className,
}: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [editingRule, setEditingRule] = useState<AvailabilityRule | undefined>();

  // Get days in month
  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysCount = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of month
    for (let day = 1; day <= daysCount; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [currentMonth]);

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // Check if date has a rule
  const getRuleForDate = (date: Date): AvailabilityRule | undefined => {
    const dateStr = date.toISOString().split('T')[0];
    return availabilityRules.find((rule) => {
      return dateStr >= rule.start_date && dateStr <= rule.end_date;
    });
  };

  // Handle date click
  const handleDateClick = (date: Date) => {
    const existingRule = getRuleForDate(date);
    if (existingRule) {
      setEditingRule(existingRule);
    } else {
      setSelectedDate(date);
      setEditingRule(undefined);
    }
    setIsModalOpen(true);
  };

  // Handle save rule
  const handleSaveRule = (rule: AvailabilityRule) => {
    if (editingRule && editingRule.id) {
      // Update existing rule
      onRulesChange(
        availabilityRules.map((r) => (r.id === editingRule.id ? rule : r))
      );
    } else {
      // Add new rule
      onRulesChange([...availabilityRules, { ...rule, id: crypto.randomUUID() }]);
    }
  };

  // Handle delete rule
  const handleDeleteRule = (ruleId: string) => {
    onRulesChange(availabilityRules.filter((r) => r.id !== ruleId));
  };

  // Get color for date based on rule type
  const getDateColor = (rule: AvailabilityRule | undefined) => {
    if (!rule) return '';
    switch (rule.rule_type) {
      case 'blocked':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'price_override':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'min_stay':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default:
        return '';
    }
  };

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-anthracite">
          Availability Calendar
        </h3>
        <button
          type="button"
          onClick={goToToday}
          className="px-3 py-1 text-sm text-primary hover:bg-primary/10 rounded transition-colors"
        >
          Today
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-100 border border-red-300 rounded" />
          <span className="text-gray-600">Blocked</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded" />
          <span className="text-gray-600">Price Override</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded" />
          <span className="text-gray-600">Min Stay</span>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <button
          type="button"
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          aria-label="Previous month"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <h4 className="text-base font-semibold text-gray-anthracite">
          {currentMonth.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          })}
        </h4>

        <button
          type="button"
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          aria-label="Next month"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 bg-gray-100">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="p-2 text-center text-xs font-semibold text-gray-600"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 bg-white">
          {daysInMonth.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const rule = getRuleForDate(date);
            const isToday =
              date.toDateString() === new Date().toDateString();
            const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

            return (
              <button
                key={date.toISOString()}
                type="button"
                onClick={() => !isPast && handleDateClick(date)}
                disabled={isPast}
                className={clsx(
                  'aspect-square p-2 border border-gray-100 hover:bg-gray-50 transition-colors text-sm relative',
                  {
                    'cursor-not-allowed opacity-50': isPast,
                    'cursor-pointer': !isPast,
                    'font-bold ring-2 ring-primary ring-inset': isToday,
                  },
                  rule ? getDateColor(rule) : ''
                )}
                aria-label={date.toLocaleDateString()}
              >
                <span className="block">{date.getDate()}</span>
                {rule && (
                  <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-current" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Rules List */}
      {availabilityRules.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-anthracite">
            Active Rules ({availabilityRules.length})
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {availabilityRules.map((rule) => (
              <div
                key={rule.id}
                className={clsx(
                  'flex items-center justify-between p-3 rounded-lg border-2',
                  getDateColor(rule)
                )}
              >
                <div className="flex-1">
                  <div className="font-medium text-sm">
                    {rule.rule_type === 'blocked' && 'Blocked'}
                    {rule.rule_type === 'price_override' &&
                      `Price Override: €${rule.price_per_night}/night`}
                    {rule.rule_type === 'min_stay' &&
                      `Min Stay: ${rule.min_nights} nights`}
                  </div>
                  <div className="text-xs">
                    {new Date(rule.start_date).toLocaleDateString()} -{' '}
                    {new Date(rule.end_date).toLocaleDateString()}
                  </div>
                  {rule.reason && (
                    <div className="text-xs mt-1">{rule.reason}</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => rule.id && handleDeleteRule(rule.id)}
                  className="ml-3 p-2 hover:bg-white/50 rounded transition-colors"
                  aria-label="Delete rule"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Date Block Modal */}
      <DateBlockModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDate(undefined);
          setEditingRule(undefined);
        }}
        onSave={handleSaveRule}
        initialData={editingRule}
        selectedDate={selectedDate}
      />
    </div>
  );
}
