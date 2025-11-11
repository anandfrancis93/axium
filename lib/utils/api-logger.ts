import { createClient } from '@/lib/supabase/server'

// Cost per 1M tokens (as of January 2025)
const PRICING = {
  // Anthropic Claude
  'claude-sonnet-4-5-20250929': { input: 3.00, output: 15.00 },
  'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
  'claude-3-5-haiku-20241022': { input: 0.80, output: 4.00 },

  // OpenAI
  'gpt-4o': { input: 2.50, output: 10.00 },
  'gpt-4o-mini': { input: 0.150, output: 0.600 },
  'text-embedding-3-small': { input: 0.02, output: 0 },

  // Google Gemini
  'gemini-1.5-pro': { input: 1.25, output: 5.00 },
  'gemini-1.5-flash': { input: 0.075, output: 0.30 },
}

interface LogAPICallParams {
  userId?: string
  provider: 'anthropic' | 'openai' | 'google'
  model: string
  endpoint: string
  inputTokens: number
  outputTokens: number
  latencyMs?: number
  purpose?: string
  metadata?: Record<string, any>
  status?: 'success' | 'error' | 'rate_limit'
  errorMessage?: string
}

export async function logAPICall(params: LogAPICallParams) {
  try {
    const {
      userId,
      provider,
      model,
      endpoint,
      inputTokens,
      outputTokens,
      latencyMs,
      purpose,
      metadata = {},
      status = 'success',
      errorMessage
    } = params

    // Calculate costs
    const pricing = PRICING[model as keyof typeof PRICING] || { input: 0, output: 0 }
    const inputCost = (inputTokens / 1_000_000) * pricing.input
    const outputCost = (outputTokens / 1_000_000) * pricing.output
    const totalCost = inputCost + outputCost
    const totalTokens = inputTokens + outputTokens

    // Insert log entry
    const supabase = await createClient()
    const { error } = await supabase
      .from('api_call_log')
      .insert({
        user_id: userId || null,
        provider,
        model,
        endpoint,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        total_tokens: totalTokens,
        input_cost: inputCost,
        output_cost: outputCost,
        total_cost: totalCost,
        latency_ms: latencyMs,
        purpose,
        metadata,
        status,
        error_message: errorMessage
      })

    if (error) {
      console.error('Failed to log API call:', error)
    }
  } catch (error) {
    console.error('Error in logAPICall:', error)
  }
}

// Helper to calculate cost for a given token count and model
export function calculateCost(model: string, inputTokens: number, outputTokens: number) {
  const pricing = PRICING[model as keyof typeof PRICING] || { input: 0, output: 0 }
  const inputCost = (inputTokens / 1_000_000) * pricing.input
  const outputCost = (outputTokens / 1_000_000) * pricing.output
  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost
  }
}
