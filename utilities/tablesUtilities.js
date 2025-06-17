const pool = require('../database.js')
const { v4: uuidv4 } = require('uuid');





const findTableByName = async (tableName, spaceId) => {
  if (!tableName || !spaceId) throw new Error('MISSING_ARGUMENTS')

  try {
    const query = `
      SELECT * FROM space_tables
      WHERE name = $1 AND space_id = $2
    `
    const result = await pool.query(query, [tableName, spaceId])

    return result.rows[0]

  } catch (error) {
    throw error
  }
}
const createNewTable = async (spaceId, tableName) => {
  const idDone = 'col-' + uuidv4();

  if (!spaceId || !tableName) throw new Error('MISSING_ARGUMENTS')

  const existingTable = await findTableByName(tableName, spaceId)
  if (existingTable != null) throw new Error('TABLE_NAME_ALREADY_EXISTS')


  try {
    const tableIndexQuery = `
    SELECT COUNT(*) FROM space_tables WHERE space_id = $1;
    `
    const tableIndexResult = await pool.query(tableIndexQuery, [spaceId]);
    const tableIndex = parseInt(tableIndexResult.rows[0].count, 10) + 1;


    const spaceTablesQuery = `
  INSERT INTO space_tables (space_id, id, name, table_position)
  VALUES ($1, $2, $3, $4)
  RETURNING *;`

    const result = await pool.query(spaceTablesQuery, [spaceId, idDone, tableName, tableIndex])
    return result.rows[0]

  } catch (error) {
    throw error
  }
}

const changeTablePosition = async (spaceId, tableId, tableFromIndex, tableToIndex, neighborTableId) => {
  if (!spaceId || tableFromIndex == null || tableToIndex == null || !neighborTableId || !tableId) {
    throw new Error('MISSING_ARGUMENTS');
  }

  const client = await pool.connect(); // usa tu pool de pg

  try {
    await client.query('BEGIN');

    // Cambiar la posición de la tabla actual
    await client.query(
      `
      UPDATE space_tables
      SET table_position = $1
      WHERE id = $2 AND space_id = $3
      `,
      [tableToIndex, tableId, spaceId]
    );

    // Cambiar la posición de la tabla vecina
    await client.query(
      `
      UPDATE space_tables
      SET table_position = $1
      WHERE id = $2 AND space_id = $3
      `,
      [tableFromIndex, neighborTableId, spaceId]
    );

    await client.query('COMMIT');
    return { success: true };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};




module.exports = { findTableByName, createNewTable, changeTablePosition }