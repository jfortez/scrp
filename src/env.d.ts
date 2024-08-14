declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SUPABASE_URL: string;
      SUPABASE_ANON_KEY: string;
      RUC: string;
      PASSWORD: string;
      PORT: string;
    }
  }
}

export {};
