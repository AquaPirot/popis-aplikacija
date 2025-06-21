import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, RefreshCw, Trash2 } from 'lucide-react';
import { getInventoryHistory, deleteInventory } from '../utils/storage';

export default function Istorija() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const history = await getInventoryHistory();
      setInventory(history);
    } catch (error) {
      console.error('Error loading history:', error);
      alert('Greška pri učitavanju istorije');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleGeneratePDF = async (inv) => {
    setGeneratingPDF(inv.id);
    try {
      console.log('🎯 Generiram PDF za popis:', inv);
      
      // UČITAJ KOMPLETAN POPIS SA STAVKAMA
      const response = await fetch(`/api/inventory/${inv.id}`);
      const detailData = await response.json();
      
      console.log('📡 Detalji popisa:', detailData);
      
      if (detailData.success && detailData.data) {
        // Proslijedi kompletan popis sa stavkama
        const fullInventoryData = {
          ...inv,
          ...detailData.data,
          items: detailData.data.items || []
        };
        
        console.log('📋 Šaljem PDF generator-u:', fullInventoryData);
        
        // Dinamički učitaj PDF generator
        const { generatePDF, generatePDFFromHTML } = await import('../utils/pdfGenerator');
        
        // Pokušaj prvo sa HTML2Canvas pristupom za bolju podršku srpskih karaktera
        try {
          await generatePDFFromHTML(fullInventoryData);
        } catch (htmlError) {
          console.warn('HTML2Canvas PDF generation failed, falling back to jsPDF:', htmlError);
          // Fallback na obični jsPDF
          await generatePDF(fullInventoryData);
        }
      } else {
        throw new Error('Nema podataka o popisu');
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Greška pri generisanju PDF-a: ' + error.message);
    } finally {
      setGeneratingPDF(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Da li ste sigurni da želite da obrišete ovaj popis?')) {
      return;
    }

    setDeleting(id);
    try {
      await deleteInventory(id);
      await loadHistory(); // Reload history after deletion
    } catch (error) {
      console.error('Error deleting inventory:', error);
      alert('Greška pri brisanju popisa');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateStr) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-4">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-2">Učitavam istoriju...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-500 rounded-lg mr-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Istorija popisa</h1>
          </div>
          
          <Link 
            href="/"
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Nazad
          </Link>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">Ukupno popisa</p>
                <p className="text-2xl font-bold text-blue-900">{inventory.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-600">Napomena</p>
                <p className="text-xs text-yellow-800">PDF izveštaj automatski konvertuje srpske karaktere (č, ć, š, ž, đ) u latinične za bolje prikazivanje.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory List */}
        {inventory.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nema sačuvanih popisa</h3>
            <p className="text-gray-500">Kreirajte svoj prvi popis da biste videli istoriju ovde.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {inventory.map((inv) => (
              <div key={inv.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4l6 6m0-6l-6 6" />
                      </svg>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {inv.datum || formatDate(inv.timestamp)}
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-gray-600">Sastavio: </span>
                        <span className="font-medium text-gray-900">{inv.sastavio}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-blue-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a.997.997 0 01-1.414 0l-7-7A1.997 1.997 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span className="text-blue-600 font-medium">
                          {inv.total_items || 0} / {inv.items_with_quantity || 0} artikala
                        </span>
                      </div>
                      
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span className="text-green-600 font-medium">Ukupno: kom</span>
                      </div>
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-500">
                      Kreiran: {formatDate(inv.timestamp)}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleGeneratePDF(inv)}
                      disabled={generatingPDF === inv.id}
                      className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                    >
                      {generatingPDF === inv.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleDelete(inv.id)}
                      disabled={deleting === inv.id}
                      className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 transition-colors"
                    >
                      {deleting === inv.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}