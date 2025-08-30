const pool = require('../../../../database')

const { BadRequestError, NotFoundError } = require("../../../utilities/errorsUtilities");
const runTransaction = require('../../../utilities/runTransaction');
const spaceExistsById = require('../../spaces/validations/spaceExistsById');





const tableExistsByName = async (tableName, spaceId, clientArg = pool) => {
  return runTransaction(clientArg, async (client) => {
    if (!tableName) throw new BadRequestError('Missing arguments: table_name')
    await spaceExistsById.error(spaceId, client)

    const tableRes = await client.query(
      'SELECT id FROM space_tables WHERE name = $1 AND space_id = $2 LIMIT 1;',
      [tableName, spaceId]
    );
    return tableRes.rowCount > 0
  })
}
tableExistsByName.bool = tableExistsByName
tableExistsByName.error = async (tableName, spaceId, clientArg = pool) => {
  const exists = await tableExistsByName(tableName, spaceId, clientArg)
  if (!exists) {
    throw new NotFoundError(`table not found with name: ${tableName}`)
  }
}

module.exports = tableExistsByName