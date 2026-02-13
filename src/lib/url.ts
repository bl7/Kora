/**
 * Get the base URL for the application.
 * Priority:
 * 1. NEXT_PUBLIC_APP_URL env var (explicit production URL)
 * 2. VERCEL_URL env var (auto-set by Vercel)
 * 3. Request headers (origin, x-forwarded-host, host)
 * 4. localhost fallback for development
 */
type RequestLike = {
  headers: {
    get: (name: string) => string | null;
  };
};

export function getBaseUrl(request?: Request | RequestLike): string {
  // Explicit production URL (set in Vercel env vars)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Vercel auto-provides this
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Try to get from request headers
  if (request) {
    const origin = request.headers.get("origin");
    if (origin) {
      return origin;
    }

    const forwardedHost = request.headers.get("x-forwarded-host");
    const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
    if (forwardedHost) {
      return `${forwardedProto}://${forwardedHost}`;
    }

    const host = request.headers.get("host");
    if (host) {
      const proto = process.env.NODE_ENV === "production" ? "https" : "http";
      return `${proto}://${host}`;
    }
  }

  // Development fallback
  return "http://localhost:3000";
}

