const runTransaction = require('../../../utilities/runTransaction');

const normalizeTablePositions = require('./normalizeTablePositions');



const changeTablePosition = async (spaceId, tableId, tableFromIndex, tableToIndex, neighborTableId, clientArg) => {
  return runTransaction(clientArg, async (client) => {
    await client.query(
      `UPDATE space_tables SET table_position = $1 WHERE id = $2 AND space_id = $3`,
      [tableToIndex, tableId, spaceId]
    );

    await client.query(
      `UPDATE space_tables SET table_position = $1 WHERE id = $2 AND space_id = $3`,
      [tableFromIndex, neighborTableId, spaceId]
    );

    await normalizeTablePositions(spaceId, client)

    return { success: true };
  })
};

module.exports = changeTablePosition