// AI Orchestrator - Main coordination logic for AI responses
import { createClient } from '@/lib/supabase/server';
import { buildContext, formatContextForPrompt } from './context-builder';
import { buildPrompt } from './prompts/system-prompts';
import { geminiProvider } from './providers/gemini';
import { openRouterProvider } from './providers/openrouter';
import {
  analyzeUserMessage,
  buildConfidenceFactors,
  calculateConfidence,
  shouldEscalate,
} from './confidence-scorer';
import type { GenerateResponseResult, AIError } from '@/types/ai';

/**
 * Generate AI response for a user message in a thread
 * This is the main entry point for AI chat functionality
 */
export async function generateAIResponse(
  threadId: string,
  userMessage: string
): Promise<GenerateResponseResult> {
  try {
    // Step 1: Build context from thread
    const context = await buildContext(threadId);
    if (!context) {
      return {
        content: 'I apologize, but I was unable to load the conversation context. The property owner will be with you shortly.',
        confidence: 0,
        should_escalate: true,
        escalation_reason: 'Failed to load context',
        intent: 'other',
        provider: 'gemini',
        error: {
          code: 'CONTEXT_ERROR',
          message: 'Failed to build context',
          provider: 'gemini',
          recoverable: false,
        },
      };
    }

    // Step 2: Analyze user message for intent
    const intentAnalysis = analyzeUserMessage(userMessage);

    // Step 3: Format context for prompt
    const contextText = formatContextForPrompt(context);

    // Step 4: Build prompt based on intent
    const { system, user } = buildPrompt(
      intentAnalysis.intent,
      userMessage,
      contextText
    );

    // Step 5: Try primary provider (Gemini)
    let aiResponse;
    let provider: 'gemini' | 'openrouter' = 'gemini';
    let aiError: AIError | undefined;

    try {
      aiResponse = await geminiProvider.generate({
        prompt: user,
        system_prompt: system,
        context,
        temperature: 0.7,
        max_tokens: 1024,
      });
    } catch (error: any) {
      console.error('Gemini provider failed, trying fallback:', error);
      aiError = error;

      // Step 6: Fallback to OpenRouter
      try {
        aiResponse = await openRouterProvider.generate({
          prompt: user,
          system_prompt: system,
          context,
          temperature: 0.7,
          max_tokens: 1024,
        });
        provider = 'openrouter';
      } catch (fallbackError: any) {
        console.error('OpenRouter fallback also failed:', fallbackError);

        // Both providers failed - escalate
        return {
          content: 'I apologize, but I am experiencing technical difficulties. The property owner will respond to you shortly.',
          confidence: 0,
          should_escalate: true,
          escalation_reason: 'AI providers unavailable',
          intent: intentAnalysis.intent,
          provider: 'gemini',
          error: fallbackError,
        };
      }
    }

    // Step 7: Calculate overall confidence
    const confidenceFactors = buildConfidenceFactors(
      userMessage,
      context,
      intentAnalysis,
      aiResponse.confidence
    );

    // Update safety score from AI response
    if (aiResponse.safety_flags) {
      const hasSafetyIssue = Object.values(aiResponse.safety_flags).some(
        (flag) => flag === true
      );
      if (hasSafetyIssue) {
        confidenceFactors.safety_score = 0.3;
      }
    }

    const overallConfidence = calculateConfidence(confidenceFactors);

    // Step 8: Determine if escalation is needed
    const escalationDecision = shouldEscalate(
      overallConfidence,
      intentAnalysis.intent,
      userMessage,
      context
    );

    // Step 9: Store AI trace for monitoring
    const aiTraceId = await storeAITrace(threadId, {
      model: aiResponse.model,
      prompt_tokens: aiResponse.usage.prompt_tokens,
      completion_tokens: aiResponse.usage.completion_tokens,
      latency_ms: aiResponse.latency_ms,
      confidence: overallConfidence,
      safety_flags: aiResponse.safety_flags,
    });

    // Step 10: Return result
    return {
      content: aiResponse.content,
      confidence: overallConfidence,
      should_escalate: escalationDecision.should_escalate,
      escalation_reason: escalationDecision.reason,
      intent: intentAnalysis.intent,
      ai_trace_id: aiTraceId,
      provider,
      error: aiError,
    };
  } catch (error) {
    console.error('Orchestrator error:', error);

    return {
      content: 'I apologize for the inconvenience. The property owner will assist you shortly.',
      confidence: 0,
      should_escalate: true,
      escalation_reason: 'Unexpected error in AI orchestrator',
      intent: 'other',
      provider: 'gemini',
      error: {
        code: 'ORCHESTRATOR_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        provider: 'gemini',
        recoverable: false,
        details: error,
      },
    };
  }
}

/**
 * Store AI trace in database for monitoring and analytics
 */
async function storeAITrace(
  threadId: string,
  trace: {
    model: string;
    prompt_tokens: number;
    completion_tokens: number;
    latency_ms: number;
    confidence: number;
    safety_flags?: any;
  }
): Promise<string | undefined> {
  try {
    const supabase = await createClient();

    // Note: We need service role to bypass RLS for AI traces
    // For now, we'll use the regular client and it should work with the service_role policy
    const { data, error } = await supabase
      .from('ai_traces')
      .insert({
        thread_id: threadId,
        model: trace.model,
        prompt_tokens: trace.prompt_tokens,
        completion_tokens: trace.completion_tokens,
        latency_ms: trace.latency_ms,
        confidence: trace.confidence,
        safety_flags: trace.safety_flags || {},
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to store AI trace:', error);
      return undefined;
    }

    return data?.id;
  } catch (error) {
    console.error('Error storing AI trace:', error);
    return undefined;
  }
}

/**
 * Simple wrapper for generating a quick AI response (for testing)
 */
export async function quickResponse(message: string): Promise<string> {
  try {
    const response = await geminiProvider.generate({
      prompt: message,
      system_prompt:
        'You are a helpful assistant for vacation rental properties. Be concise and friendly.',
      temperature: 0.7,
      max_tokens: 512,
    });

    return response.content;
  } catch (error) {
    console.error('Quick response error:', error);
    return 'I apologize, but I am unable to respond at the moment.';
  }
}
