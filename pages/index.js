import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import styles from '../styles/Pokedex.module.css';
import { useLanguage } from '../contexts/LanguageContext';

// Type mapping with both languages
const typeMapping = {
  water: { nameHe: 'מים', nameEn: 'Water', color: '#6890F0' },
  fire: { nameHe: 'אש', nameEn: 'Fire', color: '#F08030' },
  grass: { nameHe: 'עשב', nameEn: 'Grass', color: '#78C850' },
  electric: { nameHe: 'חשמלי', nameEn: 'Electric', color: '#F8D030' },
  psychic: { nameHe: 'פסיכי', nameEn: 'Psychic', color: '#F85888' },
  fighting: { nameHe: 'לחימה', nameEn: 'Fighting', color: '#C03028' },
  darkness: { nameHe: 'אופל', nameEn: 'Darkness', color: '#705848' },
  metal: { nameHe: 'מתכת', nameEn: 'Metal', color: '#B8B8D0' },
  fairy: { nameHe: 'פיה', nameEn: 'Fairy', color: '#EE99AC' },
  dragon: { nameHe: 'דרקון', nameEn: 'Dragon', color: '#7038F8' },
  colorless: { nameHe: 'נטול צבע', nameEn: 'Colorless', color: '#A8A878' },
  flying: { nameHe: 'מעופף', nameEn: 'Flying', color: '#A890F0' },
  poison: { nameHe: 'רעל', nameEn: 'Poison', color: '#A040A0' },
  ice: { nameHe: 'קרח', nameEn: 'Ice', color: '#98D8D8' },
  ground: { nameHe: 'קרקע', nameEn: 'Ground', color: '#E0C068' },
  rock: { nameHe: 'סלע', nameEn: 'Rock', color: '#B8A038' },
  bug: { nameHe: 'חרק', nameEn: 'Bug', color: '#A8B820' },
  ghost: { nameHe: 'רוח', nameEn: 'Ghost', color: '#705898' },
  steel: { nameHe: 'פלדה', nameEn: 'Steel', color: '#B8B8D0' },
  dark: { nameHe: 'אופל', nameEn: 'Dark', color: '#705848' },
};

// Rarity mapping with both languages
const rarityMapping = {
  'Common': { he: 'נפוץ', en: 'Common' },
  'Uncommon': { he: 'לא נפוץ', en: 'Uncommon' },
  'Rare': { he: 'נדיר', en: 'Rare' },
  'Rare Holo': { he: 'הולוגרפי נדיר', en: 'Rare Holo' },
  'Rare Ultra': { he: 'אולטרה נדיר', en: 'Rare Ultra' },
  'Ultra Rare': { he: 'אולטרה נדיר', en: 'Ultra Rare' },
  'Secret Rare': { he: 'סודי נדיר', en: 'Secret Rare' },
  'Promo': { he: 'פרומו', en: 'Promo' },
  'Amazing Rare': { he: 'מדהים נדיר', en: 'Amazing Rare' },
  'Shiny Rare': { he: 'מבריק נדיר', en: 'Shiny Rare' },
  'Radiant Rare': { he: 'זוהר נדיר', en: 'Radiant Rare' },
};

// Language Toggle Component
function LanguageToggle() {
  const { language, setLang, t } = useLanguage();
  
  return (
    <div className={styles.languageToggle}>
      <button 
        className={`${styles.langIconBtn} ${language === 'he' ? styles.active : ''}`}
        onClick={() => setLang('he')}
        title="עברית"
      >
        🇮🇱
      </button>
      <button 
        className={`${styles.langIconBtn} ${language === 'en' ? styles.active : ''}`}
        onClick={() => setLang('en')}
        title="English"
      >
        🇬🇧
      </button>
    </div>
  );
}

