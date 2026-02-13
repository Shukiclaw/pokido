// API endpoint for manual card search (no image, just name/number)
const TCGDEX_API_EN = 'https://api.tcgdex.net/v2/en';
const TCGDEX_API_JA = 'https://api.tcgdex.net/v2/ja';

// fallback לתמונה מ-Pokemon TCG API
async function getImageFromPokemonTCG(name, number) {
  try {
    const query = `name:${name.toLowerCase()}${number ? ` number:${number}` : ''}`;
    const url = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(query)}&pageSize=1`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, {
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

// קריאה ל-TCGdex API
async function getPokemonCardTCGdex(pokemonName, cardNumber, isJapanese = false) {
  const apiBase = isJapanese ? TCGDEX_API_JA : TCGDEX_API_EN;
  
  try {
    const searchUrl = `${apiBase}/cards?name=${encodeURIComponent(pokemonName.toLowerCase())}`;
    console.log('🌐 TCGdex search:', searchUrl);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(searchUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const cards = await response.json();
    console.log(`✅ Found ${cards.length} cards`);
    
    if (!cards || cards.length === 0) return null;
    
    let selectedCard = cards[0];
    
    if (cardNumber) {
      const cardNumMatch = cardNumber.match(/(\d+)\s*\/\s*(\d+)/);
      const cardNum = cardNumMatch ? String(parseInt(cardNumMatch[1])) : String(parseInt(cardNumber));
      const setTotal = cardNumMatch ? parseInt(cardNumMatch[2]) : null;
      
      console.log('🔍 Looking for card:', cardNum, 'in set with', setTotal, 'cards');
      
      const matchingCards = cards.filter(c => c.localId === cardNum);
      console.log('📊 Found', matchingCards.length, 'cards with localId', cardNum);
      
      if (setTotal && matchingCards.length > 1) {
        console.log('🔍 Multiple cards found, fetching set details...');
        
        for (const card of matchingCards) {
          try {
            const detailUrl = `${apiBase}/cards/${card.id}`;
            const detailResponse = await fetch(detailUrl, { signal: controller.signal });
            if (detailResponse.ok) {
              const fullCard = await detailResponse.json();
              const officialCount = fullCard.set?.cardCount?.official;
              const totalCount = fullCard.set?.cardCount?.total;
              
              if (officialCount === setTotal || totalCount === setTotal) {
                console.log('✅ Found exact match:', card.id);
                return await formatCardData(fullCard, isJapanese);
              }
            }
          } catch (e) {
            console.log('Error fetching details:', e.message);
          }
        }
        selectedCard = matchingCards[0];
      } else if (matchingCards.length > 0) {
        selectedCard = matchingCards[0];
      }
    }
    
    const detailUrl = `${apiBase}/cards/${selectedCard.id}`;
    const detailResponse = await fetch(detailUrl, { signal: controller.signal });
    
    if (!detailResponse.ok) return await formatCardData(selectedCard, isJapanese);
    
    const fullCard = await detailResponse.json();
    return await formatCardData(fullCard, isJapanese);
    
  } catch (err) {
    console.error('⚠️ TCGdex API failed:', err.message);
    return null;
  }
}

async function formatCardData(card, isJapanese = false) {
  let imageUrl = card.image;
  
  if (imageUrl && !imageUrl.endsWith('/high.png')) {
    imageUrl = `${imageUrl}/high.png`;
  }
  
  if (!imageUrl) {
    imageUrl = await getImageFromPokemonTCG(card.name, card.localId);
  }
  
  if (!imageUrl && card.set?.id) {
    const setId = card.set.id.replace(/\./g, '');
    const series = setId.replace(/\d+$/, '');
    const lang = isJapanese ? 'ja' : 'en';
    imageUrl = `https://assets.tcgdex.net/${lang}/${series}/${setId}/${card.localId}/high.png`;
  }
  
  return {
    name: card.name,
    number: card.localId || card.id,
    setTotal: card.set?.cardCount?.official || card.set?.cardCount?.total || null,
    set: card.set?.name || 'Unknown',
    rarity: card.rarity || 'Common',
    hp: card.hp,
    types: card.types,
    description: card.flavorText || '',
    image: imageUrl,
    prices: {
      cardmarket: card.pricing?.cardmarket,
      tcgplayer: card.pricing?.tcgplayer
    },
    attacks: card.attacks,
    weaknesses: card.weaknesses,
    resistances: card.resistances,
    retreat: card.retreat,
    illustrator: card.illustrator,
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { name, number } = req.query;
    
    if (!name) {
      return res.status(400).json({ error: 'Pokemon name is required' });
    }

    console.log('🔍 Manual search:', name, number || '');
    
    const cardData = await getPokemonCardTCGdex(name, number, false);
    
    if (!cardData) {
      return res.status(404).json({ error: 'Card not found' });
    }
    
    return res.status(200).json({
      records: [{
        _identification: {
          pokemon_name: cardData.name,
          card_number: cardData.number,
          set_total: cardData.setTotal,
          set: cardData.set,
          rarity: cardData.rarity,
          description: cardData.description,
          image: cardData.image,
          prices: cardData.prices,
          hp: cardData.hp,
          types: cardData.types,
          attacks: cardData.attacks,
          illustrator: cardData.illustrator,
          isJapanese: false,
          geminiDetected: { pokemonName: name, cardNumber: number }
        }
      }]
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
