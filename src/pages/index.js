import { useState, useEffect } from 'react';
import { getItemsFromFirebase, saveInventoryToFirebase, saveItemToFirebase, listenToItems } from '../utils/firebase';
import { Plus, Save, FileText, History, Settings, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function PopisApp() {
  const [items, setItems] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [datum, setDatum] = useState(new Date().toISOString().split('T')[0]);
  const [sastavio, setSastavio] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // TAČAN redosled artikala kao u PDF-u (1-127)
  const exactItemOrder = [
    // Topli napici (1-4)
    'ESPRESSO', 'NESCAFE', 'CAJ', 'TOPLA COKOLADA',
    
    // Bezalkoholno piće (5-32)
    'ROSA 0.33', 'ROSA 0.7', 'ROSA GAZ 0.33', 'ROSA GAZ 0.7', 'ROMERQUELA', 
    'KOKA KOLA', 'KOKA KOLA zero', 'KOKA KOLA limeta', 'FANTA', 'SPRITE', 
    'BITER', 'TONIK', 'SCHWEPPES PURPLE', 'CEDEVITA NARANDZA', 'CEDEVITA 9 VITAMINA',
    'CEDEVITA LIMUN', 'CEDEVITA LIMETA', 'KOKTA', 'ULTRA ENERGY', 'RED BULL', 
    'GUARANA', 'NEXT JABUKA', 'NEXT NARANDZA', 'NEXT JAGODA', 'NEXT BOROVNICA',
    'NEXT BRESKVA', 'NEXT LIMUNADA JAGODA', 'NEXT LIMUNADA ANANAS',
    
    // Piva (33-46)
    'TUBORG 0,3', 'LAV PREMIUM 0,3', 'CARLSBERG 0.25', 'ERDINGER', 
    'BLANC - KRONENBURG', 'TUBORG ICE', 'TOČENO LAV PREMIUM', 'BUDWEISER TAMBO', 'BUDWEISER SVETLO',
    
    // Cideri (39-43)
    'SOMERSBY MANGO', 'SOMERSBY JABUKA', 'SOMERSBY BOROVNICA', 'SOMERSBY MALINA', 'SOMERSBY JAGODA',
    
    // Žestoka pića (47-79)
    'VOTKA', 'SMIRNOFF', 'DZIN', 'DZIN BEEFEATER', 'DZIN BEEFEATER PINK', 'TEQUILA OLMECA', 'VINJAK',
    'GORKI LIST', 'VERMUT', 'MEGDAN DUNJA', 'MEGDAN SLJIVA', 'MEGDAN VILJAMOVKA',
    'MEGDAN KAJSIJA', 'LOZOVAČA', 'STOMAKLIJA', 'Jagermaister lit', 'RAMAZZOTI',
    'OUZO', 'CAMPARI', 'BAILEYS', 'HAWANA RUM', 'APEROL', 'MARTINI', 'CHIVAS',
    'RED LABEL', 'BLACK LABEL', 'JAMESON', 'TULAMURE', 'JACK DANIELS', 
    'BALANTINES', 'COURVOSIER', 'HENNESY', 'GORDA ŠLJIVA',
    
    // Vina butilirana (80-124)
    'FILIGRAN CHARDONAY', 'KOVAČEVIĆ CHARDONAY', 'RADOVANOVIC CHARDONAY', 'MATALJ SOUVIGNON',
    'MATALJ CHARDONAY', 'ALEKSANDROVIC TEMA', 'CILIC ONYX BELI', 'DEURIC AKSIOM BELI',
    'SPASIC LEKCIJA TAMJANIKA', 'RUBIN SOUV BLANC 0,7', 'RUBIN CHARDONAY 0,7', 'RUBIN MUSCAT 0,7',
    'RUBIN MERLOT 0,7', 'FILIGRAN CABERNET', 'IZBA JOVAN MERLOT', 'RADOVANOVIC CABERNET',
    'RADOVANOVIC SUVIGNON', 'CILIC ONYX CRVENO', 'DEURIC AKSIOM CRVENI', 'PRO CORDE VRANAC',
    'MATALJ KREMEN', 'ALEKSANDROVIĆ PROKUPAC', 'SAVIĆ RIZLING', 'RUBIN CABERNET',
    'RUBIN DOB.BAR. SUV', 'RUBIN DOB.BAR. CAB', 'RUBIN AMANTE CARMEN', 'DESPOTIKA NEMIR',
    'JOVIC CHARDONAY', 'JOVIC CABARNET', 'JOVIC VRANAC', 'VARIJANTA ALEKSANDROVIC',
    'MATALJ DUSICA', 'LA SASTRERIA BELO', 'LA SASTRERIA CRVENO', 'FRESCO KOVACEVIC',
    'RUBIN ROSE 0,7', 'RUBIN VRONSKY 0,7', 'CILIC MORAVA', 'CILIC cabernet & merlot',
    'VINUM FRANCOVKA', 'TEMET BURGUNDAC', 'IVANOVIC PROKUPAC', 'CRNA OVCA', 'JANKO ZAVET',
    
    // Vina 0,187 (125-127)
    'RUBIN CHARDONAY', 'RUBIN VRANAC', 'RUBIN ROSE'
  ];

  // Tačan redosled kategorija kao u PDF-u
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
  const sortItemsByPDFOrder = (categoryItems) => {
    return categoryItems.sort((a, b) => {
      let indexA = exactItemOrder.indexOf(a.name);
      let indexB = exactItemOrder.indexOf(b.name);
      
      // Pokušaj sa velikim slovima ako nije našao
      if (indexA === -1) indexA = exactItemOrder.indexOf(a.name.toUpperCase());
      if (indexB === -1) indexB = exactItemOrder.indexOf(b.name.toUpperCase());
      
      // Ako artikal nije u listi, stavi na kraj
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      
      return indexA - indexB;
    });
  };

  // Učitavanje artikala
  useEffect(() => {
    const loadItems = async () => {
      try {
        const allItems = await getItemsFromFirebase();
        setItems(allItems);
      } catch (error) {
        console.error('Greška pri učitavanju:', error);
      } finally {
        setLoading(false);
      }
    };

    loadItems();

    // Real-time listener za nove artikle
    const unsubscribe = listenToItems((newItems) => {
      setItems(newItems);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Grupa artikala po kategorijama
  const groupedItems = items.reduce((acc, item) => {
    const category = item.category || 'Ostalo';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});

  // Sortiranje kategorija po redosledu I artikala unutar kategorija
  const sortedCategories = categoryOrder
    .filter(category => groupedItems[category])
    .map(category => [category, sortItemsByPDFOrder(groupedItems[category])]);

  // Dodaj ostale kategorije koje nisu u listi (takođe sortirane)
  Object.entries(groupedItems).forEach(([category, categoryItems]) => {
    if (!categoryOrder.includes(category)) {
      sortedCategories.push([category, sortItemsByPDFOrder(categoryItems)]);
    }
  });

  // Input logika - pravilno rukovanje nulama
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

  // Čuvanje popisa
  const handleSave = async () => {
    if (!datum || !sastavio.trim()) {
      alert('Molimo unesite datum i ko je sastavio popis!');
      return;
    }

    // Prebroji artikle sa količinama > 0
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
      
      // Reset forme
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">⏳</div>
          <p className="text-gray-500">Učitavam artikle...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-t-2xl shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">📋 Popis artikala</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-green-500 hover:bg-green-600 px-3 py-2 rounded-lg text-sm flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Dodaj
              </button>
              <Link href="/istorija" className="bg-gray-500 hover:bg-gray-600 px-3 py-2 rounded-lg text-sm flex items-center gap-1">
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
          {/* Statistike */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{items.length}</div>
                <div className="text-sm text-gray-600">Ukupno artikala</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {Object.values(quantities).filter(q => q > 0).length}
                </div>
                <div className="text-sm text-gray-600">Sa količinama</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{sortedCategories.length}</div>
                <div className="text-sm text-gray-600">Kategorija</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {Object.values(quantities).reduce((sum, q) => sum + (q || 0), 0).toFixed(0)}
                </div>
                <div className="text-sm text-gray-600">Ukupne količine</div>
              </div>
            </div>
          </div>

          {/* Lista artikala po kategorijama */}
          <div className="space-y-6">
            {sortedCategories.map(([category, categoryItems]) => (
              <div key={category} className="border-2 border-gray-100 rounded-xl p-4">
                <h2 className="font-bold text-lg text-gray-800 mb-4 pb-2 border-b">
                  {category} ({categoryItems.length})
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categoryItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
                      <div className="flex-1">
                        <div className="font-medium text-gray-800 text-sm">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.unit}</div>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={quantities[item.id] === '' ? '' : (quantities[item.id] || 0)}
                        onFocus={handleInputFocus}
                        onBlur={(e) => handleInputBlur(e, item.id)}
                        onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                        className="w-20 text-center rounded border-2 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 p-2"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Save dugme */}
          <div className="mt-8 pt-6 border-t">
            <button
              onClick={handleSave}
              disabled={saving || !datum || !sastavio.trim()}
              className={`w-full p-4 rounded-xl text-lg font-bold transition-all ${
                saving || !datum || !sastavio.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600 shadow-lg'
              }`}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Čuvam popis...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Save className="w-5 h-5" />
                  Sačuvaj popis
                </span>
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
        />
      )}
    </div>
  );
}

// Modal za dodavanje novog artikla
function AddItemModal({ show, onClose, categories }) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    newCategory: '',
    unit: 'kom'
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSaving(true);
    try {
      const itemData = {
        name: formData.name.trim().toUpperCase(),
        category: formData.newCategory.trim() || formData.category,
        unit: formData.unit
      };

      await saveItemToFirebase(itemData);
      alert('Artikal je dodat!');
      setFormData({ name: '', category: '', newCategory: '', unit: 'kom' });
      onClose();
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
        <h2 className="text-xl font-bold mb-4">➕ Dodaj novi artikal</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 font-medium">Naziv artikla:</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-200"
              placeholder="Naziv artikla"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Kategorija:</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
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
              className="flex-1 bg-gray-500 text-white p-3 rounded-lg hover:bg-gray-600"
            >
              Otkaži
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
            >
              {saving ? 'Čuvam...' : 'Dodaj'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}