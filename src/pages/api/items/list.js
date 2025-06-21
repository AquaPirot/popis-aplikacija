// src/pages/api/items/list.js - SA NAŠIM SORTIRANJEM
import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'aggroup.rs',
  port: 3306,
  user: 'aggroup_restpopis_aplikacija',
  password: '=}r)Hw$o5@J]zBFX',
  database: 'aggroup_popis_restoran',
  ssl: false,
  connectTimeout: 10000,
  acquireTimeout: 10000,
  timeout: 10000,
  charset: 'utf8mb4'
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // NAŠ REDOSLED KATEGORIJA
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
    
    // Query sa CASE sortiranjem po našem redosledu
    const query = `
      SELECT id, name, category, unit, timestamp
      FROM items 
      ORDER BY 
        CASE category
          WHEN 'TOPLI NAPICI' THEN 1
          WHEN 'BEZALKOHOLNA PIĆA' THEN 2
          WHEN 'CEDEVITA I ENERGETSKA PIĆA' THEN 3
          WHEN 'NEXT SOKOVI' THEN 4
          WHEN 'PIVA' THEN 5
          WHEN 'SOMERSBY' THEN 6
          WHEN 'ŽESTOKA PIĆA' THEN 7
          WHEN 'VISKI' THEN 8
          WHEN 'BRENDI I KONJACI' THEN 9
          WHEN 'LIKERI' THEN 10
          WHEN 'DOMAĆA ALKOHOLNA PIĆA' THEN 11
          WHEN 'BELA VINA' THEN 12
          WHEN 'CRVENA VINA' THEN 13
          WHEN 'ROZE VINA' THEN 14
          WHEN 'VINA 0,187L' THEN 15
          ELSE 999
        END,
        name
    `;
    
    const [items] = await connection.execute(query);
    
    res.status(200).json({
      success: true,
      data: items,
      count: items.length
    });
  } catch (error) {
    console.error('List items error:', error);
    res.status(500).json({ 
      error: 'Greška pri učitavanju artikala',
      details: error.message 
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}