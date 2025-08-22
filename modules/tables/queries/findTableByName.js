const pool = require('../../../database')


const findTableByName = async (tableName, spaceId) => {
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

module.exports = findTableByName