export default function Pokedex() {
  const { t, language } = useLanguage();
  const [view, setView] = useState('closed');
  const [image, setImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Open pokedex animation on load
    setTimeout(() => setView('open'), 500);
  }, []);

  const openPokedex = () => {
    setView('upload');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target.result);
        setView('preview');
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeCard = async () => {
    setView('loading');
    setIsScanning(true);
    setStatus(t('analyzing'));
    setError('');

    try {
      if (!selectedFile) throw new Error(language === 'he' ? 'לא נבחר קובץ' : 'No file selected');

      const formData = new FormData();
      formData.append('file', selectedFile);

      setStatus(t('processing'));
      await new Promise(r => setTimeout(r, 800));

      setStatus(t('identifying'));
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error(language === 'he' ? 'תשובה לא תקינה מהשרת' : 'Invalid server response');
      }

      // Check if API returned error
      if (!response.ok) {
        console.error('API Error:', data);
        throw new Error(data.error || `API Error: ${response.status}`);
      }

      console.log('✅ API Response:', data);
      const cardData = parseAPIResponse(data);
      
      if (!cardData) {
        throw new Error(language === 'he' ? 'לא ניתן לזהות את הקלף' : 'Could not identify card');
      }
      
      setResult(cardData);
      setIsScanning(false);
      setView('result');

    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message);
      setStatus(t('scanFailed'));
      
      setTimeout(() => {
        setIsScanning(false);
        setView('upload');
        alert('❌ ' + err.message + '\n\n' + (language === 'he' ? 'נסה שוב או צלם קלף אחר.' : 'Try again or scan a different card.'));
      }, 1000);
    }
  };

  // פונקציה לניתוח תשובת API אמיתית
  const parseAPIResponse = (apiData) => {
    console.log('Parsing API data:', apiData);
    
    if (apiData.error) {
      throw new Error(apiData.error);
    }

    const records = apiData.records;
    if (!records || !records.length) {
      throw new Error(t('error'));
    }

    const id = records[0]._identification;
    console.log('Card data:', id);
    
    // המרת סוגים לשפה הנוכחית
    const typeNames = [];
    const typeColors = [];
    if (id.types) {
      id.types.forEach(type => {
        const mapped = typeMapping[type.toLowerCase()];
        if (mapped) {
          typeNames.push(language === 'he' ? mapped.nameHe : mapped.nameEn);
          typeColors.push(mapped.color);
        }
      });
    }
    
    // חישוב ערך משוער
    let value = 0;
    if (id.prices) {
      if (id.prices.cardmarket?.trend) {
        value = Math.round(id.prices.cardmarket.trend * 4); // המרה מיורו לש"ח
      } else if (id.prices.tcgplayer?.marketPrice) {
        value = Math.round(id.prices.tcgplayer.marketPrice * 3.5); // המרה מדולר לש"ח
      }
    }
    
    // יצירת טיפים
    const tips = [];
    if (language === 'he') {
      if (id.rarity?.toLowerCase().includes('ultra') || id.rarity?.toLowerCase().includes('secret')) {
        tips.push('💎 קלף נדיר מאוד! שמור במכסה מגן');
        tips.push('📈 ערך עתידי גבוה');
      } else if (id.rarity?.toLowerCase().includes('holo') || id.rarity?.toLowerCase().includes('rare')) {
        tips.push('✨ קלף הולוגרפי - שמור בטוב');
        tips.push('💎 ערך אספני');
      }
      if (value > 50) {
        tips.push('💰 קלף יקר! שמור במקום בטוח');
      }
      if (id.hp && parseInt(id.hp) > 200) {
        tips.push('⚡ HP גבוה - קלף חזק במשחק!');
      }
      if (tips.length === 0) {
        tips.push('📚 קלף נחמד לאוסף');
        tips.push('✨ שמור בתנאים טובים');
      }
    } else {
      // English tips
      if (id.rarity?.toLowerCase().includes('ultra') || id.rarity?.toLowerCase().includes('secret')) {
        tips.push('💎 Very rare card! Store in protective sleeve');
        tips.push('📈 High future value');
      } else if (id.rarity?.toLowerCase().includes('holo') || id.rarity?.toLowerCase().includes('rare')) {
        tips.push('✨ Holographic card - keep it safe');
        tips.push('💎 Collector value');
      }
      if (value > 50) {
        tips.push('💰 Valuable card! Keep in a safe place');
      }
      if (id.hp && parseInt(id.hp) > 200) {
        tips.push('⚡ High HP - strong card in game!');
      }
      if (tips.length === 0) {
        tips.push('📚 Nice addition to collection');
        tips.push('✨ Keep in good condition');
      }
    }

    return {
      name: id.pokemon_name || id.name,
      number: id.set_total ? `#${id.card_number || id.number || '???'}/${id.set_total}` : `#${id.card_number || id.number || '???'}`,
      displayNumber: id.card_number || id.number || '???',
      setTotal: id.set_total,
      geminiDetected: id.geminiDetected,
      types: id.types || [],
      typeNames: typeNames,
      typeColors: typeColors,
      hp: id.hp || '?',
      rarity: rarityMapping[id.rarity] ? rarityMapping[id.rarity][language] : (id.rarity || (language === 'he' ? 'נפוץ' : 'Common')),
      rarityText: id.rarity || 'Common',
      stars: id.rarity?.toLowerCase().includes('ultra') ? '⭐⭐⭐⭐⭐' : 
             id.rarity?.toLowerCase().includes('rare') ? '⭐⭐⭐⭐' : '⭐⭐',
      value: value || 10,
      description: id.description || `${id.pokemon_name || id.name} - קלף פוקימון`,
      tips: tips,
      image: id.image,
      highResImage: id.highResImage,
      set: id.set,
      setId: id.setId,
      prices: id.prices,
      attacks: id.attacks,
      weaknesses: id.weaknesses,
      resistances: id.resistances,
      retreat: id.retreat,
      illustrator: id.illustrator,
      category: id.category,
      dexId: id.dexId,
      suffix: id.suffix,
      evolveFrom: id.evolveFrom,
      geminiDetected: id.geminiDetected
    };
  };

  const reset = () => {
    setView('upload');
    setImage(null);
    setSelectedFile(null);
    setResult(null);
    setError('');
    setStatus('');
    setIsScanning(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const closePokedex = () => {
    setView('closed');
    setTimeout(() => setView('open'), 200);
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Pokido - {language === 'he' ? 'פוקידו' : 'Pokido'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;700;900&display=swap" rel="stylesheet" />
      </Head>

      {/* Language Toggle */}
      <LanguageToggle />

      {/* Background Pattern */}
      <div className={styles.bgPattern}></div>

      {/* Main Pokedex Device */}
      <div className={`${styles.pokedex} ${view === 'closed' ? styles.closed : ''}`}>
        
        {/* Top Section - Blue Light */}
        <div className={styles.topSection}>
          <div className={styles.mainLight}>
            <div className={styles.lightInner}></div>
            <div className={styles.lightReflect}></div>
          </div>
          <div className={styles.smallLights}>
            <div className={`${styles.smallLight} ${styles.redLight}`}></div>
            <div className={`${styles.smallLight} ${styles.yellowLight}`}></div>
            <div className={`${styles.smallLight} ${styles.greenLight}`}></div>
          </div>
        </div>

        {/* Hinge */}
        <div className={styles.hinge}>
          <div className={styles.hingeLine}></div>
        </div>

        {/* Screen Section */}
        <div className={styles.screenSection}>
          {/* Screen Frame */}
          <div className={styles.screenFrame}>
            {/* Corner Screws */}
            <div className={`${styles.screw} ${styles.screwTL}`}></div>
            <div className={`${styles.screw} ${styles.screwTR}`}></div>
            <div className={`${styles.screw} ${styles.screwBL}`}></div>
            <div className={`${styles.screw} ${styles.screwBR}`}></div>

            {/* Red Dots */}
            <div className={styles.redDots}>
              <span></span><span></span>
            </div>

            {/* The Screen */}
            <div className={`${styles.screen} ${isScanning ? styles.scanning : ''}`}>
              {view === 'open' && (
                <div className={styles.welcomeScreen}>
                  <div className={styles.pokeballLarge}>
                    <div className={styles.pokeballButton}></div>
                  </div>
                  <h2 className={styles.welcomeTitle}>{t('welcomeTitle')}</h2>
                  <p className={styles.welcomeText}>{t('welcomeSubtitle')}</p>
                  <button className={styles.openBtn} onClick={openPokedex}>
                    {t('openPokedex')}
                  </button>
                </div>
              )}

              {view === 'upload' && (
                <div className={styles.uploadScreen}>
                  <label className={styles.cameraCircle}>
                    <span className={styles.cameraIcon}>📷</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileChange}
                      className={styles.hidden}
                    />
                  </label>
                  <p className={styles.uploadText}>{t('uploadTitle')}</p>
                  <p className={styles.uploadSubtext}>{t('uploadSubtitle')}</p>
                </div>
              )}

              {view === 'preview' && (
                <div className={styles.previewScreen}>
                  <div className={styles.previewImageContainer}>
                    <img src={image} alt={language === 'he' ? 'קלף' : 'Card'} className={styles.previewImage} />
                  </div>
                  <div className={styles.actionButtons}>
                    <button onClick={analyzeCard} className={styles.scanBtn}>
                      {t('scan')}
                    </button>
                    <button onClick={reset} className={styles.backBtn}>
                      {t('cancel')}
                    </button>
                  </div>
                </div>
              )}

              {view === 'loading' && (
                <div className={styles.loadingScreen}>
                  <div className={styles.scannerAnimation}>
                    <div className={styles.scannerLine}></div>
                    <div className={styles.scannerGlow}></div>
                  </div>
                  <div className={styles.loadingSpinner}></div>
                  <p className={styles.loadingStatus}>{status}</p>
                  {error && <p className={styles.errorMsg}>{error}</p>}
                </div>
              )}

              {view === 'result' && result && (
                <div className={styles.resultScreen}>
                  <div className={styles.resultCard}>
                    {/* Pokemon Image - Full Screen clickable */}
                    <div 
                      className={styles.pokemonImageSection}
                      onClick={() => setShowCardModal(true)}
                    >
                      {result.image ? (
                        <img 
                          src={result.image} 
                          alt={result.name} 
                          className={styles.pokemonImageFull}
                          onError={(e) => {
                            console.log('API image failed, falling back to uploaded image');
                            e.target.src = image;
                          }}
                        />
                      ) : (
                        <img src={image} alt={result.name} className={styles.pokemonImageFull} />
                      )}
                      <div className={styles.imageOverlay}>
                        <span className={styles.zoomIcon}>🔍</span>
                      </div>
                    </div>

                    {/* Info Section */}
                    <div className={styles.infoSection}>
                      <div className={styles.pokemonHeader}>
                        <span className={styles.pokemonNumber}>{result.number}</span>
                        <h2 className={styles.pokemonName}>{result.name}</h2>
                      </div>

                      {/* Type Badges */}
                      <div className={styles.typeContainer}>
                        {result.types.map((type, i) => (
                          <span 
                            key={i} 
                            className={styles.typeBadge}
                            style={{ background: result.typeColors[i] }}
                          >
                            {result.typeNames[i]}
                          </span>
                        ))}
                      </div>

                      {/* Stats */}
                      <div className={styles.stats}>
                        <div className={styles.stat}>
                          <span className={styles.statLabel}>HP</span>
                          <span className={styles.statValue}>{result.hp}</span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className={styles.description}>{result.description}</p>
                    </div>
                  </div>

                  {/* Value Card */}
                  <div className={styles.valueCard}>
                    <div className={styles.rarityBadge}>
                      <span className={styles.stars}>{result.stars}</span>
                      <span className={styles.rarityText}>{result.rarityText}</span>
                    </div>
                    <div className={styles.valueDisplay}>
                      <span className={styles.valueLabel}>{t('estimatedValue')}</span>
                      <span className={styles.valueAmount}>₪{result.value.toLocaleString()}</span>
                    </div>
                    
                    {/* פירוט מחירים */}
                    {result.prices && (result.prices.cardmarket || result.prices.tcgplayer) && (
                      <div className={styles.priceDetails}>
                        {result.prices.cardmarket?.trend && (
                          <div className={styles.priceRow}>
                            <span>Cardmarket Trend:</span>
                            <span>€{result.prices.cardmarket.trend}</span>
                          </div>
                        )}
                        {result.prices.tcgplayer?.marketPrice && (
                          <div className={styles.priceRow}>
                            <span>TCGplayer Market:</span>
                            <span>${result.prices.tcgplayer.marketPrice}</span>
                          </div>
                        )}
                        {result.prices.tcgplayer?.lowPrice && (
                          <div className={styles.priceRow}>
                            <span>Low-High:</span>
                            <span>${result.prices.tcgplayer.lowPrice} - ${result.prices.tcgplayer.highPrice}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Tips */}
                  <div className={styles.tipsSection}>
                    <h4>{t('tips')}</h4>
                    {result.tips.map((tip, i) => (
                      <div key={i} className={styles.tip}>{tip}</div>
                    ))}
                  </div>
                  
                  {/* פרטים נוספים */}
                  <div className={styles.detailsSection}>
                    <h4>{t('cardDetails')}</h4>
                    
                    {result.set && (
                      <div className={styles.detailRow}>
                        <span>{t('set')}:</span>
                        <span>{result.set} {result.setTotal ? `(${result.setTotal} ${t('cards')})` : ''}</span>
                      </div>
                    )}
                    
                    {result.illustrator && (
                      <div className={styles.detailRow}>
                        <span>{t('illustrator')}:</span>
                        <span>{result.illustrator}</span>
                      </div>
                    )}
                    
                    {result.attacks && result.attacks.length > 0 && (
                      <div className={styles.attacksSection}>
                        <h5>{t('attacks')}</h5>
                        {result.attacks.map((attack, i) => (
                          <div key={i} className={styles.attackRow}>
                            <span className={styles.attackName}>{attack.name}</span>
                            <span className={styles.attackDamage}>{attack.damage || ''}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {result.weaknesses && result.weaknesses.length > 0 && (
                      <div className={styles.detailRow}>
                        <span>{t('weakness')}:</span>
                        <span>{result.weaknesses.map(w => `${w.type} ${w.value}`).join(', ')}</span>
                      </div>
                    )}
                    
                    {result.retreat && (
                      <div className={styles.detailRow}>
                        <span>{t('retreat')}:</span>
                        <span>{result.retreat} ⭐</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Debug Info - Shows what Gemini detected */}
                  {result.geminiDetected && (
                    <div className={styles.debugSection}>
                      <h4>🔍 Debug (Gemini)</h4>
                      <div className={styles.debugRow}>
                        <span>Detected #:</span>
                        <span>{result.geminiDetected.cardNumber || 'N/A'}</span>
                      </div>
                      <div className={styles.debugRow}>
                        <span>Language:</span>
                        <span>{result.geminiDetected.language || 'N/A'}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Card Modal - Full Screen */}
                  {showCardModal && (
                    <div 
                      className={styles.cardModal}
                      onClick={() => setShowCardModal(false)}
                    >
                      <div className={styles.cardModalContent} onClick={e => e.stopPropagation()}>
                        <button 
                          className={styles.closeModalBtn}
                          onClick={() => setShowCardModal(false)}
                        >
                          ✕
                        </button>
                        <img 
                          src={result.image || image} 
                          alt={result.name}
                          className={styles.cardModalImage}
                        />
                        <div className={styles.cardModalInfo}>
                          <h3>{result.name} {result.number}</h3>
                          <p>{result.set} | {result.rarity}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Screen Controls */}
          <div className={styles.screenControls}>
            <div className={styles.blackButton}></div>
            <div className={styles.redStripes}>
              <span></span><span></span>
            </div>
            <div className={styles.blueButton}></div>
          </div>
        </div>

        {/* Keypad Section */}
        <div className={styles.keypadSection}>
          <div className={styles.dpad}>
            <div className={styles.dpadVertical}></div>
            <div className={styles.dpadHorizontal}></div>
            <div className={styles.dpadCenter}></div>
          </div>

          <div className={styles.actionSection}>
            {view === 'result' && (
              <button onClick={reset} className={styles.resetBtn}>
                {t('newScan')}
              </button>
            )}
            <button onClick={closePokedex} className={styles.closeBtn}>
              {t('close')}
            </button>
          </div>

          <div className={styles.speaker}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className={styles.speakerLine}></div>
            ))}
          </div>
        </div>

        {/* Bottom Curve */}
        <div className={styles.bottomCurve}></div>
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>Pokido © 2026</p>
        <p>{t('poweredBy')}</p>
      </footer>
    </div>
  );
}
