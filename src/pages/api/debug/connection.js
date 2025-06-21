// pages/api/debug/connection.js
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
  let connection;
  try {
    // Test osnovne konekcije
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT 1 as test, NOW() as current_time');
    
    // Test postojanja tabela
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      ORDER BY TABLE_NAME
    `, [dbConfig.database]);
    
    // Test count artikala i popisa
    let itemsCount = 0;
    let inventoryCount = 0;
    
    try {
      const [itemsResult] = await connection.execute('SELECT COUNT(*) as count FROM items');
      itemsCount = itemsResult[0].count;
    } catch (e) {
      console.log('Tabela items ne postoji ili je prazna');
    }
    
    try {
      const [inventoryResult] = await connection.execute('SELECT COUNT(*) as count FROM inventory');
      inventoryCount = inventoryResult[0].count;
    } catch (e) {
      console.log('Tabela inventory ne postoji ili je prazna');
    }

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      connection: {
        status: 'Connected successfully',
        host: dbConfig.host,
        database: dbConfig.database,
        user: dbConfig.user,
        currentTime: rows[0].current_time
      },
      tables: tables.map(t => t.TABLE_NAME),
      data: {
        itemsCount,
        inventoryCount
      },
      message: '✅ MySQL konekcija radi!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString(),
      config: {
        host: dbConfig.host,
        database: dbConfig.database,
        user: dbConfig.user,
        // Ne prikazuj password u error response-u
      }
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}