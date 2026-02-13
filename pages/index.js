import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import styles from '../styles/Pokedex.module.css';

// מיפוי סוגים לעברית וצבעים
const typeMapping = {
  water: { name: 'מים', color: '#6890F0' },
  fire: { name: 'אש', color: '#F08030' },
  grass: { name: 'עשב', color: '#78C850' },
  electric: { name: 'חשמלי', color: '#F8D030' },
  psychic: { name: 'פסיכי', color: '#F85888' },
  fighting: { name: 'לחימה', color: '#C03028' },
  darkness: { name: 'אופל', color: '#705848' },
  metal: { name: 'מתכת', color: '#B8B8D0' },
  fairy: { name: 'פיה', color: '#EE99AC' },
  dragon: { name: 'דרקון', color: '#7038F8' },
  colorless: { name: 'נטול צבע', color: '#A8A878' },
  flying: { name: 'מעופף', color: '#A890F0' },
  poison: { name: 'רעל', color: '#A040A0' },
  ice: { name: 'קרח', color: '#98D8D8' },
  ground: { name: 'קרקע', color: '#E0C068' },
  rock: { name: 'סלע', color: '#B8A038' },
  bug: { name: 'חרק', color: '#A8B820' },
  ghost: { name: 'רוח', color: '#705898' },
  steel: { name: 'פלדה', color: '#B8B8D0' },
  dark: { name: 'אופל', color: '#705848' },
};

// תרגום נדירות
const rarityMapping = {
  'Common': 'נפוץ',
  'Uncommon': 'לא נפוץ',
  'Rare': 'נדיר',
  'Rare Holo': 'הולוגרפי נדיר',
  'Rare Ultra': 'אולטרה נדיר',
  'Ultra Rare': 'אולטרה נדיר',
  'Secret Rare': 'סודי נדיר',
  'Promo': 'פרומו',
  'Amazing Rare': 'מדהים נדיר',
  'Shiny Rare': 'מבריק נדיר',
  'Radiant Rare': 'זוהר נדיר',
};

export default function Pokedex() {
  const [view, setView] = useState('closed');
  const [image, setImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
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
    setStatus('מנתח את הקלף...');
    setError('');

    try {
      if (!selectedFile) throw new Error('לא נבחר קובץ');

      const formData = new FormData();
      formData.append('file', selectedFile);

      setStatus('מעבד תמונה...');
      await new Promise(r => setTimeout(r, 800));

      setStatus('מזהה פוקימון...');
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error('תשובה לא תקינה מהשרת');
      }

      // Check if API returned error
      if (!response.ok) {
        console.error('API Error:', data);
        throw new Error(data.error || `שגיאת API: ${response.status}`);
      }

      console.log('✅ API Response:', data);
      const cardData = parseAPIResponse(data);
      
      if (!cardData) {
        throw new Error('לא ניתן לזהות את הקלף');
      }
      
      setResult(cardData);
      setIsScanning(false);
      setView('result');

    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message);
      setStatus('הסריקה נכשלה');
      
      setTimeout(() => {
        setIsScanning(false);
        setView('upload');
        alert('❌ ' + err.message + '\n\nנסה שוב או צלם קלף אחר.');
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
      throw new Error('לא נמצאו קלפים');
    }

    const id = records[0]._identification;
    console.log('Card data:', id);
    
    // המרת סוגים לעברית
    const typeNames = [];
    const typeColors = [];
    if (id.types) {
      id.types.forEach(type => {
        const mapped = typeMapping[type.toLowerCase()];
        if (mapped) {
          typeNames.push(mapped.name);
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

    return {
      name: id.pokemon_name || id.name,
      number: `#${id.card_number || id.number || '???'}`,
      types: id.types || [],
      typeNames: typeNames,
      typeColors: typeColors,
      hp: id.hp || '?',
      rarity: rarityMapping[id.rarity] || id.rarity || 'נפוץ',
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
        <title>Pokido - פוקידו</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;700;900&display=swap" rel="stylesheet" />
      </Head>

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
                  <h2 className={styles.welcomeTitle}>Pokido</h2>
                  <p className={styles.welcomeText}>מכשיר זיהוי קלפי פוקימון</p>
                  <button className={styles.openBtn} onClick={openPokedex}>
                    פתח את הפוקידקס
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
                  <p className={styles.uploadText}>העלה קלף פוקימון</p>
                  <p className={styles.uploadSubtext}>לחץ כדי לצלם או לבחור תמונה</p>
                </div>
              )}

              {view === 'preview' && (
                <div className={styles.previewScreen}>
                  <div className={styles.previewImageContainer}>
                    <img src={image} alt="קלף" className={styles.previewImage} />
                  </div>
                  <div className={styles.actionButtons}>
                    <button onClick={analyzeCard} className={styles.scanBtn}>
                      🔍 סרוק
                    </button>
                    <button onClick={reset} className={styles.backBtn}>
                      ❌ ביטול
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
                    {/* Pokemon Image */}
                    <div className={styles.pokemonImageSection}>
                      {result.image ? (
                        <img 
                          src={result.image} 
                          alt={result.name} 
                          className={styles.pokemonImage}
                          onError={(e) => {
                            console.log('API image failed, falling back to uploaded image');
                            e.target.src = image;
                          }}
                        />
                      ) : (
                        <img src={image} alt={result.name} className={styles.pokemonImage} />
                      )}
                      <div className={styles.imageOverlay}></div>
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
                        <div className={styles.stat}>
                          <span className={styles.statLabel}>כוח</span>
                          <span className={styles.statValue}>{result.power}</span>
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
                      <span className={styles.valueLabel}>ערך משוער</span>
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
                    <h4>💡 טיפים</h4>
                    {result.tips.map((tip, i) => (
                      <div key={i} className={styles.tip}>{tip}</div>
                    ))}
                  </div>
                  
                  {/* פרטים נוספים */}
                  <div className={styles.detailsSection}>
                    <h4>📋 פרטי קלף</h4>
                    
                    {result.set && (
                      <div className={styles.detailRow}>
                        <span>סט:</span>
                        <span>{result.set}</span>
                      </div>
                    )}
                    
                    {result.illustrator && (
                      <div className={styles.detailRow}>
                        <span>מאייר:</span>
                        <span>{result.illustrator}</span>
                      </div>
                    )}
                    
                    {result.attacks && result.attacks.length > 0 && (
                      <div className={styles.attacksSection}>
                        <h5>⚔️ התקפות</h5>
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
                        <span>חולשה:</span>
                        <span>{result.weaknesses.map(w => `${w.type} ${w.value}`).join(', ')}</span>
                      </div>
                    )}
                    
                    {result.retreat && (
                      <div className={styles.detailRow}>
                        <span>נסיגה:</span>
                        <span>{result.retreat} ⭐</span>
                      </div>
                    )}
                  </div>
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
                🔄 חדש
              </button>
            )}
            <button onClick={closePokedex} className={styles.closeBtn}>
              ✕ סגור
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
        <p>Pokido © 2026 - עידו וחברים 🎴</p>
        <p>Powered by Gemini AI + TCGdex</p>
      </footer>
    </div>
  );
}
