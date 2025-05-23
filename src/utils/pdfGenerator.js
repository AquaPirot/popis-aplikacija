import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generatePDF = (inventoryData) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text('POPIS ARTIKALA', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`Datum: ${inventoryData.datum}`, 20, 40);
  doc.text(`Sastavio: ${inventoryData.sastavio}`, 20, 50);
  
  // Artikli
  let yPosition = 70;
  let currentCategory = '';
  
  inventoryData.items.forEach((item) => {
    if (item.quantity > 0) {
      if (item.category !== currentCategory) {
        currentCategory = item.category;
        doc.setFontSize(14);
        doc.text(currentCategory, 20, yPosition);
        yPosition += 10;
        doc.setFontSize(10);
      }
      
      doc.text(`${item.name}: ${item.quantity} ${item.unit}`, 30, yPosition);
      yPosition += 7;
      
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
    }
  });
  
  // Save
  doc.save(`popis_${inventoryData.datum}.pdf`);
};