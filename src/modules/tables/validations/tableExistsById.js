const pool = require('../../../../database')

const { BadRequestError, NotFoundError } = require("../../../utilities/errorsUtilities");
const runTransaction = require('../../../utilities/runTransaction');


const tableExistsById = async (tableId, clientArg = pool) => {
  return runTransaction(clientArg, async (client) => {
    if (!tableId) throw new BadRequestError('Missing arguments: table_id')

    const tableRes = await client.query(
      'SELECT id FROM space_tables WHERE id = $1 LIMIT 1;',
      [tableId]
    );
    return tableRes.rowCount > 0
  })
}
tableExistsById.bool = tableExistsById
tableExistsById.error = async (tableId, clientArg = pool) => {
  const exists = await tableExistsById(tableId, clientArg)
  if (!exists) {
    throw new NotFoundError(`table not found with id: ${tableId}`)
  }
}


module.exports = tableExistsById