import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

// Create Redis client - uses UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Rate limiters for different endpoints
export const rateLimiters = {
    // Security check: 10 requests per 10 seconds
    securityCheck: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '10 s'),
        prefix: 'ratelimit:security',
    }),

    // AI Chat: 20 requests per minute per user
    aiChat: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(20, '1 m'),
        prefix: 'ratelimit:ai-chat',
    }),

    // Semantic APIs: 30 requests per 10 seconds
    semantic: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(30, '10 s'),
        prefix: 'ratelimit:semantic',
    }),

    // General API: 100 requests per minute
    general: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, '1 m'),
        prefix: 'ratelimit:general',
    }),
};

// Helper to get identifier (IP or user ID)
export function getIdentifier(request: Request, userId?: string): string {
    if (userId) return userId;

    // Get IP from headers (Vercel provides this)
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'anonymous';
    return ip;
}

// Rate limit response helper
export function rateLimitResponse(resetTime: number) {
    return NextResponse.json(
        {
            error: 'Too many requests',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
        },
        {
            status: 429,
            headers: {
                'Retry-After': String(Math.ceil((resetTime - Date.now()) / 1000)),
            },
        }
    );
}

// Check if rate limiting is enabled (Upstash configured)
export function isRateLimitEnabled(): boolean {
    return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}
