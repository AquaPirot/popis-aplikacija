// src/utils/storage.js - KOMPLETNA MYSQL VERZIJA

// ===== MYSQL FUNKCIJE ZA ARTIKLE =====

// Učitaj sve artikle iz MySQL
export const getItemsFromDatabase = async () => {
  try {
    console.log('📡 Učitavam artikle iz MySQL...');
    
    const response = await fetch('/api/items/list');
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Greška pri učitavanju artikala');
    }

    console.log('✅ Artikli učitani:', data.data.length);
    
    // Sortiraj artikle po ispravnom redosledu
    const sortedItems = sortItemsByPDFOrder(data.data);
    return sortedItems || [];
  } catch (error) {
    console.error('❌ Greška pri učitavanju artikala:', error);
    throw error;
  }
};

// Dodaj novi artikal u MySQL
export const addItemToDatabase = async (itemData) => {
  try {
    console.log('➕ Dodajem artikal u MySQL:', itemData);
    
    const response = await fetch('/api/items/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(itemData)
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Greška pri dodavanju artikla');
    }

    console.log('✅ Artikal dodat:', data.data);
    return data.data;
  } catch (error) {
    console.error('❌ Greška pri dodavanju artikla:', error);
    throw error;
  }
};

// ===== MYSQL FUNKCIJE ZA INVENTORY/POPISE =====

// Sačuvaj inventory u MySQL
export const saveInventoryToDatabase = async (inventoryData) => {
  try {
    console.log('💾 Čuvam inventory u MySQL:', inventoryData);
    
    const response = await fetch('/api/inventory/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inventoryData)
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Greška pri čuvanju popisa');
    }

    console.log('✅ Inventory sačuvan:', data);
    return data;
  } catch (error) {
    console.error('❌ Greška pri čuvanju inventory:', error);
    throw error;
  }
};

// Učitaj istoriju popisa iz MySQL
export const getInventoryHistory = async () => {
  try {
    console.log('📡 Učitavam istoriju iz MySQL...');
    
    const response = await fetch('/api/inventory/list');
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Greška pri učitavanju istorije');
    }

    console.log('✅ Istorija učitana:', data.data.length, 'popisa');
    return data.data || [];
  } catch (error) {
    console.error('❌ Greška pri učitavanju istorije:', error);
    throw error;
  }
};

// Učitaj detalje inventory-ja iz MySQL
export const getInventoryDetails = async (inventoryId) => {
  try {
    console.log('📋 Učitavam detalje inventory:', inventoryId);
    
    const response = await fetch(`/api/inventory/${inventoryId}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Greška pri učitavanju detalja popisa');
    }

    console.log('✅ Detalji učitani:', data.data);
    return data.data;
  } catch (error) {
    console.error('❌ Greška pri učitavanju detalja:', error);
    throw error;
  }
};

// Obriši inventory iz MySQL
export const deleteInventory = async (inventoryId) => {
  try {
    console.log('🗑️ Brišem inventory:', inventoryId);
    
    const response = await fetch(`/api/inventory/${inventoryId}`, {
      method: 'DELETE'
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Greška pri brisanju popisa');
    }

    console.log('✅ Inventory obrisan');
    return data;
  } catch (error) {
    console.error('❌ Greška pri brisanju inventory:', error);
    throw error;
  }
};

// ===== HELPER FUNKCIJE =====

// Sortiraj artikle po ispravnom redosledu
export const sortItemsByPDFOrder = (items) => {
  const categoryOrder = [
    'TOPLI NAPICI',
    'BEZALKOHOLNA PIĆA', 
    'CEDEVITA I ENERGETSKA PIĆA',
    'NEXT SOKOVI',
    'PIVA',
    'SOMERSBY',
    'ŽESTOKA PIĆA',
    'VISKI',
    'BRENDI I KONJACI',
    'LIKERI',
    'DOMAĆA ALKOHOLNA PIĆA',
    'BELA VINA',
    'CRVENA VINA',
    'ROZE VINA',
    'VINA 0,187L'
  ];

  return items.sort((a, b) => {
    const categoryA = categoryOrder.indexOf(a.category);
    const categoryB = categoryOrder.indexOf(b.category);
    
    // Ako kategorije nisu u listi, stavi ih na kraj
    const finalCategoryA = categoryA === -1 ? 999 : categoryA;
    const finalCategoryB = categoryB === -1 ? 999 : categoryB;
    
    if (finalCategoryA !== finalCategoryB) {
      return finalCategoryA - finalCategoryB;
    }
    
    // Unutar iste kategorije, sortiraj po imenu
    return a.name.localeCompare(b.name);
  });
};

// Format datuma
export const formatDate = (dateStr) => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('sr-RS', {
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return dateStr;
  }
};

// ===== KOMPATIBILNOST SA STARIM KODOM =====
// Ove funkcije postoje da ne bi bilo grešaka ako neki deo koda još poziva stare funkcije

export const getItemsFromFirebase = async () => {
  console.warn('⚠️ getItemsFromFirebase is deprecated, use getItemsFromDatabase');
  return getItemsFromDatabase();
};

export const saveInventoryToFirebase = async (data) => {
  console.warn('⚠️ saveInventoryToFirebase is deprecated, use saveInventoryToDatabase');
  return saveInventoryToDatabase(data);
};

export const addItemToFirebase = async (data) => {
  console.warn('⚠️ addItemToFirebase is deprecated, use addItemToDatabase');  
  return addItemToDatabase(data);
};

// Dummy funkcija za listenToItems (MySQL nema real-time)
export const listenToItems = (callback) => {
  console.warn('⚠️ listenToItems is not supported with MySQL. Use polling if needed.');
  // Vrati dummy unsubscribe funkciju
  return () => {};
};

// ===== EXPORT SVIH FUNKCIJA =====
export default {
  // MySQL funkcije
  getItemsFromDatabase,
  addItemToDatabase,
  saveInventoryToDatabase,
  getInventoryHistory,
  getInventoryDetails,
  deleteInventory,
  
  // Helper funkcije
  sortItemsByPDFOrder,
  formatDate,
  
  // Kompatibilnost
  getItemsFromFirebase,
  saveInventoryToFirebase,
  addItemToFirebase,
  listenToItems
};