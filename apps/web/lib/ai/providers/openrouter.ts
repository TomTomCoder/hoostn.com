// OpenRouter AI Provider (fallback)
import type {
  AIProvider,
  GenerateParams,
  AIResponse,
} from '@/types/ai';

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenRouterProvider implements AIProvider {
  name: 'openrouter' = 'openrouter';
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENROUTER_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('OpenRouter API key is required');
    }
  }

  async generate(params: GenerateParams): Promise<AIResponse> {
    const startTime = Date.now();
    // Use Claude Haiku for cost efficiency
    const model = params.model || 'anthropic/claude-3-haiku';

    try {
      const messages = this.buildMessages(params);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://hoostn.com',
          'X-Title': 'Hoostn Chat System',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: params.temperature ?? 0.7,
          max_tokens: params.max_tokens ?? 1024,
          stop: params.stop_sequences,
        }),
      });

      const latency = Date.now() - startTime;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `OpenRouter API error: ${response.status} - ${errorData.error?.message || response.statusText}`
        );
      }

      const data: OpenRouterResponse = await response.json();
      const choice = data.choices?.[0];

      if (!choice) {
        throw new Error('No response choice from OpenRouter');
      }

      const content = choice.message.content || '';
      const confidence = this.calculateConfidence(choice, content);

      return {
        content,
        confidence,
        model: data.model,
        usage: {
          prompt_tokens: data.usage.prompt_tokens,
          completion_tokens: data.usage.completion_tokens,
          total_tokens: data.usage.total_tokens,
        },
        latency_ms: latency,
        safety_flags: {
          harassment: false,
          hate_speech: false,
          sexually_explicit: false,
          dangerous_content: false,
        },
        finish_reason: choice.finish_reason,
        provider: 'openrouter',
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      console.error('OpenRouter provider error:', error);
      throw {
        code: 'OPENROUTER_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        provider: 'openrouter',
        recoverable: false,
        details: error,
      };
    }
  }

  private buildMessages(params: GenerateParams): OpenRouterMessage[] {
    const messages: OpenRouterMessage[] = [];

    // Add system prompt
    if (params.system_prompt) {
      messages.push({
        role: 'system',
        content: params.system_prompt,
      });
    }

    // Add conversation history if available
    if (params.context?.conversation_history) {
      for (const msg of params.context.conversation_history) {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    // Add current prompt
    messages.push({
      role: 'user',
      content: params.prompt,
    });

    return messages;
  }

  private calculateConfidence(
    choice: OpenRouterResponse['choices'][0],
    content: string
  ): number {
    // Start with base confidence
    let confidence = 0.85;

    // Reduce confidence if response was stopped early
    if (choice.finish_reason !== 'stop' && choice.finish_reason !== 'end_turn') {
      confidence -= 0.15;
    }

    // Check response length
    if (content.length < 20) {
      confidence -= 0.1;
    }

    // Claude models are generally reliable, so we maintain higher base confidence
    return Math.max(0, Math.min(1, confidence));
  }
}

// Export a singleton instance
export const openRouterProvider = new OpenRouterProvider();
