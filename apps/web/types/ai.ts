// AI System Types

export type AIProviderType = 'gemini' | 'openrouter' | 'openai';
export type MessageIntent =
  | 'availability'
  | 'pricing'
  | 'booking_info'
  | 'check_in'
  | 'amenities'
  | 'local_info'
  | 'cancellation'
  | 'complaint'
  | 'other';

export interface AIProvider {
  name: AIProviderType;
  generate(params: GenerateParams): Promise<AIResponse>;
}

export interface GenerateParams {
  prompt: string;
  system_prompt?: string;
  context?: ContextData;
  temperature?: number;
  max_tokens?: number;
  stop_sequences?: string[];
  model?: string;
}

export interface AIResponse {
  content: string;
  confidence: number;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  latency_ms: number;
  safety_flags?: {
    harassment: boolean;
    hate_speech: boolean;
    sexually_explicit: boolean;
    dangerous_content: boolean;
  };
  finish_reason?: string;
  provider: AIProviderType;
}

// Context types for AI
export interface ContextData {
  thread_id: string;
  conversation_history: ConversationMessage[];
  reservation?: ReservationContext;
  property?: PropertyContext;
  lot?: LotContext;
  organization?: OrganizationContext;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ReservationContext {
  id: string;
  guest_name: string;
  guest_email: string;
  check_in: string;
  check_out: string;
  guests_count: number;
  total_price: number;
  status: string;
  payment_status: string;
  channel: string;
  nights: number;
}

export interface PropertyContext {
  id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  country: string;
  check_in_time?: string;
  check_out_time?: string;
  house_rules?: string;
  wifi_info?: string;
}

export interface LotContext {
  id: string;
  title: string;
  description?: string;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  base_price: number;
  cleaning_fee: number;
  pets_allowed: boolean;
  amenities?: string[];
}

export interface OrganizationContext {
  id: string;
  name: string;
  support_email?: string;
  support_phone?: string;
}

// Confidence scoring types
export interface ConfidenceFactors {
  message_clarity: number; // 0-1: How clear is the user message
  context_availability: number; // 0-1: How much context we have
  intent_confidence: number; // 0-1: How confident we are about intent
  entity_extraction: number; // 0-1: Did we extract entities (dates, prices, etc)
  safety_score: number; // 0-1: Safety/appropriateness
  model_confidence?: number; // 0-1: Model's own confidence (if provided)
}

export interface IntentAnalysis {
  intent: MessageIntent;
  confidence: number;
  entities: {
    dates?: string[];
    prices?: number[];
    guests?: number;
    amenities?: string[];
    locations?: string[];
  };
  sentiment?: 'positive' | 'neutral' | 'negative';
  urgency?: 'low' | 'medium' | 'high';
  requires_action?: boolean;
}

export interface EscalationDecision {
  should_escalate: boolean;
  reason?: string;
  confidence: number;
  factors: {
    low_confidence: boolean;
    complaint_detected: boolean;
    payment_issue: boolean;
    cancellation_request: boolean;
    unsafe_content: boolean;
    complex_query: boolean;
  };
}

// Prompt template types
export interface PromptTemplate {
  name: string;
  system_prompt: string;
  user_prompt_template: string;
  temperature: number;
  max_tokens: number;
  intent?: MessageIntent;
}

export interface FormattedPrompt {
  system_prompt: string;
  user_prompt: string;
  context: ContextData;
}

// AI configuration
export interface AIConfig {
  primary_provider: AIProviderType;
  fallback_provider: AIProviderType;
  confidence_threshold: number;
  auto_escalate: boolean;
  max_context_messages: number;
  default_temperature: number;
  default_max_tokens: number;
  rate_limit_per_minute: number;
}

// Error types
export interface AIError {
  code: string;
  message: string;
  provider: AIProviderType;
  recoverable: boolean;
  details?: any;
}

// Response generation result
export interface GenerateResponseResult {
  content: string;
  confidence: number;
  should_escalate: boolean;
  escalation_reason?: string;
  intent: MessageIntent;
  ai_trace_id?: string;
  provider: AIProviderType;
  error?: AIError;
}
