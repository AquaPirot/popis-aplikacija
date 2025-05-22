import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, onSnapshot, orderBy, query } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAFKmB111lpF-bYI5o_hlmt2f--zPNh4Io",
  authDomain: "trebovanje-aplikacija.firebaseapp.com",
  projectId: "trebovanje-aplikacija",
  storageBucket: "trebovanje-aplikacija.firebasestorage.app",
  messagingSenderId: "840642827188",
  appId: "1:840642827188:web:1fdb3041b621d8988a58e1",
  measurementId: "G-08FQJYNYVX"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Redosled kategorija kao u vašem PDF-u
const categoryOrder = [
  'Topli napici',
  'Bezalkoholno piće', 
  'Piva',
  'Cideri',
  'Žestoka pića',
  'Vina butilirana',
  'Vina 0,187'
];

// Sortiranje artikala po PDF redosledu
const sortItemsByPDFOrder = (items) => {
  return items.sort((a, b) => {
    // Prvo po kategoriji
    const catIndexA = categoryOrder.indexOf(a.category);
    const catIndexB = categoryOrder.indexOf(b.category);
    
    if (catIndexA !== catIndexB) {
      return catIndexA - catIndexB;
    }
    
    // Zatim alfabetski unutar kategorije
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

// Dodaje novi artikal (kao u trebovanje)
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