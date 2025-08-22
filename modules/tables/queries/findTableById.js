const pool = require('../../../database')


const findTableById = async (tableId) => {
  try {
    const query = `
        SELECT * FROM space_tables
        WHERE id = $1
      `
    const result = await pool.query(query, [tableId])

    return result.rows[0]

  } catch (error) {
    throw error
  }
}

module.exports = findTableById
