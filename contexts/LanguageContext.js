import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const translations = {
  he: {
    // General
    appName: 'Pokido',
    loading: 'טוען...',
    error: 'שגיאה',
    
    // Welcome screen
    welcomeTitle: 'Pokido',
    welcomeSubtitle: 'מכשיר זיהוי קלפי פוקימון',
    openPokedex: 'פתח את הפוקידקס',
    tapToOpen: 'לחץ לפתיחה',
    
    // Menu
    menu: 'תפריט',
    pokedex: 'פוקידקס',
    scanCard: 'סרוק קלף',
    myAlbum: 'האלבום שלי',
    
    // Album
    emptyAlbum: 'האלבום ריק!',
    scanFirst: 'סרוק קלף ראשון',
    noCardsInSet: 'אין קלפים בסט זה',
    back: 'חזרה',
    savedToAlbum: 'נשמר לאלבום!',
    saveToAlbum: 'שמור לאלבום',
    scanAnother: 'סרוק עוד קלף',
    
    // Upload screen
    uploadTitle: 'העלה קלף פוקימון',
    uploadSubtitle: 'לחץ כדי לצלם או לבחור תמונה',
    camera: 'מצלמה',
    search: 'חיפוש',
    searchCard: 'חפש קלף',
    
    // Preview screen
    scan: '🔍 סרוק',
    cancel: '❌ ביטול',
    
    // Loading screen
    analyzing: 'מנתח את הקלף...',
    processing: 'מעבד תמונה...',
    identifying: 'מזהה פוקימון...',
    scanFailed: 'הסריקה נכשלה',
    
    // Result screen
    hp: 'HP',
    set: 'סט',
    cards: 'קלפים',
    rarity: 'נדירות',
    estimatedValue: 'ערך משוער',
    tips: '💡 טיפים',
    cardDetails: '📋 פרטי קלף',
    illustrator: 'מאייר',
    attacks: '⚔️ התקפות',
    weakness: 'חולשה',
    retreat: 'נסיגה',
    newScan: '🔄 חדש',
    close: '✕ סגור',
    
    // Modal
    zoom: '🔍',
    closeModal: '✕',
    
    // Footer
    poweredBy: 'Powered by Gemini AI + TCGdex',
    
    // Language
    language: 'שפה',
    hebrew: 'עברית',
    english: 'English',
  },
  en: {
    // General
    appName: 'Pokido',
    loading: 'Loading...',
    error: 'Error',
    
    // Welcome screen
    welcomeTitle: 'Pokido',
    welcomeSubtitle: 'Pokemon Card Scanner',
    openPokedex: 'Open Pokedex',
    tapToOpen: 'Tap to open',
    
    // Menu
    menu: 'Menu',
    pokedex: 'Pokedex',
    scanCard: 'Scan Card',
    myAlbum: 'My Album',
    
    // Album
    emptyAlbum: 'Album is empty!',
    scanFirst: 'Scan your first card',
    noCardsInSet: 'No cards in this set',
    back: 'Back',
    savedToAlbum: 'Saved to album!',
    saveToAlbum: 'Save to Album',
    scanAnother: 'Scan Another',
    
    // Upload screen
    uploadTitle: 'Upload Pokemon Card',
    uploadSubtitle: 'Tap to capture or select image',
    camera: 'Camera',
    search: 'Search',
    searchCard: 'Search Card',
    
    // Preview screen
    scan: '🔍 Scan',
    cancel: '❌ Cancel',
    
    // Loading screen
    analyzing: 'Analyzing card...',
    processing: 'Processing image...',
    identifying: 'Identifying Pokemon...',
    scanFailed: 'Scan failed',
    
    // Result screen
    hp: 'HP',
    set: 'Set',
    cards: 'cards',
    rarity: 'Rarity',
    estimatedValue: 'Estimated Value',
    tips: '💡 Tips',
    cardDetails: '📋 Card Details',
    illustrator: 'Illustrator',
    attacks: '⚔️ Attacks',
    weakness: 'Weakness',
    retreat: 'Retreat',
    newScan: '🔄 New',
    close: '✕ Close',
    
    // Modal
    zoom: '🔍',
    closeModal: '✕',
    
    // Footer
    poweredBy: 'Powered by Gemini AI + TCGdex',
    
    // Language
    language: 'Language',
    hebrew: 'עברית',
    english: 'English',
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('he');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load saved language preference
    const savedLang = localStorage.getItem('pokido-language');
    if (savedLang && (savedLang === 'he' || savedLang === 'en')) {
      setLanguage(savedLang);
    }
    setMounted(true);
  }, []);

  const toggleLanguage = () => {
    const newLang = language === 'he' ? 'en' : 'he';
    setLanguage(newLang);
    localStorage.setItem('pokido-language', newLang);
  };

  const setLang = (lang) => {
    if (lang === 'he' || lang === 'en') {
      setLanguage(lang);
      localStorage.setItem('pokido-language', lang);
    }
  };

  const t = (key) => {
    return translations[language][key] || key;
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <LanguageContext.Provider value={{ 
        language: 'he', 
        t: (key) => translations.he[key] || key,
        toggleLanguage: () => {},
        setLang: () => {}
      }}>
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, t, toggleLanguage, setLang }}>
      <div dir={language === 'he' ? 'rtl' : 'ltr'} style={{ height: '100%' }}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}

export default LanguageContext;
