// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type { AppProps } from 'next/app';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import Layout from '@/components/Layout';
import '@/styles/globals.css';

// Development mode authentication bypass
if (process.env.NODE_ENV === 'development') {
  // Mock authentication token for development
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', 'dev-mode-token');
  }
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
      <Toaster />
    </ThemeProvider>
  );
}
