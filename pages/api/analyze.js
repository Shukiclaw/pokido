export const config = {
  api: {
    bodyParser: false,
  },
};

import formidable from 'formidable';
import fetch from 'node-fetch';
import fs from 'fs';

const POKEMON_TCG_API = 'https://api.pokemontcg.io/v2/cards';
const API_KEY = 'e5c6d79a-8cf5-4d42-9717-68d228ebc80d';

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

    // For now, use a default search since we don't have OCR
    // In production, you'd use OCR to extract text from the image
    const searchTerm = 'pikachu'; // Default search
    
    // Call Pokemon TCG API
    const response = await fetch(`${POKEMON_TCG_API}?q=name:${searchTerm}&pageSize=1`, {
      headers: {
        'X-Api-Key': API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Pokemon TCG API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Clean up temp file
    try { fs.unlinkSync(filepath); } catch (e) {}

    if (!data.data || data.data.length === 0) {
      return res.status(404).json({ error: 'No cards found' });
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
          prices: card.tcgplayer?.prices || {}
        }
      }]
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: error.message,
      usingLocal: true
    });
  }
}
