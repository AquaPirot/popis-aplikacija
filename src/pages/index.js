import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getItemsFromDatabase, saveInventoryToDatabase, addItemToDatabase } from '../utils/storage';

export default function PopisApp() {
  const [items, setItems] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [datumVreme, setDatumVreme] = useState('');
  const [sastavio, setSastavio] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openCategories, setOpenCategories] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [dynamicCategories, setDynamicCategories] = useState([]);

  // TAČAN REDOSLED IZ SQL-a
  const EXACT_ITEMS_ORDER = [
    'ESPRESSO', 'NES KAFA', 'ČAJ', 'TOPLA ČOKOLADA - Bela', 'TOPLA ČOKOLADA - Crna', 'MLEKO BARISTA',
    'ROSA 0.33', 'ROSA 0.7', 'ROSA GAZ 0.33', 'ROSA GAZ 0.7', 'ROMERQUELLE', 'KOKA KOLA', 'KOKA KOLA zero', 'KOKA KOLA limeta', 'FANTA', 'SPRITE', 'BITTER', 'SCHWEEPS purple', 'TONIK',
    'CEDEVITA NARANDŽA', 'CEDEVITA 9 VITAMINA', 'CEDEVITA LIMUN', 'CEDEVITA LIMETA', 'KOKTA', 'ULTRA ENERGY', 'RED BULL', 'GUARANA',
    'NEXT JABUKA', 'NEXT NARANDŽA', 'NEXT JAGODA', 'NEXT ŠUMSKO VOĆE', 'NEXT BRESKVA', 'NEXT LIMUNADA JAGODA', 'NEXT LIMUNADA ANANAS',
    'TUBORG 0.3', 'LAV PREMIUM 0.3', 'TOČENO LAV PREMIUM 30l', 'CARLSBERG 0.25', 'ERDINGER', 'BLANC - KRONENBURG', 'TUBORG ICE', 'BUDWEISER TAMNO', 'BUDWEISER SVETLO',
    'SOMERSBY MANGO', 'SOMERSBY JABUKA', 'SOMERSBY BOROVNICA', 'SOMERSBY MALINA', 'SOMERSBY JAGODA',
    'VOTKA', 'SMIRNOFF', 'DŽIN', 'DŽIN BEEFEATER', 'DŽIN BEEFEATER PINK', 'TEQUILA', 'VINJAK', 'GORKI LIST', 'VERMUT',
    'JOHNNIE WALKER RED', 'JOHNNIE WALKER BLACK', 'JAMESON', 'CHIVAS', 'TULLAMORE DEW', 'JACK DANIELS', 'BALLANTINES',
    'COURVOISIER', 'HENNESSY',
    'JEGER', 'BAILEYS', 'APEROL', 'CAMPARI', 'MARTINI', 'RAMAZZOTTI', 'OUZO', 'HAVANA RUM',
    'MEGDAN DUNJA 1l', 'MEGDAN ŠLJIVA 1l', 'MEGDAN VILJAMOVKA', 'MEGDAN KAJSIJA', 'MEGDAN GROŽĐE', 'STOMAKLIJA',
    'FILIGRAN CHARDONNAY', 'KOVAČEVIĆ CHARDONNAY', 'RADOVANOVIĆ CHARDONNAY', 'MATALJ SOUVIGNON', 'MATALJ CHARDONNAY', 'ALEKSANDROVIĆ TEMA', 'CILIĆ ONYX BELI', 'DEURIĆ AKSIOM BELI', 'SPASIĆ LEKCIJA TAMJANIKA', 'RUBIN SOV BLANC', 'RUBIN CHARDONAY', 'RUBIN MUSCAT', 'LA SASTRERIA BELO', 'SAVIĆ RIZLING', 'JOVIĆ CHARDONNAY',
    'RUBIN MERLOT', 'FILIGRAN CABERNET', 'IZBA JOVAN MERLOT', 'RADOVANOVIĆ CABERNET', 'RADOVANOVIĆ SUVIGNON', 'CILIĆ ONYX CRVENO', 'DEURIĆ AKSIOM CRVENI', 'SPASIĆ DESPOT', 'MATALJ KREMEN', 'ALEKSANDROVIĆ PROKUPAC', 'RUBIN CABERNET', 'RUBIN DOB.BAR. SUV', 'RUBIN DOB.BAR. CAB', 'RUBIN AMANTE CARMEN', 'JOVIĆ CABERNET', 'JOVIĆ VRANAC', 'PROCORDE VRANAC', 'LA SASTRERIA CRVENO', 'CILIĆ MORAVA', 'CILIĆ cabernet & merlot', 'VINUM FRANCOVKA', 'TEMET BURGUNDAC', 'IVANOVIĆ PROKUPAC', 'CRNA OVCA',
    'RUBIN ROSE 0,7', 'DESPOTIKA NEMIR', 'MATALJ DUSICA', 'RUBIN VRONSKY 0,7',
    'RUBIN CHARDONNAY 0,187', 'RUBIN VRANAC 0,187', 'RUBIN ROSE 0,187'
  ];

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

  // Funkcija za ažuriranje kategorija iz baze - useCallback da se izbegne warning
  const updateCategoriesFromItems = useCallback((items) => {
    const uniqueCategories = [...new Set(items.map(item => item.category))];
    
    // Kombinuj osnovne kategorije sa onima iz baze
    const sortedCategories = [
      ...categoryOrder.filter(cat => uniqueCategories.includes(cat)),
      ...uniqueCategories.filter(cat => !categoryOrder.includes(cat)).sort()
    ];
    
    setDynamicCategories(sortedCategories);
    console.log('📋 Ažurirane kategorije:', sortedCategories);
  }, []);

  // SORTIRANJE PO TAČNOM REDOSLEDU
  const sortItemsByExactOrder = (items) => {
    return items.sort((a, b) => {
      const indexA = EXACT_ITEMS_ORDER.indexOf(a.name);
      const indexB = EXACT_ITEMS_ORDER.indexOf(b.name);
      
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      
      if (indexA === -1 && indexB !== -1) return 1;
      if (indexA !== -1 && indexB === -1) return -1;
      
      return a.name.localeCompare(b.name);
    });
  };

  // SRPSKI DATUM I VREME - automatski
  useEffect(() => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    setDatumVreme(`${day}/${month}/${year} ${hours}:${minutes}`);
  }, []);

  useEffect(() => {
    const loadItems = async () => {
      try {
        const allItems = await getItemsFromDatabase();
        setItems(allItems);
        updateCategoriesFromItems(allItems); // Ažuriraj kategorije
        setLoading(false);
      } catch (error) {
        console.error('Error loading items:', error);
        setLoading(false);
        alert('Greška pri učitavanju artikala: ' + error.message);
      }
    };

    loadItems();
  }, [updateCategoriesFromItems]);

  const handleQuantityChange = (itemId, value) => {
    const numValue = value === '' ? '' : parseInt(value) || 0;
    setQuantities(prev => ({
      ...prev,
      [itemId]: numValue
    }));
  };

  const toggleCategory = (category) => {
    setOpenCategories(prev => 
      prev.includes(category) 
        ? prev.filter(cat => cat !== category)
        : [...prev, category]
    );
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  // SORTIRAJ ARTIKLE U SVAKOJ KATEGORIJI PO NAŠEM REDOSLEDU
  Object.keys(groupedItems).forEach(category => {
    groupedItems[category] = sortItemsByExactOrder(groupedItems[category]);
  });

  const sortedCategories = categoryOrder.filter(category => groupedItems[category]);
  Object.keys(groupedItems).forEach(category => {
    if (!categoryOrder.includes(category)) {
      sortedCategories.push(category);
    }
  });

  const totalItems = filteredItems.length;
  const itemsWithQuantity = filteredItems.filter(item => quantities[item.id] && quantities[item.id] > 0).length;
  const uniqueCategories = sortedCategories.length;

  const handleSaveInventory = async () => {
    if (!sastavio.trim()) {
      alert('Molimo unesite ko je sastavio popis');
      return;
    }

    setSaving(true);
    try {
      const inventoryData = {
        datum: datumVreme,
        sastavio: sastavio.trim(),
        items: filteredItems.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          unit: item.unit,
          quantity: quantities[item.id] || 0
        }))
      };

      const result = await saveInventoryToDatabase(inventoryData);
      
      alert('Popis je uspešno sačuvan!');
      
      // Reset forme
      setQuantities({});
      setSastavio('');
      
      // Ponovo postavi datum i vreme
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setDatumVreme(`${day}/${month}/${year} ${hours}:${minutes}`);
      
      console.log('Inventory saved:', result);
    } catch (error) {
      console.error('Error saving inventory:', error);
      alert('Greška pri čuvanju popisa: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center px-4">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-lg font-medium">Učitavam artikle...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-2 sm:p-4">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 p-4 sm:p-6 text-white">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg mr-3">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold">Popis artikala</h1>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="hidden sm:inline">Dodaj</span>
                </button>
                
                <Link 
                  href="/istorija"
                  className="flex items-center px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="hidden sm:inline">Istorija</span>
                </Link>
              </div>
            </div>

            {/* DATUM I VREME AUTOMATSKI + SASTAVIO */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex-1">
                  <label className="block text-white text-sm mb-1 font-medium">Datum i vreme popisa:</label>
                  <input
                    type="text"
                    value={datumVreme}
                    onChange={(e) => setDatumVreme(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="dd/mm/yyyy hh:mm"
                  />
                </div>
                
                <div className="flex-1">
                  <label className="block text-white text-sm mb-1 font-medium">Popis sastavio:</label>
                  <input
                    type="text"
                    value={sastavio}
                    onChange={(e) => setSastavio(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Ime i prezime"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Stats */}
        <div className="p-4 sm:p-6 bg-gray-50 border-b">
          <div className="space-y-4">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Pretraži artikle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="text-center bg-white p-3 rounded-lg shadow-sm">
                <div className="text-lg sm:text-2xl font-bold text-blue-600">{totalItems}</div>
                <div className="text-xs sm:text-sm text-gray-500">Ukupno</div>
              </div>
              <div className="text-center bg-white p-3 rounded-lg shadow-sm">
                <div className="text-lg sm:text-2xl font-bold text-green-600">{itemsWithQuantity}</div>
                <div className="text-xs sm:text-sm text-gray-500">Sa količinom</div>
              </div>
              <div className="text-center bg-white p-3 rounded-lg shadow-sm">
                <div className="text-lg sm:text-2xl font-bold text-purple-600">{uniqueCategories}</div>
                <div className="text-xs sm:text-sm text-gray-500">Kategorija</div>
              </div>
            </div>
          </div>
        </div>

        {/* KATEGORIJE - SAMO KATEGORIJE, KLIK ZA ARTIKLE */}
        <div className="p-4 sm:p-6">
          {sortedCategories.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nema artikala</h3>
              <p className="text-gray-500 text-sm">Dodajte artikle da biste počeli sa popisom.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedCategories.map(category => (
                <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 flex items-center justify-between text-left font-medium transition-colors"
                  >
                    <span className="text-sm sm:text-base font-semibold">{category}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs sm:text-sm text-gray-500 bg-white px-2 py-1 rounded">
                        {groupedItems[category].filter(item => quantities[item.id] && quantities[item.id] > 0).length} / {groupedItems[category].length}
                      </span>
                      <svg 
                        className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${openCategories.includes(category) ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  
                  {openCategories.includes(category) && (
                    <div className="divide-y divide-gray-100">
                      {groupedItems[category].map(item => (
                        <div key={item.id} className="p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 text-sm sm:text-base">{item.name}</h4>
                              <p className="text-xs sm:text-sm text-gray-500">Jedinica: {item.unit}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600 sm:hidden">Količina:</span>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={quantities[item.id] || ''}
                                onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                className="w-20 sm:w-24 px-2 py-2 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="0"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="p-4 sm:p-6 bg-gray-50 border-t">
          <button
            onClick={handleSaveInventory}
            disabled={saving || !sastavio.trim()}
            className="w-full flex items-center justify-center px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium rounded-lg transition-colors text-sm sm:text-base"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Čuvam popis...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Sačuvaj popis
              </>
            )}
          </button>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <AddItemModal 
          show={showAddModal} 
          onClose={() => setShowAddModal(false)}
          categories={dynamicCategories}
          onItemAdded={async () => {
            const allItems = await getItemsFromDatabase();
            setItems(allItems);
            updateCategoriesFromItems(allItems); // Ažuriraj kategorije nakon dodavanja
          }}
        />
      )}
    </div>
  );
}

// Modal za dodavanje novog artikla - KOMPLETNA POPRAVKA
function AddItemModal({ show, onClose, categories, onItemAdded }) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    newCategory: '',
    unit: 'kom'
  });
  const [saving, setSaving] = useState(false);
  const [allCategories, setAllCategories] = useState([]);

  // Osnovne kategorije
  const defaultCategories = [
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

  // Funkcija za ažuriranje liste kategorija iz baze - useCallback da se izbegne warning
  const updateCategoriesFromDatabase = useCallback(async () => {
    try {
      console.log('🔄 Ažuriram kategorije iz baze...');
      
      const items = await getItemsFromDatabase();
      const uniqueCategories = [...new Set(items.map(item => item.category))];
      
      console.log('📋 Kategorije iz baze:', uniqueCategories);
      
      // Kombinuj osnovne kategorije sa onima iz baze
      const sortedCategories = [
        ...defaultCategories.filter(cat => uniqueCategories.includes(cat)),
        ...uniqueCategories.filter(cat => !defaultCategories.includes(cat)).sort()
      ];

      console.log('✅ Finalne kategorije:', sortedCategories);
      setAllCategories(sortedCategories);
    } catch (error) {
      console.error('❌ Greška pri ažuriranju kategorija:', error);
      // Ako ne može da učita iz baze, koristi osnovne
      setAllCategories(defaultCategories);
    }
  }, []);

  // Učitaj kategorije kada se modal otvori
  useEffect(() => {
    if (show) {
      console.log('🎯 Modal otvoren, učitavam kategorije...');
      updateCategoriesFromDatabase();
    }
  }, [show, updateCategoriesFromDatabase]);

  // Takođe ažuriraj kategorije ako se promeni categories prop
  useEffect(() => {
    if (categories && categories.length > 0) {
      setAllCategories(categories);
    }
  }, [categories]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Molimo unesite naziv artikla');
      return;
    }

    const finalCategory = formData.newCategory.trim() || formData.category;
    if (!finalCategory) {
      alert('Molimo izaberite ili unesite kategoriju');
      return;
    }

    setSaving(true);
    try {
      const itemData = {
        name: formData.name.trim().toUpperCase(),
        category: finalCategory.toUpperCase(),
        unit: formData.unit
      };

      console.log('➕ Dodajem artikal:', itemData);
      await addItemToDatabase(itemData);
      
      alert('Artikal je uspešno dodat!');
      setFormData({ name: '', category: '', newCategory: '', unit: 'kom' });
      
      // Ažuriraj kategorije nakon dodavanja (nova kategorija će biti uključena)
      await updateCategoriesFromDatabase();
      
      onClose();
      
      if (onItemAdded) {
        await onItemAdded();
      }
    } catch (error) {
      alert('Greška pri dodavanju: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Dodaj novi artikal</h2>
          <div className="text-xs text-gray-500">
            Kategorija: {allCategories.length} dostupnih
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 font-medium">Kategorija:</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value, newCategory: ''})}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Izaberi postojeću kategoriju</option>
              {allCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            
            <div className="mt-2 mb-1 text-center text-gray-500 text-sm font-medium">ILI</div>
            
            <input
              type="text"
              value={formData.newCategory}
              onChange={(e) => setFormData({...formData, newCategory: e.target.value, category: ''})}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-200"
              placeholder="Unesite potpuno novu kategoriju"
            />
            
            {formData.newCategory && (
              <div className="mt-1 text-xs text-green-600">
                ✅ Kreiraće se nova kategorija: &quot;{formData.newCategory.toUpperCase()}&quot;
              </div>
            )}
          </div>

          <div>
            <label className="block mb-2 font-medium">Naziv artikla:</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-200"
              placeholder="Unesite naziv artikla"
              required
            />
          </div>

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
              <option value="l">l</option>
              <option value="flaša">flaša</option>
              <option value="pakovanje">pakovanje</option>
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