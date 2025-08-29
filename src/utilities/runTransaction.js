const pool = require('../../database')

/*
  Formas de uso
  clientArg = client -> usa el cliente proporcionado
  clientArg = undefined -> conecta un nuevo cliente
  clientArg = pool -> no inicia ningúna transacción sino que usa pool directamente.
*/
const runTransaction= async (clientArg, callback) => {
  const externalClient = !!clientArg;
  const client = clientArg || await pool.connect();

  try {
    if (!externalClient) await client.query('BEGIN');

    // Ejecuta la lógica pasada por callback
    const result = await callback(client);

    if (!externalClient) await client.query('COMMIT');

    return result;
  } catch (err) {
    if (!externalClient) await client.query('ROLLBACK');
    throw err;
  } finally {
    if (!externalClient) client.release();
  }
};

module.exports = runTransaction