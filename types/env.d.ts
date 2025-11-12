declare namespace NodeJS {
  interface ProcessEnv {
    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;

    // Stripe
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
    STRIPE_SECRET_KEY: string;
    STRIPE_WEBHOOK_SECRET: string;

    // Email
    RESEND_API_KEY: string;
    RESEND_FROM_EMAIL: string;

    // SMS
    TWILIO_ACCOUNT_SID: string;
    TWILIO_AUTH_TOKEN: string;
    TWILIO_PHONE_NUMBER: string;

    // AI
    OPENROUTER_API_KEY: string;
    GEMINI_API_KEY: string;

    // App
    NEXT_PUBLIC_APP_URL: string;
    NEXT_PUBLIC_API_URL: string;

    // OTA
    BOOKING_API_KEY: string;
    BOOKING_API_SECRET: string;

    // Environment
    NODE_ENV: 'development' | 'production' | 'test';
  }
}
