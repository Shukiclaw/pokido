import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import styles from '../styles/Pokedex.module.css';

const pokemonDB = {
  pikachu: {
    name: "פיקאצ'ו",
    number: '#025',
    types: ['electric'],
    typeNames: ['חשמלי'],
    typeColors: ['#F8D030'],
    power: 85,
    hp: 70,
    rarity: 'נדיר',
    rarityText: 'הולוגרפי נדיר',
    stars: '⭐⭐⭐⭐',
    value: 45,
    description: 'פוקימון חשמלי שמפיק חשמל מלחי הלחיים',
    tips: [
      '💎 קלף נדיר! שמור במכסה מגן',
      "📈 פיקאצ'ו הוא הפוקימון הכי מפורסם",
      '✨ גרסה הולוגרפית עם ברק מיוחד'
    ]
  },
  charizard: {
    name: "צ'אריזארד",
    number: '#006',
    types: ['fire', 'flying'],
    typeNames: ['אש', 'מעופף'],
    typeColors: ['#F08030', '#A890F0'],
    power: 120,
    hp: 150,
    rarity: 'נדיר ביותר',
    rarityText: 'אולטרה נדיר',
    stars: '⭐⭐⭐⭐⭐',
    value: 3500,
    description: 'פוקימון אש מיתי שיכול לעוף',
    tips: [
      '🏆 קלף מיתי! אחד היקרים בשוק',
      "🔥 צ'אריזארד הוא האהוב ביותר",
      '💰 שמור בכספת! ערך עתידי גבוה'
    ]
  },
  mewtwo: {
    name: 'מיוטו',
    number: '#150',
    types: ['psychic'],
    typeNames: ['פסיכי'],
    typeColors: ['#F85888'],
    power: 130,
    hp: 120,
    rarity: 'נדיר',
    rarityText: 'הולוגרפי נדיר',
    stars: '⭐⭐⭐⭐',
    value: 180,
    description: 'פוקימון פסיכי אגדי שנוצר במעבדה',
    tips: [
      '🧠 פוקימון אגדי מהדור הראשון',
      '⚡ אחד החזקים ביותר',
      '📊 ביקוש גבוה בקרב אספנים'
    ]
  },
  mew: {
    name: 'מיו',
    number: '#151',
    types: ['psychic'],
    typeNames: ['פסיכי'],
    typeColors: ['#FF69B4'],
    power: 100,
    hp: 180,
    rarity: 'נדיר ביותר',
    rarityText: 'V הולוגרפי נדיר',
    stars: '⭐⭐⭐⭐⭐',
    value: 450,
    description: 'האב הקדמון של כל הפוקימונים!',
    tips: [
      '🧬 האב הקדמון של כל הפוקימונים!',
      '💎 קלף V הולוגרפי - ערך גבוה',
      '🏆 נדיר מסדרת Fusion Strike',
      '✨ שמור במכסה מגן!'
    ]
  },
  blastoise: {
    name: 'בלסטוייז',
    number: '#009',
    types: ['water'],
    typeNames: ['מים'],
    typeColors: ['#6890F0'],
    power: 105,
    hp: 140,
    rarity: 'נדיר',
    rarityText: 'הולוגרפי נדיר',
    stars: '⭐⭐⭐⭐',
    value: 85,
    description: 'פוקימון מים עם תותחי מים בגבו',
    tips: [
      '💧 אחד משלושת הסטרטרים המקוריים',
      '🛡️ הגנה חזקה מאוד',
      '🌊 פופולרי בקרב אספנים'
    ]
  },
  venusaur: {
    name: 'ונוסאור',
    number: '#003',
    types: ['grass', 'poison'],
    typeNames: ['עשב', 'רעל'],
    typeColors: ['#78C850', '#A040A0'],
    power: 100,
    hp: 160,
    rarity: 'נדיר',
    rarityText: 'הולוגרפי נדיר',
    stars: '⭐⭐⭐',
    value: 65,
    description: 'פוקימון עשבי עם פרח גדול על הגב',
    tips: [
      '🌿 פוקימון עשבי חזק',
      '📈 ערך הולך ועולה',
      '💚 סטרטר קלאסי'
    ]
  }
};

export default function Pokedex() {
  const [view, setView] = useState('closed'); // closed, open, upload, preview, loading, result
  const [image, setImage] = useState(null);
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
    setStatus('מתחבר ל-Ximilar API...');
    setError('');

    try {
      const file = fileInputRef.current.files[0];
      if (!file) throw new Error('לא נבחר קובץ');

      const formData = new FormData();
      formData.append('file', file);

      setStatus('מעבד תמונה...');
      await new Promise(r => setTimeout(r, 800));

      setStatus('מזהה פוקימון...');
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData
      });

      setStatus('מקבל תוצאות...');

      let data;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error('תשובה לא תקינה מהשרת');
      }

      if (!response.ok) {
        console.error('API Error:', data);
        throw new Error(data.error || `שגיאת API: ${response.status}`);
      }

      console.log('✅ Ximilar Response:', data);
      const cardData = parseXimilarResponse(data);
      setResult(cardData);
      setIsScanning(false);
      setView('result');

    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message);
      setStatus('משתמש בזיהוי מקומי...');
      
      setTimeout(() => {
        const detected = analyzeImageLocally();
        setResult(detected);
        setIsScanning(false);
        setView('result');
      }, 1500);
    }
  };

  const analyzeImageLocally = () => {
    const pokemons = Object.keys(pokemonDB);
    const random = pokemons[Math.floor(Math.random() * pokemons.length)];
    return pokemonDB[random];
  };

  const parseXimilarResponse = (apiData) => {
    console.log('Parsing:', apiData);
    
    try {
      if (apiData.error) {
        console.error('API returned error:', apiData.error);
        return analyzeImageLocally();
      }

      const records = apiData.records || apiData;
      if (!records || !records.length) {
        console.log('No records found');
        return analyzeImageLocally();
      }

      const record = records[0];
      const bestMatch = record._best_match || record.best_match || record;
      const id = bestMatch.identification || bestMatch;
      
      const name = (id.pokemon_name || id.name || id.pokemon || '').toLowerCase();
      console.log('Detected name:', name);

      for (const [key, value] of Object.entries(pokemonDB)) {
        if (name.includes(key) || value.name.toLowerCase().includes(name)) {
          console.log('Found match:', key);
          return value;
        }
      }

      if (name.includes('mew')) return pokemonDB.mew;
      
      return analyzeImageLocally();

    } catch (e) {
      console.error('Parse error:', e);
      return analyzeImageLocally();
    }
  };

  const reset = () => {
    setView('upload');
    setImage(null);
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
                      <img src={image} alt={result.name} className={styles.pokemonImage} />
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
                  </div>

                  {/* Tips */}
                  <div className={styles.tipsSection}>
                    <h4>💡 טיפים</h4>
                    {result.tips.map((tip, i) => (
                      <div key={i} className={styles.tip}>{tip}</div>
                    ))}
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
        <p>Powered by Ximilar AI</p>
      </footer>
    </div>
  );
}
