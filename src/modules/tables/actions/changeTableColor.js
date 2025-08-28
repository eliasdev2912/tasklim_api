const pool = require('../../../../database');
const findTableById = require('../queries/findTableById');


const changeTableColor = async (newColor, tableId) => {
  try {
    const query = `
    UPDATE space_tables
    SET color = $1
    WHERE id = $2
    `

    await pool.query(query, [newColor, tableId])

    const updatedTable = await findTableById(tableId)

    return updatedTable
  } catch (error) {
    throw error
  }
}

module.exports = changeTableColor