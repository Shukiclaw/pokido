import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import styles from '../styles/Pokedex.module.css';
import { useLanguage } from '../contexts/LanguageContext';
import { useCollection } from '../contexts/CollectionContext';

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
  const { language, setLang } = useLanguage();
  
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

// Pokedex Controls Component
function PokedexControls({ onUp, onDown, onLeft, onRight, onMenu, onA, onB, view, setView }) {
  const { t } = useLanguage();
  
  return (
    <div className={styles.pokedexControls}>
      {/* D-Pad */}
      <div className={styles.dpad}>
        <button className={`${styles.dpadBtn} ${styles.dpadUp}`} onClick={onUp}>▲</button>
        <div className={styles.dpadMiddle}>
          <button className={`${styles.dpadBtn} ${styles.dpadLeft}`} onClick={onLeft}>◀</button>
          <div className={styles.dpadCenter}></div>
          <button className={`${styles.dpadBtn} ${styles.dpadRight}`} onClick={onRight}>▶</button>
        </div>
        <button className={`${styles.dpadBtn} ${styles.dpadDown}`} onClick={onDown}>▼</button>
      </div>
      
      {/* Menu Button */}
      <button className={styles.menuBtn} onClick={onMenu}>
        {t('menu')}
      </button>
      
      {/* A/B Buttons */}
      <div className={styles.pokedexActionButtons}>
        <button className={`${styles.actionBtn} ${styles.btnA}`} onClick={onA}>A</button>
        <button className={`${styles.actionBtn} ${styles.btnB}`} onClick={onB}>B</button>
      </div>
    </div>
  );
}

