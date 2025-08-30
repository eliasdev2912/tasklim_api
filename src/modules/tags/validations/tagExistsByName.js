const pool = require('../../../../database');
const { BadRequestError, NotFoundError } = require('../../../utilities/errorsUtilities');
const runTransaction = require('../../../utilities/runTransaction');
const spaceExistsById = require('../../spaces/validations/spaceExistsById');




const tagExistsByName = async (tagName, spaceId, clientArg = pool) => {
  return runTransaction(clientArg, async (client) => {
    if (!tagName) throw new BadRequestError('Missing arguments: tag_name')
    await spaceExistsById.error(spaceId, client)

    const tagRes = await client.query(
      'SELECT id FROM tags WHERE name = $1 AND space_id = $2 LIMIT 1;',
      [tagName, spaceId]
    );
    return tagRes.rowCount > 0
  })
}

tagExistsByName.bool = tagExistsByName

tagExistsByName.error = async (tagName, spaceId, clientArg = pool) => {
  const exists = await tagExistsByName(tagName, spaceId, clientArg)
  if (!exists) {
    throw new NotFoundError(`tag not found with name: ${tagName}`)
  }
}

module.exports = tagExistsByName