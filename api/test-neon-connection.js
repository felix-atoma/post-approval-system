const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DIRECT_URL
  // ✅ Remove ssl config - let connection string handle it
});

async function testConnection() {
  try {
    console.log('🔌 Testing Neon connection...');
    console.log('Connection string:', process.env.DIRECT_URL.replace(/:[^:@]+@/, ':****@'));
    
    await client.connect();
    console.log('✅ Connected successfully!');
    
    const res = await client.query('SELECT NOW()');
    console.log('⏰ Database time:', res.rows[0].now);
    
    await client.end();
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  }
}

testConnection();