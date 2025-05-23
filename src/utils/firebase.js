import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, onSnapshot, orderBy, query } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Novi redosled kategorija
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

// Sortiranje artikala po redosledu kategorija
const sortItemsByPDFOrder = (items) => {
  return items.sort((a, b) => {
    const catIndexA = categoryOrder.indexOf(a.category);
    const catIndexB = categoryOrder.indexOf(b.category);
    
    if (catIndexA !== catIndexB) {
      return catIndexA - catIndexB;
    }
    
    return a.name.localeCompare(b.name);
  });
};

// Čita artikle iz trebovanje baze
export const getItemsFromFirebase = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'items'));
    const items = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() });
    });
    
    const sortedItems = sortItemsByPDFOrder(items);
    console.log('✅ Učitano', sortedItems.length, 'artikala');
    return sortedItems;
  } catch (error) {
    console.error('❌ Greška pri učitavanju artikala:', error);
    return [];
  }
};

// Čuva popis u novu kolekciju
export const saveInventoryToFirebase = async (inventoryData) => {
  try {
    const docRef = await addDoc(collection(db, 'inventory'), {
      ...inventoryData,
      timestamp: new Date().toISOString()
    });
    console.log('✅ Popis sačuvan:', docRef.id);
    return { id: docRef.id, ...inventoryData };
  } catch (error) {
    console.error('❌ Greška pri čuvanju popisa:', error);
    throw error;
  }
};

// Učitava sve popise
export const getInventoryFromFirebase = async () => {
  try {
    const q = query(collection(db, 'inventory'), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    const inventory = [];
    querySnapshot.forEach((doc) => {
      inventory.push({ id: doc.id, ...doc.data() });
    });
    console.log('✅ Učitano', inventory.length, 'popisa');
    return inventory;
  } catch (error) {
    console.error('❌ Greška pri učitavanju popisa:', error);
    return [];
  }
};

// Briše popis
export const deleteInventoryFromFirebase = async (inventoryId) => {
  try {
    await deleteDoc(doc(db, 'inventory', inventoryId));
    console.log('✅ Popis obrisan:', inventoryId);
    return true;
  } catch (error) {
    console.error('❌ Greška pri brisanju:', error);
    throw error;
  }
};

// Real-time listener za artikle
export const listenToItems = (callback) => {
  return onSnapshot(collection(db, 'items'), (querySnapshot) => {
    const items = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() });
    });
    
    const sortedItems = sortItemsByPDFOrder(items);
    callback(sortedItems);
  });
};

// Dodaje novi artikal
export const saveItemToFirebase = async (itemData) => {
  try {
    const docRef = await addDoc(collection(db, 'items'), {
      ...itemData,
      timestamp: new Date().toISOString()
    });
    console.log('✅ Artikal sačuvan:', docRef.id);
    return { id: docRef.id, ...itemData };
  } catch (error) {
    console.error('❌ Greška pri čuvanju artikla:', error);
    throw error;
  }
};