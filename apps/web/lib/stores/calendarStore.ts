/**
 * Calendar Store
 * Zustand store for managing calendar state and preferences
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  CalendarView,
  CalendarEvent,
  CalendarFilters,
  CalendarPreferences,
} from '@/types/calendar';
import type { ReservationStatus } from '@/types/booking';

interface CalendarState {
  // View state
  currentView: CalendarView;
  currentDate: Date;

  // Filters
  selectedPropertyIds: string[];
  selectedLotIds: string[];
  selectedStatuses: ReservationStatus[];
  showBlocked: boolean;

  // Data
  events: CalendarEvent[];
  isLoading: boolean;

  // Preferences (persisted)
  preferences: CalendarPreferences;

  // Actions
  setView: (view: CalendarView) => void;
  setDate: (date: Date) => void;
  nextPeriod: () => void;
  previousPeriod: () => void;
  goToToday: () => void;

  // Filter actions
  togglePropertySelection: (propertyId: string) => void;
  setSelectedProperties: (propertyIds: string[]) => void;
  toggleLotSelection: (lotId: string) => void;
  setSelectedLots: (lotIds: string[]) => void;
  toggleStatusFilter: (status: ReservationStatus) => void;
  setSelectedStatuses: (statuses: ReservationStatus[]) => void;
  toggleShowBlocked: () => void;
  resetFilters: () => void;

  // Data actions
  setEvents: (events: CalendarEvent[]) => void;
  setLoading: (loading: boolean) => void;

  // Preferences
  updatePreferences: (preferences: Partial<CalendarPreferences>) => void;

  // Helpers
  getFilters: () => CalendarFilters;
}

const defaultPreferences: CalendarPreferences = {
  defaultView: 'month',
  selectedPropertyIds: [],
  selectedLotIds: [],
  showWeekends: true,
  colorScheme: 'status',
};

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentView: 'month',
      currentDate: new Date(),
      selectedPropertyIds: [],
      selectedLotIds: [],
      selectedStatuses: [],
      showBlocked: true,
      events: [],
      isLoading: false,
      preferences: defaultPreferences,

      // View actions
      setView: (view) => set({ currentView: view }),

      setDate: (date) => set({ currentDate: date }),

      nextPeriod: () => {
        const { currentView, currentDate } = get();
        const newDate = new Date(currentDate);

        if (currentView === 'month') {
          newDate.setMonth(newDate.getMonth() + 1);
        } else if (currentView === 'week') {
          newDate.setDate(newDate.getDate() + 7);
        } else {
          newDate.setDate(newDate.getDate() + 1);
        }

        set({ currentDate: newDate });
      },

      previousPeriod: () => {
        const { currentView, currentDate } = get();
        const newDate = new Date(currentDate);

        if (currentView === 'month') {
          newDate.setMonth(newDate.getMonth() - 1);
        } else if (currentView === 'week') {
          newDate.setDate(newDate.getDate() - 7);
        } else {
          newDate.setDate(newDate.getDate() - 1);
        }

        set({ currentDate: newDate });
      },

      goToToday: () => set({ currentDate: new Date() }),

      // Filter actions
      togglePropertySelection: (propertyId) => {
        const { selectedPropertyIds } = get();
        const newSelection = selectedPropertyIds.includes(propertyId)
          ? selectedPropertyIds.filter((id) => id !== propertyId)
          : [...selectedPropertyIds, propertyId];
        set({ selectedPropertyIds: newSelection });
      },

      setSelectedProperties: (propertyIds) =>
        set({ selectedPropertyIds: propertyIds }),

      toggleLotSelection: (lotId) => {
        const { selectedLotIds } = get();
        const newSelection = selectedLotIds.includes(lotId)
          ? selectedLotIds.filter((id) => id !== lotId)
          : [...selectedLotIds, lotId];
        set({ selectedLotIds: newSelection });
      },

      setSelectedLots: (lotIds) =>
        set({ selectedLotIds: lotIds }),

      toggleStatusFilter: (status) => {
        const { selectedStatuses } = get();
        const newStatuses = selectedStatuses.includes(status)
          ? selectedStatuses.filter((s) => s !== status)
          : [...selectedStatuses, status];
        set({ selectedStatuses: newStatuses });
      },

      setSelectedStatuses: (statuses) =>
        set({ selectedStatuses: statuses }),

      toggleShowBlocked: () => {
        const { showBlocked } = get();
        set({ showBlocked: !showBlocked });
      },

      resetFilters: () => {
        set({
          selectedPropertyIds: [],
          selectedLotIds: [],
          selectedStatuses: [],
          showBlocked: true,
        });
      },

      // Data actions
      setEvents: (events) => set({ events }),

      setLoading: (loading) => set({ isLoading: loading }),

      // Preferences
      updatePreferences: (newPreferences) => {
        const { preferences } = get();
        set({ preferences: { ...preferences, ...newPreferences } });
      },

      // Helper to get current filters
      getFilters: (): CalendarFilters => {
        const { selectedPropertyIds, selectedLotIds, selectedStatuses, showBlocked } = get();
        return {
          propertyIds: selectedPropertyIds,
          lotIds: selectedLotIds,
          statuses: selectedStatuses,
          showBlocked,
        };
      },
    }),
    {
      name: 'calendar-storage',
      partialize: (state) => ({
        preferences: state.preferences,
        selectedPropertyIds: state.selectedPropertyIds,
        selectedLotIds: state.selectedLotIds,
      }),
    }
  )
);
