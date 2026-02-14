import { createContext, useContext, useState, useEffect } from 'react';

const CollectionContext = createContext();

export function CollectionProvider({ children }) {
  const [collection, setCollection] = useState({});
  const [sets, setSets] = useState({});

  // Load collection from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('pokido-collection');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCollection(parsed.collection || {});
        setSets(parsed.sets || {});
      } catch (e) {
        console.error('Failed to load collection:', e);
      }
    }
  }, []);

  // Save to localStorage whenever collection changes
  useEffect(() => {
    localStorage.setItem('pokido-collection', JSON.stringify({
      collection,
      sets
    }));
  }, [collection, sets]);

  // Add a card to collection
  const addCard = (cardData) => {
    const setId = cardData.setId || 'unknown';
    const cardId = cardData.id || `${setId}-${cardData.number}`;
    
    setSets(prev => ({
      ...prev,
      [setId]: {
        id: setId,
        name: cardData.set || 'Unknown Set',
        total: cardData.setTotal || 0,
        logo: cardData.setLogo || null
      }
    }));

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

  // Get cards for a specific set
  const getSetCards = (setId) => {
    return collection[setId] || [];
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
