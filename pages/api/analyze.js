export const config = {
  api: {
    bodyParser: false,
  },
};

import formidable from 'formidable';
import fetch from 'node-fetch';
import fs from 'fs';

const TCGDEX_API_EN = 'https://api.tcgdex.net/v2/en';
const TCGDEX_API_JA = 'https://api.tcgdex.net/v2/ja';

// משתני סביבה
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const POKEMON_TCG_API_KEY = process.env.POKEMON_TCG_API_KEY;

// fallback לתמונה מ-Pokemon TCG API
async function getImageFromPokemonTCG(name, number) {
  try {
    const query = `name:${name.toLowerCase()}${number ? ` number:${number}` : ''}`;
    const url = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(query)}&pageSize=1`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, {
      headers: POKEMON_TCG_API_KEY ? { 'X-Api-Key': POKEMON_TCG_API_KEY } : {},
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.data && data.data[0]?.images?.large) {
      return data.data[0].images.large;
    }
    return null;
  } catch (e) {
    console.log('Pokemon TCG image fallback failed:', e.message);
    return null;
  }
}

// קריאה ל-TCGdex API - מהיר ואמין!
async function getPokemonCardTCGdex(pokemonName, cardNumber, isJapanese = false) {
  const apiBase = isJapanese ? TCGDEX_API_JA : TCGDEX_API_EN;
  
  try {
    // חיפוש לפי שם
    const searchUrl = `${apiBase}/cards?name=${encodeURIComponent(pokemonName.toLowerCase())}`;
    console.log('🌐 TCGdex search:', searchUrl, isJapanese ? '(Japanese)' : '(English)');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 שניות
    
    const response = await fetch(searchUrl, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const cards = await response.json();
    console.log(`✅ Found ${cards.length} cards`);
    
    if (!cards || cards.length === 0) {
      return null;
    }
    
    // אם יש מספר קלף, נחפש התאמה - כולל התאמה לפי מספר הסט (למשל 132/214)
    let selectedCard = cards[0];
    
    if (cardNumber) {
      // חילוץ מספר הקלף ומספר הסט (למשל "132/214" → cardNum=132, setTotal=214)
      // טיפול במספרים עם אפסים מקדימים (099 → 99)
      const cardNumMatch = cardNumber.match(/(\d+)\s*\/\s*(\d+)/);
      const cardNum = cardNumMatch ? String(parseInt(cardNumMatch[1])) : String(parseInt(cardNumber));
      const setTotal = cardNumMatch ? parseInt(cardNumMatch[2]) : null;
      
      console.log('🔍 Looking for card:', cardNum, 'in set with', setTotal, 'cards');
      
      // מציאת כל הקלפים עם המספר המתאים
      const matchingCards = cards.filter(c => c.localId === cardNum);
      console.log('📊 Found', matchingCards.length, 'cards with localId', cardNum);
      
      if (setTotal && matchingCards.length > 1) {
        // יש לנו כמה קלפים עם אותו מספר - צריך לבדוק את הסט לכל אחד
        console.log('🔍 Multiple cards found, fetching set details to match set size...');
        
        // שליפת פרטים מלאים לכל קלף כדי לבדוק את גודל הסט
        for (const card of matchingCards) {
          try {
            const detailUrl = `${apiBase}/cards/${card.id}`;
            console.log('  Fetching details for:', card.id);
            
            const detailResponse = await fetch(detailUrl, { signal: controller.signal });
            if (detailResponse.ok) {
              const fullCard = await detailResponse.json();
              const officialCount = fullCard.set?.cardCount?.official;
              const totalCount = fullCard.set?.cardCount?.total;
              
              console.log(`    ${card.id}: set=${fullCard.set?.name}, official=${officialCount}, total=${totalCount}`);
              
              // בדיקה אם זה הסט הנכון
              if (officialCount === setTotal || totalCount === setTotal) {
                console.log('✅ Found exact match:', card.id, 'set:', fullCard.set?.name);
                selectedCard = fullCard; // שמירת כל הפרטים המלאים
                return await formatCardData(selectedCard, isJapanese);
              }
            }
          } catch (e) {
            console.log('  Error fetching details for', card.id, ':', e.message);
          }
        }
        
        // אם הגענו לכאן, לא מצאנו התאמה לפי גודל הסט - ניקח את הראשון
        console.log('⚠️ No set size match found, using first card with number', cardNum);
        selectedCard = matchingCards[0];
      } else if (matchingCards.length > 0) {
        // יש התאמה אחת או יותר - ניקח את הראשונה
        selectedCard = matchingCards[0];
        console.log('✅ Found single match:', selectedCard.id);
      } else {
        // לא מצאנו קלף עם המספר הזה - בדיקה אם יש קלף אחר עם אותו שם
        console.log('⚠️ No card found with number:', cardNum, '- checking other cards with same name...');
        
        if (cards.length > 0) {
          // ננסה למצוא קלף עם מספר דומה (למשל אם Gemini זיהה 99 במקום 92)
          const alternativeCards = cards.filter(c => {
            const num = parseInt(c.localId);
            const targetNum = parseInt(cardNum);
            // חיפוש מספרים קרובים (±5)
            return Math.abs(num - targetNum) <= 5;
          });
          
          if (alternativeCards.length > 0) {
            console.log('🔍 Found alternative cards with similar numbers:', alternativeCards.map(c => c.localId));
            selectedCard = alternativeCards[0];
          } else {
            console.log('⚠️ Using first result');
          }
        }
      }
    }
    
    // קבלת פרטים מלאים על הקלף
    const detailUrl = `${apiBase}/cards/${selectedCard.id}`;
    console.log('🌐 Getting details:', detailUrl);
    
    const detailResponse = await fetch(detailUrl, {
      signal: controller.signal
    });
    
    if (!detailResponse.ok) {
      // אם אין פרטים מלאים, נשתמש במה שיש
      return await formatCardData(selectedCard, isJapanese);
    }
    
    const fullCard = await detailResponse.json();
    return await formatCardData(fullCard, isJapanese);
    
  } catch (err) {
    console.error('⚠️ TCGdex API failed:', err.message);
    return null;
  }
}

// המרת נתוני TCGdex לפורמט שלנו
async function formatCardData(card, isJapanese = false) {
  // בניית כתובת תמונה נכונה
  // TCGdex מחזיר image בלי /high.png - צריך להוסיף!
  let imageUrl = card.image;
  
  if (imageUrl && !imageUrl.endsWith('/high.png')) {
    imageUrl = `${imageUrl}/high.png`;
    console.log('🖼️ Fixed image URL:', imageUrl);
  }
  
  // אם אין תמונה, ננסה Pokemon TCG API
  if (!imageUrl) {
    console.log('🖼️ No image from TCGdex, trying Pokemon TCG API...');
    imageUrl = await getImageFromPokemonTCG(card.name, card.localId);
  }
  
  // אם עדיין אין, נבנה URL לפי פורמט TCGdex (בלי נקודות בסט)
  if (!imageUrl && card.set?.id) {
    const setId = card.set.id.replace(/\./g, ''); // מסיר נקודות
    const series = setId.replace(/\d+$/, ''); // מספרי הסדרה
    const lang = isJapanese ? 'ja' : 'en';
    imageUrl = `https://assets.tcgdex.net/${lang}/${series}/${setId}/${card.localId}/high.png`;
  }
  
  return {
    name: card.name,
    nameEn: card.name, // שם באנגלית (או יפנית לפי השפה)
    nameJa: isJapanese ? card.name : null,
    number: card.localId || card.id,
    setTotal: card.set?.cardCount?.official || card.set?.cardCount?.total || null,
    set: card.set?.name || 'Unknown',
    setId: card.set?.id,
    rarity: card.rarity || 'Common',
    hp: card.hp,
    types: card.types,
    description: card.flavorText || '',
    image: imageUrl,
    highResImage: card.image,
    isJapanese: isJapanese,
    prices: {
      cardmarket: card.pricing?.cardmarket,
      tcgplayer: card.pricing?.tcgplayer
    },
    attacks: card.attacks,
    weaknesses: card.weaknesses,
    resistances: card.resistances,
    retreat: card.retreat,
    illustrator: card.illustrator,
    category: card.category,
    dexId: card.dexId,
    legal: card.legal,
    suffix: card.suffix,
    evolveFrom: card.evolveFrom
  };
}

