import { useState, useEffect } from 'react';
import { getItemsFromFirebase, saveInventoryToFirebase, saveItemToFirebase, listenToItems } from '../utils/firebase';
import { Plus, Save, FileText, History, Search, Package, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function PopisApp() {
  const [items, setItems] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [datum, setDatum] = useState(new Date().toISOString().split('T')[0]);
  const [sastavio, setSastavio] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Novi struktuirani katalog artikala sa varijantama
  const itemsCatalog = {
    'TOPLI NAPICI': [
      { name: 'ESPRESSO', unit: 'gr', noVariant: true },
      { name: 'NES KAFA', unit: 'gr', noVariant: true },
      { name: 'ČAJ', unit: 'kom', variants: [
        'Nana', 'Kamilica', 'Zeleni', 'Jagoda & Jogurt', 
        'Voćni MIX', 'Jabuka & Cimet', 'Ostalo'
      ]},
      { name: 'TOPLA ČOKOLADA', unit: 'kom', variants: ['Bela', 'Crna']},
      { name: 'MLEKO BARISTA', unit: 'lit', noVariant: true }
    ],
    'BEZALKOHOLNA PIĆA': [
      { name: 'ROSA 0.33', unit: 'kom', noVariant: true },
      { name: 'ROSA 0.7', unit: 'kom', noVariant: true },
      { name: 'ROSA GAZ 0.33', unit: 'kom', noVariant: true },
      { name: 'ROSA GAZ 0.7', unit: 'kom', noVariant: true },
      { name: 'ROMERQUELLE', unit: 'kom', noVariant: true },
      { name: 'KOKA KOLA', unit: 'kom', noVariant: true },
      { name: 'KOKA KOLA zero', unit: 'kom', noVariant: true },
      { name: 'KOKA KOLA limeta', unit: 'kom', noVariant: true },
      { name: 'FANTA', unit: 'kom', noVariant: true },
      { name: 'SPRITE', unit: 'kom', noVariant: true },
      { name: 'BITTER', unit: 'kom', noVariant: true },
      { name: 'SCHWEEPS purple', unit: 'kom', noVariant: true },
      { name: 'TONIK', unit: 'kom', noVariant: true }
    ],
    'CEDEVITA I ENERGETSKA PIĆA': [
      { name: 'CEDEVITA NARANDŽA', unit: 'kom', noVariant: true },
      { name: 'CEDEVITA 9 VITAMINA', unit: 'kom', noVariant: true },
      { name: 'CEDEVITA LIMUN', unit: 'kom', noVariant: true },
      { name: 'CEDEVITA LIMETA', unit: 'kom', noVariant: true },
      { name: 'KOKTA', unit: 'kom', noVariant: true },
      { name: 'ULTRA ENERGY', unit: 'kom', noVariant: true },
      { name: 'RED BULL', unit: 'kom', noVariant: true },
      { name: 'GUARANA', unit: 'kom', noVariant: true }
    ],
    'NEXT SOKOVI': [
      { name: 'NEXT JABUKA', unit: 'kom', noVariant: true },
      { name: 'NEXT NARANDŽA', unit: 'kom', noVariant: true },
      { name: 'NEXT JAGODA', unit: 'kom', noVariant: true },
      { name: 'NEXT ŠUMSKO VOĆE', unit: 'kom', noVariant: true },
      { name: 'NEXT BRESKVA', unit: 'kom', noVariant: true },
      { name: 'NEXT LIMUNADA JAGODA', unit: 'kom', noVariant: true },
      { name: 'NEXT LIMUNADA ANANAS', unit: 'kom', noVariant: true }
    ],
    'PIVA': [
      { name: 'TUBORG 0.3', unit: 'kom', noVariant: true },
      { name: 'LAV PREMIUM 0.3', unit: 'kom', noVariant: true },
      { name: 'TOČENO LAV PREMIUM 30l', unit: 'kom', noVariant: true },
      { name: 'CARLSBERG 0.25', unit: 'kom', noVariant: true },
      { name: 'ERDINGER', unit: 'kom', noVariant: true },
      { name: 'BLANC - KRONENBURG', unit: 'kom', noVariant: true },
      { name: 'TUBORG ICE', unit: 'kom', noVariant: true },
      { name: 'BUDWEISER TAMNO', unit: 'kom', noVariant: true },
      { name: 'BUDWEISER SVETLO', unit: 'kom', noVariant: true }
    ],
    'SOMERSBY': [
      { name: 'SOMERSBY MANGO', unit: 'kom', noVariant: true },
      { name: 'SOMERSBY JABUKA', unit: 'kom', noVariant: true },
      { name: 'SOMERSBY BOROVNICA', unit: 'kom', noVariant: true },
      { name: 'SOMERSBY MALINA', unit: 'kom', noVariant: true },
      { name: 'SOMERSBY JAGODA', unit: 'kom', noVariant: true }
    ],
    'ŽESTOKA PIĆA': [
      { name: 'VOTKA', unit: 'ml', noVariant: true },
      { name: 'SMIRNOFF', unit: 'ml', noVariant: true },
      { name: 'DŽIN', unit: 'ml', noVariant: true },
      { name: 'DŽIN BEEFEATER', unit: 'ml', noVariant: true },
      { name: 'DŽIN BEEFEATER PINK', unit: 'ml', noVariant: true },
      { name: 'TEQUILA', unit: 'ml', noVariant: true },
      { name: 'VINJAK', unit: 'ml', noVariant: true },
      { name: 'GORKI LIST', unit: 'ml', noVariant: true },
      { name: 'VERMUT', unit: 'ml', noVariant: true }
    ],
    'VISKI': [
      { name: 'JOHNNIE WALKER RED', unit: 'ml', noVariant: true },
      { name: 'JOHNNIE WALKER BLACK', unit: 'ml', noVariant: true },
      { name: 'JAMESON', unit: 'ml', noVariant: true },
      { name: 'CHIVAS', unit: 'ml', noVariant: true },
      { name: 'TULLAMORE DEW', unit: 'ml', noVariant: true },
      { name: 'JACK DANIELS', unit: 'ml', noVariant: true },
      { name: 'BALLANTINES', unit: 'ml', noVariant: true }
    ],
    'BRENDI I KONJACI': [
      { name: 'COURVOISIER', unit: 'ml', noVariant: true },
      { name: 'HENNESSY', unit: 'ml', noVariant: true }
    ],
    'LIKERI': [
      { name: 'JEGER', unit: 'ml', noVariant: true },
      { name: 'BAILEYS', unit: 'ml', noVariant: true },
      { name: 'APEROL', unit: 'ml', noVariant: true },
      { name: 'CAMPARI', unit: 'ml', noVariant: true },
      { name: 'MARTINI', unit: 'ml', noVariant: true },
      { name: 'RAMAZZOTTI', unit: 'ml', noVariant: true },
      { name: 'OUZO', unit: 'ml', noVariant: true },
      { name: 'HAVANA RUM', unit: 'ml', noVariant: true }
    ],
    'DOMAĆA ALKOHOLNA PIĆA': [
      { name: 'MEGDAN DUNJA 1l', unit: 'ml', noVariant: true },
      { name: 'MEGDAN ŠLJIVA 1l', unit: 'ml', noVariant: true },
      { name: 'MEGDAN VILJAMOVKA', unit: 'ml', noVariant: true },
      { name: 'MEGDAN KAJSIJA', unit: 'ml', noVariant: true },
      { name: 'MEGDAN GROŽĐE', unit: 'ml', noVariant: true },
      { name: 'STOMAKLIJA', unit: 'ml', noVariant: true }
    ],
    'BELA VINA': [
      { name: 'FILIGRAN CHARDONNAY', unit: 'kom', noVariant: true },
      { name: 'KOVAČEVIĆ CHARDONNAY', unit: 'kom', noVariant: true },
      { name: 'RADOVANOVIĆ CHARDONNAY', unit: 'kom', noVariant: true },
      { name: 'MATALJ SOUVIGNON', unit: 'kom', noVariant: true },
      { name: 'MATALJ CHARDONNAY', unit: 'kom', noVariant: true },
      { name: 'ALEKSANDROVIĆ TEMA', unit: 'kom', noVariant: true },
      { name: 'CILIĆ ONYX BELI', unit: 'kom', noVariant: true },
      { name: 'DEURIĆ AKSIOM BELI', unit: 'kom', noVariant: true },
      { name: 'SPASIĆ LEKCIJA TAMJANIKA', unit: 'kom', noVariant: true },
      { name: 'RUBIN SOV BLANC', unit: 'kom', noVariant: true },
      { name: 'RUBIN CHARDONAY', unit: 'kom', noVariant: true },
      { name: 'RUBIN MUSCAT', unit: 'kom', noVariant: true },
      { name: 'LA SASTRERIA BELO', unit: 'kom', noVariant: true },
      { name: 'SAVIĆ RIZLING', unit: 'kom', noVariant: true },
      { name: 'JOVIĆ CHARDONNAY', unit: 'kom', noVariant: true }
    ],
    'CRVENA VINA': [
      { name: 'RUBIN MERLOT', unit: 'kom', noVariant: true },
      { name: 'FILIGRAN CABERNET', unit: 'kom', noVariant: true },
      { name: 'IZBA JOVAN MERLOT', unit: 'kom', noVariant: true },
      { name: 'RADOVANOVIĆ CABERNET', unit: 'kom', noVariant: true },
      { name: 'RADOVANOVIĆ SUVIGNON', unit: 'kom', noVariant: true },
      { name: 'CILIĆ ONYX CRVENO', unit: 'kom', noVariant: true },
      { name: 'DEURIĆ AKSIOM CRVENI', unit: 'kom', noVariant: true },
      { name: 'SPASIĆ DESPOT', unit: 'kom', noVariant: true },
      { name: 'MATALJ KREMEN', unit: 'kom', noVariant: true },
      { name: 'ALEKSANDROVIĆ PROKUPAC', unit: 'kom', noVariant: true },
      { name: 'RUBIN CABERNET', unit: 'kom', noVariant: true },
      { name: 'RUBIN DOB.BAR. SUV', unit: 'kom', noVariant: true },
      { name: 'RUBIN DOB.BAR. CAB', unit: 'kom', noVariant: true },
      { name: 'RUBIN AMANTE CARMEN', unit: 'kom', noVariant: true },
      { name: 'JOVIĆ CABERNET', unit: 'kom', noVariant: true },
      { name: 'JOVIĆ VRANAC', unit: 'kom', noVariant: true },
      { name: 'PROCORDE VRANAC', unit: 'kom', noVariant: true },
      { name: 'LA SASTRERIA CRVENO', unit: 'kom', noVariant: true },
      { name: 'CILIĆ MORAVA', unit: 'kom', noVariant: true },
      { name: 'CILIĆ cabernet & merlot', unit: 'kom', noVariant: true },
      { name: 'VINUM FRANCOVKA', unit: 'kom', noVariant: true },
      { name: 'TEMET BURGUNDAC', unit: 'kom', noVariant: true },
      { name: 'IVANOVIĆ PROKUPAC', unit: 'kom', noVariant: true },
      { name: 'CRNA OVCA', unit: 'kom', noVariant: true }
    ],
    'ROZE VINA': [
      { name: 'RUBIN ROSE 0,7', unit: 'kom', noVariant: true },
      { name: 'DESPOTIKA NEMIR', unit: 'kom', noVariant: true },
      { name: 'MATALJ DUSICA', unit: 'kom', noVariant: true },
      { name: 'RUBIN VRONSKY 0,7', unit: 'kom', noVariant: true }
    ],
    'VINA 0,187L': [
      { name: 'RUBIN CHARDONNAY 0,187', unit: 'kom', noVariant: true },
      { name: 'RUBIN VRANAC 0,187', unit: 'kom', noVariant: true },
      { name: 'RUBIN ROSE 0,187', unit: 'kom', noVariant: true }
    ]
  };

  // Redosled kategorija
  const categoryOrder = Object.keys(itemsCatalog);

  // Generisanje liste svih artikala za sortiranje
  const generateItemOrder = () => {
    const order = [];
    categoryOrder.forEach(category => {
      itemsCatalog[category].forEach(item => {
        if (item.variants) {
          item.variants.forEach(variant => {
            order.push(`${item.name} - ${variant}`);
          });
        } else {
          order.push(item.name);
        }
      });
    });
    return order;
  };

  const exactItemOrder = generateItemOrder();

  // Sortiranje artikala po katalogu
  const sortItemsByCatalogOrder = (categoryItems) => {
    return categoryItems.sort((a, b) => {
      let indexA = exactItemOrder.indexOf(a.name);
      let indexB = exactItemOrder.indexOf(b.name);
      
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      
      return indexA - indexB;
    });
  };

  // Toggle kategorija
  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Učitavanje artikala
  useEffect(() => {
    const loadItems = async () => {
      try {
        const allItems = await getItemsFromFirebase();
        setItems(allItems);
        
        // Automatski otvori sve kategorije na početku
        const initialExpanded = {};
        categoryOrder.forEach(cat => {
          initialExpanded[cat] = true;
        });
        setExpandedCategories(initialExpanded);
      } catch (error) {
        console.error('Greška pri učitavanju:', error);
      } finally {
        setLoading(false);
      }
    };

    loadItems();

    const unsubscribe = listenToItems((newItems) => {
      setItems(newItems);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filtriranje po pretrazi
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Grupiranje artikala po kategorijama
  const groupedItems = filteredItems.reduce((acc, item) => {
    const category = item.category || 'Ostalo';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});

  // Sortiranje kategorija po redosledu
  const sortedCategories = categoryOrder
    .filter(category => groupedItems[category])
    .map(category => [category, sortItemsByCatalogOrder(groupedItems[category])]);

  // Dodaj ostale kategorije koje nisu u listi
  Object.entries(groupedItems).forEach(([category, categoryItems]) => {
    if (!categoryOrder.includes(category)) {
      sortedCategories.push([category, sortItemsByCatalogOrder(categoryItems)]);
    }
  });

  // Input handlers
  const handleInputFocus = (e) => {
    if (e.target.value === '0') {
      e.target.value = '';
    }
  };

  const handleInputBlur = (e, itemId) => {
    if (e.target.value === '') {
      setQuantities(prev => ({
        ...prev,
        [itemId]: 0
      }));
    }
  };

  const handleQuantityChange = (itemId, value) => {
    if (value === '') {
      setQuantities(prev => ({
        ...prev,
        [itemId]: ''
      }));
    } else {
      const numValue = parseFloat(value) || 0;
      setQuantities(prev => ({
        ...prev,
        [itemId]: numValue
      }));
    }
  };

  // Brzo popunjavanje kategorije
  const fillCategoryWithValue = (categoryItems, value) => {
    const updates = {};
    categoryItems.forEach(item => {
      updates[item.id] = value;
    });
    setQuantities(prev => ({ ...prev, ...updates }));
  };

  // Čuvanje popisa
  const handleSave = async () => {
    if (!datum || !sastavio.trim()) {
      alert('Molimo unesite datum i ko je sastavio popis!');
      return;
    }

    const itemsWithQuantities = items.filter(item => 
      quantities[item.id] && quantities[item.id] > 0
    );

    setSaving(true);
    try {
      const inventoryData = {
        datum,
        sastavio: sastavio.trim(),
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          unit: item.unit,
          quantity: quantities[item.id] || 0
        })),
        totalItems: items.length,
        itemsWithQuantity: itemsWithQuantities.length
      };

      await saveInventoryToFirebase(inventoryData);
      
      setQuantities({});
      setSastavio('');
      setDatum(new Date().toISOString().split('T')[0]);
      
      alert(`Popis je sačuvan! (${itemsWithQuantities.length} artikala sa količinama)`);
    } catch (error) {
      console.error('Greška pri čuvanju:', error);
      alert('Greška pri čuvanju popisa: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">📦</div>
          <p className="text-gray-600">Učitavam artikle...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {!isOnline && (
        <div className="bg-red-500 text-white p-3 text-center sticky top-0 z-50 animate-pulse">
          ⚠️ Offline režim - promene će biti sinhronizovane kada se vratite online
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Package className="w-8 h-8" />
              Popis artikala
            </h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg text-sm flex items-center gap-1 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Dodaj
              </button>
              <Link href="/istorija" className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm flex items-center gap-1 transition-colors">
                <History className="w-4 h-4" />
                Istorija
              </Link>
            </div>
          </div>

          {/* Forma za osnovne podatke */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 font-medium">Datum popisa:</label>
              <input
                type="date"
                value={datum}
                onChange={(e) => setDatum(e.target.value)}
                className="w-full p-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div>
              <label className="block mb-2 font-medium">Popis sastavio:</label>
              <input
                type="text"
                value={sastavio}
                onChange={(e) => setSastavio(e.target.value)}
                placeholder="Ime i prezime"
                className="w-full p-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-b-2xl shadow-xl p-6">
          {/* Pretraga */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Pretraži artikle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Statistike */}
<div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl mb-6 border border-blue-100">
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
    <div className="bg-white rounded-lg p-3 shadow-sm">
      <div className="text-2xl font-bold text-blue-600">{filteredItems.length}</div>
      <div className="text-xs text-gray-600">Ukupno artikala</div>
    </div>
    <div className="bg-white rounded-lg p-3 shadow-sm">
      <div className="text-2xl font-bold text-green-600">
        {Object.values(quantities).filter(q => q > 0).length}
      </div>
      <div className="text-xs text-gray-600">Sa količinama</div>
    </div>
    <div className="bg-white rounded-lg p-3 shadow-sm">
      <div className="text-2xl font-bold text-purple-600">{sortedCategories.length}</div>
      <div className="text-xs text-gray-600">Kategorija</div>
    </div>
  </div>
</div>

          {/* Lista artikala po kategorijama */}
          <div className="space-y-4">
            {sortedCategories.map(([category, categoryItems]) => (
              <div key={category} className="border-2 border-gray-100 rounded-xl overflow-hidden hover:border-blue-200 transition-colors">
                <div 
                  onClick={() => toggleCategory(category)}
                  className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 cursor-pointer hover:from-blue-50 hover:to-indigo-50 transition-all"
                >
                  <div className="flex justify-between items-center">
                    <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                      <span className={`transform transition-transform ${expandedCategories[category] ? 'rotate-90' : ''}`}>
                        ▶
                      </span>
                      {category} ({categoryItems.length})
                    </h2>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          fillCategoryWithValue(categoryItems, 0);
                        }}
                        className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200 transition-colors"
                      >
                        Resetuj
                      </button>
                      <span className="text-sm text-gray-500">
                        {categoryItems.filter(item => quantities[item.id] > 0).length} popunjeno
                      </span>
                    </div>
                  </div>
                </div>
                
                {expandedCategories[category] && (
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {categoryItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-all hover:shadow-md">
                          <div className="flex-1">
                            <div className="font-medium text-gray-800 text-sm">{item.name}</div>
                            <div className="text-xs text-gray-500">Jedinica: {item.unit}</div>
                          </div>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={quantities[item.id] === '' ? '' : (quantities[item.id] || 0)}
                            onFocus={handleInputFocus}
                            onBlur={(e) => handleInputBlur(e, item.id)}
                            onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                            className="w-24 text-center rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-2 transition-all"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Save dugme */}
          <div className="mt-8 pt-6 border-t-2 border-gray-100">
            <button
              onClick={handleSave}
              disabled={saving || !datum || !sastavio.trim()}
              className={`w-full p-4 rounded-xl text-lg font-bold transition-all flex items-center justify-center gap-2 ${
                saving || !datum || !sastavio.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1'
              }`}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Čuvam popis...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Sačuvaj popis
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <AddItemModal 
          show={showAddModal} 
          onClose={() => setShowAddModal(false)}
          categories={categoryOrder}
          itemsCatalog={itemsCatalog}
        />
      )}
    </div>
  );
}

// Modal za dodavanje novog artikla
function AddItemModal({ show, onClose, categories, itemsCatalog }) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    newCategory: '',
    unit: 'kom',
    hasVariants: false,
    selectedVariant: ''
  });
  const [saving, setSaving] = useState(false);

  // Pronađi postojeće varijante za izabrani artikal
  const getVariantsForItem = () => {
    if (!formData.category || !formData.name) return [];

     const categoryItems = itemsCatalog[formData.category];
   if (!categoryItems) return [];
   
   const item = categoryItems.find(i => i.name === formData.name);
   return item?.variants || [];
 };

 const handleSubmit = async (e) => {
   e.preventDefault();
   if (!formData.name.trim()) return;

   setSaving(true);
   try {
     let finalName = formData.name.trim().toUpperCase();
     
     // Dodaj varijantu u naziv ako postoji
     if (formData.hasVariants && formData.selectedVariant) {
       finalName = `${finalName} - ${formData.selectedVariant}`;
     }

     const itemData = {
       name: finalName,
       category: formData.newCategory.trim() || formData.category,
       unit: formData.unit
     };

     await saveItemToFirebase(itemData);
     alert('Artikal je dodat!');
     setFormData({ name: '', category: '', newCategory: '', unit: 'kom', hasVariants: false, selectedVariant: '' });
     onClose();
   } catch (error) {
     alert('Greška pri dodavanju: ' + error.message);
   } finally {
     setSaving(false);
   }
 };

 if (!show) return null;

 const variants = getVariantsForItem();

 return (
   <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
     <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
       <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
         <Plus className="w-5 h-5" />
         Dodaj novi artikal
       </h2>
       
       <form onSubmit={handleSubmit} className="space-y-4">
         <div>
           <label className="block mb-2 font-medium">Kategorija:</label>
           <select
             value={formData.category}
             onChange={(e) => {
               const category = e.target.value;
               setFormData({...formData, category, hasVariants: false, selectedVariant: ''});
             }}
             className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-200"
           >
             <option value="">Izaberi postojeću kategoriju</option>
             {categories.map(cat => (
               <option key={cat} value={cat}>{cat}</option>
             ))}
           </select>
           
           <input
             type="text"
             value={formData.newCategory}
             onChange={(e) => setFormData({...formData, newCategory: e.target.value})}
             className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-200 mt-2"
             placeholder="Ili unesite novu kategoriju"
           />
         </div>

         <div>
           <label className="block mb-2 font-medium">Naziv artikla:</label>
           <select
             value={formData.name}
             onChange={(e) => {
               const name = e.target.value;
               const categoryItems = itemsCatalog[formData.category] || [];
               const item = categoryItems.find(i => i.name === name);
               setFormData({
                 ...formData, 
                 name,
                 unit: item?.unit || 'kom',
                 hasVariants: !!item?.variants,
                 selectedVariant: ''
               });
             }}
             className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-200 mb-2"
             disabled={!formData.category || formData.newCategory}
           >
             <option value="">Izaberi postojeći artikal ili unesi novi</option>
             {formData.category && itemsCatalog[formData.category]?.map(item => (
               <option key={item.name} value={item.name}>{item.name}</option>
             ))}
           </select>
           
           <input
             type="text"
             value={formData.name}
             onChange={(e) => setFormData({...formData, name: e.target.value})}
             className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-200"
             placeholder="Ili unesite novi naziv"
           />
         </div>

         {formData.hasVariants && variants.length > 0 && (
           <div>
             <label className="block mb-2 font-medium">Varijanta:</label>
             <select
               value={formData.selectedVariant}
               onChange={(e) => setFormData({...formData, selectedVariant: e.target.value})}
               className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-200"
               required
             >
               <option value="">Izaberi varijantu</option>
               {variants.map(variant => (
                 <option key={variant} value={variant}>{variant}</option>
               ))}
             </select>
           </div>
         )}

         <div>
           <label className="block mb-2 font-medium">Jedinica mere:</label>
           <select
             value={formData.unit}
             onChange={(e) => setFormData({...formData, unit: e.target.value})}
             className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-200"
           >
             <option value="kom">kom</option>
             <option value="ml">ml</option>
             <option value="lit">lit</option>
             <option value="gr">gr</option>
             <option value="kg">kg</option>
           </select>
         </div>

         <div className="flex gap-3 pt-4">
           <button
             type="button"
             onClick={onClose}
             className="flex-1 bg-gray-500 text-white p-3 rounded-lg hover:bg-gray-600 transition-colors"
           >
             Otkaži
           </button>
           <button
             type="submit"
             disabled={saving}
             className="flex-1 bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
           >
             {saving ? 'Čuvam...' : 'Dodaj'}
           </button>
         </div>
       </form>
     </div>
   </div>
 );
}
