const pool = require('../database.js')
const { v4: uuidv4 } = require('uuid');





const findTableByName = async (tableName, spaceId) => {
  if (!tableName || !spaceId) throw new Error('MISSING_ARGUMENTS')

  try {
    const query = `
        SELECT * FROM space_tables st
        JOIN table_task_formats ttf ON ttf.table_id = st.id 
        WHERE name = $1 AND space_id = $2
      `
    const result = await pool.query(query, [tableName, spaceId])

    return result.rows[0]

  } catch (error) {
    throw error
  }
}
const findTableById = async (tableId) => {
  if (!tableId) throw new Error('MISSING_ARGUMENTS')

  try {
    const query = `
        SELECT * FROM space_tables st
        JOIN table_task_formats ttf ON ttf.table_id = $1
        WHERE id = $1
      `
    const result = await pool.query(query, [tableId])

    return result.rows[0]

  } catch (error) {
    throw error
  }
}
const createNewTable = async (spaceId, tableName) => {
  const newTableId = 'col-' + uuidv4();

  if (!spaceId || !tableName) throw new Error('MISSING_ARGUMENTS');

  const existingTable = await findTableByName(tableName, spaceId);
  if (existingTable != null) throw new Error('TABLE_NAME_ALREADY_EXISTS');

  const client = await pool.connect()

  try {

    await client.query('BEGIN')

    const tableIndexQuery = `
      SELECT COUNT(*) FROM space_tables WHERE space_id = $1;
    `;
    const tableIndexResult = await client.query(tableIndexQuery, [spaceId]);
    const tableIndex = parseInt(tableIndexResult.rows[0].count, 10);

    // Creamos la tabla
    const spaceTablesQuery = `
      INSERT INTO space_tables (space_id, id, name, table_position)
      VALUES ($1, $2, $3, $4);
    `;
    await client.query(spaceTablesQuery, [spaceId, newTableId, tableName, tableIndex]);

    // Creamos la fila en table_task_formats
    const formatsQuery = `
      INSERT INTO table_task_formats (table_id)
      VALUES ($1);
    `;
    await client.query(formatsQuery, [newTableId]);

    await client.query('COMMIT')

    const newTable = await findTableById(newTableId)
    return newTable;

  } catch (error) {
    await client.query('ROLLBACK')
    throw error;
  } finally {
    client.release()
  }
};


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

const changeTableFormat = async (tableId, newFormat) => {
  if (!tableId || !newFormat) {
    throw new Error('MISSING_ARGUMENTS');
  }

  const validFormats = ['minimalist', 'compact', 'standard', 'full']
  if (!validFormats.includes(newFormat)) {
    throw new Error('INVALID_FORMAT')
  }

  const client = await pool.connect(); // usa tu pool de pg

  const tableQuery = `
  UPDATE space_tables
      SET task_format = $1
      WHERE id = $2
  `

  const getTaskParts = () => {
    switch (newFormat) {
      case 'minimalist':
        return {
          show_title: true,
          show_description: false,
          show_tags: false,
          show_assignees: false,
          show_body: false,
          show_author: false,
          show_deadline: false,
          show_comments: false
        };
      case 'compact':
        return {
          show_title: false,
          show_description: true,
          show_tags: true,
          show_assignees: true,
          show_body: false,
          show_author: false,
          show_deadline: true,
          show_comments: false
        };
      case 'standard':
        return {
          show_title: true,
          show_description: true,
          show_tags: true,
          show_assignees: true,
          show_body: false,
          show_author: false,
          show_deadline: true,
          show_comments: true
        };
      case 'full':
        return {
          show_title: true,
          show_description: true,
          show_tags: true,
          show_assignees: true,
          show_body: true,
          show_author: true,
          show_deadline: true,
          show_comments: true
        };
      default:
        return {
          show_title: true,
          show_description: true,
          show_tags: true,
          show_assignees: true,
          show_body: false,
          show_author: false,
          show_deadline: true,
          show_comments: true
        };
    }
  }
  const parts = getTaskParts();
  const keys = Object.keys(parts);
  const values = Object.values(parts);

  const setClause = keys.map((key, idx) => `${key} = $${idx + 1}`).join(', ');

  const tableTaskFormatsQuery = `
  UPDATE table_task_formats
SET ${setClause}
WHERE table_id = $${keys.length + 1}
 `

  try {
    await client.query('BEGIN')

    await client.query(tableQuery, [newFormat, tableId])
    await client.query(tableTaskFormatsQuery, [...values, tableId]);

    await client.query('COMMIT')

    const updatedTable = await findTableById(tableId)
    return updatedTable

  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}



module.exports = { findTableByName, createNewTable, changeTablePosition, findTableById, changeTableFormat }