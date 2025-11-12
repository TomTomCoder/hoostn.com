/**
 * iCal Export Endpoint
 * Public endpoint to export lot reservations as iCalendar feed
 * GET /api/ota/ical/[lotId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateICalForLot, getICalHeaders } from '@/lib/ota/ical/generator';
import type { Reservation } from '@/types/booking';

/**
 * GET /api/ota/ical/[lotId]
 * Public endpoint - no authentication required
 * Returns iCalendar feed for a lot's reservations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { lotId: string } }
) {
  try {
    const { lotId } = params;

    if (!lotId) {
      return NextResponse.json({ error: 'Lot ID required' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Get lot details (verify it exists and is active)
    const { data: lot, error: lotError } = await supabase
      .from('lots')
      .select('id, title, status')
      .eq('id', lotId)
      .single();

    if (lotError || !lot) {
      return NextResponse.json({ error: 'Lot not found' }, { status: 404 });
    }

    // Only export for active lots
    if (lot.status !== 'active') {
      return NextResponse.json(
        { error: 'Lot is not active' },
        { status: 403 }
      );
    }

    // 2. Get active reservations for this lot
    // Only include confirmed, checked_in, and pending reservations
    // Exclude cancelled reservations
    const { data: reservations, error: reservationsError } = await supabase
      .from('reservations')
      .select('*')
      .eq('lot_id', lotId)
      .in('status', ['confirmed', 'checked_in', 'pending'])
      .gte('check_out', new Date().toISOString().split('T')[0]) // Only future/current bookings
      .order('check_in', { ascending: true });

    if (reservationsError) {
      console.error('Error fetching reservations:', reservationsError);
      return NextResponse.json(
        { error: 'Failed to fetch reservations' },
        { status: 500 }
      );
    }

    // 3. Generate iCal feed
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    const icalData = generateICalForLot(
      lotId,
      lot.title,
      (reservations as Reservation[]) || [],
      baseUrl
    );

    // 4. Return iCal data with proper headers
    const headers = getICalHeaders();

    return new NextResponse(icalData, {
      status: 200,
      headers: {
        ...headers,
        'Content-Disposition': `inline; filename="${lot.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics"`,
      },
    });
  } catch (error) {
    console.error('iCal export error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate iCal feed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Configure route
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
