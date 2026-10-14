import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function listColumns() {
  const res = await pool.query("SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'patients' ORDER BY ordinal_position;");
  console.log('Total columns in patients:', res.rows.length);
  res.rows.forEach(r => console.log(`${r.column_name} (${r.data_type}${r.character_maximum_length ? ': ' + r.character_maximum_length : ''})`));
  await pool.end();
}

listColumns();