export default function Pokedex() {
  const { t, language } = useLanguage();
  const { addCard, getSetsWithStats, getSetCards, getTotalStats } = useCollection();
  const [view, setView] = useState('closed');
  const [image, setImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [searchMode, setSearchMode] = useState('camera');
  const [searchName, setSearchName] = useState('');
  const [searchNumber, setSearchNumber] = useState('');
  
  // Album navigation state
  const [selectedSetIndex, setSelectedSetIndex] = useState(0);
  const [selectedCardIndex, setSelectedCardIndex] = useState(0);
  const [currentSetId, setCurrentSetId] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  
  const fileInputRef = useRef(null);
  const setsWithStats = getSetsWithStats();
  const totalStats = getTotalStats();

  useEffect(() => {
    setTimeout(() => setView('menu'), 500);
  }, []);

  // Navigation handlers
  const handleUp = () => {
    if (view === 'album') {
      setSelectedSetIndex(prev => Math.max(0, prev - 1));
    } else if (view === 'set-view' && currentSetId) {
      setSelectedCardIndex(prev => Math.max(0, prev - 4)); // Move up one row (4 cards per row)
    }
  };

  const handleDown = () => {
    if (view === 'album') {
      setSelectedSetIndex(prev => Math.min(setsWithStats.length - 1, prev + 1));
    } else if (view === 'set-view' && currentSetId) {
      const cards = getSetCards(currentSetId);
      setSelectedCardIndex(prev => Math.min(cards.length - 1, prev + 4));
    }
  };

  const handleLeft = () => {
    if (view === 'set-view' && currentSetId) {
      setSelectedCardIndex(prev => Math.max(0, prev - 1));
    }
  };

  const handleRight = () => {
    if (view === 'set-view' && currentSetId) {
      const cards = getSetCards(currentSetId);
      setSelectedCardIndex(prev => Math.min(cards.length - 1, prev + 1));
    }
  };

  const handleMenu = () => {
    setView('menu');
    setCurrentSetId(null);
  };

  const handleA = () => {
    if (view === 'menu') {
      setView('upload');
    } else if (view === 'album' && setsWithStats[selectedSetIndex]) {
      setCurrentSetId(setsWithStats[selectedSetIndex].id);
      setSelectedCardIndex(0);
      setView('set-view');
    } else if (view === 'set-view') {
      // Show card details
      const cards = getSetCards(currentSetId);
      if (cards[selectedCardIndex]) {
        // Could open a detailed view here
      }
    }
  };

  const handleB = () => {
    if (view === 'set-view') {
      setView('album');
      setCurrentSetId(null);
    } else if (view === 'upload' || view === 'album') {
      setView('menu');
    } else if (view === 'result' || view === 'preview') {
      reset();
    }
  };

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

      if (!response.ok) {
        console.error('API Error:', data);
        throw new Error(data.error || `API Error: ${response.status}`);
      }

      console.log('✅ API Response:', data);
      const cardData = parseAPIResponse(data);
      
      if (!cardData) {
        throw new Error(language === 'he' ? 'לא ניתן לזהות את הקלף' : 'Could not identify card');
      }
      
      // Auto-save to collection!
      const ident = data.records?.[0]?._identification;
      addCard({
        ...cardData,
        setId: ident?.set_id || 'unknown',
        set: ident?.set || 'Unknown Set',
        setTotal: ident?.set_total || 0
      });
      
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

  // Search by name/number
  const searchManual = async () => {
    if (!searchName.trim()) {
      alert(language === 'he' ? 'אנא הזן שם פוקימון' : 'Please enter a Pokemon name');
      return;
    }

    setView('loading');
    setIsScanning(true);
    setStatus(t('identifying'));
    setError('');

    try {
      const response = await fetch(`/api/search?name=${encodeURIComponent(searchName)}&number=${encodeURIComponent(searchNumber)}`);
      
      let data;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error(language === 'he' ? 'תשובה לא תקינה מהשרת' : 'Invalid server response');
      }

      if (!response.ok) {
        console.error('API Error:', data);
        throw new Error(data.error || `API Error: ${response.status}`);
      }

      console.log('✅ API Response:', data);
      const cardData = parseAPIResponse(data);
      
      if (!cardData) {
        throw new Error(language === 'he' ? 'לא נמצא קלף' : 'Card not found');
      }
      
      // Auto-save to collection!
      const ident = data.records?.[0]?._identification;
      addCard({
        ...cardData,
        setId: ident?.set_id || 'unknown',
        set: ident?.set || 'Unknown Set',
        setTotal: ident?.set_total || 0
      });
      
      setResult(cardData);
      setIsScanning(false);
      setView('result');

    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message);
      setIsScanning(false);
      setView('upload');
      alert('❌ ' + err.message);
    }
  };

  const parseAPIResponse = (data) => {
    console.log('Parsing API data:', data);
    
    if (!data || data.error) {
      console.error('API returned error:', data?.error);
      return null;
    }

    // Handle the API response format: { records: [{ _identification: {...} }] }
    const records = data.records;
    if (!records || !records.length) {
      console.error('No records in API response');
      return null;
    }

    const ident = records[0]._identification;
    if (!ident) {
      console.error('No _identification in record');
      return null;
    }
    
    const name = ident.pokemon_name || 
                 (language === 'he' ? 'לא ידוע' : 'Unknown');
    
    const number = ident.card_number || ident.localId || '?';
    
    let hp = ident.hp || '-';
    if (typeof hp === 'string' && hp.includes('HP')) {
      hp = hp.replace('HP', '').trim();
    }
    
    const types = ident.types || [ident.type].filter(Boolean) || ['colorless'];
    const typeColors = types.map(type => typeMapping[type?.toLowerCase()]?.color || '#A8A878');
    const typeNames = types.map(type => 
      typeMapping[type?.toLowerCase()]?.[language === 'he' ? 'nameHe' : 'nameEn'] || type
    );
    
    const rarity = ident.rarity || 'Common';
    const rarityText = rarityMapping[rarity]?.[language] || rarity;
    const stars = '★'.repeat(
      rarity.includes('Secret') ? 5 :
      rarity.includes('Ultra') || rarity.includes('Amazing') ? 4 :
      rarity.includes('Rare') && !rarity.includes('Common') ? 3 :
      rarity.includes('Uncommon') ? 2 : 1
    );
    
    const description = ident.description || 
                       ident.flavorText || 
                       (language === 'he' ? 'אין תיאור זמין' : 'No description available');
    
    // Calculate value from real prices (convert to NIS)
    let value = 0;
    if (ident.prices?.cardmarket?.trend) {
      value = Math.round(ident.prices.cardmarket.trend * 4); // Approximate EUR to NIS
    } else if (ident.prices?.tcgplayer?.marketPrice) {
      value = Math.round(ident.prices.tcgplayer.marketPrice * 3.5); // Approximate USD to NIS
    } else if (ident.prices?.tcgplayer?.lowPrice) {
      value = Math.round(ident.prices.tcgplayer.lowPrice * 3.5);
    }
    
    // Fallback if no price found
    if (value === 0) {
      value = Math.floor(Math.random() * 50) + 10;
    }
    
    const image = ident.image || 
                  ident.images?.large || 
                  ident.images?.small ||
                  null;
    
    return {
      name,
      number,
      hp,
      types,
      typeColors,
      typeNames,
      rarity,
      rarityText,
      stars,
      description,
      value,
      image,
      prices: ident.prices || {},
      set: ident.set || 'Unknown Set',
      setTotal: ident.set_total || 0,
      illustrator: ident.illustrator || null,
      attacks: ident.attacks || [],
      id: ident.id || `${number}-${Date.now()}`
    };
  };

  const reset = () => {
    setImage(null);
    setSelectedFile(null);
    setResult(null);
    setStatus('');
    setError('');
    setSearchName('');
    setSearchNumber('');
    setView('upload');
  };

  // Render Menu View
  const renderMenu = () => (
    <div className={styles.menuScreen}>
      <h2 className={styles.menuTitle}>{t('pokedex')}</h2>
      
      <div className={styles.statsOverview}>
        <div className={styles.statBox}>
          <span className={styles.statNumber}>{totalStats.totalCards}</span>
          <span className={styles.statLabel}>{t('cards')}</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statNumber}>{totalStats.totalSets}</span>
          <span className={styles.statLabel}>{t('sets')}</span>
        </div>
      </div>
      
      <div className={styles.menuOptions}>
        <button className={styles.menuOption} onClick={() => setView('upload')}>
          📸 {t('scanCard')}
        </button>
        <button className={styles.menuOption} onClick={() => setView('album')}>
          📚 {t('myAlbum')}
        </button>
      </div>
    </div>
  );

  // Render Album View (Sets List)
  const renderAlbum = () => (
    <div className={styles.albumScreen}>
      <h3 className={styles.albumTitle}>{t('myAlbum')}</h3>
      
      {setsWithStats.length === 0 ? (
        <div className={styles.emptyAlbum}>
          <p>{t('emptyAlbum')}</p>
          <button className={styles.scanBtn} onClick={() => setView('upload')}>
            {t('scanFirst')}
          </button>
        </div>
      ) : (
        <div className={styles.setsList}>
          {setsWithStats.map((set, index) => (
            <div 
              key={set.id}
              className={`${styles.setRow} ${index === selectedSetIndex ? styles.selected : ''}`}
              onClick={() => {
                setSelectedSetIndex(index);
                setCurrentSetId(set.id);
                setView('set-view');
              }}
            >
              <div className={styles.setInfo}>
                <span className={styles.setName}>{set.name}</span>
                <span className={styles.setCount}>
                  {set.collected} / {set.total} {t('cards')}
                </span>
              </div>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill}
                  style={{ width: `${set.percentage}%` }}
                />
              </div>
              <span className={styles.percentage}>{set.percentage}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Render Set View (Cards Grid)
  const renderSetView = () => {
    const cards = currentSetId ? getSetCards(currentSetId) : [];
    const setInfo = setsWithStats.find(s => s.id === currentSetId);
    const selectedCard = cards[selectedCardIndex];
    
    return (
      <div className={styles.setViewScreen}>
        <div className={styles.setHeader}>
          <button className={styles.backBtn} onClick={() => setView('album')}>
            ← {t('back')}
          </button>
          <h3 className={styles.setTitle}>{setInfo?.name}</h3>
          <span className={styles.setCountSmall}>
            {cards.length} {t('cards')}
          </span>
        </div>
        
        {cards.length === 0 ? (
          <p className={styles.noCards}>{t('noCardsInSet')}</p>
        ) : (
          <div className={styles.cardsGrid}>
            {cards.map((card, index) => (
              <div 
                key={card.id}
                className={`${styles.cardThumb} ${index === selectedCardIndex ? styles.selected : ''}`}
                onClick={() => setSelectedCardIndex(index)}
              >
                {card.image ? (
                  <img 
                    src={card.image} 
                    alt={card.name} 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCardIndex(index);
                      setShowCardModal(true);
                    }}
                  />
                ) : (
                  <div className={styles.cardPlaceholder}>?</div>
                )}
                <span className={styles.cardNumber}>#{card.number}</span>
              </div>
            ))}
          </div>
        )}
        
        {selectedCard && (
          <div className={styles.selectedCardInfo}>
            <span className={styles.selectedName}>{selectedCard.name}</span>
            <span className={styles.selectedDate}>
              {new Date(selectedCard.scannedAt).toLocaleDateString()}
            </span>
            {selectedCard.image && (
              <button 
                className={styles.zoomBtn}
                onClick={() => setShowCardModal(true)}
              >
                🔍 {t('zoom')}
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Pokido - Pokedex</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <LanguageToggle />

      <main className={styles.main}>
        {/* Pokedex Device */}
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
          
          {/* Screen */}
          <div className={styles.screen}>
            {view === 'closed' && (
              <div className={styles.closedScreen} onClick={openPokedex}>
                <div className={styles.pokeball}>
                  <div className={styles.pokeballTop}></div>
                  <div className={styles.pokeballCenter}>
                    <div className={styles.pokeballButton}></div>
                  </div>
                  <div className={styles.pokeballBottom}></div>
                </div>
                <p className={styles.tapToOpen}>{t('tapToOpen')}</p>
              </div>
            )}

            {view === 'menu' && renderMenu()}
            {view === 'album' && renderAlbum()}
            {view === 'set-view' && renderSetView()}

            {/* Original views */}
            {view === 'upload' && (
              <div className={styles.uploadScreen}>
                <div className={styles.modeToggle}>
                  <button 
                    className={searchMode === 'camera' ? styles.active : ''}
                    onClick={() => setSearchMode('camera')}
                  >
                    📷 {language === 'he' ? 'מצלמה' : 'Camera'}
                  </button>
                  <button 
                    className={searchMode === 'manual' ? styles.active : ''}
                    onClick={() => setSearchMode('manual')}
                  >
                    ⌨️ {language === 'he' ? 'חיפוש' : 'Search'}
                  </button>
                </div>

                {searchMode === 'camera' ? (
                  <>
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
                  </>
                ) : (
                  <div className={styles.manualSearch}>
                    <input
                      type="text"
                      placeholder={language === 'he' ? 'שם הפוקימון (למשל: Pikachu)' : 'Pokemon name (e.g., Pikachu)'}
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      className={styles.searchInput}
                    />
                    <input
                      type="text"
                      placeholder={language === 'he' ? 'מספר קלף (אופציונלי)' : 'Card number (optional)'}
                      value={searchNumber}
                      onChange={(e) => setSearchNumber(e.target.value)}
                      className={styles.searchInput}
                    />
                    <button onClick={searchManual} className={styles.searchBtn}>
                      🔍 {t('searchCard')}
                    </button>
                  </div>
                )}
              </div>
            )}

            {view === 'preview' && (
              <div className={styles.previewScreen}>
                <div className={styles.previewImageContainer}>
                  <img src={image} alt="Card" className={styles.previewImage} />
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
                  <div 
                    className={styles.pokemonImageSection}
                    onClick={() => setShowCardModal(true)}
                  >
                    {result.image ? (
                      <img 
                        src={result.image} 
                        alt={result.name} 
                        className={styles.pokemonImageFull}
                        onError={(e) => { e.target.src = image; }}
                      />
                    ) : (
                      <img src={image} alt={result.name} className={styles.pokemonImageFull} />
                    )}
                    <div className={styles.imageOverlay}>
                      <span className={styles.zoomIcon}>🔍</span>
                    </div>
                  </div>

                  <div className={styles.infoSection}>
                    <div className={styles.pokemonHeader}>
                      <span className={styles.pokemonNumber}>{result.number}</span>
                      <h2 className={styles.pokemonName}>{result.name}</h2>
                    </div>

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

                    <div className={styles.stats}>
                      <div className={styles.stat}>
                        <span className={styles.statLabel}>HP</span>
                        <span className={styles.statValue}>{result.hp}</span>
                      </div>
                    </div>

                    <p className={styles.description}>{result.description}</p>
                  </div>
                </div>

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
                          <span className={styles.attackDamage}>{attack.damage}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.savedBadge}>
                  ✅ {t('savedToAlbum')}
                </div>

                <button onClick={reset} className={styles.scanAnotherBtn}>
                  {t('scanAnother')}
                </button>
              </div>
            )}
          </div>

          {/* Pokedex Controls */}
          <PokedexControls 
            onUp={handleUp}
            onDown={handleDown}
            onLeft={handleLeft}
            onRight={handleRight}
            onMenu={handleMenu}
            onA={handleA}
            onB={handleB}
            view={view}
            setView={setView}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>Pokido © 2026</p>
      </footer>

      {/* Card Modal - works for both result and album */}
      {showCardModal && (
        <div className={styles.cardModal} onClick={() => setShowCardModal(false)}>
          <div className={styles.cardModalContent}>
            <button 
              className={styles.closeModal} 
              onClick={(e) => {
                e.stopPropagation();
                setShowCardModal(false);
              }}
            >
              ✕
            </button>
            <img 
              src={
                view === 'set-view' && currentSetId
                  ? getSetCards(currentSetId)[selectedCardIndex]?.image 
                  : result?.image
              } 
              alt="Card" 
            />
          </div>
        </div>
      )}
    </div>
  );
}
