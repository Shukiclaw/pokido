export const config = {
  api: {
    bodyParser: false,
  },
};

import formidable from 'formidable';
import fetch from 'node-fetch';
import fs from 'fs';
import Tesseract from 'tesseract.js';

const POKEMON_TCG_API = 'https://api.pokemontcg.io/v2/cards';

// קריאת מפתח מהמשתנה סביבה
const API_KEY = process.env.POKEMON_TCG_API_KEY;

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

    console.log('🔍 Starting OCR...');
    
    // OCR - קריאת טקסט מהתמונה
    const ocrResult = await Tesseract.recognize(filepath, 'eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });

    const ocrText = ocrResult.data.text;
    console.log('📝 OCR Text:', ocrText);

    // ניקוי ועיבוד הטקסט
    const lines = ocrText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    console.log('📋 Lines:', lines);

    // חיפוש שם הפוקימון והמספר
    let pokemonName = null;
    let cardNumber = null;
    
    // רשימת פוקימונים נפוצים לחיפוש
    const commonPokemon = ['pikachu', 'charizard', 'mew', 'mewtwo', 'blastoise', 'venusaur', 
      'charmander', 'squirtle', 'bulbasaur', 'eevee', 'snorlax', 'gengar', 'dragonite',
      'lugia', 'rayquaza', 'groudon', 'kyogre', 'dialga', 'palkia', 'giratina',
      'arceus', 'zekrom', 'reshiram', 'kyurem', 'xerneas', 'yveltal', 'zygarde',
      'solgaleo', 'lunala', 'necrozma', 'zacian', 'zamazenta', 'eternatus'];
    
    // חיפוש שם בטקסט
    const lowerText = ocrText.toLowerCase();
    for (const pokemon of commonPokemon) {
      if (lowerText.includes(pokemon)) {
        pokemonName = pokemon;
        break;
      }
    }
    
    // אם לא נמצא, ננסה לקחת את השורה הראשונה שאינה "basic" או "stage"
    if (!pokemonName && lines.length > 0) {
      for (const line of lines) {
        const lowerLine = line.toLowerCase();
        if (lowerLine.length > 2 && 
            !lowerLine.includes('basic') && 
            !lowerLine.includes('stage') &&
            !lowerLine.includes('hp') &&
            !lowerLine.includes('evolves') &&
            !/^\d+$/.test(line)) {
          pokemonName = line.replace(/[^a-zA-Z\s-]/g, '').trim().toLowerCase();
          break;
        }
      }
    }
    
    // חיפוש מספר קלף (בד"כ בפורמט XXX/YYY)
    const numberMatch = ocrText.match(/(\d+)\s*\/\s*(\d+)/);
    if (numberMatch) {
      cardNumber = numberMatch[1];
    }

    if (!pokemonName) {
      // Clean up
      try { fs.unlinkSync(filepath); } catch (e) {}
      return res.status(400).json({ 
        error: 'לא זוהה שם פוקימון בתמונה',
        ocrText: ocrText
      });
    }

    console.log(`🎯 Found: ${pokemonName}, Card #${cardNumber || 'unknown'}`);

    // קריאה ל-API
    let searchQuery = `name:${pokemonName}`;
    if (cardNumber) {
      searchQuery += ` number:${cardNumber}`;
    }

    const apiUrl = `${POKEMON_TCG_API}?q=${encodeURIComponent(searchQuery)}&pageSize=10`;
    console.log('🌐 API URL:', apiUrl);
    
    const headers = {};
    if (API_KEY) {
      headers['X-Api-Key'] = API_KEY;
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
        ocrText: ocrText
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
          ocrDetected: {
            name: pokemonName,
            number: cardNumber,
            rawText: ocrText.substring(0, 200)
          }
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
