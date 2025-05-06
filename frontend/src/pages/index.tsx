import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard page
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Head>
        <title>NDISuite Report Generator</title>
        <meta name="description" content="Generate NDIS reports with AI-powered transcription and content generation" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="text-center">
        <h1 className="text-3xl font-bold">NDISuite Report Generator</h1>
        <p className="mt-4">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
