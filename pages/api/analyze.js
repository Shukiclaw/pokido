export const config = {
  api: {
    bodyParser: false,
  },
};

import formidable from 'formidable';
import fetch from 'node-fetch';
import fs from 'fs';

const TCGDEX_API = 'https://api.tcgdex.net/v2/en';

// משתני סביבה
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// קריאה ל-TCGdex API - מהיר ואמין!
async function getPokemonCardTCGdex(pokemonName, cardNumber) {
  try {
    // חיפוש לפי שם
    const searchUrl = `${TCGDEX_API}/cards?name=${encodeURIComponent(pokemonName.toLowerCase())}`;
    console.log('🌐 TCGdex search:', searchUrl);
    
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
    
    // אם יש מספר קלף, נחפש התאמה
    let selectedCard = cards[0];
    
    if (cardNumber) {
      const numOnly = cardNumber.split('/')[0]?.trim();
      const matchingCard = cards.find(c => 
        c.localId === numOnly || 
        c.localId === cardNumber ||
        c.id?.includes(numOnly)
      );
      
      if (matchingCard) {
        selectedCard = matchingCard;
        console.log('✅ Matched card number:', selectedCard.localId);
      }
    }
    
    // קבלת פרטים מלאים על הקלף
    const detailUrl = `${TCGDEX_API}/cards/${selectedCard.id}`;
    console.log('🌐 Getting details:', detailUrl);
    
    const detailResponse = await fetch(detailUrl, {
      signal: controller.signal
    });
    
    if (!detailResponse.ok) {
      // אם אין פרטים מלאים, נשתמש במה שיש
      return formatCardData(selectedCard);
    }
    
    const fullCard = await detailResponse.json();
    return formatCardData(fullCard);
    
  } catch (err) {
    console.error('⚠️ TCGdex API failed:', err.message);
    return null;
  }
}

// המרת נתוני TCGdex לפורמט שלנו
function formatCardData(card) {
  // בניית כתובת תמונה נכונה
  let imageUrl = card.image;
  if (!imageUrl && card.set?.id) {
    // פורמט: https://assets.tcgdex.net/en/sm/sm7.5/18.png
    const setId = card.set.id.replace('-', '/');
    imageUrl = `https://assets.tcgdex.net/en/${setId}/${card.localId}.png`;
  }
  
  return {
    name: card.name,
    number: card.localId || card.id,
    set: card.set?.name || 'Unknown',
    setId: card.set?.id,
    rarity: card.rarity || 'Common',
    hp: card.hp,
    types: card.types,
    description: card.flavorText || '',
    image: imageUrl,
    highResImage: card.image,
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
1. Pokemon name (exact name, e.g., "Pikachu", "Charizard", "Mew", "Kingdra GX")
2. Card number if visible (e.g., "25/102", "18/70")
3. Set name if visible

Return ONLY a JSON object in this exact format:
{
  "pokemonName": "PokemonName",
  "cardNumber": "XX/YY",
  "setName": "Set Name"
}

If any field is not found, use null.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
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
          maxOutputTokens: 256
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
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse Gemini response');
  }

  return JSON.parse(jsonMatch[0]);
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

    if (!pokemonName) {
      try { fs.unlinkSync(filepath); } catch (e) {}
      return res.status(400).json({ 
        error: 'לא זוהה שם פוקימון בתמונה',
        geminiResult: geminiResult
      });
    }

    console.log(`🎯 Found: ${pokemonName}, Card #${cardNumber || 'unknown'}`);

    // קריאה ל-TCGdex API
    const cardData = await getPokemonCardTCGdex(pokemonName, cardNumber);
    
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
          set: cardData.set,
          rarity: cardData.rarity,
          description: cardData.description,
          image: cardData.image,
          prices: cardData.prices,
          hp: cardData.hp,
          types: cardData.types,
          attacks: cardData.attacks,
          illustrator: cardData.illustrator,
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
