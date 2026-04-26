import * as Sentry from "https://deno.land/x/sentry/index.mjs";

/**
 * Initializes Sentry for Supabase Edge Functions.
 * Requires SENTRY_DSN to be set in Supabase secrets.
 */
export function initSentry() {
    const dsn = Deno.env.get("SENTRY_DSN");
    if (!dsn) {
        return;
    }

    Sentry.init({
        dsn,
        // Performance Monitoring
        tracesSampleRate: 1.0,
        environment: Deno.env.get("APP_ENV") || "production",
    });
}

export { Sentry };
