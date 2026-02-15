import '../styles/globals.css';
import '../styles/retro.css';
import Head from 'next/head';
import { Analytics } from '@vercel/analytics/react';
import { LanguageProvider } from '../contexts/LanguageContext';
import { CollectionProvider } from '../contexts/CollectionContext';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
      </Head>
      <LanguageProvider>
        <CollectionProvider>
          <Component {...pageProps} />
        </CollectionProvider>
      </LanguageProvider>
      <Analytics />
    </>
  );
}

export default MyApp;
