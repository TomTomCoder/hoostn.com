/**
 * iCalendar Parser
 * Parses iCal (RFC 5545) format into structured events
 */

import type { ICalEvent } from '@/types/ota';

/**
 * Unfold lines according to iCal spec (lines can be folded with CRLF + space/tab)
 */
function unfoldLines(icalData: string): string {
  // Replace CRLF+space or CRLF+tab with nothing (unfold the line)
  return icalData.replace(/\r?\n[ \t]/g, '');
}

/**
 * Unescape text according to iCal spec
 * Escaped characters: \n (newline), \\ (backslash), \; (semicolon), \, (comma)
 */
function unescapeText(text: string): string {
  return text
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

/**
 * Parse iCal date/datetime to ISO format
 * Handles formats:
 * - YYYYMMDD (date only)
 * - YYYYMMDDTHHmmss (datetime local)
 * - YYYYMMDDTHHmmssZ (datetime UTC)
 */
function parseICalDate(dateStr: string): string {
  // Remove any TZID parameter (e.g., "TZID=America/New_York:20250115T140000")
  const cleanDateStr = dateStr.split(':').pop() || dateStr;

  // Date only format: YYYYMMDD
  if (cleanDateStr.length === 8) {
    const year = cleanDateStr.substring(0, 4);
    const month = cleanDateStr.substring(4, 6);
    const day = cleanDateStr.substring(6, 8);
    return `${year}-${month}-${day}`;
  }

  // DateTime format: YYYYMMDDTHHmmss or YYYYMMDDTHHmmssZ
  if (cleanDateStr.includes('T')) {
    const year = cleanDateStr.substring(0, 4);
    const month = cleanDateStr.substring(4, 6);
    const day = cleanDateStr.substring(6, 8);
    const hour = cleanDateStr.substring(9, 11);
    const minute = cleanDateStr.substring(11, 13);
    const second = cleanDateStr.substring(13, 15);
    const isUTC = cleanDateStr.endsWith('Z');

    return `${year}-${month}-${day}T${hour}:${minute}:${second}${isUTC ? 'Z' : ''}`;
  }

  // Fallback: return as-is and let Date constructor handle it
  return cleanDateStr;
}

/**
 * Parse a single VEVENT component into an ICalEvent object
 */
function parseVEvent(vevent: string): ICalEvent | null {
  const lines = vevent.split(/\r?\n/);
  const event: Partial<ICalEvent> = {};

  for (const line of lines) {
    if (!line.trim() || line.startsWith('BEGIN:') || line.startsWith('END:')) {
      continue;
    }

    // Split by first colon to get property name and value
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    let propertyPart = line.substring(0, colonIndex);
    const valuePart = line.substring(colonIndex + 1);

    // Handle property parameters (e.g., "DTSTART;TZID=America/New_York:20250115T140000")
    const semicolonIndex = propertyPart.indexOf(';');
    const propertyName = semicolonIndex !== -1
      ? propertyPart.substring(0, semicolonIndex)
      : propertyPart;

    const value = unescapeText(valuePart.trim());

    // Map iCal properties to our event object
    switch (propertyName.toUpperCase()) {
      case 'UID':
        event.uid = value;
        break;
      case 'SUMMARY':
        event.summary = value;
        break;
      case 'DTSTART':
        event.dtstart = parseICalDate(valuePart);
        break;
      case 'DTEND':
        event.dtend = parseICalDate(valuePart);
        break;
      case 'STATUS':
        event.status = value;
        break;
      case 'DESCRIPTION':
        event.description = value;
        break;
      case 'LOCATION':
        event.location = value;
        break;
      case 'CREATED':
        event.created = parseICalDate(valuePart);
        break;
      case 'LAST-MODIFIED':
        event.lastModified = parseICalDate(valuePart);
        break;
      case 'ORGANIZER':
        event.organizer = value;
        break;
      case 'ATTENDEE':
        if (!event.attendee) event.attendee = [];
        event.attendee.push(value);
        break;
      default:
        // Store other properties as-is
        event[propertyName.toLowerCase()] = value;
    }
  }

  // Validate required fields
  if (!event.uid || !event.dtstart || !event.dtend) {
    console.warn('Invalid VEVENT: missing required fields (UID, DTSTART, or DTEND)', event);
    return null;
  }

  return event as ICalEvent;
}

/**
 * Parse iCal data and extract all VEVENT components
 * @param icalData - Raw iCalendar data string
 * @returns Array of parsed ICalEvent objects
 */
export function parseICalData(icalData: string): ICalEvent[] {
  try {
    // Unfold lines first
    const unfolded = unfoldLines(icalData);

    // Split into lines
    const lines = unfolded.split(/\r?\n/);

    const events: ICalEvent[] = [];
    let currentVEvent: string[] = [];
    let inVEvent = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed === 'BEGIN:VEVENT') {
        inVEvent = true;
        currentVEvent = [trimmed];
      } else if (trimmed === 'END:VEVENT') {
        currentVEvent.push(trimmed);
        const veventStr = currentVEvent.join('\n');
        const event = parseVEvent(veventStr);
        if (event) {
          events.push(event);
        }
        inVEvent = false;
        currentVEvent = [];
      } else if (inVEvent) {
        currentVEvent.push(trimmed);
      }
    }

    return events;
  } catch (error) {
    console.error('Error parsing iCal data:', error);
    throw new Error('Failed to parse iCalendar data');
  }
}

/**
 * Fetch and parse iCal data from a URL
 * @param url - iCal feed URL (must be HTTPS)
 * @returns Array of parsed ICalEvent objects
 */
export async function fetchAndParseICal(url: string): Promise<ICalEvent[]> {
  // Validate URL (must be HTTPS for security)
  if (!url.startsWith('https://')) {
    throw new Error('iCal URL must use HTTPS protocol');
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Hoostn/1.0',
        'Accept': 'text/calendar, text/plain, */*',
      },
      // Set reasonable timeout
      signal: AbortSignal.timeout(30000), // 30 seconds
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch iCal feed: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/calendar') && !contentType.includes('text/plain')) {
      console.warn(`Unexpected content-type: ${contentType}, proceeding anyway`);
    }

    const icalData = await response.text();

    if (!icalData || icalData.trim().length === 0) {
      throw new Error('iCal feed is empty');
    }

    // Validate it looks like iCal data
    if (!icalData.includes('BEGIN:VCALENDAR') || !icalData.includes('END:VCALENDAR')) {
      throw new Error('Invalid iCalendar format: missing VCALENDAR wrapper');
    }

    return parseICalData(icalData);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch or parse iCal feed');
  }
}
