/**
 * Typage strict des variables d'environnement (process.env.*).
 * Toute variable Stripe / auth / e-mail utilisée dans le code est déclarée ici :
 * l'accès à une variable non déclarée devient une erreur TypeScript.
 */
declare namespace NodeJS {
  interface ProcessEnv {
    // — Supabase (auth) —
    NEXT_PUBLIC_SUPABASE_URL?: string
    NEXT_PUBLIC_SUPABASE_ANON_KEY?: string
    SUPABASE_SERVICE_ROLE_KEY?: string
    NEXT_PUBLIC_SITE_URL?: string

    // — Stripe (paiement unique, jamais d'abonnement) —
    STRIPE_SECRET_KEY?: string
    STRIPE_WEBHOOK_SECRET?: string
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?: string

    // — E-mails transactionnels (Resend) —
    RESEND_API_KEY?: string
    /** Expéditeur vérifié, ex. "ATHLETE CV <no-reply@cvathlete.com>". */
    EMAIL_FROM?: string
    /** Destinataires internes des leads sur-mesure (séparés par des virgules). */
    LEAD_NOTIFY_EMAILS?: string

    // — Vercel Cron (capture des essais Pro à J+3) —
    CRON_SECRET?: string

    NODE_ENV: 'development' | 'production' | 'test'
  }
}
