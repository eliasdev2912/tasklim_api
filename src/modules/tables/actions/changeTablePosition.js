const pool = require('../../../../database');

const normalizeTablePositions = require('./normalizeTablePositions');



const changeTablePosition = async (spaceId, tableId, tableFromIndex, tableToIndex, neighborTableId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE space_tables SET table_position = $1 WHERE id = $2 AND space_id = $3`,
      [tableToIndex, tableId, spaceId]
    );

    await client.query(
      `UPDATE space_tables SET table_position = $1 WHERE id = $2 AND space_id = $3`,
      [tableFromIndex, neighborTableId, spaceId]
    );

    await normalizeTablePositions(spaceId, client)

    await client.query('COMMIT');
    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = changeTablePosition