export const config = {
  api: {
    bodyParser: false,
  },
};

import formidable from 'formidable';
import fetch from 'node-fetch';
import fs from 'fs';

const POKEMON_TCG_API = 'https://api.pokemontcg.io/v2/cards';

// משתני סביבה
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const POKEMON_TCG_API_KEY = process.env.POKEMON_TCG_API_KEY;

async function analyzeImageWithGemini(imagePath) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  // קריאת התמונה כ-base64
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');

  const prompt = `Analyze this Pokemon card image and extract:
1. Pokemon name (exact name, e.g., "Pikachu", "Charizard", "Mew")
2. Card number if visible (e.g., "25/102")
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
  
  // חילוץ JSON מהתשובה
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
    
    // Gemini OCR
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

    // קריאה ל-Pokemon TCG API
    let searchQuery = `name:${pokemonName}`;
    if (cardNumber) {
      const numOnly = cardNumber.split('/')[0];
      if (numOnly) {
        searchQuery += ` number:${numOnly}`;
      }
    }

    const apiUrl = `${POKEMON_TCG_API}?q=${encodeURIComponent(searchQuery)}&pageSize=10`;
    console.log('🌐 Pokemon API:', apiUrl);
    
    const headers = {};
    if (POKEMON_TCG_API_KEY) {
      headers['X-Api-Key'] = POKEMON_TCG_API_KEY;
    }
    
    const response = await fetch(apiUrl, { headers });

    if (!response.ok) {
      throw new Error(`Pokemon TCG API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Clean up
    try { fs.unlinkSync(filepath); } catch (e) {}

    if (!data.data || data.data.length === 0) {
      return res.status(404).json({ 
        error: `לא נמצאו קלפים ל-${pokemonName}`,
        pokemonName: pokemonName,
        cardNumber: cardNumber,
        geminiResult: geminiResult
      });
    }

    const card = data.data[0];
    
    return res.status(200).json({
      records: [{
        _identification: {
          pokemon_name: card.name,
          card_number: card.number,
          set: card.set?.name || 'Unknown',
          rarity: card.rarity || 'Common',
          description: card.flavorText || '',
          image: card.images?.large || '',
          prices: card.tcgplayer?.prices || {},
          hp: card.hp,
          types: card.types,
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
