// src/pages/api/items/add.js - KREIRAJ OVAJ FAJL AKO NE POSTOJI
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
  console.log('🎯 API /items/add pozvan');
  console.log('📧 Method:', req.method);
  console.log('📦 Body:', req.body);

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ message: 'API endpoint radi' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    const { name, category, unit } = req.body;

    console.log('📝 Primljeni podaci:', { name, category, unit });

    if (!name || !category) {
      return res.status(400).json({ 
        error: 'Ime artikla i kategorija su obavezni' 
      });
    }

    // Proveri da li artikal već postoji
    const [existing] = await connection.execute(
      'SELECT id FROM items WHERE name = ? AND category = ?',
      [name.trim(), category]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        error: 'Artikal sa tim imenom već postoji u toj kategoriji'
      });
    }

    // Dodaj novi artikal
    const [result] = await connection.execute(
      'INSERT INTO items (name, category, unit) VALUES (?, ?, ?)',
      [name.trim(), category, unit || 'kom']
    );

    // Vrati dodati artikal
    const [newItem] = await connection.execute(
      'SELECT * FROM items WHERE id = ?',
      [result.insertId]
    );

    console.log('✅ Artikal dodat:', newItem[0]);

    res.status(200).json({
      success: true,
      message: 'Artikal je uspešno dodat',
      data: newItem[0]
    });
  } catch (error) {
    console.error('❌ API Error:', error);
    res.status(500).json({ 
      error: 'Greška pri dodavanju artikla',
      details: error.message 
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}