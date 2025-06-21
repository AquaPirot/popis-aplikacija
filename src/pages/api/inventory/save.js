// src/pages/api/inventory/save.js
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    const { datum, sastavio, items } = req.body;

    if (!datum || !sastavio || !items || !Array.isArray(items)) {
      return res.status(400).json({ 
        error: 'Nedostaju obavezni podaci (datum, sastavio, items)' 
      });
    }

    // Broji statistike
    const totalItems = items.length;
    const itemsWithQuantity = items.filter(item => 
      item.quantity && parseFloat(item.quantity) > 0
    ).length;

    // Ubaci osnovni inventory zapis
    const [inventoryResult] = await connection.execute(
      `INSERT INTO inventory (datum, sastavio, total_items, items_with_quantity) 
       VALUES (?, ?, ?, ?)`,
      [datum, sastavio, totalItems, itemsWithQuantity]
    );

    const inventoryId = inventoryResult.insertId;

    // Ubaci sve stavke (čak i one sa količinom 0)
    for (const item of items) {
      await connection.execute(
        `INSERT INTO inventory_items 
         (inventory_id, item_id, item_name, category, unit, quantity) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          inventoryId,
          item.id || null,
          item.name,
          item.category,
          item.unit,
          parseFloat(item.quantity) || 0
        ]
      );
    }

    await connection.commit();

    res.status(200).json({
      success: true,
      message: 'Popis je uspešno sačuvan',
      data: {
        id: inventoryId,
        datum,
        sastavio,
        total_items: totalItems,
        items_with_quantity: itemsWithQuantity
      }
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Save inventory error:', error);
    res.status(500).json({ 
      error: 'Greška pri čuvanju popisa',
      details: error.message 
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}