const pool = require('../../../database')

const { BadRequestError, NotFoundError } = require("../../../utilities/errorsUtilities");
const spaceExistsById = require('../../spaces/validations/spaceExistsById');





const tableExistsByName = async (tableName, spaceId, client = pool) => {
  try {
    if (!tableName) throw new BadRequestError('Missing arguments: table_name')
    await spaceExistsById.error(spaceId, client)

    const tableRes = await client.query(
      'SELECT id FROM space_tables WHERE name = $1 AND space_id = $2 LIMIT 1;',
      [tableName, spaceId]
    );
    return tableRes.rowCount > 0
  } catch (error) {
    throw error
  }
}
tableExistsByName.bool = tableExistsByName
tableExistsByName.error = async (tableName, spaceId, client = pool) => {
  const exists = await tableExistsByName(tableName, spaceId, client)
  if (!exists) {
    throw new NotFoundError(`table not found with name: ${tableName}`)
  }
}

module.exports = tableExistsByName