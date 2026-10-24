import { pool } from '../api/config/database';

async function main() {
  const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
  console.log('Tables in database (' + tables.rows.length + '):');
  console.log(tables.rows.map(r => r.table_name).join(', '));

  const hasJournal = tables.rows.some(r => r.table_name === 'instrument_message_journal');
  console.log('Has instrument_message_journal table:', hasJournal);

  const hasNexusMode = tables.rows.some(r => r.table_name === 'nexus_operating_mode_config');
  console.log('Has nexus_operating_mode_config table:', hasNexusMode);

  const hasAnalyzers = tables.rows.some(r => r.table_name === 'analyzers');
  console.log('Has analyzers table:', hasAnalyzers);
}

main().catch(console.error).finally(() => pool.end());
