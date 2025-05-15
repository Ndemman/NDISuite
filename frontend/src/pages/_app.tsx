// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type { AppProps } from 'next/app';
import type { NextPage } from 'next';
import type { ReactElement, ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import Layout from '@/components/Layout';
import '@/styles/globals.css';
import { useEffect } from 'react';
import { initializeErrorHandling } from '@/utils/errorHandling';
import { initAuth } from '@/utils/initAuth';

// Add type for pages with custom layouts
export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode
};

// Update AppProps to include the custom layout type
type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
};

export default function App({ Component, pageProps }: AppPropsWithLayout) {
  // Use the layout defined at the page level, or fall back to just rendering the page without a layout
  const getLayout = Component.getLayout ?? ((page) => <Layout>{page}</Layout>);
  
  // Initialize error handling and auth
  useEffect(() => {
    initializeErrorHandling();
    initAuth(); // Run once on client mount to hydrate TokenStore from localStorage
  }, []);
  
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true}>
      {getLayout(<Component {...pageProps} />)}
      <Toaster />
    </ThemeProvider>
  );
}
