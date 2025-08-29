const pool = require('../../../../database');
const { ConflictError } = require('../../../utilities/errorsUtilities');
const spaceExistsById = require('../../spaces/validations/spaceExistsById');
const findTableById = require('../queries/findTableById')
const tableExistsByName = require('../validations/tableExistsByName');

const { v4: uuidv4 } = require('uuid');
const normalizeTablePositions = require('./normalizeTablePositions');



const createNewTable = async (spaceId, tableName, clientArg = null) => {
  const externalClient = !!clientArg; // sólo liberamos si lo creamos nosotros
  const client = clientArg || await pool.connect();

  try {
    if (!externalClient) await client.query('BEGIN'); // sólo abrimos transacción si no venía de antes

    // Core
    const newTableId = 'col-' + uuidv4();

    const tableIndexQuery = `SELECT COUNT(*) FROM space_tables WHERE space_id = $1;`;
    const tableIndexResult = await client.query(tableIndexQuery, [spaceId]);
    const tableIndex = parseInt(tableIndexResult.rows[0].count, 10);

    const spaceTablesQuery = `
      INSERT INTO space_tables (space_id, id, name, table_position)
      VALUES ($1, $2, $3, $4);
    `;
    await client.query(spaceTablesQuery, [spaceId, newTableId, tableName, tableIndex]);

    await normalizeTablePositions(spaceId, client)
    if (!externalClient) await client.query('COMMIT');

    return await findTableById(newTableId);

  } catch (error) {
    if (!externalClient) await client.query('ROLLBACK');
    throw error;
  } finally {
    if (!externalClient) client.release();
  }
};

module.exports = createNewTable