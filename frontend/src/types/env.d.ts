declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    NEXT_PUBLIC_API_URL: string;
    NEXT_PUBLIC_WS_HOST: string;
    NEXT_PUBLIC_ENABLE_ANALYTICS?: string;
    NEXT_PUBLIC_APP_VERSION?: string;
  }
}
