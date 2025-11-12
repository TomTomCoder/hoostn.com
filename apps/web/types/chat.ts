// Chat System Types

export type ThreadStatus = 'open' | 'escalated' | 'closed';
export type AuthorType = 'guest' | 'owner' | 'agent' | 'ai';
export type ChannelType = 'direct' | 'airbnb' | 'booking' | 'email' | 'sms';

export interface Thread {
  id: string;
  org_id: string;
  reservation_id?: string;
  channel: ChannelType;
  status: ThreadStatus;
  opened_by: string;
  language: string;
  last_message_at?: string;
  opened_at: string;
  closed_at?: string;
  created_at: string;
  updated_at?: string;
  message_count?: number;
  last_rate_limit_reset?: string;

  // Relations (populated via joins)
  messages?: Message[];
  reservation?: {
    id: string;
    guest_name: string;
    guest_email: string;
    check_in: string;
    check_out: string;
    lot_id: string;
  };
  handoffs?: Handoff[];
  latest_message?: Message;
}

export interface Message {
  id: string;
  thread_id: string;
  author_type: AuthorType;
  author_id?: string;
  body: string;
  meta: {
    auto_greeting?: boolean;
    confidence?: number;
    ai_trace_id?: string;
    redacted?: boolean;
    attachments?: string[];
    [key: string]: any;
  };
  created_at: string;

  // Relations
  author?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface AITrace {
  id: string;
  thread_id: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  latency_ms: number;
  confidence: number;
  safety_flags?: {
    harassment?: boolean;
    hate_speech?: boolean;
    sexually_explicit?: boolean;
    dangerous_content?: boolean;
    [key: string]: any;
  };
  created_at: string;
}

export interface Handoff {
  id: string;
  thread_id: string;
  reason: string;
  snapshot?: {
    last_messages: Message[];
    context: any;
  };
  assigned_to?: string;
  resolved_at?: string;
  outcome?: string;
  created_at: string;

  // Relations
  assignee?: {
    id: string;
    full_name: string;
    email: string;
  };
}

// Input types for creating resources
export interface CreateThreadInput {
  org_id: string;
  reservation_id?: string;
  channel?: ChannelType;
  opened_by: string;
  language?: string;
  initial_message?: string;
}

export interface CreateMessageInput {
  thread_id: string;
  author_type: AuthorType;
  author_id?: string;
  body: string;
  meta?: Record<string, any>;
}

export interface CreateHandoffInput {
  thread_id: string;
  reason: string;
  snapshot?: any;
}

// Filter and pagination types
export interface ChatFilters {
  org_id: string;
  status?: ThreadStatus;
  channel?: ChannelType;
  reservation_id?: string;
  search?: string;
  from_date?: string;
  to_date?: string;
  has_handoff?: boolean;
}

export interface ChatPagination {
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'last_message_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedThreads {
  threads: Thread[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// Statistics types
export interface ChatStats {
  open_threads: number;
  escalated_threads: number;
  closed_threads: number;
  avg_resolution_hours: number;
  total_threads: number;
  total_ai_responses: number;
  avg_confidence: number;
  avg_latency_ms: number;
  total_tokens: number;
  low_confidence_count: number;
}

// Real-time event types
export interface ThreadEvent {
  type: 'thread_created' | 'thread_updated' | 'thread_closed';
  thread: Thread;
}

export interface MessageEvent {
  type: 'message_created';
  message: Message;
  thread_id: string;
}

export interface HandoffEvent {
  type: 'handoff_created' | 'handoff_assigned' | 'handoff_resolved';
  handoff: Handoff;
  thread_id: string;
}

// UI state types
export interface MessageDraft {
  thread_id: string;
  body: string;
  updated_at: number;
}

export interface ThreadUIState {
  is_typing: boolean;
  is_loading: boolean;
  draft?: MessageDraft;
  unread_count: number;
}
