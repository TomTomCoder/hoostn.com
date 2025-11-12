// Confidence Scoring and Escalation Logic
import type {
  ConfidenceFactors,
  IntentAnalysis,
  EscalationDecision,
  MessageIntent,
  ContextData,
} from '@/types/ai';

/**
 * Analyze user message to detect intent and extract entities
 */
export function analyzeUserMessage(message: string): IntentAnalysis {
  const lowerMessage = message.toLowerCase();
  let intent: MessageIntent = 'other';
  let confidence = 0.5;
  const entities: IntentAnalysis['entities'] = {};

  // Intent patterns (simple keyword matching)
  const intentPatterns: Record<MessageIntent, string[]> = {
    availability: [
      'available',
      'availability',
      'book',
      'reserve',
      'free',
      'vacant',
      'dates',
    ],
    pricing: ['price', 'cost', 'how much', 'fee', 'charge', 'rate', 'total'],
    check_in: [
      'check in',
      'check-in',
      'checkin',
      'check out',
      'checkout',
      'arrival',
      'departure',
      'access',
      'key',
    ],
    amenities: [
      'wifi',
      'parking',
      'kitchen',
      'amenities',
      'facilities',
      'pool',
      'towels',
      'linens',
      'pet',
      'dog',
      'cat',
    ],
    local_info: [
      'restaurant',
      'nearby',
      'area',
      'attraction',
      'beach',
      'shopping',
      'recommend',
      'things to do',
      'places to visit',
    ],
    cancellation: [
      'cancel',
      'cancellation',
      'refund',
      'change dates',
      'modify',
      'reschedule',
    ],
    complaint: [
      'problem',
      'issue',
      'broken',
      'not working',
      'dirty',
      'complaint',
      'disappointed',
      'unacceptable',
    ],
    booking_info: [
      'reservation',
      'booking',
      'confirmation',
      'details',
      'my reservation',
    ],
    other: [],
  };

  // Detect intent
  let maxMatches = 0;
  for (const [intentKey, keywords] of Object.entries(intentPatterns)) {
    let matches = 0;
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        matches++;
      }
    }
    if (matches > maxMatches) {
      maxMatches = matches;
      intent = intentKey as MessageIntent;
      confidence = Math.min(0.9, 0.5 + matches * 0.1);
    }
  }

  // Extract dates (simple pattern)
  const datePatterns = [
    /\b(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})\b/g,
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/gi,
  ];
  for (const pattern of datePatterns) {
    const matches = message.match(pattern);
    if (matches) {
      entities.dates = matches;
    }
  }

  // Extract prices (€, $, numbers)
  const pricePattern = /[€$£]\s*\d+(?:[.,]\d{2})?|\d+\s*(?:euro|euros|dollar|dollars)/gi;
  const priceMatches = message.match(pricePattern);
  if (priceMatches) {
    entities.prices = priceMatches.map((p) => {
      const num = parseFloat(p.replace(/[€$£,\s]/g, ''));
      return isNaN(num) ? 0 : num;
    });
  }

  // Extract guest count
  const guestPattern = /(\d+)\s*(?:guest|guests|people|person|persons)/i;
  const guestMatch = message.match(guestPattern);
  if (guestMatch) {
    entities.guests = parseInt(guestMatch[1]);
  }

  // Sentiment analysis (very basic)
  const positiveWords = [
    'great',
    'thanks',
    'thank you',
    'perfect',
    'excellent',
    'wonderful',
    'love',
  ];
  const negativeWords = [
    'bad',
    'terrible',
    'awful',
    'disappointed',
    'angry',
    'frustrated',
    'unacceptable',
    'problem',
  ];

  let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
  const hasPositive = positiveWords.some((word) => lowerMessage.includes(word));
  const hasNegative = negativeWords.some((word) => lowerMessage.includes(word));

  if (hasPositive && !hasNegative) sentiment = 'positive';
  else if (hasNegative && !hasPositive) sentiment = 'negative';

  // Urgency detection
  const urgentWords = [
    'urgent',
    'asap',
    'immediately',
    'emergency',
    'now',
    'quickly',
  ];
  const hasUrgent = urgentWords.some((word) => lowerMessage.includes(word));
  const urgency = hasUrgent ? 'high' : sentiment === 'negative' ? 'medium' : 'low';

  // Requires action?
  const requiresAction =
    intent === 'cancellation' ||
    intent === 'complaint' ||
    intent === 'booking_info' ||
    sentiment === 'negative';

  return {
    intent,
    confidence,
    entities,
    sentiment,
    urgency,
    requires_action: requiresAction,
  };
}

