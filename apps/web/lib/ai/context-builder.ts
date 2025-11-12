// AI Context Builder - Load thread, reservation, property, lot data
import { createClient } from '@/lib/supabase/server';
import type {
  ContextData,
  ConversationMessage,
  ReservationContext,
  PropertyContext,
  LotContext,
  OrganizationContext,
} from '@/types/ai';

/**
 * Build context for AI from a thread
 * Loads thread messages, reservation, property, lot, and organization data
 */
export async function buildContext(threadId: string): Promise<ContextData | null> {
  const supabase = await createClient();

  try {
    // Fetch thread with reservation
    const { data: thread, error: threadError } = await supabase
      .from('threads')
      .select(
        `
        *,
        reservation:reservations(
          id,
          guest_name,
          guest_email,
          check_in,
          check_out,
          guests_count,
          total_price,
          status,
          payment_status,
          channel,
          lot:lots(
            id,
            title,
            description,
            bedrooms,
            bathrooms,
            max_guests,
            base_price,
            cleaning_fee,
            pets_allowed,
            property:properties(
              id,
              name,
              description,
              address,
              city,
              country,
              org_id
            )
          )
        )
      `
      )
      .eq('id', threadId)
      .single();

    if (threadError || !thread) {
      console.error('Failed to load thread:', threadError);
      return null;
    }

    // Fetch last 20 messages from the thread
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (messagesError) {
      console.error('Failed to load messages:', messagesError);
      return null;
    }

    // Build conversation history
    const conversationHistory: ConversationMessage[] = (messages || [])
      .reverse() // Oldest first
      .map((msg) => ({
        role: msg.author_type === 'ai' ? 'assistant' : 'user',
        content: msg.body,
        timestamp: msg.created_at,
      }));

    // Build reservation context
    let reservationContext: ReservationContext | undefined;
    if (thread.reservation) {
      const checkIn = new Date(thread.reservation.check_in);
      const checkOut = new Date(thread.reservation.check_out);
      const nights = Math.ceil(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
      );

      reservationContext = {
        id: thread.reservation.id,
        guest_name: thread.reservation.guest_name,
        guest_email: thread.reservation.guest_email,
        check_in: thread.reservation.check_in,
        check_out: thread.reservation.check_out,
        guests_count: thread.reservation.guests_count,
        total_price: thread.reservation.total_price,
        status: thread.reservation.status,
        payment_status: thread.reservation.payment_status,
        channel: thread.reservation.channel,
        nights,
      };
    }

    // Build lot context
    let lotContext: LotContext | undefined;
    if (thread.reservation?.lot) {
      const lot = thread.reservation.lot;
      lotContext = {
        id: lot.id,
        title: lot.title,
        description: lot.description,
        bedrooms: lot.bedrooms,
        bathrooms: lot.bathrooms,
        max_guests: lot.max_guests,
        base_price: lot.base_price,
        cleaning_fee: lot.cleaning_fee,
        pets_allowed: lot.pets_allowed,
      };
    }

    // Build property context
    let propertyContext: PropertyContext | undefined;
    if (thread.reservation?.lot?.property) {
      const property = thread.reservation.lot.property;
      propertyContext = {
        id: property.id,
        name: property.name,
        description: property.description,
        address: property.address,
        city: property.city,
        country: property.country,
      };
    }

    // Fetch organization context
    let organizationContext: OrganizationContext | undefined;
    if (thread.org_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('id', thread.org_id)
        .single();

      if (org) {
        organizationContext = {
          id: org.id,
          name: org.name,
        };
      }
    }

    return {
      thread_id: threadId,
      conversation_history: conversationHistory,
      reservation: reservationContext,
      property: propertyContext,
      lot: lotContext,
      organization: organizationContext,
    };
  } catch (error) {
    console.error('Error building context:', error);
    return null;
  }
}

/**
 * Format context data into a text prompt for the AI
 */
export function formatContextForPrompt(context: ContextData): string {
  const sections: string[] = [];

  // Organization info
  if (context.organization) {
    sections.push(`PROPERTY MANAGEMENT: ${context.organization.name}`);
  }

  // Property info
  if (context.property) {
    sections.push(
      `PROPERTY: ${context.property.name}`,
      `Location: ${context.property.address}, ${context.property.city}, ${context.property.country}`
    );
    if (context.property.description) {
      sections.push(`Description: ${context.property.description}`);
    }
  }

  // Lot/Unit info
  if (context.lot) {
    sections.push(
      `\nACCOMMODATION: ${context.lot.title}`,
      `Bedrooms: ${context.lot.bedrooms}, Bathrooms: ${context.lot.bathrooms}`,
      `Max Guests: ${context.lot.max_guests}`,
      `Base Price: €${context.lot.base_price}/night`,
      `Cleaning Fee: €${context.lot.cleaning_fee}`,
      `Pets: ${context.lot.pets_allowed ? 'Allowed' : 'Not allowed'}`
    );
    if (context.lot.description) {
      sections.push(`Description: ${context.lot.description}`);
    }
  }

  // Reservation info
  if (context.reservation) {
    const checkIn = new Date(context.reservation.check_in);
    const checkOut = new Date(context.reservation.check_out);
    const checkInStr = checkIn.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const checkOutStr = checkOut.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    sections.push(
      `\nRESERVATION DETAILS:`,
      `Guest: ${context.reservation.guest_name}`,
      `Check-in: ${checkInStr}`,
      `Check-out: ${checkOutStr}`,
      `Nights: ${context.reservation.nights}`,
      `Guests: ${context.reservation.guests_count}`,
      `Total Price: €${context.reservation.total_price}`,
      `Status: ${context.reservation.status}`,
      `Payment: ${context.reservation.payment_status}`,
      `Booking Channel: ${context.reservation.channel}`
    );
  }

  // Recent conversation
  if (context.conversation_history.length > 0) {
    sections.push(`\nRECENT CONVERSATION:`);
    const recentMessages = context.conversation_history.slice(-10); // Last 10 messages
    for (const msg of recentMessages) {
      const role = msg.role === 'assistant' ? 'You' : 'Guest';
      sections.push(`${role}: ${msg.content}`);
    }
  }

  return sections.join('\n');
}

/**
 * Extract key dates from context for availability checking
 */
export function extractDatesFromContext(context: ContextData): {
  checkIn?: Date;
  checkOut?: Date;
} {
  if (!context.reservation) {
    return {};
  }

  return {
    checkIn: new Date(context.reservation.check_in),
    checkOut: new Date(context.reservation.check_out),
  };
}

/**
 * Check if context has sufficient information for AI response
 */
export function hasMinimumContext(context: ContextData): boolean {
  // We need at least property or lot information
  return !!(context.property || context.lot);
}
