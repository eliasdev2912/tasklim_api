const pool = require("../database.js");

async function cleanDatabase() {
  if(process.env.DB_NAME != 'tasklim-tests') {
    console.error('⚠️ Bloqueo de seguridad: No puedes alterar otras tablas que no sean \'tasklim-tests\' ⚠️')
    return
  }
  console.log("👉 Iniciando limpieza de DB...");

  const { rows } = await pool.query(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT LIKE 'sql_%';
  `);

  if (rows.length === 0) {
    console.warn("⚠️ No se encontraron tablas en la DB");
    return;
  }

  const tableNames = rows.map(r => `"${r.tablename}"`).join(", ");

  await pool.query(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE;`);
  console.log("✅ Base limpiada");
}

// 👉 Esto es clave para que se ejecute si lo corres con `node cleanDatabase.js`
if (require.main === module) {
  cleanDatabase()
    .then(() => process.exit(0))
    .catch(err => {
      console.error("❌ Error:", err);
      process.exit(1);
    });
}

module.exports = cleanDatabase;
