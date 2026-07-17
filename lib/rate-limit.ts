import { NextRequest } from "next/server";

// Simple in-memory rate limiting
// 5 attempts per 15 minutes per IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function checkRateLimit(request: NextRequest): Promise<{ success: boolean; remaining: number }> {
  const ip = request.headers.get("x-forwarded-for") ?? 
             request.headers.get("x-real-ip") ?? 
             "anonymous";
  
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    // First attempt or window expired
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + WINDOW_MS
    });
    return { success: true, remaining: MAX_ATTEMPTS - 1 };
  }
  
  if (record.count >= MAX_ATTEMPTS) {
    // Rate limit exceeded
    return { success: false, remaining: 0 };
  }
  
  // Increment count
  record.count++;
  rateLimitMap.set(ip, record);
  return { success: true, remaining: MAX_ATTEMPTS - record.count };
}

