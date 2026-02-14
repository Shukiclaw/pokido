import '../styles/globals.css';
import { LanguageProvider } from '../contexts/LanguageContext';
import { CollectionProvider } from '../contexts/CollectionContext';

function MyApp({ Component, pageProps }) {
  return (
    <LanguageProvider>
      <CollectionProvider>
        <Component {...pageProps} />
      </CollectionProvider>
    </LanguageProvider>
  );
}

export default MyApp;
