const pool = require('../../../../database')

const { BadRequestError, NotFoundError } = require("../../../utilities/errorsUtilities");



const tableExistsById = async (tableId) => {
  if (!tableId) throw new BadRequestError('Missing arguments: table_id')

  try {
    const tableRes = await pool.query(
      'SELECT id FROM space_tables WHERE id = $1 LIMIT 1;',
      [tableId]
    );
    return tableRes.rowCount > 0
  } catch (error) {
    throw error
  }
}
tableExistsById.bool = tableExistsById
tableExistsById.error = async (tableId) => {
  const exists = await tableExistsById(tableId)
  if (!exists) {
    throw new NotFoundError(`table not found with id: ${tableId}`)
  }
}


module.exports = tableExistsById