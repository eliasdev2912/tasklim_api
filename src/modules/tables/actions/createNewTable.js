const findTableById = require('../queries/findTableById')
const { v4: uuidv4 } = require('uuid');
const normalizeTablePositions = require('./normalizeTablePositions');
const runTransaction = require('../../../utilities/runTransaction');



const createNewTable = async (spaceId, tableName, clientArg) => {
  return runTransaction(clientArg, async (client) => {
    // Core
    const tableIndexQuery = `SELECT COUNT(*) FROM space_tables WHERE space_id = $1;`;
    const tableIndexResult = await client.query(tableIndexQuery, [spaceId]);
    const tableIndex = parseInt(tableIndexResult.rows[0].count, 10);

    const spaceTableQuery = `
      INSERT INTO space_tables (space_id, name, table_position)
      VALUES ($1, $2, $3);
    `;
    const rawTable = await client.query(spaceTableQuery, [spaceId, tableName, tableIndex]);

    await normalizeTablePositions(spaceId, client)

    return await findTableById(rawTable.id, client);
  })
};

module.exports = createNewTable