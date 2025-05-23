import { useState, useEffect } from 'react';
import { getInventoryFromFirebase, deleteInventoryFromFirebase } from '../utils/firebase';
import Link from 'next/link';
import { ArrowLeft, FileText, Trash2, Download, Calendar, User, Package } from 'lucide-react';

export default function Istorija() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(null);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const data = await getInventoryFromFirebase();
      setInventory(data);
    } catch (error) {
      console.error('Greška pri učitavanju istorije:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Sigurno želite obrisati ovaj popis?')) {
      try {
        await deleteInventoryFromFirebase(id);
        await loadInventory();
      } catch (error) {
        alert('Greška pri brisanju: ' + error.message);
      }
    }
  };

  const handleGeneratePDF = async (inv) => {
    setGeneratingPDF(inv.id);
    try {
      // Dinamički učitaj PDF generator
      const { generatePDF, generatePDFFromHTML } = await import('../utils/pdfGenerator');
      
      // Pokušaj prvo sa HTML2Canvas pristupom za bolju podršku srpskih karaktera
      try {
        await generatePDFFromHTML(inv);
      } catch (htmlError) {
        console.warn('HTML2Canvas PDF generation failed, falling back to jsPDF:', htmlError);
        // Fallback na obični jsPDF
        generatePDF(inv);
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Greška pri generisanju PDF-a: ' + error.message);
    } finally {
      setGeneratingPDF(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">📚</div>
          <p className="text-gray-600">Učitavam istoriju...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                Istorija popisa
              </h1>
              <Link 
                href="/" 
                className="bg-white/20 hover:bg-white/30 backdrop-blur px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Nazad
              </Link>
            </div>
          </div>

          <div className="p-6">
            {inventory.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-500 text-lg">Nema sačuvanih popisa</p>
                <Link href="/" className="mt-4 inline-block text-blue-500 hover:text-blue-600">
                  Kreiraj prvi popis →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700 mb-2">
                    📊 <strong>Ukupno popisa:</strong> {inventory.length}
                  </p>
                  <p className="text-xs text-blue-600">
                    💡 <strong>Napomena:</strong> PDF izveštaji automatski konvertuju srpske karaktere (č, ć, š, ž, đ) u latinične za bolje prikazivanje.
                  </p>
                </div>
                
                {inventory.map((inv) => (
                  <div 
                    key={inv.id} 
                    className="border-2 border-gray-100 rounded-lg p-4 hover:border-blue-200 hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <p className="font-bold text-lg">{inv.datum}</p>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span>Sastavio: <strong>{inv.sastavio}</strong></span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                            <Package className="w-3 h-3" />
                            {inv.itemsWithQuantity} / {inv.totalItems} artikala
                          </div>
                          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm">
                            📦 Ukupno: {inv.items?.reduce((sum, item) => sum + (item.quantity || 0), 0).toFixed(0)} kom
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleGeneratePDF(inv)}
                          disabled={generatingPDF === inv.id}
                          className={`p-3 rounded-lg transition-colors group ${
                            generatingPDF === inv.id 
                              ? 'bg-blue-300 text-blue-700 cursor-not-allowed' 
                              : 'bg-blue-500 text-white hover:bg-blue-600'
                          }`}
                          title="Generiši PDF"
                        >
                          {generatingPDF === inv.id ? (
                            <div className="w-5 h-5 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Download className="w-5 h-5 group-hover:animate-bounce" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(inv.id)}
                          className="bg-red-500 text-white p-3 rounded-lg hover:bg-red-600 transition-colors"
                          title="Obriši popis"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Dodatne informacije o popisu */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        Kreiran: {new Date(inv.timestamp).toLocaleString('sr-RS')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}