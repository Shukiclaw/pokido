import { createContext, useContext, useState, useEffect } from 'react';

const CollectionContext = createContext();

export function CollectionProvider({ children }) {
  const [collection, setCollection] = useState({});
  const [sets, setSets] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Load collection from localStorage on mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pokido-collection');
      console.log('Loading from localStorage:', saved ? 'Found data' : 'No data'); // DEBUG
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          console.log('Parsed data:', { sets: Object.keys(parsed.sets || {}), collectionKeys: Object.keys(parsed.collection || {}) }); // DEBUG
          setCollection(parsed.collection || {});
          setSets(parsed.sets || {});
        } catch (e) {
          console.error('Failed to load collection:', e);
        }
      }
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage whenever collection changes (but only after initial load)
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      console.log('Saving to localStorage:', { sets: Object.keys(sets), collectionKeys: Object.keys(collection) }); // DEBUG
      localStorage.setItem('pokido-collection', JSON.stringify({
        collection,
        sets
      }));
    }
  }, [collection, sets, isLoaded]);

  // Add a card to collection
  const addCard = (cardData) => {
    const setId = cardData.setId || 'unknown';
    const cardId = cardData.id || `${setId}-${cardData.number}`;
    
    console.log('Adding card:', { setId, cardId, name: cardData.name, set: cardData.set }); // DEBUG
    
    setSets(prev => {
      console.log('Previous sets:', Object.keys(prev)); // DEBUG
      const newSets = {
        ...prev,
        [setId]: {
          id: setId,
          name: cardData.set || 'Unknown Set',
          total: cardData.setTotal || 0,
          logo: cardData.setLogo || null
        }
      };
      console.log('New sets:', Object.keys(newSets)); // DEBUG
      return newSets;
    });

    setCollection(prev => {
      const setCards = prev[setId] || [];
      // Check if card already exists
      const exists = setCards.find(c => c.id === cardId);
      if (exists) {
        // Update scan date
        return {
          ...prev,
          [setId]: setCards.map(c => 
            c.id === cardId 
              ? { ...c, scannedAt: new Date().toISOString(), scanCount: (c.scanCount || 0) + 1 }
              : c
          )
        };
      }
      
      // Add new card
      return {
        ...prev,
        [setId]: [...setCards, {
          id: cardId,
          name: cardData.name,
          number: cardData.number,
          image: cardData.image,
          rarity: cardData.rarity,
          types: cardData.types,
          hp: cardData.hp,
          scannedAt: new Date().toISOString(),
          scanCount: 1
        }]
      };
    });
  };

  // Get all sets with completion stats
  const getSetsWithStats = () => {
    return Object.values(sets).map(set => {
      const collected = collection[set.id] || [];
      const percentage = set.total > 0 ? Math.round((collected.length / set.total) * 100) : 0;
      return {
        ...set,
        collected: collected.length,
        percentage
      };
    }).sort((a, b) => b.collected - a.collected);
  };

  // Get cards for a specific set, sorted by card number
  const getSetCards = (setId) => {
    const cards = collection[setId] || [];
    return cards.sort((a, b) => {
      // Extract numbers from card numbers (e.g., "25/102" -> 25)
      const numA = parseInt(a.number) || 0;
      const numB = parseInt(b.number) || 0;
      return numA - numB;
    });
  };

  // Get total stats
  const getTotalStats = () => {
    const totalCards = Object.values(collection).flat().length;
    const totalSets = Object.keys(sets).length;
    return { totalCards, totalSets };
  };

  return (
    <CollectionContext.Provider value={{
      collection,
      sets,
      isLoaded,
      addCard,
      getSetsWithStats,
      getSetCards,
      getTotalStats
    }}>
      {children}
    </CollectionContext.Provider>
  );
}

export function useCollection() {
  const context = useContext(CollectionContext);
  if (!context) {
    throw new Error('useCollection must be used within CollectionProvider');
  }
  return context;
}