/**
 * Calculate overall confidence score from multiple factors
 */
export function calculateConfidence(factors: ConfidenceFactors): number {
  // Weighted average of different confidence factors
  const weights = {
    message_clarity: 0.15,
    context_availability: 0.25,
    intent_confidence: 0.25,
    entity_extraction: 0.1,
    safety_score: 0.15,
    model_confidence: 0.1,
  };

  let totalConfidence = 0;
  let totalWeight = 0;

  // Add each factor with its weight
  for (const [key, weight] of Object.entries(weights)) {
    const factor = factors[key as keyof ConfidenceFactors];
    if (factor !== undefined) {
      totalConfidence += factor * weight;
      totalWeight += weight;
    }
  }

  // Normalize to 0-1 range
  const confidence = totalWeight > 0 ? totalConfidence / totalWeight : 0.5;

  return Math.max(0, Math.min(1, confidence));
}

/**
 * Determine if we should escalate to human based on confidence and intent
 */
export function shouldEscalate(
  confidence: number,
  intent: MessageIntent,
  message: string,
  context?: ContextData
): EscalationDecision {
  const factors = {
    low_confidence: confidence < 0.7,
    complaint_detected: intent === 'complaint',
    payment_issue: message.toLowerCase().includes('payment') || message.toLowerCase().includes('charge'),
    cancellation_request: intent === 'cancellation',
    unsafe_content: false, // Set by AI provider
    complex_query: message.length > 500 || message.split('?').length > 3,
  };

  // Immediate escalation triggers
  if (factors.complaint_detected) {
    return {
      should_escalate: true,
      reason: 'Complaint or issue reported - requires human attention',
      confidence,
      factors,
    };
  }

  if (factors.cancellation_request) {
    return {
      should_escalate: true,
      reason: 'Cancellation request - requires owner approval',
      confidence,
      factors,
    };
  }

  if (factors.payment_issue) {
    return {
      should_escalate: true,
      reason: 'Payment-related inquiry - requires human verification',
      confidence,
      factors,
    };
  }

  // Low confidence escalation
  if (factors.low_confidence) {
    return {
      should_escalate: true,
      reason: `Low confidence response (${Math.round(confidence * 100)}%)`,
      confidence,
      factors,
    };
  }

  // Complex query escalation
  if (factors.complex_query) {
    return {
      should_escalate: true,
      reason: 'Complex multi-part query - better handled by human',
      confidence,
      factors,
    };
  }

  // Missing critical context
  if (context && !context.property && !context.lot) {
    return {
      should_escalate: true,
      reason: 'Insufficient property context for accurate response',
      confidence,
      factors,
    };
  }

  // All good - no escalation needed
  return {
    should_escalate: false,
    confidence,
    factors,
  };
}

/**
 * Calculate message clarity score
 */
export function assessMessageClarity(message: string): number {
  let score = 0.5; // Base score

  // Length check (too short or too long is unclear)
  if (message.length >= 10 && message.length <= 200) {
    score += 0.2;
  } else if (message.length > 200 && message.length <= 500) {
    score += 0.1;
  }

  // Has question mark
  if (message.includes('?')) {
    score += 0.1;
  }

  // Has proper capitalization
  if (/^[A-Z]/.test(message)) {
    score += 0.1;
  }

  // Not all caps (shouting)
  if (message !== message.toUpperCase()) {
    score += 0.1;
  }

  return Math.min(1, score);
}

/**
 * Calculate context availability score
 */
export function assessContextAvailability(context?: ContextData): number {
  if (!context) return 0;

  let score = 0;

  // Has conversation history
  if (context.conversation_history && context.conversation_history.length > 0) {
    score += 0.2;
  }

  // Has property info
  if (context.property) {
    score += 0.3;
  }

  // Has lot info
  if (context.lot) {
    score += 0.2;
  }

  // Has reservation info
  if (context.reservation) {
    score += 0.3;
  }

  return Math.min(1, score);
}

/**
 * Build confidence factors for a message
 */
export function buildConfidenceFactors(
  message: string,
  context: ContextData | null,
  intentAnalysis: IntentAnalysis,
  modelConfidence?: number
): ConfidenceFactors {
  return {
    message_clarity: assessMessageClarity(message),
    context_availability: assessContextAvailability(context || undefined),
    intent_confidence: intentAnalysis.confidence,
    entity_extraction: Object.keys(intentAnalysis.entities).length > 0 ? 0.8 : 0.5,
    safety_score: 1.0, // Default safe, AI provider will update if needed
    model_confidence: modelConfidence,
  };
}
