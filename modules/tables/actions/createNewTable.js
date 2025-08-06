const pool = require('../../../database');
const { ConflictError } = require('../../../utilities/errorsUtilities');
const spaceExistsById = require('../../spaces/validations/spaceExistsById');
const findTableById = require('../queries/findTableById')
const tableExistsByName = require('../validations/tableExistsByName');

const { v4: uuidv4 } = require('uuid');



const createNewTable = async (spaceId, tableName, clientArg = null) => {
  const shouldReleaseClient = !clientArg; // sólo liberamos si lo creamos nosotros
  const client = clientArg || await pool.connect();

  try {
    if (!clientArg) await client.query('BEGIN'); // sólo abrimos transacción si no venía de antes

    // Validaciones
    await spaceExistsById.error(spaceId, client);

    const existingTable = await tableExistsByName.bool(tableName, spaceId, client);
    if (existingTable) throw new ConflictError('Table already exists');

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

    const formatsQuery = `
      INSERT INTO table_task_formats (table_id)
      VALUES ($1);
    `;
    await client.query(formatsQuery, [newTableId]);

    if (!clientArg) await client.query('COMMIT');

    return await findTableById(newTableId);

  } catch (error) {
    if (!clientArg) await client.query('ROLLBACK');
    throw error;
  } finally {
    if (shouldReleaseClient) client.release();
  }
};

module.exports = createNewTable