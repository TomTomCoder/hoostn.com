# Calendar System - Developer Guide

## Overview
Professional multi-lot calendar system for managing property reservations and availability.

## Architecture

### Component Hierarchy
```
CalendarContainer (Client)
├── CalendarStats
├── CalendarFilters
├── CalendarToolbar
└── MonthView
    └── CalendarCell (per lot/date)
        └── ReservationCard (per event)
└── BulkBlockModal
```

### Data Flow
1. **Server** → `calendar/page.tsx` fetches initial properties/lots
2. **Client** → `CalendarContainer` manages state with Zustand
3. **Store** → User interactions update filters/date
4. **Actions** → Server actions fetch events/metrics
5. **Components** → Re-render with new data

## Key Files

### Types
- `/apps/web/types/calendar.ts` - All calendar-related TypeScript interfaces

### Store
- `/apps/web/lib/stores/calendarStore.ts` - Zustand store with persistence

### Server Actions
- `/apps/web/lib/actions/calendar.ts` - Data fetching and mutations

### Utilities
- `/apps/web/lib/utils/calendar-utils.ts` - Date helpers and formatters

### Components
- `CalendarContainer.tsx` - Main orchestrator
- `MonthView.tsx` - Calendar grid layout
- `CalendarCell.tsx` - Individual date/lot cell
- `ReservationCard.tsx` - Event display
- `CalendarToolbar.tsx` - Navigation controls
- `CalendarFilters.tsx` - Filter dropdowns
- `CalendarStats.tsx` - Metrics display
- `BulkBlockModal.tsx` - Bulk blocking UI

## State Management

### Zustand Store
```typescript
// Access store in components
const { currentDate, events, setDate } = useCalendarStore();

// Key state
- currentView: 'month' | 'week' | 'day'
- currentDate: Date
- selectedPropertyIds: string[]
- selectedLotIds: string[]
- events: CalendarEvent[]
```

### Persisted State
- User preferences (view, selected properties/lots)
- Stored in localStorage as 'calendar-storage'

## Server Actions

### getCalendarEvents
Fetches reservations and blocked dates for date range.
```typescript
const result = await getCalendarEvents(filters, dateRange);
if (result.success) {
  // result.data: CalendarEvent[]
}
```

### getPropertiesWithLots
Gets all properties with their lots for filters.
```typescript
const result = await getPropertiesWithLots();
// result.data: PropertyWithLots[]
```

### bulkBlockDates
Blocks dates across multiple lots.
```typescript
const result = await bulkBlockDates({
  lotIds: ['...'],
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  reason: 'Maintenance',
  ruleType: 'blocked'
});
```

### getCalendarMetrics
Calculates statistics for lots in date range.
```typescript
const result = await getCalendarMetrics(lotIds, dateRange);
// result.data: CalendarMetrics[]
```

## Common Tasks

### Adding a New Filter
1. Add state to `calendarStore.ts`
2. Add action to update state
3. Add UI in `CalendarFilters.tsx`
4. Update `getFilters()` in store
5. Server action will use new filter

### Adding Event Details Modal
1. Create `EventDetailsModal.tsx` component
2. Add modal state to `CalendarContainer`
3. Pass `onEventClick` to `MonthView`
4. Handle click in `CalendarCell`
5. Show modal with event data

### Adding Quick Create
1. Create `QuickCreateModal.tsx` component
2. Add modal state to `CalendarContainer`
3. Pass `onDateClick` to `MonthView`
4. Handle click in `CalendarCell`
5. Pre-fill form with lot/date

### Adding Drag & Drop
1. Install `@dnd-kit/core` packages
2. Wrap `MonthView` with `DndContext`
3. Make `ReservationCard` draggable
4. Make `CalendarCell` droppable
5. Handle drop event
6. Create server action to update reservation
7. Validate no conflicts

## Styling

### Color Scheme
- **Pending**: Yellow (yellow-100, yellow-800)
- **Confirmed**: Green (green-100, green-800)
- **Checked In**: Blue (blue-100, blue-800)
- **Checked Out**: Gray (gray-100, gray-800)
- **Cancelled**: Red (red-100, red-800)
- **Blocked**: Gray (gray-100, gray-700)

### Layout
- Calendar uses CSS Grid
- Date column: 120px fixed width
- Lot columns: minmax(200px, 1fr)
- Sticky positioning for headers
- Horizontal scroll for overflow

## Database Schema

### Relevant Tables
- `properties` - Property information
- `lots` - Rental units/lots
- `reservations` - Guest bookings
- `availability_rules` - Blocked dates

### Key Queries
- Join reservations with lots and properties
- Filter by org_id (RLS)
- Date range queries (check_in, check_out)
- Status filtering

## Performance

### Optimization Strategies
- Date range buffering (±1 month)
- Memoized calculations
- Client-side filtering after fetch
- Lazy modal loading
- No virtualization needed for <10 lots

### Future Considerations
- Virtualization for 50+ lots
- Pagination for date ranges
- Caching strategy for events
- Debounced filter updates

## Testing

### Manual Testing Checklist
- [ ] Load calendar page
- [ ] Select properties from filter
- [ ] Select specific lots
- [ ] Filter by status
- [ ] Toggle blocked dates
- [ ] Navigate months (prev/next/today)
- [ ] View statistics update
- [ ] Bulk block dates (3 steps)
- [ ] Click reservation cards
- [ ] Click calendar cells
- [ ] Check responsive layout

### Edge Cases
- No properties/lots
- No reservations in month
- Many overlapping events
- Long guest names
- Multiple lots per property
- Timezone handling

## Troubleshooting

### Calendar not loading
- Check authentication
- Verify org_id in database
- Check browser console for errors
- Verify server actions return data

### Filters not working
- Check Zustand store state
- Verify filter state updates
- Check server action receives filters
- Verify database queries

### Events not displaying
- Check date format (YYYY-MM-DD)
- Verify lot_id matches
- Check event type ('reservation' or 'blocked')
- Verify status is not 'cancelled'

## Phase 2 Features

### Planned Enhancements
1. **Drag & Drop** - Move/resize reservations
2. **Week/Day Views** - Alternative calendar layouts
3. **Event Details** - Modal/panel for full info
4. **Quick Create** - Fast booking from calendar
5. **iCal Export** - Download calendar data
6. **Print View** - Print-friendly layout
7. **Mobile Gestures** - Swipe navigation
8. **Heatmap** - Advanced visualization

### Technical Debt
- Add comprehensive error boundaries
- Implement retry logic for failed requests
- Add optimistic updates
- Improve loading states
- Add skeleton screens
- Implement proper accessibility
- Add keyboard navigation

## Contributing

### Code Style
- Use TypeScript for type safety
- Follow existing component patterns
- Use Tailwind for styling
- Document complex logic
- Add JSDoc comments for functions

### Naming Conventions
- Components: PascalCase
- Functions: camelCase
- Types: PascalCase with descriptive names
- Files: Match primary export name

### Pull Request Checklist
- [ ] Types updated if needed
- [ ] Components are responsive
- [ ] Loading states implemented
- [ ] Error handling added
- [ ] Code follows existing patterns
- [ ] Manual testing completed
