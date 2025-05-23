import jsPDF from 'jspdf';

export const generatePDF = (inventoryData) => {
  const doc = new jsPDF();

  // Funkcija za konvertovanje srpskih karaktera u latinicu
  const convertSerbianToLatin = (text) => {
    const cyrillicToLatin = {
      'č': 'c', 'Č': 'C',
      'ć': 'c', 'Ć': 'C', 
      'š': 's', 'Š': 'S',
      'ž': 'z', 'Ž': 'Z',
      'đ': 'd', 'Đ': 'D'
    };
    
    return text.replace(/[čćšžđČĆŠŽĐ]/g, (char) => cyrillicToLatin[char] || char);
  };

  // Alternativno: Možete koristiti i jednostavniju zamenu
  const normalizeText = (text) => {
    return text
      .replace(/[čć]/gi, 'c')
      .replace(/[šs]/gi, 's') 
      .replace(/[žz]/gi, 'z')
      .replace(/[đd]/gi, 'd');
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
  let currentCategory = '';

  // Grupiši artikle po kategorijama
  const itemsByCategory = {};
  inventoryData.items.forEach((item) => {
    if (item.quantity > 0) {
      const category = item.category || 'Ostalo';
      if (!itemsByCategory[category]) {
        itemsByCategory[category] = [];
      }
      itemsByCategory[category].push(item);
    }
  });

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
};

// Alternativno rešenje sa HTML2Canvas (ako želite kompletnu podršku za Unicode)
export const generatePDFFromHTML = async (inventoryData) => {
  // Kreiraj privremeni HTML element
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.width = '210mm';
  tempDiv.style.padding = '20px';
  tempDiv.style.fontFamily = 'Arial, sans-serif';
  tempDiv.style.backgroundColor = 'white';
  
  // Grupiši artikle po kategorijama
  const itemsByCategory = {};
  inventoryData.items.forEach((item) => {
    if (item.quantity > 0) {
      const category = item.category || 'Ostalo';
      if (!itemsByCategory[category]) {
        itemsByCategory[category] = [];
      }
      itemsByCategory[category].push(item);
    }
  });

  // HTML sadržaj
  let htmlContent = `
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="margin: 0; font-size: 24px;">POPIS ARTIKALA</h1>
      <p style="margin: 10px 0;">Datum: ${inventoryData.datum}</p>
      <p style="margin: 10px 0;">Sastavio: ${inventoryData.sastavio}</p>
      <hr style="margin: 20px 0;">
    </div>
  `;

  const categoryOrder = [
    'TOPLI NAPICI', 'BEZALKOHOLNA PIĆA', 'CEDEVITA I ENERGETSKA PIĆA',
    'NEXT SOKOVI', 'PIVA', 'SOMERSBY', 'ŽESTOKA PIĆA', 'VISKI',
    'BRENDI I KONJACI', 'LIKERI', 'DOMAĆA ALKOHOLNA PIĆA',
    'BELA VINA', 'CRVENA VINA', 'ROZE VINA', 'VINA 0,187L'
  ];

  const sortedCategories = categoryOrder.filter(cat => itemsByCategory[cat]);
  Object.keys(itemsByCategory).forEach(cat => {
    if (!categoryOrder.includes(cat)) {
      sortedCategories.push(cat);
    }
  });

  sortedCategories.forEach((category) => {
    htmlContent += `<h3 style="margin: 20px 0 10px 0; color: #333;">${category}</h3>`;
    itemsByCategory[category].forEach((item) => {
      htmlContent += `<p style="margin: 5px 0 5px 20px; font-size: 12px;">${item.name}: ${item.quantity} ${item.unit}</p>`;
    });
  });

  tempDiv.innerHTML = htmlContent;
  document.body.appendChild(tempDiv);

  try {
    // Generiši canvas iz HTML-a
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true
    });

    // Kreiraj PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`popis_${inventoryData.datum}_${inventoryData.sastavio}.pdf`);
  } finally {
    document.body.removeChild(tempDiv);
  }
};