async function analyzeImageWithGemini(imagePath) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');

  const prompt = `Analyze this Pokemon card image and extract:
1. Pokemon name - Return the ENGLISH name (e.g., "Yveltal", "Pikachu", "Ninetales", "Alolan Ninetales", "Galarian Slowbro")
   IMPORTANT: Include the prefix like "Alolan" or "Galarian" if present!
2. Card number - MUST extract the COMPLETE number as shown on the card (e.g., "132/214", "25/102", "92/163")
   IMPORTANT: 
   - Look carefully at the bottom left/right of the card
   - The format is "XX/YY" where XX is card number, YY is total cards in set
   - Pay attention: 92 is NOT the same as 99, 82 is NOT the same as 28
   - Read slowly and carefully - don't confuse similar numbers
3. Set name if visible
4. Detect the card language - is it Japanese, English, or other?

Return ONLY a JSON object in this exact format:
{
  "pokemonName": "PokemonName",
  "cardNumber": "XX/YY",
  "setName": "Set Name",
  "language": "english"
}

For language detection:
- If card has Japanese characters (hiragana, katakana, kanji), use "japanese"
- If card is in English, use "english"
- Otherwise use "other"

If any field is not found, use null.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: base64Image
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: GEMINI_MODEL.includes('3') ? 1024 : 256
        }
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  
  if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
    throw new Error('No response from Gemini');
  }

  const text = data.candidates[0].content.parts[0].text;
  console.log('📝 Raw Gemini response:', text);
  
  // Check if response is an error message in Hebrew or other non-JSON
  if (text.includes('נסה שוב') || text.includes('לא זוהה') || text.includes('error') || text.includes('שגיאה')) {
    console.log('⚠️ Gemini returned error message instead of JSON');
    return {
      pokemonName: null,
      cardNumber: null,
      setName: null,
      language: 'english',
      error: text.substring(0, 200)
    };
  }
  
  // Try to extract JSON more robustly
  let jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    // Try to find JSON in markdown code blocks
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonMatch = codeBlockMatch[1].match(/\{[\s\S]*\}/);
    }
  }
  
  if (!jsonMatch) {
    throw new Error('Could not parse Gemini response: ' + text.substring(0, 200));
  }

  try {
    const result = JSON.parse(jsonMatch[0]);
    console.log('✅ Parsed Gemini result:', result);
    
    // Ensure language field exists with a default
    if (!result.language) {
      result.language = 'english';
      console.log('⚠️ Language not detected, defaulting to english');
    }
    
    return result;
  } catch (parseError) {
    throw new Error(`JSON parse error: ${parseError.message}. Raw text: ${jsonMatch[0].substring(0, 200)}`);
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({ multiples: false });
    
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const file = files.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const actualFile = Array.isArray(file) ? file[0] : file;
    const filepath = actualFile.filepath || actualFile.path;
    
    if (!filepath) {
      return res.status(500).json({ error: 'File path not found' });
    }

    console.log('🤖 Analyzing with Gemini...');
    
    const geminiResult = await analyzeImageWithGemini(filepath);
    console.log('✅ Gemini result:', geminiResult);

    const pokemonName = geminiResult.pokemonName;
    const cardNumber = geminiResult.cardNumber;
    const isJapanese = geminiResult.language === 'japanese';

    if (!pokemonName) {
      try { fs.unlinkSync(filepath); } catch (e) {}
      return res.status(400).json({ 
        error: 'לא זוהה שם פוקימון בתמונה',
        geminiResult: geminiResult
      });
    }

    console.log(`🎯 Found: ${pokemonName}, Card #${cardNumber || 'unknown'}, Language: ${geminiResult.language || 'unknown'}`);

    // קריאה ל-TCGdex API
    const cardData = await getPokemonCardTCGdex(pokemonName, cardNumber, isJapanese);
    
    // Clean up
    try { fs.unlinkSync(filepath); } catch (e) {}
    
    // אם ה-API נכשל - מחזירים שגיאה ברורה
    if (!cardData) {
      return res.status(503).json({ 
        error: 'שירות זיהוי הקלפים לא זמין כרגע. נסה שוב בעוד רגע.',
        pokemonName: pokemonName,
        cardNumber: cardNumber
      });
    }
    
    return res.status(200).json({
      records: [{
        _identification: {
          pokemon_name: cardData.name,
          card_number: cardData.number,
          set_total: cardData.setTotal,
          set: cardData.set,
          setId: cardData.setId,
          rarity: cardData.rarity,
          description: cardData.description,
          image: cardData.image,
          prices: cardData.prices,
          hp: cardData.hp,
          types: cardData.types,
          attacks: cardData.attacks,
          illustrator: cardData.illustrator,
          isJapanese: cardData.isJapanese,
          geminiDetected: geminiResult
        }
      }]
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({ 
      error: error.message
    });
  }
}
