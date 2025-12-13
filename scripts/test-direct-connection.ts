// Try using node-postgres directly
import pkg from 'pg';
const { Client } = pkg;

async function testDirectConnection() {
  const connectionString = process.env.SUPABASE_DIRECT_URL;
  
  if (!connectionString) {
    console.error("❌ SUPABASE_DIRECT_URL not found in environment");
    process.exit(1);
  }
  
  console.log("🔍 Testing direct PostgreSQL connection...");
  console.log("Using SUPABASE_DIRECT_URL");
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log("✅ Connected successfully!");
    
    const result = await client.query('SELECT 1 as test');
    console.log("✅ Query executed:", result.rows);
    
    // Check for roles table
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'roles'
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log("❌ Schema not applied! The 'roles' table doesn't exist.");
      console.log("📝 Please run: database/scripts/001-initial-schema.sql in Supabase SQL Editor");
    } else {
      console.log("✅ Schema exists! Roles table found.");
    }
    
    await client.end();
  } catch (error) {
    console.error("❌ Connection failed:", error);
    console.log("\n💡 Check:");
    console.log("1. Is your Supabase project ACTIVE (not paused)?");
    console.log("2. Go to Supabase Dashboard → Project Settings → check status");
    process.exit(1);
  }
}

testDirectConnection();
