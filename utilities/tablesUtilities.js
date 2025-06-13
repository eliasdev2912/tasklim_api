const pool = require('../database.js')
const { v4: uuidv4 } = require('uuid');





const findTableByName = async (tableName, spaceId) => {
  if(!tableName || !spaceId) throw new Error('MISSING_ARGUMENTS')

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

  if(!spaceId || !tableName) throw new Error('MISSING_ARGUMENTS')
  
  const existingTable = await findTableByName(tableName, spaceId)
  if(existingTable != null) throw new Error('TABLE_NAME_ALREADY_EXISTS')
  try {
    const spaceTablesQuery = `
  INSERT INTO space_tables (space_id, id, name)
  VALUES ($1, $2, $3)
  RETURNING *;`

    const result = await pool.query(spaceTablesQuery, [spaceId, idDone, tableName])
    return result.rows[0]

  } catch (error) {
    throw error
  }
}



module.exports = {findTableByName, createNewTable}