/**
 * iCalendar Generator
 * Generates iCal (RFC 5545) format from reservations
 */

import type { Reservation } from '@/types/booking';

/**
 * Escape text according to iCal spec
 * Escape: \n (newline), \\ (backslash), \; (semicolon), \, (comma)
 */
function escapeText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Format date to iCal DATE format (YYYYMMDD)
 */
function formatICalDate(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Format datetime to iCal DATETIME format (YYYYMMDDTHHmmssZ)
 */
function formatICalDateTime(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hour = String(date.getUTCHours()).padStart(2, '0');
  const minute = String(date.getUTCMinutes()).padStart(2, '0');
  const second = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hour}${minute}${second}Z`;
}

/**
 * Fold long lines according to iCal spec (max 75 octets per line)
 * Continuation lines start with a space
 */
function foldLine(line: string): string {
  if (line.length <= 75) {
    return line;
  }

  const folded: string[] = [];
  let remaining = line;

  // First line can be 75 chars
  folded.push(remaining.substring(0, 75));
  remaining = remaining.substring(75);

  // Subsequent lines can be 74 chars (1 char for leading space)
  while (remaining.length > 0) {
    folded.push(' ' + remaining.substring(0, 74));
    remaining = remaining.substring(74);
  }

  return folded.join('\r\n');
}

/**
 * Generate a single VEVENT component for a reservation
 */
function generateVEvent(reservation: Reservation, lotTitle: string): string[] {
  const lines: string[] = [];

  // Generate UID (use reservation ID or OTA booking ID if available)
  const uid = reservation.external_id || reservation.id;

  // Created and last modified timestamps
  const now = new Date();
  const created = reservation.created_at ? new Date(reservation.created_at) : now;
  const lastModified = reservation.updated_at ? new Date(reservation.updated_at) : now;

  // Event summary (title)
  const summary = `${lotTitle} - ${reservation.guest_name}`;

  // Description with booking details
  const description = [
    `Booking: ${reservation.id}`,
    `Guest: ${reservation.guest_name}`,
    `Email: ${reservation.guest_email}`,
    `Guests: ${reservation.guests_count}`,
    `Total: €${reservation.total_price}`,
    `Status: ${reservation.status}`,
    reservation.guest_phone ? `Phone: ${reservation.guest_phone}` : '',
  ]
    .filter(Boolean)
    .join('\\n');

  // Status mapping
  const status =
    reservation.status === 'confirmed' || reservation.status === 'checked_in'
      ? 'CONFIRMED'
      : reservation.status === 'cancelled'
      ? 'CANCELLED'
      : 'TENTATIVE';

  // Build VEVENT
  lines.push('BEGIN:VEVENT');
  lines.push(`UID:${uid}@hoostn.com`);
  lines.push(`DTSTAMP:${formatICalDateTime(now)}`);
  lines.push(`CREATED:${formatICalDateTime(created)}`);
  lines.push(`LAST-MODIFIED:${formatICalDateTime(lastModified)}`);
  lines.push(`DTSTART;VALUE=DATE:${formatICalDate(reservation.check_in)}`);
  lines.push(`DTEND;VALUE=DATE:${formatICalDate(reservation.check_out)}`);
  lines.push(`SUMMARY:${escapeText(summary)}`);
  lines.push(`DESCRIPTION:${escapeText(description)}`);
  lines.push(`STATUS:${status}`);
  lines.push(`TRANSP:OPAQUE`); // Mark as busy time

  // Add organizer (property email could be added here if available)
  lines.push('ORGANIZER;CN=Hoostn:mailto:noreply@hoostn.com');

  lines.push('END:VEVENT');

  return lines;
}

/**
 * Generate complete iCal feed for a lot's reservations
 * @param lotId - Lot ID
 * @param lotTitle - Lot title for event summaries
 * @param reservations - Array of reservations to include
 * @param baseUrl - Base URL for the calendar (optional)
 * @returns Complete iCalendar string
 */
export function generateICalForLot(
  lotId: string,
  lotTitle: string,
  reservations: Reservation[],
  baseUrl?: string
): string {
  const lines: string[] = [];
  const now = new Date();

  // VCALENDAR header
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//Hoostn//Booking Calendar//EN');
  lines.push('CALSCALE:GREGORIAN');
  lines.push('METHOD:PUBLISH');
  lines.push(`X-WR-CALNAME:${escapeText(lotTitle)} - Hoostn`);
  lines.push('X-WR-TIMEZONE:UTC');
  lines.push(`X-PUBLISHED-TTL:PT1H`); // Suggest 1 hour cache

  if (baseUrl) {
    lines.push(`X-WR-CALDESC:Booking calendar for ${escapeText(lotTitle)}`);
    lines.push(`URL:${baseUrl}/api/ota/ical/${lotId}`);
  }

  // Add VEVENT for each reservation
  // Filter to only include confirmed, checked_in, and pending reservations
  const activeReservations = reservations.filter(
    (r) =>
      r.status === 'confirmed' ||
      r.status === 'checked_in' ||
      r.status === 'pending'
  );

  for (const reservation of activeReservations) {
    const veventLines = generateVEvent(reservation, lotTitle);
    lines.push(...veventLines);
  }

  // VCALENDAR footer
  lines.push('END:VCALENDAR');

  // Fold long lines and join with CRLF
  const foldedLines = lines.map((line) => foldLine(line));
  return foldedLines.join('\r\n') + '\r\n';
}

/**
 * Generate iCal content-type header
 */
export function getICalHeaders(): Record<string, string> {
  return {
    'Content-Type': 'text/calendar; charset=utf-8',
    'Content-Disposition': 'inline; filename="calendar.ics"',
    'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
  };
}
