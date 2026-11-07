// 보안 #2: 인메모리 Rate Limiter
// 서버 재시작 시 초기화되지만 MVP에는 충분함. 스케일업 시 Upstash Redis로 교체 권장.

interface Entry {
  count: number
  resetAt: number
}

const store = new Map<string, Entry>()

export function rateLimit(
  key: string,
  max: number,
  windowSec: number
): { ok: boolean; remaining: number; retryAfterSec: number } {
  const now = Date.now()
  const windowMs = windowSec * 1000
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: max - 1, retryAfterSec: 0 }
  }

  if (entry.count >= max) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.ceil((entry.resetAt - now) / 1000),
    }
  }

  entry.count++
  return { ok: true, remaining: max - entry.count, retryAfterSec: 0 }
}

// 오래된 항목 정리 (메모리 누수 방지)
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(key)
  }
}, 60_000)
