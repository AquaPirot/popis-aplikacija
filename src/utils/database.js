// src/utils/database.js
import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'aggroup.rs', // Tvoj domen
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

// Debug connection helper
export const testConnection = async () => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT 1 as test');
    await connection.end();
    return { success: true, message: 'Konekcija uspešna', data: rows };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Universal query helper
export const executeQuery = async (query, params = []) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [results] = await connection.execute(query, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

export default dbConfig;