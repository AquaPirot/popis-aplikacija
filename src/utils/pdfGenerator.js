import jsPDF from 'jspdf';

export const generatePDF = async (inventoryData) => {
  console.log('🔍 PDF Generator pozvan sa:', inventoryData);
  
  const doc = new jsPDF();

  // Funkcija za konvertovanje srpskih karaktera u latinicu
  const convertSerbianToLatin = (text) => {
    if (!text) return '';
    const cyrillicToLatin = {
      'č': 'c', 'Č': 'C',
      'ć': 'c', 'Ć': 'C', 
      'š': 's', 'Š': 'S',
      'ž': 'z', 'Ž': 'Z',
      'đ': 'd', 'Đ': 'D'
    };
    
    return text.replace(/[čćšžđČĆŠŽĐ]/g, (char) => cyrillicToLatin[char] || char);
  };

  // Koristi standardni font koji podržava osnovne karaktere
  doc.setFont('helvetica');

  // Header
  doc.setFontSize(20);
  doc.text('POPIS ARTIKALA', 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.text(`Datum: ${inventoryData.datum}`, 20, 40);
  doc.text(`Sastavio: ${convertSerbianToLatin(inventoryData.sastavio)}`, 20, 50);

  // Dodaj liniju ispod headera
  doc.setLineWidth(0.5);
  doc.line(20, 55, 190, 55);

  let yPosition = 70;

  // NOVA LOGIKA: Ako nema direktan items array, učitaj iz API-ja
  let itemsData = inventoryData.items;
  
  if (!itemsData || !Array.isArray(itemsData) || itemsData.length === 0) {
    console.log('🔄 Nema items podataka, učitavam iz API...');
    
    try {
      // Pozovi API da učita detalje popisa
      const response = await fetch(`/api/inventory/${inventoryData.id}`);
      const apiData = await response.json();
      
      console.log('📡 API odgovor:', apiData);
      
      if (apiData.success && apiData.data && apiData.data.items) {
        itemsData = apiData.data.items;
        console.log('✅ Učitano iz API:', itemsData.length, 'stavki');
      }
    } catch (error) {
      console.error('❌ Greška pri učitavanju iz API:', error);
    }
  }

  // Ako još uvek nema podataka
  if (!itemsData || !Array.isArray(itemsData)) {
    console.log('❌ Nema artikala za prikaz');
    doc.text('Nema artikala za prikaz', 20, yPosition);
    doc.text(`(Debug: ${JSON.stringify(inventoryData)})`, 20, yPosition + 10);
    doc.save(`popis_${inventoryData.datum}_${convertSerbianToLatin(inventoryData.sastavio)}.pdf`);
    return;
  }

  console.log('📊 Obrađujem', itemsData.length, 'stavki');

  // Grupiši artikle po kategorijama
  const itemsByCategory = {};
  itemsData.forEach((item, index) => {
    console.log(`📦 Stavka ${index + 1}:`, item);
    
    // MySQL format ima item_name umesto name
    const itemName = item.item_name || item.name || 'Nepoznato';
    const quantity = parseFloat(item.quantity || 0);
    
    if (quantity > 0) {
      const category = item.category || 'Ostalo';
      if (!itemsByCategory[category]) {
        itemsByCategory[category] = [];
      }
      itemsByCategory[category].push({
        name: itemName,
        quantity: quantity,
        unit: item.unit || 'kom'
      });
    }
  });

  console.log('📋 Kategorije:', Object.keys(itemsByCategory));

  // Sortiranje kategorija
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

  const sortedCategories = categoryOrder.filter(cat => itemsByCategory[cat]);
  
  // Dodaj ostale kategorije koje nisu u listi
  Object.keys(itemsByCategory).forEach(cat => {
    if (!categoryOrder.includes(cat)) {
      sortedCategories.push(cat);
    }
  });

  // Proveri da li ima kategorija za prikaz
  if (sortedCategories.length === 0) {
    console.log('❌ Nema kategorija sa artiklima');
    doc.text('Nema artikala sa kolicinama za prikaz', 20, yPosition);
    doc.text(`Ukupno stavki: ${itemsData.length}`, 20, yPosition + 10);
    doc.save(`popis_${inventoryData.datum}_${convertSerbianToLatin(inventoryData.sastavio)}.pdf`);
    return;
  }

  console.log('✅ Generiram PDF sa', sortedCategories.length, 'kategorija');

  sortedCategories.forEach((category) => {
    // Proveri da li treba nova strana
    if (yPosition > 260) {
      doc.addPage();
      yPosition = 20;
    }

    // Naslov kategorije
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(convertSerbianToLatin(category), 20, yPosition);
    yPosition += 8;

    // Artikli u kategoriji
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    itemsByCategory[category].forEach((item) => {
      // Proveri da li treba nova strana
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }

      const itemName = convertSerbianToLatin(item.name);
      const text = `${itemName}: ${item.quantity} ${item.unit}`;
      
      doc.text(text, 30, yPosition);
      yPosition += 6;
    });

    yPosition += 5; // Razmak između kategorija
  });

  // Footer sa statistikama
  const totalItems = Object.values(itemsByCategory).flat().length;
  const totalQuantity = Object.values(itemsByCategory).flat()
    .reduce((sum, item) => sum + parseFloat(item.quantity || 0), 0);

  // Dodaj footer na poslednju stranu
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text(`Ukupno artikala sa kolicinama: ${totalItems}`, 20, yPosition + 10);
  doc.text(`Ukupna kolicina: ${totalQuantity.toFixed(2)}`, 20, yPosition + 16);
  doc.text(`Generisano: ${new Date().toLocaleString('sr-RS')}`, 20, yPosition + 22);

  // Sačuvaj PDF
  const fileName = `popis_${inventoryData.datum}_${convertSerbianToLatin(inventoryData.sastavio)}.pdf`;
  doc.save(fileName);
  
  console.log('✅ PDF sačuvan:', fileName);
};

// HTML2Canvas verzija je ista logika
export const generatePDFFromHTML = async (inventoryData) => {
  console.log('🖼️ HTML2Canvas PDF pozvan');
  
  // Fallback na obični PDF ako nema html2canvas
  if (typeof window === 'undefined' || !window.html2canvas) {
    console.warn('html2canvas nije dostupan, koristim obični jsPDF');
    return generatePDF(inventoryData);
  }
  
  // Za sada, koristi obični PDF jer je sigurniji
  return generatePDF(inventoryData);
};