// Gemini AI Provider using Google Generative AI
import type {
  AIProvider,
  GenerateParams,
  AIResponse,
} from '@/types/ai';

interface GeminiSafetyRating {
  category: string;
  probability: string;
}

interface GeminiUsageMetadata {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
}

interface GeminiCandidate {
  content: {
    parts: Array<{ text: string }>;
  };
  finishReason?: string;
  safetyRatings?: GeminiSafetyRating[];
}

interface GeminiResponse {
  candidates: GeminiCandidate[];
  usageMetadata?: GeminiUsageMetadata;
}

export class GeminiProvider implements AIProvider {
  name: 'gemini' = 'gemini';
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('Gemini API key is required');
    }
  }

  async generate(params: GenerateParams): Promise<AIResponse> {
    const startTime = Date.now();
    const model = params.model || 'gemini-1.5-flash';

    try {
      // Build the prompt
      const contents = this.buildContents(params);
      const systemInstruction = params.system_prompt
        ? { parts: [{ text: params.system_prompt }] }
        : undefined;

      // Call Gemini API
      const url = `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          systemInstruction,
          generationConfig: {
            temperature: params.temperature ?? 0.7,
            maxOutputTokens: params.max_tokens ?? 1024,
            stopSequences: params.stop_sequences,
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
          ],
        }),
      });

      const latency = Date.now() - startTime;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Gemini API error: ${response.status} - ${errorData.error?.message || response.statusText}`
        );
      }

      const data: GeminiResponse = await response.json();
      const candidate = data.candidates?.[0];

      if (!candidate) {
        throw new Error('No response candidate from Gemini');
      }

      const content = candidate.content.parts[0]?.text || '';
      const safetyFlags = this.parseSafetyRatings(candidate.safetyRatings);
      const confidence = this.calculateConfidence(candidate);

      return {
        content,
        confidence,
        model,
        usage: {
          prompt_tokens: data.usageMetadata?.promptTokenCount || 0,
          completion_tokens: data.usageMetadata?.candidatesTokenCount || 0,
          total_tokens: data.usageMetadata?.totalTokenCount || 0,
        },
        latency_ms: latency,
        safety_flags: safetyFlags,
        finish_reason: candidate.finishReason,
        provider: 'gemini',
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      console.error('Gemini provider error:', error);
      throw {
        code: 'GEMINI_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        provider: 'gemini',
        recoverable: true,
        details: error,
      };
    }
  }

  private buildContents(params: GenerateParams) {
    const contents = [];

    // Add conversation history if available
    if (params.context?.conversation_history) {
      for (const msg of params.context.conversation_history) {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }

    // Add current prompt
    contents.push({
      role: 'user',
      parts: [{ text: params.prompt }],
    });

    return contents;
  }

  private parseSafetyRatings(ratings?: GeminiSafetyRating[]) {
    if (!ratings) {
      return {
        harassment: false,
        hate_speech: false,
        sexually_explicit: false,
        dangerous_content: false,
      };
    }

    const flags = {
      harassment: false,
      hate_speech: false,
      sexually_explicit: false,
      dangerous_content: false,
    };

    for (const rating of ratings) {
      const isBlocked = ['HIGH', 'MEDIUM'].includes(rating.probability);

      if (rating.category.includes('HARASSMENT')) {
        flags.harassment = isBlocked;
      } else if (rating.category.includes('HATE_SPEECH')) {
        flags.hate_speech = isBlocked;
      } else if (rating.category.includes('SEXUALLY_EXPLICIT')) {
        flags.sexually_explicit = isBlocked;
      } else if (rating.category.includes('DANGEROUS_CONTENT')) {
        flags.dangerous_content = isBlocked;
      }
    }

    return flags;
  }

  private calculateConfidence(candidate: GeminiCandidate): number {
    // Start with base confidence
    let confidence = 0.85;

    // Reduce confidence based on safety ratings
    if (candidate.safetyRatings) {
      for (const rating of candidate.safetyRatings) {
        if (rating.probability === 'MEDIUM') {
          confidence -= 0.1;
        } else if (rating.probability === 'HIGH') {
          confidence -= 0.2;
        }
      }
    }

    // Reduce confidence if response was stopped early
    if (candidate.finishReason && candidate.finishReason !== 'STOP') {
      confidence -= 0.15;
    }

    // Check response length (very short responses might be less confident)
    const responseLength = candidate.content.parts[0]?.text.length || 0;
    if (responseLength < 20) {
      confidence -= 0.1;
    }

    return Math.max(0, Math.min(1, confidence));
  }
}

// Export a singleton instance
export const geminiProvider = new GeminiProvider();
